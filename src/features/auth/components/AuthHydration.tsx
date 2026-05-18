import { useEffect, useState } from "react";
import { useAuthStore } from "../store/auth.store";
import { authApi } from "../services/auth.api";
interface AuthHydrationProps {
  children: React.ReactNode;
}

/**
 * Auth Hydration Wrapper
 * 
 * Ensures auth state is loaded from localStorage before rendering routes
 * This prevents showing the login page briefly when user is already authenticated
 */
export function AuthHydration({ children }: AuthHydrationProps) {
  const [isHydrated, setIsHydrated] = useState(false);
  
  // Use specific selectors to avoid unnecessary re-renders
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const userId = useAuthStore((state) => state.userId);
  const updateUser = useAuthStore((state) => state.updateUser);
  const logout = useAuthStore((state) => state.logout);
  const hydrateAuth = useAuthStore((state) => state.hydrateAuth);

  useEffect(() => {
    const syncProfile = async () => {
      hydrateAuth();
      setIsHydrated(true);

      if (isAuthenticated && userId) {
        try {
          const profile = await authApi.getProfile(userId);
          updateUser({
            name: profile.data.name,
            email: profile.data.email,
            isActive: profile.data.isActive,
            forcePasswordChange: profile.data.forcePasswordChange,
          });

          if (profile.data.isActive === false) {
            logout();
            window.location.replace("/login");
          }
        } catch (error) {
          console.error("Failed to sync user profile", error);
        }
      }
    };

    syncProfile();
  }, [hydrateAuth, isAuthenticated, logout, userId, updateUser]);

  // Show nothing while hydrating to prevent flicker
  if (!isHydrated) {
    return null;
  }

  return children;
}
