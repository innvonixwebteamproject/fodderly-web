import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";

interface PublicRouteProps {
  children: React.ReactNode;
}

/**
 * Public Route Protection
 * 
 * - Allows access to public pages (login)
 * - Redirects authenticated users based on role and password change status
 */
export function PublicRoute({ children }: PublicRouteProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const role = useAuthStore((state) => state.role);
  const forcePasswordChange = useAuthStore((state) => state.forcePasswordChange);
  const location = useLocation();

  if (isAuthenticated) {
    // 1. Specifically block admins from the force password change page
    if (role === "admin" && location.pathname === "/force-password-change") {
      return <Navigate to="/error/403" replace />;
    }

    // 2. Handle Partner force password change flow
    if (role === "partner" && !forcePasswordChange && location.pathname !== "/force-password-change") {
      return <Navigate to="/force-password-change" replace state={{ from: location }} />;
    }
    
    // 3. Redirect authenticated users to dashboard if they shouldn't be on a public page
    // (excluding the case where a partner is correctly on the force-password-change page)
    if (location.pathname !== "/force-password-change") {
      return <Navigate to="/dashboard" replace state={{ from: location }} />;
    }
  }

  return children;
}
