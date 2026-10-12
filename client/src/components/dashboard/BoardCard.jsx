import { useNavigate } from "react-router";
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui";
import toast from "react-hot-toast";
import {
  MoreVertical,
  Trash2,
  ExternalLink,
  Copy,
  Clock,
  Layers,
  ArrowUpRight,
  PenTool,
} from "lucide-react";
import { formatRelativeTime } from "@/lib/dateUtils.js";

export function BoardCard({ board, onDeleteClick }) {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/board/${board.id}`);
  };

  const handleCopyLink = (e) => {
    e?.stopPropagation?.();
    const url = `${window.location.origin}/board/${board.id}`;
    navigator.clipboard.writeText(url);
    toast.success("Board link copied to clipboard!");
  };

  const handleDelete = (e) => {
    e?.stopPropagation?.();
    if (onDeleteClick) {
      onDeleteClick(board);
    }
  };

  const getBackgroundStyle = () => {
    const bg = board.bg_color || "#FFFFFF";
    if (board.background === "dots") {
      return {
        backgroundColor: bg,
        backgroundImage: "radial-gradient(#94a3b8 1px, transparent 1px)",
        backgroundSize: "12px 12px",
      };
    }
    if (board.background === "grid") {
      return {
        backgroundColor: bg,
        backgroundImage:
          "linear-gradient(to right, #cbd5e1 1px, transparent 1px), linear-gradient(to bottom, #cbd5e1 1px, transparent 1px)",
        backgroundSize: "14px 14px",
      };
    }
    return { backgroundColor: bg };
  };

  const formatBgLabel = (bg) => {
    if (bg === "dots") return "Dot Matrix";
    if (bg === "grid") return "Grid";
    return "Blank";
  };

  return (
    <div className="board-card" onClick={handleCardClick}>
      <div className="board-preview" style={getBackgroundStyle()}>
        <div className="board-preview-watermark">
          <PenTool size={20} />
          <div className="board-preview-bar" />
        </div>

        <div className="board-preview-top-badges">
          <span
            className="badge badge-pill-blur"
            style={{ pointerEvents: "auto" }}
          >
            {board.is_owner ? "Owner" : "Shared"}
          </span>

          <div
            style={{ pointerEvents: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <DropdownMenuPrimitive.Root>
              <DropdownMenuPrimitive.Trigger asChild>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{
                    width: "32px",
                    height: "32px",
                    padding: 0,
                    borderRadius: "var(--radius-full)",
                    background: "rgba(255, 255, 255, 0.95)",
                    border: "1px solid var(--border-subtle)",
                  }}
                  aria-label="Board options"
                >
                  <MoreVertical size={16} color="#64748b" />
                </button>
              </DropdownMenuPrimitive.Trigger>

              <DropdownMenuPrimitive.Portal>
                <DropdownMenuPrimitive.Content
                  className="dropdown-menu-custom"
                  align="end"
                  sideOffset={6}
                >
                  <DropdownMenuPrimitive.Item
                    className="dropdown-item-custom"
                    onSelect={handleCardClick}
                  >
                    <ExternalLink size={15} />
                    <span>Open Canvas</span>
                  </DropdownMenuPrimitive.Item>

                  <DropdownMenuPrimitive.Item
                    className="dropdown-item-custom"
                    onSelect={handleCopyLink}
                  >
                    <Copy size={15} />
                    <span>Copy Share Link</span>
                  </DropdownMenuPrimitive.Item>

                  {board.is_owner && (
                    <>
                      <div className="dropdown-divider-custom" />
                      <DropdownMenuPrimitive.Item
                        className="dropdown-item-custom is-danger"
                        onSelect={handleDelete}
                      >
                        <Trash2 size={15} />
                        <span>Delete Whiteboard</span>
                      </DropdownMenuPrimitive.Item>
                    </>
                  )}
                </DropdownMenuPrimitive.Content>
              </DropdownMenuPrimitive.Portal>
            </DropdownMenuPrimitive.Root>
          </div>
        </div>

        <div className="board-preview-bottom-badges">
          <span className="badge badge-pill-blur">
            {formatBgLabel(board.background)}
          </span>

          <span className="badge badge-pill-blur">
            <Layers size={13} color="#64748b" />
            <span>
              {board.element_count > 0
                ? `${board.element_count} ${board.element_count === 1 ? "item" : "items"}`
                : "Empty"}
            </span>
          </span>
        </div>
      </div>

      <div className="board-card-info">
        <div>
          <h3 className="board-card-title">
            {board.title || "Untitled Whiteboard"}
          </h3>
          <p className="board-card-description">
            {board.description || "No description provided"}
          </p>
        </div>

        <div className="board-card-footer">
          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <Clock size={14} color="#94a3b8" />
            <span>Edited {formatRelativeTime(board.updated_at || board.created_at)}</span>
          </span>

          <span className="board-card-open-cta">
            <span>Open</span>
            <ArrowUpRight size={15} />
          </span>
        </div>
      </div>
    </div>
  );
}

export default BoardCard;
