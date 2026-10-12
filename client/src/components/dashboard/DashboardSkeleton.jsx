export function DashboardSkeleton({ count = 3 }) {
  return (
    <div className="boards-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-card">
          <div
            className="skeleton-shimmer"
            style={{ height: "220px", width: "100%" }}
          />

          <div
            style={{
              padding: "22px 24px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              flex: 1,
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div
                className="skeleton-shimmer"
                style={{
                  height: "22px",
                  width: "65%",
                  borderRadius: "var(--radius-sm)",
                }}
              />
              <div
                className="skeleton-shimmer"
                style={{
                  height: "14px",
                  width: "90%",
                  borderRadius: "var(--radius-xs)",
                }}
              />
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                paddingTop: "14px",
                borderTop: "1px solid var(--border-subtle)",
              }}
            >
              <div
                className="skeleton-shimmer"
                style={{
                  height: "14px",
                  width: "40%",
                  borderRadius: "var(--radius-xs)",
                }}
              />
              <div
                className="skeleton-shimmer"
                style={{
                  height: "14px",
                  width: "20%",
                  borderRadius: "var(--radius-xs)",
                }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default DashboardSkeleton;
