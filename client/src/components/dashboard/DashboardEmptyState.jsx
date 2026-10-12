import { PenTool, Plus, Sparkles, FolderX } from "lucide-react";

export function DashboardEmptyState({
  isFiltered,
  onResetFilters,
  onCreateBoard,
}) {
  if (isFiltered) {
    return (
      <div
        className="card-simple"
        style={{
          maxWidth: "440px",
          margin: "48px auto",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "48px 24px",
        }}
      >
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "var(--radius-md)",
            background: "var(--bg-subtle)",
            color: "var(--text-muted)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "16px",
          }}
        >
          <FolderX size={26} />
        </div>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-main)" }}>
          No whiteboards in this view
        </h3>
        <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginTop: "6px", maxWidth: "280px" }}>
          You don't have any whiteboards matching this filter.
        </p>
        <div style={{ marginTop: "20px" }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onResetFilters}
          >
            Show All Whiteboards
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="card-simple"
      style={{
        maxWidth: "460px",
        margin: "48px auto",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "52px 28px",
      }}
    >
      <div
        style={{
          position: "relative",
          marginBottom: "18px",
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "var(--radius-lg)",
            background: "var(--brand-50)",
            color: "var(--brand-600)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <PenTool size={30} />
        </div>
        <div
          style={{
            position: "absolute",
            top: "-4px",
            right: "-4px",
            width: "24px",
            height: "24px",
            borderRadius: "var(--radius-full)",
            background: "#fef3c7",
            color: "#d97706",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Sparkles size={14} />
        </div>
      </div>

      <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 700, color: "var(--text-main)" }}>
        No whiteboards yet
      </h3>
      <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginTop: "8px", maxWidth: "340px", lineHeight: "1.5" }}>
        Start creating your first collaborative canvas to brainstorm ideas, draw wireframes, and visualize architecture in real time.
      </p>

      <div style={{ marginTop: "24px" }}>
        <button
          type="button"
          onClick={onCreateBoard}
          className="btn btn-primary"
        >
          <Plus size={18} />
          <span>Create Whiteboard</span>
        </button>
      </div>
    </div>
  );
}

export default DashboardEmptyState;
