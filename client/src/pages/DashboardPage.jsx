import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { Plus, RefreshCw, AlertCircle } from "lucide-react";

import Navbar from "@/components/layout/Navbar.jsx";
import api from "@/lib/api.js";
import BoardCard from "@/components/dashboard/BoardCard.jsx";
import NewBoardCard from "@/components/dashboard/NewBoardCard.jsx";
import DashboardSkeleton from "@/components/dashboard/DashboardSkeleton.jsx";
import CreateBoardDialog from "@/components/dashboard/CreateBoardDialog.jsx";
import DeleteBoardDialog from "@/components/dashboard/DeleteBoardDialog.jsx";

export const DashboardPage = () => {
  const [boards, setBoards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [boardToDelete, setBoardToDelete] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Fetch whiteboards
  const fetchBoards = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    else setIsRefreshing(true);
    setError(null);

    try {
      const response = await api.get("/whiteboards");
      const fetchedBoards = response.data?.boards || [];
      setBoards(fetchedBoards);
    } catch (err) {
      console.error("Failed to fetch whiteboards:", err);
      const msg = err.response?.data?.error || "Could not load whiteboards. Please try again.";
      setError(msg);
      if (isSilent) toast.error(msg);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  // Handle board creation callback
  const handleBoardCreated = (newBoard) => {
    if (newBoard) {
      setBoards((prev) => [newBoard, ...prev]);
    }
  };

  // Open delete dialog
  const handlePromptDelete = (board) => {
    setBoardToDelete(board);
    setIsDeleteOpen(true);
  };

  // Handle board deleted callback
  const handleBoardDeleted = (deletedId) => {
    setBoards((prev) => prev.filter((b) => b.id !== deletedId));
  };

  return (
    <div className="app-shell">
      <Navbar />

      <main className="page-container dashboard-main">
        <div className="dashboard-header">
          <div>
            <div className="dashboard-title-row">
              <h1 className="dashboard-title">Whiteboards</h1>
              {!isLoading && (
                <span className="badge">
                  {boards.length} {boards.length === 1 ? "canvas" : "canvases"}
                </span>
              )}
            </div>
            <p className="dashboard-subtitle">
              Create, organize, and collaborate on your real-time visual canvases.
            </p>
          </div>

          <div className="dashboard-header-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => fetchBoards(true)}
              disabled={isLoading || isRefreshing}
              title="Refresh whiteboards"
            >
              <RefreshCw
                size={16}
                className={isRefreshing ? "animate-spin-fast" : ""}
              />
              <span>Refresh</span>
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setIsCreateOpen(true)}
            >
              <Plus size={18} />
              <span>New Whiteboard</span>
            </button>
          </div>
        </div>

        <div>
          {isLoading ? (
            <DashboardSkeleton count={3} />
          ) : error ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "56px 24px",
                textAlign: "center",
                borderRadius: "var(--radius-xl)",
                background: "var(--danger-50)",
                border: "1px solid var(--danger-100)",
                maxWidth: "460px",
                margin: "48px auto",
              }}
            >
              <AlertCircle size={44} color="#ef4444" style={{ marginBottom: "12px" }} />
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-main)" }}>
                Failed to load whiteboards
              </h3>
              <p
                style={{
                  fontSize: "0.9rem",
                  color: "var(--text-muted)",
                  marginTop: "6px",
                  maxWidth: "320px",
                  lineHeight: "1.5",
                }}
              >
                {error}
              </p>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => fetchBoards()}
                style={{ marginTop: "20px" }}
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="boards-grid">
              <NewBoardCard onClick={() => setIsCreateOpen(true)} />

              {boards.map((board) => (
                <BoardCard
                  key={board.id}
                  board={board}
                  onDeleteClick={handlePromptDelete}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <CreateBoardDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onBoardCreated={handleBoardCreated}
      />

      <DeleteBoardDialog
        board={boardToDelete}
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onBoardDeleted={handleBoardDeleted}
      />
    </div>
  );
};

export default DashboardPage;
