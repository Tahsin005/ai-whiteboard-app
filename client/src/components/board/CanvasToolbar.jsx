import React, { useState, useRef, useEffect } from "react";
import {
  MousePointer,
  Hand,
  PenTool,
  Square,
  Circle,
  Diamond,
  ArrowRight,
  Minus,
  StickyNote,
  Type,
  Eraser,
  Undo2,
  Redo2,
  Trash2,
  ChevronDown,
  Palette,
  CheckSquare,
  BarChart3,
  Image as ImageIcon,
  Smile,
  Plus,
} from "lucide-react";

export const STICKY_PALETTE = [
  { label: "Yellow", value: "#fef08a" },
  { label: "Pink", value: "#fbcfe8" },
  { label: "Blue", value: "#bfdbfe" },
  { label: "Green", value: "#bbf7d0" },
  { label: "Lavender", value: "#ddd6fe" },
  { label: "Peach", value: "#fed7aa" },
];

export const STROKE_PALETTE = [
  { label: "Slate", value: "#1e293b" },
  { label: "Violet", value: "#6965db" },
  { label: "Cyan", value: "#06b6d4" },
  { label: "Emerald", value: "#10b981" },
  { label: "Amber", value: "#f59e0b" },
  { label: "Rose", value: "#f43f5e" },
  { label: "Purple", value: "#8b5cf6" },
];

export const FILL_PALETTE = [
  { label: "Transparent", value: "transparent" },
  { label: "Light Indigo", value: "rgba(99, 102, 241, 0.12)" },
  { label: "Light Emerald", value: "rgba(16, 185, 129, 0.12)" },
  { label: "Light Rose", value: "rgba(244, 63, 94, 0.12)" },
  { label: "Light Amber", value: "rgba(245, 158, 11, 0.12)" },
  { label: "Pure White", value: "#ffffff" },
];

export const QUICK_EMOJIS = ["😀", "🔥", "❤️", "💡", "🎉", "🚀", "⭐", "🎯", "📌", "✨", "👍", "👀"];

