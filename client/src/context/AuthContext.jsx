import React, { createContext, useContext, useMemo } from "react";
import { AuthUIContext } from "@neondatabase/auth-ui";
import { authClient, getJWTToken } from "../lib/auth.js";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const authUIContext = useContext(AuthUIContext);
  const useSessionHook = authUIContext?.hooks?.useSession;

  // Use Better Auth's reactive session hook provided by AuthUIContext
  const sessionResult = useSessionHook ? useSessionHook() : { data: null, isPending: true };
  const { data: sessionData, isPending = false, refetch } = sessionResult || {};

  const user = sessionData?.user || null;
  const session = sessionData?.session || null;
  const isAuthenticated = Boolean(user);

  const handleSignOut = async () => {
    try {
      if (typeof authClient.signOut === "function") {
        await authClient.signOut();
      }
      if (typeof refetch === "function") {
        await refetch();
      }
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  const value = useMemo(
    () => ({
      user,
      session,
      isLoading: isPending,
      isAuthenticated,
      signOut: handleSignOut,
      refetchSession: refetch,
      getJWTToken,
      authClient,
    }),
    [user, session, isPending, isAuthenticated, refetch]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
