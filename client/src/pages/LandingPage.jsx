import { Link } from "react-router";
import { PenTool, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button.jsx";
import { useAuth } from "@/context/AuthContext.jsx";

export const LandingPage = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col justify-between">
      <header className="w-full max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-xs">
            <PenTool className="w-4 h-4" />
          </div>
          <span className="text-base font-semibold tracking-tight">
            AI Whiteboard
          </span>
        </div>

        <div>
          {isAuthenticated ? (
            <Button asChild size="sm">
              <Link to="/dashboard">Go to Dashboard</Link>
            </Button>
          ) : (
            <Button asChild size="sm">
              <Link to="/auth/sign-in">Sign In</Link>
            </Button>
          )}
        </div>
      </header>

      <main className="flex-1 w-full max-w-3xl mx-auto px-6 py-16 flex flex-col items-center justify-center text-center">
        <div className="mt-8 flex items-center gap-3">
          <Button asChild size="lg">
            <Link to={isAuthenticated ? "/dashboard" : "/auth/sign-in"}>
              {isAuthenticated ? "Open Dashboard" : "Get Started"}
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Link>
          </Button>
        </div>
      </main>

      <footer className="w-full max-w-5xl mx-auto px-6 py-6 text-center text-xs text-muted-foreground border-t border-border/50">
        AI Whiteboard App
      </footer>
    </div>
  );
};

export default LandingPage;
