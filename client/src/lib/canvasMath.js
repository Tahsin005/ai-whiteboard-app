export const screenToWorld = (screenX, screenY, camera) => {
  return {
    x: (screenX - camera.x) / camera.zoom,
    y: (screenY - camera.y) / camera.zoom,
  };
};

export const worldToScreen = (worldX, worldY, camera) => {
  return {
    x: worldX * camera.zoom + camera.x,
    y: worldY * camera.zoom + camera.y,
  };
};

export const clampZoom = (zoom, min = 0.1, max = 5.0) => {
  return Math.min(Math.max(zoom, min), max);
};

export const zoomAtScreenPoint = (
  screenX,
  screenY,
  newZoom,
  currentCamera
) => {
  const clampedZoom = clampZoom(newZoom);
  if (clampedZoom === currentCamera.zoom) return currentCamera;

  const worldPoint = screenToWorld(screenX, screenY, currentCamera);

  const newX = screenX - worldPoint.x * clampedZoom;
  const newY = screenY - worldPoint.y * clampedZoom;

  return {
    x: newX,
    y: newY,
    zoom: clampedZoom,
  };
};

export const COLLABORATOR_COLORS = [
  { bg: "#6366f1", light: "#eef2ff", text: "#ffffff" }, // Indigo
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
