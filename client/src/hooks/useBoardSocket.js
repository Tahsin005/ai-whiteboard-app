import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { getJWTToken } from "@/lib/auth.js";
import { setApiSocketId } from "@/lib/api.js";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5050/api";
const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || API_BASE_URL.replace(/\/api\/?$/, "");

export function useBoardSocket({ boardId, currentUser, onEvent }) {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [collaborators, setCollaborators] = useState([]);
  const [cursors, setCursors] = useState({});
  const lastCursorSendRef = useRef(0);
  const pendingCursorRef = useRef(null);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!boardId) return;

    let isMounted = true;
    let socketInstance = null;

    const connectSocket = async () => {
      try {
        const token = await getJWTToken();

        socketInstance = io(SOCKET_URL, {
          auth: { token },
          transports: ["websocket", "polling"],
          reconnection: true,
          reconnectionAttempts: 10,
          reconnectionDelay: 1000,
        });

        socketRef.current = socketInstance;

        socketInstance.on("connect", () => {
          if (!isMounted) return;
          setIsConnected(true);
          setApiSocketId(socketInstance.id);

          // Join board room
          socketInstance.emit("wb:join", boardId, (res) => {
            if (res && !res.ok) {
              console.error("Failed to join whiteboard room:", res.error);
            }
          });
        });

        socketInstance.on("disconnect", () => {
          if (!isMounted) return;
          setIsConnected(false);
          setApiSocketId(null);
        });

        // Presence events
        socketInstance.on("presence:sync", ({ users }) => {
          if (!isMounted) return;
          setCollaborators(users || []);
        });

        socketInstance.on("presence:join", ({ user }) => {
          if (!isMounted) return;
          setCollaborators((prev) => {
            if (prev.some((u) => u.id === user.id)) return prev;
            return [...prev, user];
          });
        });

        socketInstance.on("presence:leave", ({ user }) => {
          if (!isMounted) return;
          setCollaborators((prev) => prev.filter((u) => u.id !== user.id));
          setCursors((prev) => {
            const next = { ...prev };
            delete next[user.id];
            return next;
          });
        });

        // Multiplayer cursor
        socketInstance.on("presence:cursor", ({ user, x, y }) => {
          if (!isMounted || !user || user.id === currentUser?.id) return;
          setCursors((prev) => ({
            ...prev,
            [user.id]: {
              user,
              x,
              y,
              timestamp: Date.now(),
            },
          }));
        });

        // Live drawing preview from peers
        socketInstance.on("element:live", (payload) => {
          onEventRef.current?.("element:live", payload);
        });

        // Persistent element mutations
        socketInstance.on("element:created", (element) => {
          onEventRef.current?.("element:created", element);
        });

        socketInstance.on("element:updated", (element) => {
          onEventRef.current?.("element:updated", element);
        });

        socketInstance.on("element:deleted", (payload) => {
          onEventRef.current?.("element:deleted", payload);
        });

        socketInstance.on("board:updated", (board) => {
          onEventRef.current?.("board:updated", board);
        });

        socketInstance.on("member:added", (member) => {
          onEventRef.current?.("member:added", member);
        });

        socketInstance.on("member:removed", (payload) => {
          onEventRef.current?.("member:removed", payload);
        });
      } catch (err) {
        console.error("Socket connection initialization error:", err);
      }
    };

    connectSocket();

    // Auto cleanup cursors older than 10 seconds
    const pruneInterval = setInterval(() => {
      const now = Date.now();
      setCursors((prev) => {
        let changed = false;
        const next = { ...prev };
        for (const [id, data] of Object.entries(next)) {
          if (now - data.timestamp > 10000) {
            delete next[id];
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 4000);

    return () => {
      isMounted = false;
      clearInterval(pruneInterval);
      if (socketInstance) {
        socketInstance.emit("wb:leave", boardId);
        socketInstance.disconnect();
      }
      socketRef.current = null;
      setApiSocketId(null);
    };
  }, [boardId, currentUser?.id]);

  // Throttled cursor broadcast (max ~30fps / 33ms)
  const sendCursor = useCallback(
    (x, y) => {
      if (!socketRef.current || !isConnected) return;

      const now = Date.now();
      pendingCursorRef.current = { x, y };

      if (now - lastCursorSendRef.current >= 33) {
        lastCursorSendRef.current = now;
        socketRef.current.emit("presence:cursor", {
          boardId,
          x: Math.round(x),
          y: Math.round(y),
        });
      }
    },
    [boardId, isConnected]
  );

  // Send live draft element (e.g. while drawing/dragging before releasing)
  const sendLiveElement = useCallback(
    (element) => {
      if (!socketRef.current || !isConnected) return;
      socketRef.current.emit("element:live", { boardId, element });
    },
    [boardId, isConnected]
  );

  return {
    socket: socketRef.current,
    isConnected,
    collaborators,
    cursors,
    sendCursor,
    sendLiveElement,
  };
}

export default useBoardSocket;
