import { useParams, Link } from "react-router";
import { AuthView } from "@neondatabase/auth-ui";
import { PenTool, ArrowLeft, Sparkles } from "lucide-react";

export const AuthPage = () => {
  const { path } = useParams();
  const currentPath = path || "sign-in";
  const isSignUp = currentPath === "sign-up";

  return (
    <div className="auth-page">
      <header className="page-container auth-header">
        <Link to="/" className="navbar-brand">
          <div className="navbar-brand-icon">
            <PenTool size={18} />
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
            <span className="navbar-brand-text">CanvasAI</span>
            <span className="navbar-brand-tag font-hand">virtual whiteboard</span>
          </div>
        </Link>

        <Link to="/" className="btn btn-ghost btn-sm">
          <ArrowLeft size={15} />
          <span>Back to Home</span>
        </Link>
      </header>

      <main className="page-container auth-hero-section">
        <div className="auth-brand-badge">
          <div className="badge badge-hand" style={{ marginBottom: "14px" }}>
            <Sparkles size={14} color="#6965db" />
            <span>Excalidraw Canvas Account</span>
          </div>
          <h1 className="auth-title">
            {isSignUp ? "Create your CanvasAI account" : "Welcome back to CanvasAI"}
          </h1>
          <p className="auth-subtitle">
            {isSignUp
              ? "Start sketching hand-drawn diagrams and collaborate in real-time."
              : "Sign in to access your whiteboards, sketches, and architectures."}
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", maxWidth: "440px" }}>
          <div className="auth-card-wrapper">
            <AuthView
              path={currentPath}
              redirectTo="/dashboard"
            />
          </div>


          <div
            style={{
              marginTop: "20px",
              padding: "10px 18px",
              background: "#fff9c4",
              border: "1px solid #ebd982",
              borderRadius: "var(--radius-sm)",
              boxShadow: "var(--shadow-2xs)",
              fontFamily: "var(--font-hand)",
              color: "#473d18",
              fontSize: "1.05rem",
              textAlign: "center",
              transform: "rotate(-1deg)",
            }}
          >
            ✏️ Unlimited canvases · Instant cloud autosave · Real-time live sync
          </div>
        </div>
      </main>
    </div>
  );
};

export default AuthPage;
