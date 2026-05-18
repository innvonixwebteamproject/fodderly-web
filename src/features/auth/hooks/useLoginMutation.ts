import { useMutation } from "@tanstack/react-query";
import { authApi } from "../services/auth.api";
import { useAuthStore } from "../store/auth.store";
import type { LoginRequest, LoginResponse } from "../types";

interface UseLoginMutationOptions {
  onSuccess?: (data: LoginResponse) => void;
  onError?: (error: Error) => void;
}

/**
 * React Query hook for login mutation
 * 
 * Handles:
 * - API call to login endpoint
 * - Error handling and user feedback
 * - Integration with auth store
 */
export function useLoginMutation(options?: UseLoginMutationOptions) {
  const authStore = useAuthStore();

  return useMutation({
    mutationFn: async (credentials: LoginRequest) => {
      const response = await authApi.login(credentials);
      return response;
    },

    onSuccess: (data: LoginResponse) => {
      // Store auth session in Zustand with user profile from response
      authStore.loginSuccess(data.data);

      // Call custom success handler if provided
      if (options?.onSuccess) {
        options.onSuccess(data);
      }
    },

    onError: (error: Error) => {
      // Call custom error handler if provided
      if (options?.onError) {
        options.onError(error);
      }
    },
  });
}
