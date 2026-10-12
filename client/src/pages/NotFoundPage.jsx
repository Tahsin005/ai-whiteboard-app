import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";

export const NotFoundPage = () => {
  return (
    <div className="app-shell" style={{ alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div className="card-simple" style={{ maxWidth: "400px", textAlign: "center" }}>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "4rem",
            fontWeight: 800,
            color: "var(--brand-600)",
            lineHeight: 1,
            letterSpacing: "-0.04em",
          }}
        >
          404
        </h1>
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.25rem",
            fontWeight: 700,
            color: "var(--text-main)",
            marginTop: "12px",
          }}
        >
          Page Not Found
        </h2>
        <p
          style={{
            fontSize: "0.9rem",
            color: "var(--text-muted)",
            marginTop: "8px",
            marginBottom: "24px",
          }}
        >
          The page you are looking for does not exist or has been moved.
        </p>

        <Link to="/dashboard" className="btn btn-primary btn-sm" style={{ width: "100%" }}>
          <ArrowLeft size={16} />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
