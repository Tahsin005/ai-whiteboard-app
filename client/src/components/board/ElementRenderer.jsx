import React, { useMemo, useRef, useEffect, useState } from "react";
import {
  getBounds,
  drawElementToPath,
  arrowHead,
} from "@/lib/canvasGeometry.js";
import { normalizeElementData } from "@/lib/canvasSchema.js";
import { CheckSquare, Square, Image as ImageIcon } from "lucide-react";

/**
 * Pure, memoized renderer for whiteboard elements.
 * All elements have pointer-events: none (except active inputs/checkboxes).
 */
export const ElementRenderer = React.memo(function ElementRenderer({
  element,
  isEditing = false,
  onCommitEdit,
  onToggleCheck,
  onDeleteIfEmpty,
  isPendingErase = false,
}) {
  const type = element.type || "sticky";
  const d = normalizeElementData(type, element.data);
  const bounds = getBounds(element);

  const [editText, setEditText] = useState(d.text ?? "");
  const editTextRef = useRef(d.text ?? "");
  editTextRef.current = editText;
  const textareaRef = useRef(null);

  const lastCommittedRef = useRef(d.text ?? "");

  useEffect(() => {
    setEditText(d.text ?? "");
    editTextRef.current = d.text ?? "";
    lastCommittedRef.current = d.text ?? "";
  }, [d.text]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const commitValue = (val) => {
    if (val === lastCommittedRef.current) return;
    lastCommittedRef.current = val;
    if (type === "text" && !val.trim()) {
      onDeleteIfEmpty?.(element.id);
    } else {
      onCommitEdit?.(element.id, { text: val });
    }
  };

  // When exiting editing mode, commit any uncommitted text changes
  const prevEditingRef = useRef(isEditing);
  useEffect(() => {
    if (prevEditingRef.current && !isEditing) {
      commitValue(editTextRef.current);
    }
    prevEditingRef.current = isEditing;
  }, [isEditing]);

  const handleBlur = () => {
    commitValue(editTextRef.current);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      setEditText(d.text ?? "");
      editTextRef.current = d.text ?? "";
      lastCommittedRef.current = d.text ?? "";
      onCommitEdit?.(element.id, { text: d.text ?? "" });
    } else if (e.key === "Enter" && !e.shiftKey && type !== "sticky") {
      e.preventDefault();
      handleBlur();
    }
  };

  const stopProp = (e) => {
    e.stopPropagation();
  };

  const rootStyle = {
    position: "absolute",
    left: `${bounds.x}px`,
    top: `${bounds.y}px`,
    width: `${bounds.w}px`,
    height: `${bounds.h}px`,
    pointerEvents: isEditing ? "auto" : "none",
    zIndex: isEditing ? 50 : undefined,
    opacity: isPendingErase ? 0.3 : 1,
    transition: "opacity 0.15s ease",
  };

  // 1. FREEHAND DRAW
  if (type === "draw") {
    const localPoints = useMemo(() => {
      const pts = d.points || [];
      return pts.map(([px, py, pr]) => [px - bounds.x, py - bounds.y, pr]);
    }, [d.points, bounds.x, bounds.y]);

    const pathD = useMemo(() => {
      if (localPoints.length === 0) return "";
      return drawElementToPath(
        {
          points: localPoints,
          size: d.size ?? 4,
          thinning: d.thinning ?? 0.5,
          smoothing: d.smoothing ?? 0.5,
          streamline: d.streamline ?? 0.5,
          simulatePressure: d.simulatePressure ?? true,
        },
        { last: true }
      );
    }, [localPoints, d.size, d.thinning, d.smoothing, d.streamline, d.simulatePressure]);

    return (
      <div style={rootStyle}>
        <svg
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: `${bounds.w}px`,
            height: `${bounds.h}px`,
            overflow: "visible",
            pointerEvents: "none",
          }}
        >
          {pathD ? (
            <path d={pathD} fill={d.stroke} />
          ) : localPoints.length > 0 ? (
            <circle
              cx={localPoints[0][0]}
              cy={localPoints[0][1]}
              r={(d.size || 4) / 2}
              fill={d.stroke}
            />
          ) : null}
        </svg>
      </div>
    );
  }

  // 2. LINE
  if (type === "line") {
    const startX = (d.startX ?? 0) - bounds.x;
    const startY = (d.startY ?? 0) - bounds.y;
    const endX = (d.endX ?? 0) - bounds.x;
    const endY = (d.endY ?? 0) - bounds.y;

    return (
      <div style={rootStyle}>
        <svg
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: `${bounds.w}px`,
            height: `${bounds.h}px`,
            overflow: "visible",
            pointerEvents: "none",
          }}
        >
          <line
            x1={startX}
            y1={startY}
            x2={endX}
            y2={endY}
            stroke={d.stroke}
            strokeWidth={d.strokeWidth || 3}
            strokeLinecap="round"
          />
        </svg>
      </div>
    );
  }

  // 3. ARROW (with clean polygon arrowhead)
  if (type === "arrow") {
    const startX = (d.startX ?? 0) - bounds.x;
    const startY = (d.startY ?? 0) - bounds.y;
    const endX = (d.endX ?? 0) - bounds.x;
    const endY = (d.endY ?? 0) - bounds.y;
    const sw = d.strokeWidth || 3;

    const head = arrowHead({ x: startX, y: startY }, { x: endX, y: endY }, sw);
    const shaftEndX = head.shaftEnd.x;
    const shaftEndY = head.shaftEnd.y;
    const polyPoints = `${head.tip.x},${head.tip.y} ${head.left.x},${head.left.y} ${head.right.x},${head.right.y}`;

    return (
      <div style={rootStyle}>
        <svg
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: `${bounds.w}px`,
            height: `${bounds.h}px`,
            overflow: "visible",
            pointerEvents: "none",
          }}
        >
          <line
            x1={startX}
            y1={startY}
            x2={shaftEndX}
            y2={shaftEndY}
            stroke={d.stroke}
            strokeWidth={sw}
            strokeLinecap="round"
          />
          <polygon points={polyPoints} fill={d.stroke} />
        </svg>
      </div>
    );
  }

  // 4. RECTANGLE
  if (type === "rect") {
    const sw = d.strokeWidth || 2;
    const rx = Math.min(d.radius ?? 8, bounds.w / 2, bounds.h / 2);

    return (
      <div style={rootStyle}>
        <svg
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: `${bounds.w}px`,
            height: `${bounds.h}px`,
            overflow: "visible",
            pointerEvents: "none",
          }}
        >
          <rect
            x={sw / 2}
            y={sw / 2}
            width={Math.max(bounds.w - sw, 0)}
            height={Math.max(bounds.h - sw, 0)}
            rx={rx}
            stroke={d.stroke}
            strokeWidth={sw}
            fill={d.fill || "transparent"}
          />
        </svg>

        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={editText}
            onChange={(e) => {
              setEditText(e.target.value);
              editTextRef.current = e.target.value;
            }}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            onPointerDown={stopProp}
            onMouseDown={stopProp}
            onClick={stopProp}
            onDoubleClick={stopProp}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              background: "transparent",
              border: "none",
              outline: "none",
              resize: "none",
              padding: "12px",
              fontSize: `${d.fontSize || 16}px`,
              color: d.stroke,
              textAlign: "center",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "auto",
              boxSizing: "border-box",
            }}
          />
        ) : d.text ? (
          <div
            style={{
              position: "absolute",
              inset: 0,
              padding: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              fontSize: `${d.fontSize || 16}px`,
              color: d.stroke,
              wordBreak: "break-word",
              userSelect: "none",
            }}
          >
            {d.text}
          </div>
        ) : null}
      </div>
    );
  }

  // 5. ELLIPSE
  if (type === "ellipse") {
    const sw = d.strokeWidth || 2;
    const cx = bounds.w / 2;
    const cy = bounds.h / 2;
    const rx = Math.max(bounds.w / 2 - sw / 2, 0);
    const ry = Math.max(bounds.h / 2 - sw / 2, 0);

    return (
      <div style={rootStyle}>
        <svg
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: `${bounds.w}px`,
            height: `${bounds.h}px`,
            overflow: "visible",
            pointerEvents: "none",
          }}
        >
          <ellipse
            cx={cx}
            cy={cy}
            rx={rx}
            ry={ry}
            stroke={d.stroke}
            strokeWidth={sw}
            fill={d.fill || "transparent"}
          />
        </svg>

        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={editText}
            onChange={(e) => {
              setEditText(e.target.value);
              editTextRef.current = e.target.value;
            }}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            onPointerDown={stopProp}
            onMouseDown={stopProp}
            onClick={stopProp}
            onDoubleClick={stopProp}
            style={{
              position: "absolute",
              inset: "15%",
              background: "transparent",
              border: "none",
              outline: "none",
              resize: "none",
              fontSize: `${d.fontSize || 16}px`,
              color: d.stroke,
              textAlign: "center",
              pointerEvents: "auto",
            }}
          />
        ) : d.text ? (
          <div
            style={{
              position: "absolute",
              inset: "15%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              fontSize: `${d.fontSize || 16}px`,
              color: d.stroke,
              wordBreak: "break-word",
              userSelect: "none",
            }}
          >
            {d.text}
          </div>
        ) : null}
      </div>
    );
  }

  // 6. DIAMOND
  if (type === "diamond") {
    const sw = d.strokeWidth || 2;
    const pts = `${bounds.w / 2},${sw / 2} ${bounds.w - sw / 2},${bounds.h / 2} ${bounds.w / 2},${bounds.h - sw / 2} ${sw / 2},${bounds.h / 2}`;

    return (
      <div style={rootStyle}>
        <svg
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: `${bounds.w}px`,
            height: `${bounds.h}px`,
            overflow: "visible",
            pointerEvents: "none",
          }}
        >
          <polygon
            points={pts}
            stroke={d.stroke}
            strokeWidth={sw}
            fill={d.fill || "transparent"}
          />
        </svg>

        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={editText}
            onChange={(e) => {
              setEditText(e.target.value);
              editTextRef.current = e.target.value;
            }}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            onPointerDown={stopProp}
            onMouseDown={stopProp}
            onClick={stopProp}
            onDoubleClick={stopProp}
            style={{
              position: "absolute",
              inset: "20%",
              background: "transparent",
              border: "none",
              outline: "none",
              resize: "none",
              fontSize: `${d.fontSize || 16}px`,
              color: d.stroke,
              textAlign: "center",
              pointerEvents: "auto",
            }}
          />
        ) : d.text ? (
          <div
            style={{
              position: "absolute",
              inset: "20%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              fontSize: `${d.fontSize || 16}px`,
              color: d.stroke,
              wordBreak: "break-word",
              userSelect: "none",
            }}
          >
            {d.text}
          </div>
        ) : null}
      </div>
    );
  }

  // 7. STICKY NOTE
  if (type === "sticky") {
    return (
      <div
        style={{
          ...rootStyle,
          backgroundColor: d.fill || "#fef08a",
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0,0,0,0.06)",
          padding: "14px",
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={editText}
            onChange={(e) => {
              setEditText(e.target.value);
              editTextRef.current = e.target.value;
            }}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            onPointerDown={stopProp}
            onMouseDown={stopProp}
            onClick={stopProp}
            onDoubleClick={stopProp}
            style={{
              width: "100%",
              height: "100%",
              background: "transparent",
              border: "none",
              outline: "none",
              resize: "none",
              fontSize: `${d.fontSize || 16}px`,
              fontFamily: "inherit",
              color: "#1e293b",
              lineHeight: 1.5,
              pointerEvents: "auto",
            }}
            placeholder="Write note..."
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              fontSize: `${d.fontSize || 16}px`,
              fontFamily: "inherit",
              color: "#1e293b",
              lineHeight: 1.5,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              userSelect: "none",
            }}
          >
            {d.text || <span style={{ opacity: 0.4 }}>Empty note</span>}
          </div>
        )}
      </div>
    );
  }

  // 8. TEXT
  if (type === "text") {
    return (
      <div
        style={{
          ...rootStyle,
          boxSizing: "border-box",
        }}
      >
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={editText}
            onChange={(e) => {
              setEditText(e.target.value);
              editTextRef.current = e.target.value;
            }}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            onPointerDown={stopProp}
            onMouseDown={stopProp}
            onClick={stopProp}
            onDoubleClick={stopProp}
            style={{
              width: "100%",
              minHeight: "40px",
              height: "100%",
              background: "transparent",
              border: "none",
              outline: "none",
              resize: "none",
              fontSize: `${d.fontSize || 18}px`,
              color: d.color || "#1e293b",
              fontFamily: "inherit",
              lineHeight: 1.4,
              pointerEvents: "auto",
            }}
            placeholder="Type text..."
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              fontSize: `${d.fontSize || 18}px`,
              color: d.color || "#1e293b",
              fontFamily: "inherit",
              lineHeight: 1.4,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              userSelect: "none",
            }}
          >
            {d.text || <span style={{ opacity: 0.4 }}>Empty text</span>}
          </div>
        )}
      </div>
    );
  }

  // 9. BULLET / CHECKLIST
  if (type === "bullet") {
    return (
      <div
        style={{
          ...rootStyle,
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "6px 10px",
          boxSizing: "border-box",
        }}
      >
        <button
          type="button"
          style={{
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            color: d.checked ? "var(--brand-500, #6366f1)" : "#64748b",
            pointerEvents: "auto",
          }}
          onClick={(e) => {
            e.stopPropagation();
            onToggleCheck?.(element.id, !d.checked);
          }}
        >
          {d.checked ? (
            <CheckSquare size={20} strokeWidth={2.2} />
          ) : (
            <Square size={20} strokeWidth={2} />
          )}
        </button>

        {isEditing ? (
          <input
            ref={textareaRef}
            type="text"
            value={editText}
            onChange={(e) => {
              setEditText(e.target.value);
              editTextRef.current = e.target.value;
            }}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            onPointerDown={stopProp}
            onMouseDown={stopProp}
            onClick={stopProp}
            onDoubleClick={stopProp}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              fontSize: `${d.fontSize || 16}px`,
              color: "#1e293b",
              pointerEvents: "auto",
            }}
          />
        ) : (
          <span
            style={{
              flex: 1,
              fontSize: `${d.fontSize || 16}px`,
              color: d.checked ? "#94a3b8" : "#1e293b",
              textDecoration: d.checked ? "line-through" : "none",
              userSelect: "none",
              wordBreak: "break-word",
            }}
          >
            {d.text || "Todo item"}
          </span>
        )}
      </div>
    );
  }

  // 10. IMAGE
  if (type === "image") {
    return (
      <div
        style={{
          ...rootStyle,
          borderRadius: "8px",
          overflow: "hidden",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        }}
      >
        {d.src ? (
          <img
            src={d.src}
            alt={d.text || "Whiteboard Image"}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              userSelect: "none",
              pointerEvents: "none",
            }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              backgroundColor: "#f1f5f9",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              color: "#64748b",
            }}
          >
            <ImageIcon size={32} />
            <span style={{ fontSize: "13px" }}>No image url</span>
          </div>
        )}
      </div>
    );
  }

  // 11. CHART (Pure SVG Bar / Line / Pie)
  if (type === "chart") {
    const labels = d.labels || ["Q1", "Q2", "Q3", "Q4"];
    const values = d.values || [30, 60, 45, 80];
    const colors = d.colors || ["#6366f1", "#a855f7", "#ec4899", "#3b82f6"];
    const chartType = d.chartType || "bar";
    const maxVal = Math.max(...values, 1);
    const totalVal = values.reduce((sum, v) => sum + v, 0) || 1;

    const pad = 14;
    const titleH = 26;
    const labelH = 20;
    const plotW = Math.max(bounds.w - pad * 2, 20);
    const plotH = Math.max(bounds.h - pad * 2 - titleH - labelH, 20);
    const px = pad;
    const py = pad + titleH;

    return (
      <div
        style={{
          ...rootStyle,
          backgroundColor: "#ffffff",
          borderRadius: "10px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
          padding: `${pad}px`,
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            fontSize: "13px",
            fontWeight: 600,
            color: "#334155",
            marginBottom: "6px",
            userSelect: "none",
          }}
        >
          {d.title || "Chart"}
        </div>

        <svg
          style={{
            width: "100%",
            height: `calc(100% - ${titleH}px)`,
            overflow: "visible",
            pointerEvents: "none",
          }}
        >
          {chartType === "bar" &&
            values.map((v, i) => {
              const n = values.length;
              const colW = plotW / n;
              const barW = colW * 0.7;
              const gap = colW * 0.3;
              const bx = px + i * colW + gap / 2;
              const barH = (v / maxVal) * plotH;
              const by = py + plotH - barH;
              const c = colors[i % colors.length];

              return (
                <g key={i}>
                  <rect
                    x={bx}
                    y={by}
                    width={barW}
                    height={barH}
                    rx={3}
                    fill={c}
                  />
                  <text
                    x={bx + barW / 2}
                    y={py + plotH + 14}
                    textAnchor="middle"
                    fontSize="11"
                    fill="#64748b"
                  >
                    {labels[i] || ""}
                  </text>
                </g>
              );
            })}

          {chartType === "line" && (
            <g>

              <polyline
                fill="none"
                stroke="#6366f1"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
                points={values
                  .map((v, i) => {
                    const lx = px + (i / Math.max(values.length - 1, 1)) * plotW;
                    const ly = py + plotH - (v / maxVal) * plotH;
                    return `${lx},${ly}`;
                  })
                  .join(" ")}
              />

              {values.map((v, i) => {
                const lx = px + (i / Math.max(values.length - 1, 1)) * plotW;
                const ly = py + plotH - (v / maxVal) * plotH;
                return (
                  <g key={i}>
                    <circle cx={lx} cy={ly} r={4} fill="#6366f1" />
                    <text
                      x={lx}
                      y={py + plotH + 14}
                      textAnchor="middle"
                      fontSize="11"
                      fill="#64748b"
                    >
                      {labels[i] || ""}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {chartType === "pie" && (
            <g transform={`translate(${px + plotW / 2}, ${py + plotH / 2})`}>
              {(() => {
                const r = Math.min(plotW, plotH) / 2;
                let currentAngle = 0;
                return values.map((v, i) => {
                  const sliceAngle = (v / totalVal) * 2 * Math.PI;
                  const startA = currentAngle;
                  const endA = currentAngle + sliceAngle;
                  currentAngle += sliceAngle;

                  const x1 = r * Math.cos(startA);
                  const y1 = r * Math.sin(startA);
                  const x2 = r * Math.cos(endA);
                  const y2 = r * Math.sin(endA);
                  const largeArc = sliceAngle > Math.PI ? 1 : 0;
                  const dPath = `M 0 0 L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;

                  return (
                    <path
                      key={i}
                      d={dPath}
                      fill={colors[i % colors.length]}
                      stroke="#ffffff"
                      strokeWidth={1.5}
                    />
                  );
                });
              })()}
            </g>
          )}
        </svg>
      </div>
    );
  }

  // 12. EMOJI
  if (type === "emoji") {
    const glyph = d.emoji || "😀";
    const glyphSize = Math.min(bounds.w, bounds.h) * 0.8;

    return (
      <div
        style={{
          ...rootStyle,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: `${glyphSize}px`,
          userSelect: "none",
        }}
      >
        {glyph}
      </div>
    );
  }

  return null;
});

export default ElementRenderer;
