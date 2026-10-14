import { Link } from "react-router";
import {
  PenTool,
  ArrowRight,
  Sparkles,
  Loader2,
  MousePointer,
  Square,
  Circle,
  Type,
  StickyNote,
  Image as ImageIcon,
  Share2,
  Users,
  Cloud,
  Minus,
  Plus,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext.jsx";

export const LandingPage = () => {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <div className="app-shell">

      <header className="page-container landing-header">
        <div className="navbar-brand">
          <div className="navbar-brand-icon">
            <PenTool size={18} />
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
            <span className="navbar-brand-text">CanvasAI</span>
            <span className="navbar-brand-tag font-hand">virtual whiteboard</span>
          </div>
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
            <div style={{ display: "flex", gap: "10px" }}>
              <Link to="/auth/sign-in" className="btn btn-ghost btn-sm">
                Sign In
              </Link>
              <Link to="/auth/sign-up" className="btn btn-primary btn-sm">
                <span>Get Started</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </div>
      </header>


      <main className="page-container landing-hero">
        <div className="badge badge-hand" style={{ marginBottom: "18px" }}>
          <Sparkles size={14} color="#6965db" />
          <span>Hand-drawn feel · Realtime AI Whiteboard</span>
        </div>

        <h1 className="landing-title">
          Virtual whiteboard for{" "}
          <span className="sketch-highlight">sketching hand-drawn</span> diagrams
        </h1>

        <span className="landing-hand-subtitle">
          ~ simple, collaborative, and delightfully fast ~
        </span>

        <p className="landing-desc">
          Sketch flowcharts, design architectures, brainstorm collaboratively, and
          let AI turn your ideas into diagrams with Excalidraw's iconic warmth.
        </p>

        <div style={{ marginTop: "32px", display: "flex", gap: "14px", flexWrap: "wrap", justifyContent: "center" }}>
          {isLoading ? (
            <button
              className="btn btn-primary btn-lg"
              disabled
              style={{ minWidth: "190px" }}
            >
              <Loader2 size={16} className="animate-spin-fast" />
              <span>Checking session...</span>
            </button>
          ) : (
            <>
              <Link
                to={isAuthenticated ? "/dashboard" : "/auth/sign-in"}
                className="btn btn-primary btn-lg"
              >
                <span>{isAuthenticated ? "Open My Whiteboards" : "Start Drawing Free"}</span>
                <ArrowRight size={18} />
              </Link>
              {!isAuthenticated && (
                <Link to="/auth/sign-up" className="btn btn-secondary btn-lg">
                  Create Account
                </Link>
              )}
            </>
          )}
        </div>


        <div className="landing-mockup-wrapper">

          <div className="landing-mockup-toolbar">
            <div className="landing-mockup-tool is-active" title="Selection (V)">
              <MousePointer size={16} />
            </div>
            <div className="landing-mockup-tool" title="Rectangle (R)">
              <Square size={16} />
            </div>
            <div className="landing-mockup-tool" title="Ellipse (O)">
              <Circle size={16} />
            </div>
            <div className="landing-mockup-tool" title="Pen Tool (P)">
              <PenTool size={16} />
            </div>
            <div className="landing-mockup-tool" title="Text (T)">
              <Type size={16} />
            </div>
            <div className="landing-mockup-tool" title="Sticky Note (S)">
              <StickyNote size={16} />
            </div>
            <div className="landing-mockup-tool" title="Image (9)">
              <ImageIcon size={16} />
            </div>
            <div style={{ width: "1px", height: "20px", background: "var(--border-subtle)", margin: "0 4px" }} />
            <div className="landing-mockup-tool" title="Generate with AI" style={{ color: "var(--brand-600)" }}>
              <Sparkles size={16} />
            </div>
          </div>


          <div className="landing-mockup-canvas">

            <div
              className="landing-sticky-note"
              style={{
                top: "35px",
                left: "40px",
                transform: "rotate(-2deg)",
              }}
            >
              <div style={{ fontWeight: "bold", marginBottom: "6px" }}>💡 Today's Brainstorm</div>
              <div>• Hand-drawn sketch aesthetic</div>
              <div>• Assistant & Excalifont typography</div>
              <div>• Live multiplayer sync ⚡</div>
            </div>


            <div
              className="landing-sketch-node"
              style={{
                top: "140px",
                right: "340px",
                transform: "rotate(0.5deg)",
              }}
            >
              <Square size={18} color="#6965db" />
              <span>React Client</span>
            </div>


            <svg
              style={{
                position: "absolute",
                top: "120px",
                right: "210px",
                width: "130px",
                height: "80px",
                overflow: "visible",
                zIndex: 6,
              }}
            >
              <path
                d="M 10 45 Q 60 10, 110 45"
                fill="none"
                stroke="#1e1e1e"
                strokeWidth="2.5"
                strokeDasharray="6 3"
              />
              <polygon points="112,45 102,38 105,48" fill="#1e1e1e" />
              <text x="35" y="18" fill="#6965db" fontFamily="var(--font-hand)" fontSize="15">
                WebSocket Sync
              </text>
            </svg>

            <div
              className="landing-sketch-node"
              style={{
                top: "140px",
                right: "40px",
                transform: "rotate(-1deg)",
                borderColor: "#6965db",
              }}
            >
              <Cloud size={18} color="#6965db" />
              <span>Neon Cloud + S3</span>
            </div>


            <div
              className="landing-cursor-tag"
              style={{
                top: "80px",
                left: "320px",
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#e03131">
                <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87a.5.5 0 0 0 .35-.85L6.35 2.85a.5.5 0 0 0-.85.36z" />
              </svg>
              <span className="landing-cursor-badge" style={{ background: "#e03131" }}>
                Sarah (sketching...)
              </span>
            </div>


            <div
              className="landing-cursor-tag"
              style={{
                bottom: "60px",
                right: "180px",
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#6965db">
                <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87a.5.5 0 0 0 .35-.85L6.35 2.85a.5.5 0 0 0-.85.36z" />
              </svg>
              <span className="landing-cursor-badge" style={{ background: "#6965db" }}>
                Alex
              </span>
            </div>


            <div
              style={{
                position: "absolute",
                bottom: "16px",
                left: "16px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "rgba(255, 255, 255, 0.95)",
                padding: "4px 10px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-default)",
                boxShadow: "var(--shadow-2xs)",
                fontFamily: "var(--font-sans)",
                fontSize: "0.85rem",
                color: "var(--text-secondary)",
              }}
            >
              <Minus size={13} style={{ cursor: "pointer" }} />
              <span style={{ fontWeight: 600 }}>100%</span>
              <Plus size={13} style={{ cursor: "pointer" }} />
              <div style={{ width: "1px", height: "14px", background: "var(--border-subtle)", margin: "0 2px" }} />
              <span style={{ color: "#2f9e44", fontSize: "0.75rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#2f9e44" }} />
                Live Sync
              </span>
            </div>
          </div>
        </div>


        <div className="landing-features-grid">
          <div className="landing-feature-card">
            <div className="landing-feature-icon">
              <PenTool size={22} />
            </div>
            <h3 className="landing-feature-title">Excalidraw Aesthetic</h3>
            <p className="landing-feature-desc">
              Authentic Virgil & Excalifont handwriting paired with clean Assistant typography and organic sketch strokes.
            </p>
          </div>

          <div className="landing-feature-card">
            <div className="landing-feature-icon">
              <Sparkles size={22} />
            </div>
            <h3 className="landing-feature-title">AI Diagram Generator</h3>
            <p className="landing-feature-desc">
              Describe systems, database schemas, mindmaps, or user journeys in plain text and watch them render instantly.
            </p>
          </div>

          <div className="landing-feature-card">
            <div className="landing-feature-icon">
              <Users size={22} />
            </div>
            <h3 className="landing-feature-title">Live Multiplayer</h3>
            <p className="landing-feature-desc">
              Real-time collaboration over WebSockets with presence avatars, live cursor pointers, and instant element broadcast.
            </p>
          </div>

          <div className="landing-feature-card">
            <div className="landing-feature-icon">
              <Cloud size={22} />
            </div>
            <h3 className="landing-feature-title">Neon Postgres & S3</h3>
            <p className="landing-feature-desc">
              Persistent canvas elements stored in PostgreSQL, with image uploads saved directly to your cloud S3 bucket.
            </p>
          </div>
        </div>


        <div className="landing-cta-banner">
          <h2
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "1.85rem",
              fontWeight: 700,
              color: "var(--text-main)",
            }}
          >
            Ready to bring your ideas to life?
          </h2>
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "1rem",
              color: "var(--text-secondary)",
              maxWidth: "500px",
            }}
          >
            Create your first whiteboard in seconds. Free, collaborative, and designed for natural sketching.
          </p>
          <Link
            to={isAuthenticated ? "/dashboard" : "/auth/sign-in"}
            className="btn btn-primary btn-lg"
            style={{ marginTop: "8px" }}
          >
            <span>{isAuthenticated ? "Go to Dashboard" : "Get Started Now"}</span>
            <ArrowRight size={18} />
          </Link>
        </div>
      </main>


      <footer className="landing-footer">
        <div className="page-container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <PenTool size={16} color="#6965db" />
            <span style={{ fontWeight: 600, color: "var(--text-main)" }}>CanvasAI</span>
            <span className="font-hand" style={{ color: "var(--brand-600)", marginLeft: "4px" }}>
              ~ hand-drawn visual workspace ~
            </span>
          </div>
          <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
            Powered by Excalidraw, React & Neon Cloud
          </span>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
