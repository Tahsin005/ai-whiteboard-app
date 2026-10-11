import React from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../context/AuthContext.jsx";
import LoadingSpinner from "../components/ui/LoadingSpinner.jsx";

export const PublicOnlyRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSpinner label="Checking session..." />;
  }

  if (isAuthenticated) {
    const destination = location.state?.from?.pathname || "/dashboard";
    return <Navigate to={destination} replace />;
  }

  return children ? children : <Outlet />;
};

export default PublicOnlyRoute;
