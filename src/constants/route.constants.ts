/**
 * Application route path constants
 * Use these for navigate() calls and <Link to=...> instead of hardcoded strings
 */

export const AUTH_ROUTES = {
  LOGIN: "/login",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
  FORCE_PASSWORD_CHANGE: "/force-password-change",
  CHANGE_PASSWORD: "/change-password",
} as const;

export const ADMIN_ROUTES = {
  BASE: "/admin",
  DASHBOARD: "/admin/dashboard",
  PARTNERS: "/admin/partners",
  PARTNERS_CREATE: "/admin/partners/create",
  FARMERS: "/admin/farmers",
  FARMERS_CREATE: "/admin/farmers/create",
  FODDERMAN: "/admin/fodderman",
  FODDERMAN_CREATE: "/admin/fodderman/create",
  INVENTORY: "/admin/inventory",
  PRODUCTS: "/admin/products",
  PRODUCTS_CREATE: "/admin/products/create",
  CATEGORY_CMS: "/admin/category-cms",
  ORDERS: "/admin/orders",
  CANCELLED_REFUNDS: "/admin/orders/cancelled-refunds",
  REFUNDS: "/admin/financials/refunds",
  PROFILE: "/admin/profile",
  NOTIFICATIONS: "/admin/notifications",
  MASTER_STATES: "/admin/master/states",
  MASTER_DISTRICTS: "/admin/master/districts",
  MASTER_TALUKAS: "/admin/master/talukas",
  MASTER_VILLAGES: "/admin/master/villages",
  MASTER_BRANDS: "/admin/master/brands",
} as const;

export const PARTNER_ROUTES = {
  BASE: "/partner",
  DASHBOARD: "/partner/dashboard",
  FODDERMAN: "/partner/fodderman",
  FARMERS: "/partner/farmers",
  INVENTORY: "/partner/inventory",
  PRODUCTS: "/partner/products",
  ORDERS: "/partner/orders",
  PROFILE: "/partner/profile",
  NOTIFICATIONS: "/partner/notifications",
} as const;

export const PUBLIC_ROUTES = {
  HOME: "/",
  ERROR_403: "/error/403",
  ERROR_404: "/error/404",
} as const;
