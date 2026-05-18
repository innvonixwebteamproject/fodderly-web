export const INVENTORY_UNITS = {
  KG: 0,
  TON: 1,
} as const;

export type InventoryUnitValue = (typeof INVENTORY_UNITS)[keyof typeof INVENTORY_UNITS];

export const INVENTORY_UNIT_OPTIONS = [
  { label: "KG", value: String(INVENTORY_UNITS.KG) },
  { label: "TON", value: String(INVENTORY_UNITS.TON) },
] as const;

export const getInventoryUnitLabel = (unit?: number | string | null) => {
  if (typeof unit === "string") {
    const normalized = unit.trim().toLowerCase();
    if (normalized === "ton" || normalized === "1") return "TON";
    return "KG";
  }

  if (unit === INVENTORY_UNITS.TON) return "TON";
  return "KG";
};
