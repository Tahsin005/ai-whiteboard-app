import { useState } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import toast from "react-hot-toast";
import {
  Sparkles,
  Grid,
  Square,
  CircleDot,
  Check,
  X,
  Loader2,
} from "lucide-react";
import api from "@/lib/api.js";

const BACKGROUND_OPTIONS = [
  {
    id: "dots",
    label: "Dot Matrix",
    description: "Subtle dots for freeform diagrams and sketches",
    icon: CircleDot,
    previewStyle: {
      backgroundImage: "radial-gradient(#94a3b8 1px, transparent 1px)",
      backgroundSize: "10px 10px",
    },
  },
  {
    id: "grid",
    label: "Grid Lines",
    description: "Orthogonal grid for structured wireframes & charts",
    icon: Grid,
    previewStyle: {
      backgroundImage:
        "linear-gradient(to right, #cbd5e1 1px, transparent 1px), linear-gradient(to bottom, #cbd5e1 1px, transparent 1px)",
      backgroundSize: "12px 12px",
    },
  },
  {
    id: "blank",
    label: "Blank Canvas",
    description: "Clean plane without any grid markings",
    icon: Square,
    previewStyle: {},
  },
];

const COLOR_PRESETS = [
  { hex: "#FFFFFF", name: "Pure White" },
  { hex: "#F8FAFC", name: "Slate Light" },
  { hex: "#F3F4F6", name: "Cool Neutral" },
  { hex: "#F0F9FF", name: "Soft Sky" },
  { hex: "#F0FDF4", name: "Light Mint" },
  { hex: "#FEFCE8", name: "Warm Cream" },
];

export function CreateBoardDialog({ open, onOpenChange, onBoardCreated }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [background, setBackground] = useState("dots");
  const [bgColor, setBgColor] = useState("#FFFFFF");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setBackground("dots");
    setBgColor("#FFFFFF");
  };

  const handleOpenChange = (nextOpen) => {
    if (!nextOpen) resetForm();
    onOpenChange(nextOpen);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      toast.error("Please enter a board title.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post("/whiteboards", {
        title: trimmedTitle,
        description: description.trim() || null,
        background,
        bg_color: bgColor,
      });

      const newBoard = response.data?.board;
      toast.success("Whiteboard created successfully!");
      handleOpenChange(false);

      if (onBoardCreated && newBoard) {
        onBoardCreated(newBoard);
      }
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to create whiteboard. Please try again.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="modal-backdrop" />
        <DialogPrimitive.Content className="modal-dialog">
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column" }}>
            {/* Header */}
            <div className="modal-header">
              <div className="modal-header-info">
                <div className="modal-header-icon">
                  <Sparkles size={20} />
                </div>
                <div>
                  <DialogPrimitive.Title className="modal-title">
                    Create New Whiteboard
                  </DialogPrimitive.Title>
                  <DialogPrimitive.Description className="modal-subtitle">
                    Set up a collaborative canvas for diagrams, sketches, and notes.
                  </DialogPrimitive.Description>
                </div>
              </div>

              <DialogPrimitive.Close className="modal-close-btn" aria-label="Close dialog">
                <X size={18} />
              </DialogPrimitive.Close>
            </div>

            {/* Body */}
            <div className="modal-body">
              {/* Board Title */}
              <div className="form-group">
                <label htmlFor="board-title-input" className="form-label">
                  <span>
                    Board Title <span className="form-label-required">*</span>
                  </span>
                </label>
                <input
                  id="board-title-input"
                  className="form-input"
                  type="text"
                  placeholder="e.g., Sprint Planning, Architecture Diagram"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  autoFocus
                  maxLength={100}
                  required
                />
              </div>

              {/* Description */}
              <div className="form-group">
                <label htmlFor="board-desc-input" className="form-label">
                  <span>Description</span>
                  <span className="form-label-hint">optional</span>
                </label>
                <textarea
                  id="board-desc-input"
                  className="form-textarea"
                  placeholder="Brief summary of what this canvas is for..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={250}
                />
              </div>

              {/* Canvas Background Pattern */}
              <div className="form-group">
                <label className="form-label">Canvas Background Style</label>
                <div className="pattern-grid">
                  {BACKGROUND_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = background === opt.id;
                    return (
                      <button
                        type="button"
                        key={opt.id}
                        onClick={() => setBackground(opt.id)}
                        className={`pattern-card ${isSelected ? "is-selected" : ""}`}
                      >
                        <div
                          className="pattern-preview-box"
                          style={{
                            backgroundColor: bgColor,
                            ...opt.previewStyle,
                          }}
                        >
                          <Icon size={16} color={isSelected ? "#4f46e5" : "#94a3b8"} />
                        </div>
                        <div className="pattern-title-row">
                          <span>{opt.label}</span>
                          {isSelected && <Check size={14} color="#4f46e5" />}
                        </div>
                        <span className="pattern-desc">{opt.description}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Canvas Base Color */}
              <div className="form-group">
                <label className="form-label">Canvas Base Tint</label>
                <div className="color-swatches-row">
                  {COLOR_PRESETS.map((color) => {
                    const isSelected = bgColor.toUpperCase() === color.hex.toUpperCase();
                    return (
                      <button
                        key={color.hex}
                        type="button"
                        title={color.name}
                        onClick={() => setBgColor(color.hex)}
                        className={`color-swatch-btn ${isSelected ? "is-selected" : ""}`}
                        style={{ backgroundColor: color.hex }}
                      >
                        {isSelected && <Check size={14} color="#1e293b" />}
                      </button>
                    );
                  })}
                  <span className="color-swatch-label">
                    {COLOR_PRESETS.find((c) => c.hex.toUpperCase() === bgColor.toUpperCase())?.name || bgColor}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin-fast" />
                    <span>Creating...</span>
                  </>
                ) : (
                  "Create Whiteboard"
                )}
              </button>
            </div>
          </form>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export default CreateBoardDialog;
