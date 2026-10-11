import { Link, useNavigate } from "react-router";
import { useAuth } from "@/context/AuthContext.jsx";
import { PenTool, LogOut, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button.jsx";
import { Avatar, AvatarFallback } from "@/components/ui/avatar.jsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.jsx";

export const Navbar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth/sign-in");
  };

  const initial =
    user?.name?.[0]?.toUpperCase() ||
    user?.email?.[0]?.toUpperCase() ||
    "U";

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <Link to="/dashboard" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-xs">
            <PenTool className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold text-sm tracking-tight text-foreground">
            AI Whiteboard
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 px-2 gap-2 rounded-full">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="text-xs bg-muted text-muted-foreground font-semibold">
                    {initial}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline-block text-xs font-medium max-w-[140px] truncate text-foreground">
                  {user?.name || user?.email?.split("@")[0] || "Account"}
                </span>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none truncate">
                    {user?.name || "Account"}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground truncate">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/dashboard" className="flex items-center gap-2 cursor-pointer">
                  <LayoutGrid className="w-4 h-4 text-muted-foreground" />
                  Dashboard
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="text-destructive focus:text-destructive cursor-pointer"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
