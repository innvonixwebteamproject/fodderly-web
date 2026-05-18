import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ("admin" | "partner")[];
}

/**
 * Protected Route Protection
 *
 * - Requires authentication
 * - Redirects unauthenticated users to /login
 * - Redirects inactive or unauthorized users to /error/403
 * - Enforces role-based access control
 * - Enforces mandatory password change redirection
 */
export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const role = useAuthStore((state) => state.role);
  const isActive = useAuthStore((state) => state.isActive);
  const forcePasswordChange = useAuthStore((state) => state.forcePasswordChange);
  const location = useLocation();

  // 1. Authentication Check
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // 2. Account Inactivity Check
  if (!isActive) {
    return <Navigate to="/error/403" replace />;
  }

  // 3. Forced Password Change Check
  if (role === "partner" && !forcePasswordChange && location.pathname !== "/force-password-change") {
    return <Navigate to="/force-password-change" replace />;
  }

  const effectiveRole = role || "admin";

  // 4. Role Authorization Check
  if (allowedRoles && !allowedRoles.includes(effectiveRole as "admin" | "partner")) {
    return <Navigate to="/error/403" replace />;
  }

  return <>{children}</>;
}
