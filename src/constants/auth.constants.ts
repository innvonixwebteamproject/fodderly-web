export const ROLES = {
  ADMIN: "admin",
  PARTNER: "partner",
  FARMER: "farmer",
  FODDERMAN: "fodderman",
} as const;

export const PERMISSIONS = {
  MASTER_MODULE: "MASTER_MODULE",
  MASTER_VIEW: "MASTER_VIEW",
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];
