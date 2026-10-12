import { Link } from "react-router";
import { PenTool, ArrowRight, Sparkles, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext.jsx";

export const LandingPage = () => {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <div className="app-shell">
      <header className="page-container landing-header">
        <div className="navbar-brand">
          <div className="navbar-brand-icon">
            <PenTool size={20} />
          </div>
          <span className="navbar-brand-text">CanvasAI</span>
        </div>

        <div>
          {isLoading ? (
            <div
              className="btn btn-secondary btn-sm"
              style={{ opacity: 0.7, pointerEvents: "none", minWidth: "84px" }}
            >
              <Loader2 size={14} className="animate-spin-fast" />
            </div>
          ) : isAuthenticated ? (
            <Link to="/dashboard" className="btn btn-primary btn-sm">
              <span>Go to Dashboard</span>
              <ArrowRight size={14} />
            </Link>
          ) : (
            <Link to="/auth/sign-in" className="btn btn-secondary btn-sm">
              Sign In
            </Link>
          )}
        </div>
      </header>

      <main className="page-container landing-hero">
        <div className="badge" style={{ marginBottom: "20px" }}>
          <Sparkles size={14} color="#6366f1" />
          <span>Real-time Intelligent Whiteboard</span>
        </div>

        <h1 className="landing-title">
          Where ideas take shape at the <span className="landing-gradient-text">speed of thought</span>
        </h1>

        <p className="landing-desc">
          Design architectures, sketch diagrams, brainstorm collaboratively, and accelerate your creative workflow.
        </p>

        <div style={{ marginTop: "36px", display: "flex", gap: "14px" }}>
          {isLoading ? (
            <button
              className="btn btn-primary btn-lg"
              disabled
              style={{ minWidth: "190px" }}
            >
              <Loader2 size={16} className="animate-spin-fast" />
              <span>Checking...</span>
            </button>
          ) : (
            <Link
              to={isAuthenticated ? "/dashboard" : "/auth/sign-in"}
              className="btn btn-primary btn-lg"
            >
              <span>{isAuthenticated ? "Open Dashboard" : "Get Started Free"}</span>
              <ArrowRight size={16} />
            </Link>
          )}
        </div>
      </main>
    </div>
  );
};

export default LandingPage;
