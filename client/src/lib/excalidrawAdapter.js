/**
 * excalidrawAdapter.js
 * Converts between PostgreSQL whiteboard elements and Excalidraw native elements.
 */

export function toExcalidrawElement(el) {
  if (!el) return null;
  const d = el.data || {};
  const isImage = (el.type || d.type) === "image";

  // If already an Excalidraw element (has version or width & type)
  if (d.version !== undefined || (d.width !== undefined && d.height !== undefined && d.type)) {
    return {
      ...d,
      id: el.id || d.id,
      type: el.type || d.type,
      ...(isImage
        ? {
            fileId: d.fileId || el.id || d.id,
            status: d.status || "saved",
            scale: d.scale || [1, 1],
          }
        : {}),
      isDeleted: Boolean(d.isDeleted),
    };
  }

  const base = {
    id: el.id,
    x: Number(d.x ?? d.X ?? 0),
    y: Number(d.y ?? d.Y ?? 0),
    width: Math.max(Number(d.w ?? d.W ?? d.width ?? 140), 10),
    height: Math.max(Number(d.h ?? d.H ?? d.height ?? 90), 10),
    angle: 0,
    strokeColor: d.stroke || d.color || "#1e293b",
    backgroundColor: d.fill && d.fill !== "transparent" ? d.fill : "transparent",
    fillStyle: d.fill && d.fill !== "transparent" ? "solid" : "hachure",
    strokeWidth: Number(d.strokeWidth ?? 2),
    strokeStyle: "solid",
    roughness: 1,
    opacity: 100,
    groupIds: [],
    frameId: null,
    roundness: d.radius ? { type: 3 } : null,
    seed: Math.floor(Math.random() * 1000000),
    version: 1,
    versionNonce: Math.floor(Math.random() * 1000000),
    isDeleted: false,
    boundElements: null,
    updated: Date.now(),
    link: null,
    locked: false,
  };

  const type = el.type || "rectangle";

  switch (type) {
    case "rect":
    case "rectangle":
      return {
        ...base,
        type: "rectangle",
      };

    case "sticky":
      return {
        ...base,
        type: "rectangle",
        backgroundColor: d.fill && d.fill !== "transparent" ? d.fill : "#fef08a",
        strokeColor: "#eab308",
        fillStyle: "solid",
        strokeWidth: 1,
        roundness: { type: 3 },
      };

    case "ellipse":
      return {
        ...base,
        type: "ellipse",
      };

    case "diamond":
      return {
        ...base,
        type: "diamond",
      };

    case "line": {
      const startX = Number(d.startX ?? d.x ?? 0);
      const startY = Number(d.startY ?? d.y ?? 0);
      const endX = Number(d.endX ?? (startX + (d.w || 100)));
      const endY = Number(d.endY ?? (startY + (d.h || 50)));
      return {
        ...base,
        type: "line",
        x: startX,
        y: startY,
        width: Math.max(Math.abs(endX - startX), 1),
        height: Math.max(Math.abs(endY - startY), 1),
        points: [
          [0, 0],
          [endX - startX, endY - startY],
        ],
      };
    }

    case "arrow": {
      const startX = Number(d.startX ?? d.x ?? 0);
      const startY = Number(d.startY ?? d.y ?? 0);
      const endX = Number(d.endX ?? (startX + (d.w || 100)));
      const endY = Number(d.endY ?? (startY + (d.h || 50)));
      return {
        ...base,
        type: "arrow",
        x: startX,
        y: startY,
        width: Math.max(Math.abs(endX - startX), 1),
        height: Math.max(Math.abs(endY - startY), 1),
        points: [
          [0, 0],
          [endX - startX, endY - startY],
        ],
        endArrowhead: "arrow",
      };
    }

    case "draw":
    case "freedraw": {
      const rawPoints = Array.isArray(d.points) ? d.points : [];
      let minX = Infinity;
      let minY = Infinity;
      for (const pt of rawPoints) {
        if (pt[0] < minX) minX = pt[0];
        if (pt[1] < minY) minY = pt[1];
      }
      if (!isFinite(minX)) {
        minX = base.x;
        minY = base.y;
      }
      const relativePoints = rawPoints.map(([px, py, pr]) => [
        px - minX,
        py - minY,
        pr || 0.5,
      ]);
      return {
        ...base,
        type: "freedraw",
        x: minX,
        y: minY,
        points: relativePoints,
        simulatePressure: true,
      };
    }

    case "text":
      return {
        ...base,
        type: "text",
        text: d.text || "",
        originalText: d.text || "",
        fontSize: Number(d.fontSize || 20),
        fontFamily: 1,
        textAlign: "left",
        verticalAlign: "top",
        strokeColor: d.color || d.stroke || "#1e293b",
      };

    case "image": {
      const fileId = d.fileId || el.id;
      return {
        ...base,
        type: "image",
        fileId,
        status: d.status || "saved",
        scale: d.scale || [1, 1],
        crop: d.crop || null,
        strokeColor: "transparent",
        backgroundColor: "transparent",
      };
    }

    default:
      return {
        ...base,
        type: "rectangle",
      };
  }
}

export function fromExcalidrawElement(excalEl, files = {}) {
  if (!excalEl) return null;
  const data = { ...excalEl };
  if (excalEl.type === "image" && excalEl.fileId) {
    const file = files[excalEl.fileId];
    if (file) {
      data.dataURL = file.dataURL;
      data.mimeType = file.mimeType;
      data.created = file.created;
    }
  }
  return {
    id: excalEl.id,
    type: excalEl.type,
    data,
    z: 1000,
  };
}

/**
 * Extracts binary files dictionary from elements array and/or fallback files
 */
export function extractFilesFromElements(elements = [], existingFiles = {}) {
  const files = { ...existingFiles };
  for (const el of elements || []) {
    const d = el.data || el;
    const fileId = d.fileId || (el.type === "image" ? el.id : null);
    const dataURL = d.dataURL || d.src;
    if (fileId && dataURL && !files[fileId]) {
      files[fileId] = {
        id: fileId,
        mimeType: d.mimeType || "image/png",
        dataURL,
        created: d.created || Date.now(),
      };
    }
  }
  return files;
}
