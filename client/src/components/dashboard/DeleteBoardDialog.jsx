import { useState } from "react";
import { AlertDialog as AlertDialogPrimitive } from "radix-ui";
import toast from "react-hot-toast";
import { Trash2, AlertTriangle, Loader2, X } from "lucide-react";
import api from "@/lib/api.js";

export function DeleteBoardDialog({ board, open, onOpenChange, onBoardDeleted }) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!board) return null;

  const handleDelete = async (e) => {
    e.preventDefault();
    setIsDeleting(true);
    try {
      await api.delete(`/whiteboards/${board.id}`);
      toast.success(`"${board.title}" was deleted.`);
      onOpenChange(false);
      if (onBoardDeleted) {
        onBoardDeleted(board.id);
      }
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to delete whiteboard.";
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className="modal-backdrop" />
        <AlertDialogPrimitive.Content className="modal-dialog" style={{ maxWidth: "460px" }}>
          <div className="modal-header">
            <div className="modal-header-info">
              <div
                className="modal-header-icon"
                style={{
                  background: "var(--danger-50)",
                  color: "var(--danger-600)",
                }}
              >
                <Trash2 size={20} />
              </div>
              <div>
                <AlertDialogPrimitive.Title className="modal-title">
                  Delete Whiteboard?
                </AlertDialogPrimitive.Title>
                <AlertDialogPrimitive.Description className="modal-subtitle">
                  This action cannot be undone.
                </AlertDialogPrimitive.Description>
              </div>
            </div>

            <AlertDialogPrimitive.Cancel asChild>
              <button className="modal-close-btn" aria-label="Cancel">
                <X size={18} />
              </button>
            </AlertDialogPrimitive.Cancel>
          </div>

          <div className="modal-body" style={{ gap: "14px" }}>
            <p style={{ fontSize: "0.925rem", color: "var(--text-secondary)", lineHeight: "1.55" }}>
              Are you sure you want to permanently delete{" "}
              <strong style={{ color: "var(--text-main)", fontWeight: 700 }}>
                "{board.title}"
              </strong>
              ?
            </p>

            {board.element_count > 0 ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  padding: "12px 14px",
                  borderRadius: "var(--radius-md)",
                  background: "var(--danger-50)",
                  border: "1px solid var(--danger-100)",
                  color: "var(--danger-600)",
                  fontSize: "0.85rem",
                  lineHeight: "1.45",
                }}
              >
                <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
                <span>
                  All {board.element_count} elements, sketches, diagrams, and associated data will be permanently wiped.
                </span>
              </div>
            ) : (
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                This whiteboard is empty and will be completely removed.
              </p>
            )}
          </div>

          <div className="modal-footer">
            <AlertDialogPrimitive.Cancel asChild>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={isDeleting}
              >
                Cancel
              </button>
            </AlertDialogPrimitive.Cancel>

            <button
              type="button"
              className="btn btn-danger"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 size={16} className="animate-spin-fast" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 size={16} />
                  <span>Delete Whiteboard</span>
                </>
              )}
            </button>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
}

export default DeleteBoardDialog;
