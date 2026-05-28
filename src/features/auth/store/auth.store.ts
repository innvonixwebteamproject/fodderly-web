import { create } from "zustand";
import { persist } from "zustand/middleware";
import { devtools } from "zustand/middleware";
import { STORAGE_KEYS } from "@/config/constant";
import type { AuthSession, LoginResponseData } from "../types";

interface AuthStore extends AuthSession {
  /**
   * Set auth session after successful login
   */
  loginSuccess: (data: LoginResponseData) => void;

  /**
   * Clear auth session on logout or 401
   */
  logout: () => void;

  /**
   * Restore auth session from storage on app startup
   */
  hydrateAuth: () => void;
  
  /**
   * Update user profile data in store
   */
  updateUser: (data: {
    name?: string;
    email?: string;
    isActive?: boolean;
    forcePasswordChange?: boolean;
    unitConversion?: { ton_to_kg: number } | null;
  }) => void;

  /**
   * Update only tokens (used by refresh mechanism)
   */
  updateTokens: (accessToken: string, refreshToken: string) => void;
}

const initialState: AuthSession = {
  accessToken: null,
  refreshToken: null,
  expiresIn: null,
  tokenType: null,
  role: null,
  isActive: true,
  forcePasswordChange: false,
  isAuthenticated: false,
  userEmail: null,
  userName: null,
  userId: null,
  unitConversion: null,
};

const readPersistedAuthState = (): AuthSession => {
  const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  const expiresIn = localStorage.getItem("auth.expiresIn");
  const tokenType = localStorage.getItem("auth.tokenType");
  const role = localStorage.getItem("auth.role");
  const isActive = localStorage.getItem("auth.isActive");
  const forcePasswordChange = localStorage.getItem("auth.forcePasswordChange");
  const isAuthenticated = localStorage.getItem("auth.isAuthenticated");
  const userEmail = localStorage.getItem("auth.userEmail");
  const userName = localStorage.getItem("auth.userName");
  const userId = localStorage.getItem("auth.userId");
  const unitConversionStr = localStorage.getItem("auth.unitConversion");
  let unitConversion = null;
  if (unitConversionStr) {
    try {
      unitConversion = JSON.parse(unitConversionStr);
    } catch {
      unitConversion = null;
    }
  }

  return {
    accessToken,
    refreshToken,
    expiresIn: expiresIn ? parseInt(expiresIn, 10) : null,
    tokenType: (tokenType as "Bearer" | null) || null,
    role: (role as "admin" | "partner" | null) || null,
    isActive: isActive ? isActive === "true" : true,
    forcePasswordChange: forcePasswordChange === "true",
    isAuthenticated: isAuthenticated === "true",
    userEmail: userEmail || null,
    userName: userName || null,
    userId: userId || null,
    unitConversion: unitConversion,
  };
};

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,

        loginSuccess: (data: LoginResponseData) => {
          set({
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            expiresIn: data.expiresIn,
            tokenType: data.tokenType,
            role: data.role,
            forcePasswordChange: data.forcePasswordChange,
            isActive: data.isActive,
            userEmail: data.email,
            userName: data.fullName || (data.firstName ? `${data.firstName} ${data.lastName || ""}`.trim() : data.name),
            userId: data.id,
            unitConversion: data.unitConversion || null,
            isAuthenticated: true,
          });
        },

        logout: () => {
          set({ ...initialState });
          localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
          localStorage.removeItem("auth.expiresIn");
          localStorage.removeItem("auth.tokenType");
          localStorage.removeItem("auth.role");
          localStorage.removeItem("auth.forcePasswordChange");
          localStorage.removeItem("auth.isActive");
          localStorage.removeItem("auth.isAuthenticated");
          localStorage.removeItem("auth.userEmail");
          localStorage.removeItem("auth.userName");
          localStorage.removeItem("auth.userId");
          localStorage.removeItem("auth.unitConversion");
        },

        hydrateAuth: () => {
          // No-op: persistence layer handles hydration
          // This exists for explicit hydration if needed
        },

        updateUser: (data) => {
          set((state) => {
             const newState = {
                ...state,
                userName: data.name || state.userName,
                userEmail: data.email || state.userEmail,
                isActive: data.isActive ?? state.isActive,
                forcePasswordChange:
                  data.forcePasswordChange ?? state.forcePasswordChange,
                unitConversion: data.unitConversion !== undefined ? data.unitConversion : state.unitConversion,
             };
             return newState;
          });
        },

        updateTokens: (accessToken, refreshToken) => {
          set({ accessToken, refreshToken });
          localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
          localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
        },
      }),
      {
        name: STORAGE_KEYS.ACCESS_TOKEN,
        storage: {
          getItem: () => {
            const state = readPersistedAuthState();

            if (!state.accessToken) {
              return null;
            }

            return {
              state,
              version: 0,
            };
          },

          setItem: (_name: string, value) => {
            const persistedState = value.state as Partial<AuthSession>;
            const state: AuthSession = {
              ...initialState,
              ...readPersistedAuthState(),
              ...persistedState,
            };

            localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, state.accessToken ?? "");
            localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, state.refreshToken ?? "");

            if (state.expiresIn != null) {
              localStorage.setItem("auth.expiresIn", String(state.expiresIn));
            } else {
              localStorage.removeItem("auth.expiresIn");
            }

            localStorage.setItem("auth.tokenType", state.tokenType ?? "");
            localStorage.setItem("auth.role", state.role || "admin");
            localStorage.setItem("auth.isActive", String(state.isActive));
            localStorage.setItem(
              "auth.forcePasswordChange",
              String(state.forcePasswordChange),
            );
            localStorage.setItem("auth.isAuthenticated", String(state.isAuthenticated));
            localStorage.setItem("auth.userEmail", state.userEmail ?? "");
            localStorage.setItem("auth.userName", state.userName ?? "");
            localStorage.setItem("auth.userId", state.userId ?? "");
            if (state.unitConversion) {
              localStorage.setItem("auth.unitConversion", JSON.stringify(state.unitConversion));
            } else {
              localStorage.removeItem("auth.unitConversion");
            }
          },

          removeItem: () => {
            localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
            localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
            localStorage.removeItem("auth.expiresIn");
            localStorage.removeItem("auth.tokenType");
            localStorage.removeItem("auth.role");
            localStorage.removeItem("auth.forcePasswordChange");
            localStorage.removeItem("auth.isActive");
            localStorage.removeItem("auth.isAuthenticated");
            localStorage.removeItem("auth.userEmail");
            localStorage.removeItem("auth.userName");
            localStorage.removeItem("auth.userId");
            localStorage.removeItem("auth.unitConversion");
          },
        },
        skipHydration: false,
      }
    ),
    { name: "AuthStore" }
  )
);
