import Navbar from "@/components/layout/Navbar.jsx";
import { useAuth } from "@/context/AuthContext.jsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.jsx";

export const DashboardPage = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen w-full bg-muted/40 text-foreground flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-6">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <CardTitle className="text-xl">Dashboard</CardTitle>
            <CardDescription>
              Protected workspace placeholder.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Authenticated as{" "}
              <strong className="text-foreground font-medium">
                {user?.email}
              </strong>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default DashboardPage;
