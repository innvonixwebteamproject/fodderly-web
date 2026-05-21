export const BASE_URL = import.meta.env.VITE_API_BASE_URL;
export const SUBFIX = import.meta.env.VITE_API_SUBFIX;
export const API_VERSION = import.meta.env.VITE_API_VERSION;
export const STORAGE_PATH = import.meta.env.VITE_API_STORAGE_PATH;

export const STORAGE_KEYS = {
  ACCESS_TOKEN: "sid",
  REFRESH_TOKEN: "rid",
};

/** Re-export: API `admin_unit` / `unit` — 0 = KG, 1 = TON */
export {
  ADMIN_UNIT,
  INVENTORY_UNITS,
  getInventoryUnitLabel,
  normalizeInventoryUnit,
} from "@/constants/unit.constants";
