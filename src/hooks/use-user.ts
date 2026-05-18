import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/features/auth";
import { authApi } from "@/features/auth/services/auth.api";
import type { User } from "@/interfaces/user.interface";

/**
 * Custom hook for managing user state and operations
 * Integrates with Zustand auth store for real user data
 */
export function useUser() {
  // Get authenticated user ID and token from auth store
  const { accessToken, userId, userName, userEmail, role } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", userId],
    queryFn: async () => {
      if (!userId) return null;
      return await authApi.getProfile(userId);
    },
    enabled: !!userId,
  });

  // Create user object from API response or fallback to store data
  const user: User = {
    id: userId || "",
    name: profile?.data.fullName || profile?.data.name || userName || "",
    email: profile?.data.email || userEmail || "",
    attachments: [],
  };

  const logout = useCallback(async () => {
    try {
      // Get logout function from auth store
      const { logout: authLogout } = useAuthStore.getState();
      // Call logout API endpoint
      await authApi.logout();
      // Clear auth store on successful logout
      authLogout();
    } catch (error) {
      // Get logout function from auth store
      const { logout: authLogout } = useAuthStore.getState();
      // Clear auth store even if API call fails to ensure clean state
      authLogout();
      throw error;
    }
  }, []);

 

  const updateProfile = useCallback(async (userData: Partial<User>) => {
    try {
      if (!userId) {
        throw new Error("User ID is missing");
      }

      const [fallbackFirstName = "", ...fallbackLastNameParts] = (userData.name || "")
        .trim()
        .split(/\s+/)
        .filter(Boolean);
      const fallbackLastName = fallbackLastNameParts.join(" ");

      const payload = {
        email: userData.email || "",
        firstName: userData.firstName || fallbackFirstName,
        lastName: userData.lastName || fallbackLastName,
      };

      const updatedProfile =
        role === "admin"
          ? await authApi.updateAdminProfile(payload)
          : await authApi.updateProfile(payload);

      // Update store with new data
      const { updateUser } = useAuthStore.getState();
      const displayName =
        updatedProfile.data.fullName ||
        updatedProfile.data.name ||
        [updatedProfile.data.firstName, updatedProfile.data.lastName]
          .filter(Boolean)
          .join(" ");
      updateUser({ 
        name: displayName,
        email: updatedProfile.data.email 
      });

      // Invalidate profile query to ensure fresh data is fetched
      await queryClient.invalidateQueries({ queryKey: ["profile", userId] });

      return updatedProfile;
    } catch (error) {
      throw error;
    }
  }, [queryClient, role, userId]);

  return {
    user,
    profile,
    role,
    isLoading,
    logout,
    updateProfile,
    isAuthenticated: !!accessToken,
  };
}