export function CanvasToolbar({
  activeTool,
  setActiveTool,
  toolOptions,
  setToolOptions,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  selectedCount = 0,
  onDeleteSelected,
  onUpdateSelection,
  onUploadImage,
  onCreateEmoji,
}) {
  const [shapesMenuOpen, setShapesMenuOpen] = useState(false);
  const [insertMenuOpen, setInsertMenuOpen] = useState(false);
  const [stylePanelOpen, setStylePanelOpen] = useState(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);

  const shapesMenuRef = useRef(null);
  const insertMenuRef = useRef(null);
  const stylePanelRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (shapesMenuRef.current && !shapesMenuRef.current.contains(e.target)) {
        setShapesMenuOpen(false);
      }
      if (insertMenuRef.current && !insertMenuRef.current.contains(e.target)) {
        setInsertMenuOpen(false);
      }
      if (stylePanelRef.current && !stylePanelRef.current.contains(e.target)) {
        setStylePanelOpen(false);
      }
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
        setEmojiPickerOpen(false);
      }
    }
    document.addEventListener("pointerdown", handleClickOutside);
    return () => document.removeEventListener("pointerdown", handleClickOutside);
  }, []);

  const handleApplyStyle = (patch) => {
    setToolOptions((prev) => ({ ...prev, ...patch }));
    if (selectedCount > 0) {
      onUpdateSelection?.(patch);
    }
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadImage?.(file);
    }
    e.target.value = "";
    setInsertMenuOpen(false);
  };

  const getShapeIcon = () => {
    switch (activeTool) {
      case "ellipse":
        return <Circle size={18} />;
      case "diamond":
        return <Diamond size={18} />;
      case "arrow":
        return <ArrowRight size={18} />;
      case "line":
        return <Minus size={18} />;
      default:
        return <Square size={18} />;
    }
  };

  return (
    <div className="canvas-dock-container">

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleImageFileChange}
      />


      {stylePanelOpen && (
        <div ref={stylePanelRef} className="canvas-style-popover">
          <div className="style-popover-header">
            <span>{selectedCount > 0 ? `Style (${selectedCount} selected)` : "Default Style"}</span>
            <button
              type="button"
              className="style-popover-close"
              onClick={() => setStylePanelOpen(false)}
            >
              ×
            </button>
          </div>


          <div className="style-group">
            <label className="style-group-label">Stroke Color</label>
            <div className="style-swatches">
              {STROKE_PALETTE.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  className={`style-color-dot ${toolOptions.stroke === c.value ? "is-active" : ""
                    }`}
                  style={{ backgroundColor: c.value }}
                  onClick={() => handleApplyStyle({ stroke: c.value })}
                  title={c.label}
                />
              ))}
            </div>
          </div>


          <div className="style-group">
            <label className="style-group-label">Sticky Note Color</label>
            <div className="style-swatches">
              {STICKY_PALETTE.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  className={`style-color-dot ${toolOptions.fill === c.value ? "is-active" : ""
                    }`}
                  style={{ backgroundColor: c.value }}
                  onClick={() => handleApplyStyle({ fill: c.value })}
                  title={c.label}
                />
              ))}
            </div>
          </div>


          <div className="style-group">
            <label className="style-group-label">Shape Fill</label>
            <div className="style-swatches">
              {FILL_PALETTE.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  className={`style-color-dot ${toolOptions.fill === c.value ? "is-active" : ""
                    }`}
                  style={{
                    backgroundColor: c.value === "transparent" ? "#ffffff" : c.value,
                    border: c.value === "transparent" ? "1px dashed #cbd5e1" : "none",
                  }}
                  onClick={() => handleApplyStyle({ fill: c.value })}
                  title={c.label}
                />
              ))}
            </div>
          </div>


          <div className="style-group">
            <div className="style-slider-header">
              <label className="style-group-label">Stroke Width</label>
              <span className="style-slider-val">{toolOptions.strokeWidth || 3}px</span>
            </div>
            <input
              type="range"
              min="1"
              max="12"
              value={toolOptions.strokeWidth || 3}
              onChange={(e) =>
                handleApplyStyle({ strokeWidth: Number(e.target.value) })
              }
              className="style-range-input"
            />
          </div>


          <div className="style-group">
            <div className="style-slider-header">
              <label className="style-group-label">Font Size</label>
              <span className="style-slider-val">{toolOptions.fontSize || 16}px</span>
            </div>
            <input
              type="range"
              min="12"
              max="36"
              value={toolOptions.fontSize || 16}
              onChange={(e) =>
                handleApplyStyle({ fontSize: Number(e.target.value) })
              }
              className="style-range-input"
            />
          </div>
        </div>
      )}


      {emojiPickerOpen && (
        <div ref={emojiPickerRef} className="canvas-style-popover" style={{ minWidth: "220px" }}>
          <div className="style-popover-header">
            <span>Select Emoji</span>
            <button
              type="button"
              className="style-popover-close"
              onClick={() => setEmojiPickerOpen(false)}
            >
              ×
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", padding: "8px 0" }}>
            {QUICK_EMOJIS.map((em) => (
              <button
                key={em}
                type="button"
                style={{
                  fontSize: "24px",
                  background: "none",
                  border: "1px solid #e2e8f0",
                  borderRadius: "6px",
                  cursor: "pointer",
                  padding: "6px",
                  transition: "transform 0.1s ease",
                }}
                onClick={() => {
                  onCreateEmoji?.(em);
                  setEmojiPickerOpen(false);
                }}
              >
                {em}
              </button>
            ))}
          </div>
        </div>
      )}


      <div className="canvas-dock">

        <button
          type="button"
          className={`dock-tool-btn ${activeTool === "select" ? "is-active" : ""}`}
          onClick={() => setActiveTool("select")}
          title="Select / Move (V)"
        >
          <MousePointer size={18} />
        </button>


        <button
          type="button"
          className={`dock-tool-btn ${activeTool === "hand" ? "is-active" : ""}`}
          onClick={() => setActiveTool("hand")}
          title="Pan Hand (H or Space+Drag)"
        >
          <Hand size={18} />
        </button>


        <button
          type="button"
          className={`dock-tool-btn ${activeTool === "draw" ? "is-active" : ""}`}
          onClick={() => setActiveTool("draw")}
          title="Draw (P)"
        >
          <PenTool size={18} />
        </button>


        <button
          type="button"
          className={`dock-tool-btn ${activeTool === "sticky" ? "is-active" : ""}`}
          onClick={() => setActiveTool("sticky")}
          title="Sticky Note (S)"
        >
          <StickyNote size={18} />
        </button>


        <div ref={shapesMenuRef} className="dock-dropdown-wrapper">
          <button
            type="button"
            className={`dock-tool-btn ${["rect", "ellipse", "diamond", "arrow", "line"].includes(activeTool)
                ? "is-active"
                : ""
              }`}
            onClick={() => setShapesMenuOpen((prev) => !prev)}
            title="Shapes & Lines"
          >
            {getShapeIcon()}
            <ChevronDown size={12} className="dock-dropdown-chevron" />
          </button>

          {shapesMenuOpen && (
            <div className="dock-dropdown-menu">
              <button
                type="button"
                className={`dock-menu-item ${activeTool === "rect" ? "is-active" : ""}`}
                onClick={() => {
                  setActiveTool("rect");
                  setShapesMenuOpen(false);
                }}
              >
                <Square size={16} />
                <span>Rectangle (R)</span>
              </button>

              <button
                type="button"
                className={`dock-menu-item ${activeTool === "ellipse" ? "is-active" : ""}`}
                onClick={() => {
                  setActiveTool("ellipse");
                  setShapesMenuOpen(false);
                }}
              >
                <Circle size={16} />
                <span>Ellipse (O)</span>
              </button>

              <button
                type="button"
                className={`dock-menu-item ${activeTool === "diamond" ? "is-active" : ""}`}
                onClick={() => {
                  setActiveTool("diamond");
                  setShapesMenuOpen(false);
                }}
              >
                <Diamond size={16} />
                <span>Diamond (D)</span>
              </button>

              <div className="dock-menu-divider" />

              <button
                type="button"
                className={`dock-menu-item ${activeTool === "arrow" ? "is-active" : ""}`}
                onClick={() => {
                  setActiveTool("arrow");
                  setShapesMenuOpen(false);
                }}
              >
                <ArrowRight size={16} />
                <span>Arrow (A)</span>
              </button>

              <button
                type="button"
                className={`dock-menu-item ${activeTool === "line" ? "is-active" : ""}`}
                onClick={() => {
                  setActiveTool("line");
                  setShapesMenuOpen(false);
                }}
              >
                <Minus size={16} />
                <span>Line (L)</span>
              </button>
            </div>
          )}
        </div>


        <button
          type="button"
          className={`dock-tool-btn ${activeTool === "text" ? "is-active" : ""}`}
          onClick={() => setActiveTool("text")}
          title="Text (T)"
        >
          <Type size={18} />
        </button>


        <div ref={insertMenuRef} className="dock-dropdown-wrapper">
          <button
            type="button"
            className={`dock-tool-btn ${["bullet", "chart", "image", "emoji"].includes(activeTool) ? "is-active" : ""
              }`}
            onClick={() => setInsertMenuOpen((prev) => !prev)}
            title="Insert Elements"
          >
            <Plus size={18} />
            <ChevronDown size={12} className="dock-dropdown-chevron" />
          </button>

          {insertMenuOpen && (
            <div className="dock-dropdown-menu">
              <button
                type="button"
                className={`dock-menu-item ${activeTool === "bullet" ? "is-active" : ""}`}
                onClick={() => {
                  setActiveTool("bullet");
                  setInsertMenuOpen(false);
                }}
              >
                <CheckSquare size={16} />
                <span>Checklist (B)</span>
              </button>

              <button
                type="button"
                className={`dock-menu-item ${activeTool === "chart" ? "is-active" : ""}`}
                onClick={() => {
                  setActiveTool("chart");
                  setInsertMenuOpen(false);
                }}
              >
                <BarChart3 size={16} />
                <span>Chart (C)</span>
              </button>

              <button
                type="button"
                className="dock-menu-item"
                onClick={() => {
                  fileInputRef.current?.click();
                }}
              >
                <ImageIcon size={16} />
                <span>Image (I)</span>
              </button>

              <button
                type="button"
                className="dock-menu-item"
                onClick={() => {
                  setInsertMenuOpen(false);
                  setEmojiPickerOpen(true);
                }}
              >
                <Smile size={16} />
                <span>Emoji (J)</span>
              </button>
            </div>
          )}
        </div>


        <button
          type="button"
          className={`dock-tool-btn ${activeTool === "eraser" ? "is-active" : ""}`}
          onClick={() => setActiveTool("eraser")}
          title="Eraser (E)"
        >
          <Eraser size={18} />
        </button>

        <div className="dock-divider" />


        <button
          type="button"
          className={`dock-tool-btn ${stylePanelOpen ? "is-active" : ""}`}
          onClick={() => setStylePanelOpen((prev) => !prev)}
          title="Style Options"
        >
          <Palette size={18} />
        </button>


        <button
          type="button"
          className="dock-tool-btn"
          disabled={!canUndo}
          onClick={onUndo}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 size={18} />
        </button>


        <button
          type="button"
          className="dock-tool-btn"
          disabled={!canRedo}
          onClick={onRedo}
          title="Redo (Ctrl+Y)"
        >
          <Redo2 size={18} />
        </button>


        {selectedCount > 0 && (
          <>
            <div className="dock-divider" />
            <button
              type="button"
              className="dock-tool-btn dock-delete-btn"
              onClick={onDeleteSelected}
              title={`Delete ${selectedCount} item(s) (Backspace)`}
            >
              <Trash2 size={18} />
              <span className="dock-badge">{selectedCount}</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default React.memo(CanvasToolbar);
