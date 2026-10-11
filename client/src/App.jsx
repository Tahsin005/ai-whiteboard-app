import { BrowserRouter, Routes, Route, Navigate, useNavigate, Link } from "react-router";
import { NeonAuthUIProvider } from "@neondatabase/auth-ui";
import { Toaster } from "react-hot-toast";

import { authClient } from "./lib/auth.js";
import { AuthProvider } from "./context/AuthContext.jsx";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import PublicOnlyRoute from "./routes/PublicOnlyRoute.jsx";

import LandingPage from "./pages/LandingPage.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import BoardPage from "./pages/BoardPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";

function NeonAuthProviderWrapper({ children }) {
  const navigate = useNavigate();

  return (
    <NeonAuthUIProvider
      authClient={authClient}
      defaultTheme="light"
      basePath="/auth"
      redirectTo="/dashboard"
      navigate={(to) => navigate(to)}
      replace={(to) => navigate(to, { replace: true })}
      Link={({ href, children, ...rest }) => (
        <Link to={href} {...rest}>
          {children}
        </Link>
      )}
    >
      <AuthProvider>{children}</AuthProvider>
    </NeonAuthUIProvider>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <NeonAuthProviderWrapper>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: "hsl(var(--card))",
              color: "hsl(var(--card-foreground))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "var(--radius)",
              fontSize: "0.875rem",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
            },
          }}
        />
        <Routes>
          <Route path="/" element={<LandingPage />} />

          <Route element={<PublicOnlyRoute />}>
            <Route path="/auth" element={<Navigate to="/auth/sign-in" replace />} />
            <Route path="/auth/:path" element={<AuthPage />} />
            <Route path="/sign-in" element={<Navigate to="/auth/sign-in" replace />} />
            <Route path="/sign-up" element={<Navigate to="/auth/sign-up" replace />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/board/:boardId" element={<BoardPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </NeonAuthProviderWrapper>
    </BrowserRouter>
  );
}

export default App;
