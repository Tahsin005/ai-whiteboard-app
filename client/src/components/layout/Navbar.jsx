import { Link, useNavigate } from "react-router";
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui";
import { useAuth } from "@/context/AuthContext.jsx";
import { PenTool, LogOut, LayoutGrid, ChevronDown } from "lucide-react";

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

  const displayName = user?.name || user?.email?.split("@")[0] || "Account";

  return (
    <header className="navbar">
      <div className="page-container navbar-inner">
        <Link to="/dashboard" className="navbar-brand">
          <div className="navbar-brand-icon">
            <PenTool size={18} />
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
            <span className="navbar-brand-text">CanvasAI</span>
            <span className="navbar-brand-tag font-hand">virtual whiteboard</span>
          </div>
        </Link>

        <div className="dropdown-container">
          <DropdownMenuPrimitive.Root>
            <DropdownMenuPrimitive.Trigger asChild>
              <button type="button" className="navbar-user-trigger" aria-label="User menu">
                <div className="navbar-avatar">{initial}</div>
                <span className="navbar-username">{displayName}</span>
                <ChevronDown size={14} color="#64748b" />
              </button>
            </DropdownMenuPrimitive.Trigger>

            <DropdownMenuPrimitive.Portal>
              <DropdownMenuPrimitive.Content
                className="dropdown-menu-custom"
                align="end"
                sideOffset={8}
              >
                <div className="dropdown-header-user">
                  <div className="dropdown-header-name">{user?.name || "Account"}</div>
                  <div className="dropdown-header-email">{user?.email}</div>
                </div>

                <DropdownMenuPrimitive.Item asChild>
                  <Link to="/dashboard" className="dropdown-item-custom">
                    <LayoutGrid size={16} />
                    <span>Dashboard</span>
                  </Link>
                </DropdownMenuPrimitive.Item>

                <div className="dropdown-divider-custom" />

                <DropdownMenuPrimitive.Item
                  className="dropdown-item-custom is-danger"
                  onSelect={handleSignOut}
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </DropdownMenuPrimitive.Item>
              </DropdownMenuPrimitive.Content>
            </DropdownMenuPrimitive.Portal>
          </DropdownMenuPrimitive.Root>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
