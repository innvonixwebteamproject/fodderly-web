export const BASE_URL = import.meta.env.VITE_API_BASE_URL;
export const SUBFIX = import.meta.env.VITE_API_SUBFIX;
export const API_VERSION = import.meta.env.VITE_API_VERSION;
export const STORAGE_PATH = import.meta.env.VITE_API_STORAGE_PATH;

/**
 * Re-export STORAGE_KEYS from constants so existing imports from
 * "@/config/constant" keep working without changes.
 */
export { STORAGE_KEYS } from "@/constants/app.constants";

/** Re-export: API `admin_unit` / `unit` — 0 = KG, 1 = TON */
export {
  ADMIN_UNIT,
  INVENTORY_UNITS,
  getInventoryUnitLabel,
  normalizeInventoryUnit,
} from "@/constants/unit.constants";
