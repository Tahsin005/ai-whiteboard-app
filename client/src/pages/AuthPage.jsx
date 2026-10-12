import { useParams, Link } from "react-router";
import { AuthView } from "@neondatabase/auth-ui";
import { PenTool, ArrowLeft } from "lucide-react";

export const AuthPage = () => {
  const { path } = useParams();
  const currentPath = path || "sign-in";
  const isSignUp = currentPath === "sign-up";

  return (
    <div className="auth-page">
      <header className="page-container auth-header">
        <Link to="/" className="navbar-brand">
          <div className="navbar-brand-icon">
            <PenTool size={20} />
          </div>
          <span className="navbar-brand-text">CanvasAI</span>
        </Link>

        <Link to="/" className="btn btn-ghost btn-sm">
          <ArrowLeft size={15} />
          <span>Back to Home</span>
        </Link>
      </header>

      <main className="page-container auth-hero-section">
        <div className="auth-brand-badge">
          <div className="auth-brand-icon">
            <PenTool size={24} />
          </div>
          <h1 className="auth-title">
            {isSignUp ? "Create your CanvasAI account" : "Welcome back to CanvasAI"}
          </h1>
          <p className="auth-subtitle">
            {isSignUp
              ? "Start collaborating with real-time visual canvases in seconds."
              : "Sign in to access your whiteboards, sketches, and diagrams."}
          </p>
        </div>

        <div className="auth-card-wrapper">
          <AuthView
            path={currentPath}
            redirectTo="/dashboard"
          />
        </div>
      </main>
    </div>
  );
};

export default AuthPage;
