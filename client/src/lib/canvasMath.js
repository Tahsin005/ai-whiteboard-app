/**
 * canvasMath.js
 * Backwards-compatible facade re-exporting from canvasGeometry.js and canvasSchema.js.
 */
export * from "./canvasGeometry.js";
export * from "./canvasSchema.js";

// Collaborator color palette
export const COLLABORATOR_COLORS = [
  { bg: "#6965db", light: "#ececf9", text: "#ffffff" }, // Excalidraw Violet
  { bg: "#ec4899", light: "#fdf2f8", text: "#ffffff" }, // Pink
  { bg: "#10b981", light: "#ecfdf5", text: "#ffffff" }, // Emerald
  { bg: "#f59e0b", light: "#fffbeb", text: "#ffffff" }, // Amber
  { bg: "#06b6d4", light: "#ecfeff", text: "#ffffff" }, // Cyan
  { bg: "#8b5cf6", light: "#f5f3ff", text: "#ffffff" }, // Violet
  { bg: "#f97316", light: "#fff7ed", text: "#ffffff" }, // Orange
  { bg: "#14b8a6", light: "#f0fdfa", text: "#ffffff" }, // Teal
];

export const getUserColor = (userId = "") => {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % COLLABORATOR_COLORS.length;
  return COLLABORATOR_COLORS[index];
};

// Aliases for legacy imports
export { getBounds as getElementBounds } from "./canvasGeometry.js";
export { boundsIntersect as doBoundsIntersect } from "./canvasGeometry.js";
export { pointInRect as isPointInBounds } from "./canvasGeometry.js";
export { drawElementToPath as renderPointsToSvgPath } from "./canvasGeometry.js";
