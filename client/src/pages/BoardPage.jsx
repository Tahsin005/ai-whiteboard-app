import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext.jsx";
import api from "@/lib/api.js";
import { useBoardSocket } from "@/hooks/useBoardSocket.js";
import { clampZoom } from "@/lib/canvasMath.js";
import BoardNavbar from "@/components/board/BoardNavbar.jsx";
import Canvas from "@/components/board/Canvas.jsx";
import LoadingSpinner from "@/components/ui/LoadingSpinner.jsx";
import { Sparkles, AlertCircle, ArrowLeft } from "lucide-react";

export const BoardPage = () => {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [board, setBoard] = useState(null);
  const [elements, setElements] = useState([]);
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Infinite Canvas Camera State
  const [camera, setCamera] = useState({
    x: typeof window !== "undefined" ? window.innerWidth / 2 : 500,
    y: typeof window !== "undefined" ? window.innerHeight / 2 : 400,
    zoom: 1,
  });

  // Handle incoming real-time socket events from peers
  const handleSocketEvent = useCallback((event, payload) => {
    switch (event) {
      case "element:created":
        setElements((prev) => {
          if (prev.some((el) => el.id === payload.id)) return prev;
          return [...prev, payload];
        });
        break;

      case "element:updated":
        setElements((prev) =>
          prev.map((el) => (el.id === payload.id ? { ...el, ...payload } : el))
        );
        break;

      case "element:deleted":
        setElements((prev) => prev.filter((el) => el.id !== payload.id));
        break;

      case "board:updated":
        setBoard((prev) => ({ ...prev, ...payload }));
        break;

      case "member:added":
        setMembers((prev) => {
          if (prev.some((m) => m.id === payload.id)) return prev;
          return [...prev, payload];
        });
        break;

      case "member:removed":
        setMembers((prev) => prev.filter((m) => m.id !== payload.userId));
        break;

      default:
        break;
    }
  }, []);

  // Initialize Socket.io connection and presence
  const {
    isConnected,
    collaborators,
    cursors,
    sendCursor,
  } = useBoardSocket({
    boardId,
    currentUser: user,
    onEvent: handleSocketEvent,
  });

  // Fetch initial board and elements
  const fetchBoardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get(`/whiteboards/${boardId}`);
      const data = response.data;
      setBoard(data.board);
      setElements(data.elements || []);
      setMembers(data.members || []);
    } catch (err) {
      console.error("Failed to load whiteboard data:", err);
      const msg =
        err.response?.data?.error ||
        "Could not load whiteboard. You might not have access.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [boardId]);

  useEffect(() => {
    fetchBoardData();
  }, [fetchBoardData]);

  // Zoom handlers
  const handleZoomChange = (newZoom) => {
    setCamera((prev) => ({
      ...prev,
      zoom: clampZoom(newZoom),
    }));
  };

  const handleResetZoom = () => {
    setCamera((prev) => ({
      ...prev,
      zoom: 1,
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    }));
  };

  if (isLoading) {
    return <LoadingSpinner label="Opening collaborative canvas..." />;
  }

  if (error || !board) {
    return (
      <div className="app-shell board-state-center">
        <div className="card-simple board-error-card">
          <div className="board-error-icon">
            <AlertCircle size={28} />
          </div>
          <h2 className="board-error-title">
            Cannot open whiteboard
          </h2>
          <p className="board-error-desc">
            {error || "Whiteboard not found."}
          </p>
          <button
            type="button"
            className="btn btn-secondary btn-sm board-error-btn"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft size={16} />
            <span>Return to Dashboard</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell board-page-shell">
      <BoardNavbar
        board={board}
        isConnected={isConnected}
        collaborators={collaborators}
        camera={camera}
        onZoomChange={handleZoomChange}
        onResetZoom={handleResetZoom}
      />

      <Canvas
        board={board}
        camera={camera}
        setCamera={setCamera}
        cursors={cursors}
        sendCursor={sendCursor}
      >
        {elements.length === 0 ? (
          <div className="canvas-welcome-banner">
            <div className="navbar-brand-icon canvas-welcome-icon">
              <Sparkles size={22} />
            </div>
            <h3 className="canvas-welcome-title">
              Infinite Canvas Ready
            </h3>
            <p className="canvas-welcome-desc">
              Pan with <strong>Space + Drag</strong> or mouse wheel. Your live multiplayer cursor and collaborative presence are active.
            </p>
          </div>
        ) : (
          elements.map((el) => (
            <div
              key={el.id}
              className="canvas-element"
              style={{
                left: `${el.data?.x || 0}px`,
                top: `${el.data?.y || 0}px`,
                width: `${el.data?.w || 160}px`,
                height: `${el.data?.h || 120}px`,
                backgroundColor: el.data?.fill || "#ffffff",
              }}
            >
              <strong>{el.type}</strong>
              <div className="canvas-element-text">
                {el.data?.text || el.data?.label || JSON.stringify(el.data)}
              </div>
            </div>
          ))
        )}
      </Canvas>

      <div className="canvas-hint-overlay">
        <div className="badge badge-pill-blur canvas-hint-badge">
          <span>Hold <strong>Space + Drag</strong> to Pan • Scroll to Zoom</span>
        </div>
      </div>
    </div>
  );
};

export default BoardPage;
