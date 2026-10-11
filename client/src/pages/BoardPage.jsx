import { useParams, Link } from "react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button.jsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.jsx";

export const BoardPage = () => {
  const { boardId } = useParams();

  return (
    <div className="min-h-screen w-full bg-muted/40 text-foreground flex flex-col">
      <header className="h-14 border-b border-border bg-background px-6 flex items-center justify-between sticky top-0 z-30">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-xs">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </Link>
        </Button>
        <span className="text-xs font-mono text-muted-foreground">
          {boardId}
        </span>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <CardTitle className="text-xl">Whiteboard Canvas</CardTitle>
            <CardDescription>
              Workspace placeholder for board:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <code className="text-xs bg-muted px-2 py-1 rounded font-mono text-foreground">
              {boardId}
            </code>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default BoardPage;
