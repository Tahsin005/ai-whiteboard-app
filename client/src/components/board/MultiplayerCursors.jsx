import { worldToScreen, getUserColor } from "@/lib/canvasMath.js";

export function MultiplayerCursors({ cursors, camera }) {
  if (!cursors || Object.keys(cursors).length === 0) return null;

  return (
    <div className="cursors-layer">
      {Object.entries(cursors).map(([userId, data]) => {
        const { x: worldX, y: worldY, user } = data;
        const screenPos = worldToScreen(worldX, worldY, camera);
        const color = getUserColor(userId);
        const displayName = user?.name || "Collaborator";

        return (
          <div
            key={userId}
            className="cursor-item"
            style={{
              transform: `translate3d(${screenPos.x}px, ${screenPos.y}px, 0)`,
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              className="cursor-svg"
            >
              <path
                d="M5.5 3.2L18.8 12.3C19.7 12.9 19.3 14.3 18.2 14.3H12.9L10.3 20.8C9.9 21.7 8.6 21.7 8.2 20.8L5.1 4.3C4.8 3.2 6.0 2.5 6.8 3.1"
                fill={color.bg}
                stroke="#ffffff"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>

            <div
              className="cursor-badge"
              style={{
                backgroundColor: color.bg,
                color: color.text,
              }}
            >
              {displayName}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default MultiplayerCursors;
