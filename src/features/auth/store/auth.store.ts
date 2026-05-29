import { create } from "zustand";
import { persist } from "zustand/middleware";
import { devtools } from "zustand/middleware";
import { STORAGE_KEYS } from "@/constants/app.constants";
import { ROLES } from "@/constants/auth.constants";
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
  const expiresIn = localStorage.getItem(STORAGE_KEYS.AUTH_EXPIRES_IN);
  const tokenType = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN_TYPE);
  const role = localStorage.getItem(STORAGE_KEYS.AUTH_ROLE);
  const isActive = localStorage.getItem(STORAGE_KEYS.AUTH_IS_ACTIVE);
  const forcePasswordChange = localStorage.getItem(STORAGE_KEYS.AUTH_FORCE_PASSWORD_CHANGE);
  const isAuthenticated = localStorage.getItem(STORAGE_KEYS.AUTH_IS_AUTHENTICATED);
  const userEmail = localStorage.getItem(STORAGE_KEYS.AUTH_USER_EMAIL);
  const userName = localStorage.getItem(STORAGE_KEYS.AUTH_USER_NAME);
  const userId = localStorage.getItem(STORAGE_KEYS.AUTH_USER_ID);
  const unitConversionStr = localStorage.getItem(STORAGE_KEYS.AUTH_UNIT_CONVERSION);
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
          localStorage.removeItem(STORAGE_KEYS.AUTH_EXPIRES_IN);
          localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN_TYPE);
          localStorage.removeItem(STORAGE_KEYS.AUTH_ROLE);
          localStorage.removeItem(STORAGE_KEYS.AUTH_FORCE_PASSWORD_CHANGE);
          localStorage.removeItem(STORAGE_KEYS.AUTH_IS_ACTIVE);
          localStorage.removeItem(STORAGE_KEYS.AUTH_IS_AUTHENTICATED);
          localStorage.removeItem(STORAGE_KEYS.AUTH_USER_EMAIL);
          localStorage.removeItem(STORAGE_KEYS.AUTH_USER_NAME);
          localStorage.removeItem(STORAGE_KEYS.AUTH_USER_ID);
          localStorage.removeItem(STORAGE_KEYS.AUTH_UNIT_CONVERSION);
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
              localStorage.setItem(STORAGE_KEYS.AUTH_EXPIRES_IN, String(state.expiresIn));
            } else {
              localStorage.removeItem(STORAGE_KEYS.AUTH_EXPIRES_IN);
            }

            localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN_TYPE, state.tokenType ?? "");
            localStorage.setItem(STORAGE_KEYS.AUTH_ROLE, state.role || ROLES.ADMIN);
            localStorage.setItem(STORAGE_KEYS.AUTH_IS_ACTIVE, String(state.isActive));
            localStorage.setItem(
              STORAGE_KEYS.AUTH_FORCE_PASSWORD_CHANGE,
              String(state.forcePasswordChange),
            );
            localStorage.setItem(STORAGE_KEYS.AUTH_IS_AUTHENTICATED, String(state.isAuthenticated));
            localStorage.setItem(STORAGE_KEYS.AUTH_USER_EMAIL, state.userEmail ?? "");
            localStorage.setItem(STORAGE_KEYS.AUTH_USER_NAME, state.userName ?? "");
            localStorage.setItem(STORAGE_KEYS.AUTH_USER_ID, state.userId ?? "");
            if (state.unitConversion) {
              localStorage.setItem(STORAGE_KEYS.AUTH_UNIT_CONVERSION, JSON.stringify(state.unitConversion));
            } else {
              localStorage.removeItem(STORAGE_KEYS.AUTH_UNIT_CONVERSION);
            }
          },

          removeItem: () => {
            localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
            localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
            localStorage.removeItem(STORAGE_KEYS.AUTH_EXPIRES_IN);
            localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN_TYPE);
            localStorage.removeItem(STORAGE_KEYS.AUTH_ROLE);
            localStorage.removeItem(STORAGE_KEYS.AUTH_FORCE_PASSWORD_CHANGE);
            localStorage.removeItem(STORAGE_KEYS.AUTH_IS_ACTIVE);
            localStorage.removeItem(STORAGE_KEYS.AUTH_IS_AUTHENTICATED);
            localStorage.removeItem(STORAGE_KEYS.AUTH_USER_EMAIL);
            localStorage.removeItem(STORAGE_KEYS.AUTH_USER_NAME);
            localStorage.removeItem(STORAGE_KEYS.AUTH_USER_ID);
            localStorage.removeItem(STORAGE_KEYS.AUTH_UNIT_CONVERSION);
          },
        },
        skipHydration: false,
      }
    ),
    { name: "AuthStore" }
  )
);
