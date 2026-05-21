/** API quantity unit codes (`admin_unit`, `unit`, etc.): 0 = KG, 1 = TON */
export const INVENTORY_UNITS = {
  KG: 0,
  TON: 1,
} as const;

/** Same values as `INVENTORY_UNITS`; used for `admin_unit` on products and allocations. */
export const ADMIN_UNIT = INVENTORY_UNITS;

export type InventoryUnitValue = (typeof INVENTORY_UNITS)[keyof typeof INVENTORY_UNITS];

export const INVENTORY_UNIT_OPTIONS = [
  { label: "KG", value: String(INVENTORY_UNITS.KG) },
  { label: "TON", value: String(INVENTORY_UNITS.TON) },
] as const;

export const normalizeInventoryUnit = (
  unit?: number | string | null,
): InventoryUnitValue => {
  if (unit === undefined || unit === null) {
    return INVENTORY_UNITS.KG;
  }

  if (typeof unit === "string") {
    const normalized = unit.trim().toLowerCase();
    if (normalized === "ton" || normalized === "1") {
      return INVENTORY_UNITS.TON;
    }
    if (normalized === "kg" || normalized === "0") {
      return INVENTORY_UNITS.KG;
    }
    const parsed = Number(unit);
    if (!Number.isNaN(parsed)) {
      return parsed === INVENTORY_UNITS.TON ? INVENTORY_UNITS.TON : INVENTORY_UNITS.KG;
    }
    return INVENTORY_UNITS.KG;
  }

  return unit === INVENTORY_UNITS.TON ? INVENTORY_UNITS.TON : INVENTORY_UNITS.KG;
};

export const getInventoryUnitLabel = (unit?: number | string | null) =>
  normalizeInventoryUnit(unit) === INVENTORY_UNITS.TON ? "TON" : "KG";
