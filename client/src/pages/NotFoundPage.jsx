import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button.jsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.jsx";

export const NotFoundPage = () => {
  return (
    <div className="min-h-screen w-full bg-muted/40 text-foreground flex flex-col items-center justify-center p-6 text-center">
      <Card className="max-w-sm w-full">
        <CardHeader>
          <CardTitle className="text-4xl">404</CardTitle>
          <CardDescription>
            The page you are looking for does not exist.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild size="sm">
            <Link to="/dashboard" className="inline-flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Return to Dashboard
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFoundPage;
