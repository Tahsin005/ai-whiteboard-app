import React from "react";
import { worldToScreen, getBounds, unionBounds } from "@/lib/canvasGeometry.js";

const HANDLES = [
  { id: "nw", xRatio: 0, yRatio: 0, cursor: "nwse-resize" },
  { id: "n", xRatio: 0.5, yRatio: 0, cursor: "ns-resize" },
  { id: "ne", xRatio: 1, yRatio: 0, cursor: "nesw-resize" },
  { id: "e", xRatio: 1, yRatio: 0.5, cursor: "ew-resize" },
  { id: "se", xRatio: 1, yRatio: 1, cursor: "nwse-resize" },
  { id: "s", xRatio: 0.5, yRatio: 1, cursor: "ns-resize" },
  { id: "sw", xRatio: 0, yRatio: 1, cursor: "nesw-resize" },
  { id: "w", xRatio: 0, yRatio: 0.5, cursor: "ew-resize" },
];

export function SelectionOverlay({
  selectedElements = [],
  camera,
  editingId = null,
  onResizeStart,
  onEndpointStart,
}) {
  if (!selectedElements || selectedElements.length === 0 || !camera) {
    return null;
  }

  // If the single selected element is currently being edited, hide handles so typing is clean
  if (selectedElements.length === 1 && selectedElements[0].id === editingId) {
    return null;
  }

  // Single line or arrow has 2 endpoint handles instead of 8 bounding box handles
  if (
    selectedElements.length === 1 &&
    (selectedElements[0].type === "line" || selectedElements[0].type === "arrow")
  ) {
    const el = selectedElements[0];
    const d = el.data || {};
    const startX = d.startX ?? d.x ?? 0;
    const startY = d.startY ?? d.y ?? 0;
    const endX = d.endX ?? startX;
    const endY = d.endY ?? startY;

    const sP1 = worldToScreen({ x: startX, y: startY }, camera);
    const sP2 = worldToScreen({ x: endX, y: endY }, camera);

    return (
      <div
        className="canvas-selection-overlay"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 40,
        }}
      >

        <div
          data-handle="start"
          style={{
            position: "absolute",
            left: `${sP1.x}px`,
            top: `${sP1.y}px`,
            width: "12px",
            height: "12px",
            transform: "translate(-50%, -50%)",
            backgroundColor: "#ffffff",
            border: "2px solid var(--brand-500, #6366f1)",
            borderRadius: "50%",
            boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
            cursor: "crosshair",
            pointerEvents: "auto",
          }}
          onPointerDown={(e) => onEndpointStart?.("start", e)}
        />

        <div
          data-handle="end"
          style={{
            position: "absolute",
            left: `${sP2.x}px`,
            top: `${sP2.y}px`,
            width: "12px",
            height: "12px",
            transform: "translate(-50%, -50%)",
            backgroundColor: "#ffffff",
            border: "2px solid var(--brand-500, #6366f1)",
            borderRadius: "50%",
            boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
            cursor: "crosshair",
            pointerEvents: "auto",
          }}
          onPointerDown={(e) => onEndpointStart?.("end", e)}
        />
      </div>
    );
  }

  // General element(s) bounding box overlay
  const boundsList = selectedElements.map(getBounds);
  const union = unionBounds(boundsList);
  if (!union) return null;

  const tl = worldToScreen({ x: union.x, y: union.y }, camera);
  const br = worldToScreen({ x: union.x + union.w, y: union.y + union.h }, camera);

  const screenX = tl.x;
  const screenY = tl.y;
  const screenW = Math.max(br.x - tl.x, 2);
  const screenH = Math.max(br.y - tl.y, 2);

  return (
    <div
      className="canvas-selection-overlay"
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 40,
      }}
    >

      <div
        style={{
          position: "absolute",
          left: `${screenX}px`,
          top: `${screenY}px`,
          width: `${screenW}px`,
          height: `${screenH}px`,
          border: "1.5px dashed var(--brand-500, #6366f1)",
          boxShadow: "0 0 0 1px rgba(99, 102, 241, 0.25)",
          pointerEvents: "none",
        }}
      >

        {HANDLES.map((h) => {
          const hx = screenW * h.xRatio;
          const hy = screenH * h.yRatio;

          return (
            <div
              key={h.id}
              data-handle={h.id}
              style={{
                position: "absolute",
                left: `${hx}px`,
                top: `${hy}px`,
                width: "9px",
                height: "9px",
                transform: "translate(-50%, -50%)",
                backgroundColor: "#ffffff",
                border: "1.5px solid var(--brand-500, #6366f1)",
                borderRadius: "2px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                cursor: h.cursor,
                pointerEvents: "auto",
              }}
              onPointerDown={(e) => onResizeStart?.(h.id, e)}
            />
          );
        })}
      </div>
    </div>
  );
}

export default React.memo(SelectionOverlay);
