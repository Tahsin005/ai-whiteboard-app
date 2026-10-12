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
  Grid3X3,
  Grid2X2,
  Square,
} from "lucide-react";
import { formatRelativeTime } from "@/lib/dateUtils.js";

export function BoardRow({ board, onDeleteClick }) {
  const navigate = useNavigate();

  const handleRowClick = () => {
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

  const getBgIcon = () => {
    if (board.background === "dots") return <Grid3X3 size={15} color="#4f46e5" />;
    if (board.background === "grid") return <Grid2X2 size={15} color="#4f46e5" />;
    return <Square size={15} color="#4f46e5" />;
  };

  return (
    <div
      onClick={handleRowClick}
      className="card-simple"
      style={{
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        cursor: "pointer",
        transition: "all var(--duration-fast) ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "16px", minWidth: 0 }}>
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-subtle)",
            backgroundColor: board.bg_color || "#FFFFFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {getBgIcon()}
        </div>

        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h3
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1rem",
                fontWeight: 700,
                color: "var(--text-main)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {board.title || "Untitled Whiteboard"}
            </h3>
            <span className="badge">
              {board.is_owner ? "Owner" : "Shared"}
            </span>
          </div>
          <p
            style={{
              fontSize: "0.85rem",
              color: "var(--text-muted)",
              marginTop: "4px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "500px",
            }}
          >
            {board.description || "No description provided"}
          </p>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "16px", flexShrink: 0 }}>
        <span className="badge">
          <Layers size={13} color="#64748b" />
          <span>
            {board.element_count > 0 ? `${board.element_count} items` : "Empty"}
          </span>
        </span>

        <span style={{ fontSize: "0.825rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "5px" }}>
          <Clock size={13} color="#94a3b8" />
          <span>{formatRelativeTime(board.updated_at || board.created_at)}</span>
        </span>

        <button
          type="button"
          onClick={handleRowClick}
          className="btn btn-ghost btn-sm"
          style={{ color: "var(--brand-600)" }}
        >
          <span>Open</span>
          <ExternalLink size={14} />
        </button>

        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenuPrimitive.Root>
            <DropdownMenuPrimitive.Trigger asChild>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                style={{ padding: "6px", borderRadius: "var(--radius-full)" }}
                aria-label="Actions"
              >
                <MoreVertical size={16} />
              </button>
            </DropdownMenuPrimitive.Trigger>

            <DropdownMenuPrimitive.Portal>
              <DropdownMenuPrimitive.Content className="dropdown-menu-custom" align="end">
                <DropdownMenuPrimitive.Item
                  className="dropdown-item-custom"
                  onSelect={handleCopyLink}
                >
                  <Copy size={15} />
                  <span>Copy Link</span>
                </DropdownMenuPrimitive.Item>

                {board.is_owner && (
                  <>
                    <div className="dropdown-divider-custom" />
                    <DropdownMenuPrimitive.Item
                      className="dropdown-item-custom is-danger"
                      onSelect={handleDelete}
                    >
                      <Trash2 size={15} />
                      <span>Delete Board</span>
                    </DropdownMenuPrimitive.Item>
                  </>
                )}
              </DropdownMenuPrimitive.Content>
            </DropdownMenuPrimitive.Portal>
          </DropdownMenuPrimitive.Root>
        </div>
      </div>
    </div>
  );
}

export default BoardRow;
