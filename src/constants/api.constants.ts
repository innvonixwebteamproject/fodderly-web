/**
 * API endpoint constants — all backend route paths in one place
 * Use these in *.api.ts service files instead of hardcoded strings
 */

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    LOGOUT: "/auth/logout",
    REFRESH: "/auth/refresh",
    PROFILE: "/auth/profile",
    CHANGE_PASSWORD: "/auth/change-password",
    FORCE_CHANGE_PASSWORD: "/auth/force-change-password",
    FORGOT_PASSWORD: "/auth/forgot-password",
    RESET_PASSWORD: "/auth/reset-password",
    CHECK_RESET_LINK: "/auth/check-reset-link",
    ADMIN_UPDATE_PROFILE: "/auth/admin/update-profile",
  },

  PARTNERS: {
    BASE: "/partners",
    UPDATE_PROFILE: "/partners/update-profile",
  },

  FARMERS: {
    BASE: "/farmers",
  },

  FODDERMAN: {
    BASE: "/fodderman",
  },

  INVENTORY: {
    BASE: "/inventory",
    CATEGORIES: "/inventory/categories",
  },

  PRODUCTS: {
    BASE: "/products",
    ALLOCATIONS: "/products/partner-allocations",
  },

  ORDERS: {
    BASE: "/orders",
    ADMIN_LIST: "/orders/admin/list",
    ADMIN_EXPORT: "/orders/admin/list/export",
  },

  NOTIFICATIONS: {
    BASE: "/notifications",
  },

  MASTER: {
    STATES: "/states",
    DISTRICTS: "/districts",
    TALUKAS: "/talukas",
    VILLAGES: "/villages",
    BRANDS: "/brands",
    CATEGORIES: "/categories",
    STATES_IMPORT: "/states/import",
    DISTRICTS_IMPORT: "/districts/import",
    TALUKAS_IMPORT: "/talukas/import",
    VILLAGES_IMPORT: "/villages/import",
    STATES_TEMPLATE: "/states/import-template",
    DISTRICTS_TEMPLATE: "/districts/import-template",
    TALUKAS_TEMPLATE: "/talukas/import-template",
    VILLAGES_TEMPLATE: "/villages/import-template",
  },
} as const;
