import { useParams, Link } from "react-router";
import { AuthView } from "@neondatabase/auth-ui";
import { PenTool } from "lucide-react";

export const AuthPage = () => {
  const { path } = useParams();
  const currentPath = path || "sign-in";

  return (
    <div className="min-h-screen w-full bg-muted/40 text-foreground flex flex-col justify-between">
      <header className="w-full max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-xs">
            <PenTool className="w-4 h-4" />
          </div>
          <span className="text-base font-semibold tracking-tight text-foreground">
            AI Whiteboard
          </span>
        </Link>
      </header>

      <main className="flex-1 w-full max-w-sm mx-auto px-4 py-8 flex flex-col items-center justify-center">
        <div className="w-full flex justify-center">
          <AuthView
            path={currentPath}
            redirectTo="/dashboard"
            className="w-full"
          />
        </div>
      </main>

      <footer className="w-full max-w-5xl mx-auto px-6 py-6 text-center text-xs text-muted-foreground">
        AI Whiteboard App
      </footer>
    </div>
  );
};

export default AuthPage;
