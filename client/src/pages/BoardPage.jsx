import { useParams, Link } from "react-router";
import { ArrowLeft, PenTool } from "lucide-react";

export const BoardPage = () => {
  const { boardId } = useParams();

  return (
    <div className="app-shell">
      <header className="navbar">
        <div className="page-container navbar-inner">
          <Link to="/dashboard" className="btn btn-ghost btn-sm">
            <ArrowLeft size={16} />
            <span>Back to Dashboard</span>
          </Link>

          <span
            className="badge"
            style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}
          >
            {boardId}
          </span>
        </div>
      </header>

      <main
        className="page-container"
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 24px",
        }}
      >
        <div
          className="card-simple"
          style={{ maxWidth: "440px", textAlign: "center" }}
        >
          <div
            className="navbar-brand-icon"
            style={{ width: "48px", height: "48px", margin: "0 auto 16px" }}
          >
            <PenTool size={24} />
          </div>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.4rem",
              fontWeight: 700,
              color: "var(--text-main)",
            }}
          >
            Whiteboard Canvas
          </h2>
          <p
            style={{
              fontSize: "0.9rem",
              color: "var(--text-secondary)",
              marginTop: "8px",
            }}
          >
            Workspace placeholder for board:
          </p>
          <div
            style={{
              marginTop: "16px",
              padding: "10px 14px",
              background: "var(--bg-subtle)",
              borderRadius: "var(--radius-md)",
              fontFamily: "var(--font-mono)",
              fontSize: "0.85rem",
              color: "var(--brand-700)",
              border: "1px solid var(--border-subtle)",
              wordBreak: "break-all",
            }}
          >
            {boardId}
          </div>
        </div>
      </main>
    </div>
  );
};

export default BoardPage;
