import { api } from "@/lib/axios.interceptors";
import type {
  LoginRequest,
  LoginResponse,
  UserProfile,
  EditProfileSchemaType,
} from "../types";
import type { ResetPasswordSchemaType } from "../types/password.types";

/**
 * Auth API Service
 *
 * Pure API layer - handles all authentication API calls
 * Returns strongly typed responses
 */

export const authApi = {
  /**
   * Login with email and password
   * @param payload - Email and password credentials
   * @returns API response with auth tokens and session data
   */
  login: async (payload: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>("/auth/login", payload);
    return response.data;
  },

  /**
   * Refresh access token
   * @param refreshToken - Current refresh token
   * @returns API response with new auth tokens
   */
  refresh: async (refreshToken: string): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>(
      "/auth/refresh",
      { refreshToken: refreshToken },
      {
        headers: {
          Authorization: `Bearer ${refreshToken}`,
        },
      },
    );
    return response.data;
  },

  /**
   * Logout user
   * @returns API response confirmation
   */
  logout: async (): Promise<{ success: boolean; message: string }> => {
    const response = await api.post<{ success: boolean; message: string }>(
      "/auth/logout",
      {},
    );
    return response.data;
  },

  /**
   * Change password for authenticated user (Profile)
   * @param payload - Current password, new password, and confirm password
   * @returns API response confirmation
   */
  changePassword: async (payload: {
    currentPassword?: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<{ success: boolean; message: string }> => {
    const response = await api.post<{ success: boolean; message: string }>(
      "/auth/change-password",
      payload,
    );
    return response.data;
  },

  /**
   * Force change password (Onboarding)
   * @param payload - New password and confirm password
   * @returns API response confirmation
   */
  forceChangePassword: async (payload: {
    newPassword: string;
    confirmPassword: string;
  }): Promise<{ success: boolean; message: string }> => {
    const response = await api.post<{ success: boolean; message: string }>(
      "/auth/force-change-password",
      payload,
    );
    return response.data;
  },

  /**
   * Request password reset link
   * @param email - User email address
   * @returns API response confirmation
   */
  forgotPassword: async (
    email: string,
  ): Promise<{ success: boolean; message: string }> => {
    const response = await api.post<{ success: boolean; message: string }>(
      "/auth/forgot-password",
      { email },
    );
    return response.data;
  },

  /**
   * Validate password reset link token before showing reset form
   * @param token - Reset link token
   * @returns API response confirmation
   */
  checkResetLink: async (
    token: string,
  ): Promise<{ success: boolean; message: string; data?: { isValid?: boolean } }> => {
    const response = await api.get<{
      success: boolean;
      message: string;
      data?: { isValid?: boolean };
    }>("/auth/check-reset-link", {
      params: { token },
    });
    return response.data;
  },

  /**
   * Reset password using token
   * @param payload - Token and new password
   * @returns API response confirmation
   */
  resetPassword: async (payload: {
    token: string;
    data: ResetPasswordSchemaType;
  }): Promise<{ success: boolean; message: string }> => {
    const response = await api.post<{ success: boolean; message: string }>(
      "/auth/reset-password",
      {
        token: payload.token,
        newPassword: payload.data.password,
        confirmPassword: payload.data.confirmPassword,
      },
    );
    return response.data;
  },

  /**
   * Get user profile
   * @param id - User ID
   * @returns User profile data
   */
  getProfile: async (_id: string): Promise<UserProfile> => {
    const response = await api.get<UserProfile>(`/auth/profile`);
    return response.data;
  },

  /**
   * Update partner profile
   * @param data - Profile data
   * @returns Updated user profile
   */
  updateProfile: async (data: EditProfileSchemaType): Promise<UserProfile> => {
    const response = await api.post<UserProfile>("/partners/update-profile", {
      firstName: data.firstName,
      lastName: data.lastName,
    });
    return response.data;
  },

  /**
   * Update admin profile
   * @param data - Profile data
   * @returns Updated user profile
   */
  updateAdminProfile: async (
    data: EditProfileSchemaType,
  ): Promise<UserProfile> => {
    const response = await api.patch<UserProfile>("/auth/admin/update-profile", {
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
    });
    return response.data;
  },

};
