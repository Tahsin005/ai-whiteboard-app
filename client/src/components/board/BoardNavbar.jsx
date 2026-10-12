import { Link } from "react-router";
import {
  ArrowLeft,
  PenTool,
  Wifi,
  WifiOff,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from "lucide-react";
import { getUserColor } from "@/lib/canvasMath.js";

export function BoardNavbar({
  board,
  isConnected,
  collaborators = [],
  camera,
  onZoomChange,
  onResetZoom,
}) {
  const zoomPercent = Math.round((camera.zoom || 1) * 100);

  return (
    <header className="navbar navbar-board">
      <div className="page-container navbar-inner navbar-board-inner">
        <div className="board-nav-left">
          <Link
            to="/dashboard"
            className="btn btn-secondary btn-sm board-nav-back-btn"
            title="Back to Dashboard"
          >
            <ArrowLeft size={16} />
            <span className="board-nav-back-label">Dashboard</span>
          </Link>

          <div className="board-nav-divider" />

          <div className="board-nav-meta">
            <div className="navbar-brand-icon board-nav-icon">
              <PenTool size={16} />
            </div>

            <div>
              <div className="board-nav-title-row">
                <h1 className="board-nav-title">
                  {board?.title || "Untitled Whiteboard"}
                </h1>
                {board?.role && (
                  <span className="badge board-nav-role-badge">
                    {board.role}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="board-nav-actions">
          {collaborators.length > 0 && (
            <div className="presence-group">
              <div className="presence-avatars">
                {collaborators.slice(0, 5).map((collab) => {
                  const color = getUserColor(collab.id);
                  const initial = (collab.name?.[0] || "U").toUpperCase();

                  return (
                    <div
                      key={collab.id}
                      title={`${collab.name} (Online)`}
                      className="presence-avatar"
                      style={{
                        backgroundColor: color.bg,
                        color: color.text,
                      }}
                    >
                      {initial}
                    </div>
                  );
                })}
              </div>

              {collaborators.length > 5 && (
                <span className="presence-more">
                  +{collaborators.length - 5}
                </span>
              )}
            </div>
          )}

          <div className="badge badge-pill-blur board-status-badge">
            {isConnected ? (
              <>
                <span className="board-status-dot is-live" />
                <span className="board-status-label-live">Live Sync</span>
              </>
            ) : (
              <>
                <span className="board-status-dot is-connecting" />
                <span className="board-status-label-connecting">Connecting...</span>
              </>
            )}
          </div>

          <div className="board-zoom-controls">
            <button
              type="button"
              className="btn btn-ghost btn-sm board-zoom-btn"
              onClick={() => onZoomChange?.(camera.zoom - 0.15)}
              title="Zoom Out"
            >
              <ZoomOut size={14} />
            </button>

            <button
              type="button"
              className="btn btn-ghost btn-sm board-zoom-level"
              onClick={onResetZoom}
              title="Reset Zoom to 100%"
            >
              {zoomPercent}%
            </button>

            <button
              type="button"
              className="btn btn-ghost btn-sm board-zoom-btn"
              onClick={() => onZoomChange?.(camera.zoom + 0.15)}
              title="Zoom In"
            >
              <ZoomIn size={14} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default BoardNavbar;
