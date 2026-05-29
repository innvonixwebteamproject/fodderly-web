/**
 * App-wide constants
 * Pagination, localStorage keys, and global settings
 */

/** Pagination limits used across list queries */
export const PAGINATION = {
  DEFAULT_LIMIT: 10,
  MEDIUM_LIMIT: 50,
  LARGE_LIMIT: 100,
  INFINITE_LIMIT: 200,
} as const;

/** All localStorage keys used in the app — single source of truth */
export const STORAGE_KEYS = {
  // Tokens (existing)
  ACCESS_TOKEN: "sid",
  REFRESH_TOKEN: "rid",

  // Auth session fields
  AUTH_EXPIRES_IN: "auth.expiresIn",
  AUTH_TOKEN_TYPE: "auth.tokenType",
  AUTH_ROLE: "auth.role",
  AUTH_IS_ACTIVE: "auth.isActive",
  AUTH_FORCE_PASSWORD_CHANGE: "auth.forcePasswordChange",
  AUTH_IS_AUTHENTICATED: "auth.isAuthenticated",
  AUTH_USER_EMAIL: "auth.userEmail",
  AUTH_USER_NAME: "auth.userName",
  AUTH_USER_ID: "auth.userId",
  AUTH_UNIT_CONVERSION: "auth.unitConversion",
} as const;
