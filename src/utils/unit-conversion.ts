/**
 * Global Unit Conversion Utility
 * 
 * This utility handles unit conversion logic for inventory and other features.
 * The backend expects KG values, but the UI can accept TON values.
 * 
 * Conversion rate: 1 TON = getTonToKgRate() KG
 */

import { INVENTORY_UNITS, InventoryUnitValue } from "@/constants/unit.constants";

import { useAuthStore } from "@/features/auth/store/auth.store";

/** Get dynamic conversion rate for TON to KG */
export const getTonToKgRate = (): number => {
  const state = useAuthStore.getState();
  return state.unitConversion?.ton_to_kg ?? 1000;
};

/** Backend precision for decimal values */
export const BACKEND_PRECISION = 4;

/**
 * Convert quantity from TON to KG
 * @param tonQuantity - Quantity in TON
 * @returns Quantity in KG with backend precision
 */
export const convertTonToKgQuantity = (tonQuantity: number): number => {
  if (!Number.isFinite(tonQuantity) || tonQuantity < 0) {
    throw new Error("Invalid TON quantity for conversion");
  }
  const result = tonQuantity * getTonToKgRate();
  return Number(result.toFixed(BACKEND_PRECISION));
};

/**
 * Convert price from TON to price per KG
 * @param tonPrice - Price per TON
 * @returns Price per KG with backend precision
 */
export const convertTonToKgPrice = (tonPrice: number): number => {
  if (!Number.isFinite(tonPrice) || tonPrice < 0) {
    throw new Error("Invalid TON price for conversion");
  }
  const result = tonPrice / getTonToKgRate();
  return Number(result.toFixed(BACKEND_PRECISION));
};

/**
 * Convert quantity from KG to TON
 * @param kgQuantity - Quantity in KG
 * @returns Quantity in TON with backend precision
 */
export const convertKgToTonQuantity = (kgQuantity: number): number => {
  if (!Number.isFinite(kgQuantity) || kgQuantity < 0) {
    throw new Error("Invalid KG quantity for conversion");
  }
  const result = kgQuantity / getTonToKgRate();
  return Number(result.toFixed(BACKEND_PRECISION));
};

/**
 * Convert price per KG to price per TON
 * @param kgPrice - Price per KG
 * @returns Price per TON with backend precision
 */
export const convertKgToTonPrice = (kgPrice: number): number => {
  if (!Number.isFinite(kgPrice) || kgPrice < 0) {
    throw new Error("Invalid KG price for conversion");
  }
  const result = kgPrice * getTonToKgRate();
  return Number(result.toFixed(BACKEND_PRECISION));
};

/**
 * Convert inventory form values to KG format for API submission
 * When unit is TON, converts quantity and price to KG
 * When unit is KG, returns values as-is
 * 
 * @param quantity - The quantity in the UI unit
 * @param price - The price per UI unit
 * @param unit - The UI unit (0 = KG, 1 = TON)
 * @returns Object with unit (always KG), quantity in KG, and price per KG
 */
export const convertInventoryToKgFormat = (
  quantity: number,
  price: number,
  unit: InventoryUnitValue
): { unit: InventoryUnitValue; quantity: number; price: number } => {
  if (unit === INVENTORY_UNITS.TON) {
    return {
      unit: INVENTORY_UNITS.KG,
      quantity: convertTonToKgQuantity(quantity),
      price: convertTonToKgPrice(price),
    };
  }
  
  // Unit is KG, return as-is
  return {
    unit: INVENTORY_UNITS.KG,
    quantity: Number(quantity.toFixed(BACKEND_PRECISION)),
    price: Number(price.toFixed(BACKEND_PRECISION)),
  };
};

/**
 * Convert KG values to the target unit for display
 * Used when loading edit form data from API
 *
 * @param quantityInKg - The quantity in KG
 * @param pricePerKg - The price per KG
 * @param targetUnit - The target unit for display (0 = KG, 1 = TON)
 * @returns Object with quantity and price in the target unit
 */
export const convertInventoryFromKgFormat = (
  quantityInKg: number,
  pricePerKg: number,
  targetUnit: InventoryUnitValue
): { quantity: number; price: number } => {
  if (targetUnit === INVENTORY_UNITS.TON) {
    return {
      quantity: convertKgToTonQuantity(quantityInKg),
      price: convertKgToTonPrice(pricePerKg),
    };
  }

  // Target unit is KG, return as-is
  return {
    quantity: Number(quantityInKg.toFixed(BACKEND_PRECISION)),
    price: Number(pricePerKg.toFixed(BACKEND_PRECISION)),
  };
};

/**
 * Determine the appropriate display unit based on the KG value.
 * If KG value is >= TON conversion rate (getTonToKgRate() KG), display as TON, otherwise display as KG.
 *
 * @param quantityInKg - The quantity in KG
 * @returns The appropriate display unit ("kg" or "ton")
 */
export const getDisplayUnit = (quantityInKg: number): "kg" | "ton" => {
  if (!Number.isFinite(quantityInKg) || quantityInKg < 0) {
    return "kg";
  }
  return quantityInKg >= getTonToKgRate() ? "ton" : "kg";
};

/**
 * Format quantity and price for display based on automatic unit selection.
 * Returns the quantity, price, and unit in the most appropriate format.
 * If KG value is >= getTonToKgRate() KG, displays as TON, otherwise displays as KG.
 * Price is also converted based on the unit (price per TON when displaying TON, price per KG when displaying KG).
 * Price is rounded to the nearest whole number for display purposes.
 * Quantity is displayed with up to 3 decimal places for precision.
 *
 * @param quantityInKg - The quantity in KG
 * @param pricePerKg - The price per KG
 * @returns Object with formatted quantity, price, and display unit
 */
export const formatForDisplay = (
  quantityInKg: number,
  pricePerKg: number
): { quantity: number; price: number; unit: "kg" | "ton" } => {
  const displayUnit = getDisplayUnit(quantityInKg);
  
  // Convert both quantity and price based on the display unit
  const convertedQuantity = displayUnit === "ton"
    ? convertKgToTonQuantity(quantityInKg)
    : quantityInKg;

  const convertedPrice = displayUnit === "ton"
    ? convertKgToTonPrice(pricePerKg)
    : pricePerKg;

  // Round price to nearest whole number for display
  const roundedPrice = Math.round(convertedPrice);

  return {
    quantity: convertedQuantity,
    price: roundedPrice,
    unit: displayUnit,
  };
};

/**
 * Format Admin Available Qty.
 * - Converts to TON if display unit is TON.
 * - Rounds the value to the nearest whole number.
 * - Example: 198.126 TON -> 198 Ton, 198.000 TON -> 198 Ton.
 * 
 * @param quantityInKg - Quantity in KG
 * @returns Formatted string with unit
 */
export const formatAdminAvailableQty = (quantityInKg: number | null | undefined): string => {
  if (quantityInKg === null || quantityInKg === undefined || !Number.isFinite(quantityInKg) || quantityInKg < 0) {
    return "—";
  }
  const displayUnit = getDisplayUnit(quantityInKg);
  if (displayUnit === "ton") {
    const qtyInTon = quantityInKg / getTonToKgRate();
    const roundedQty = Math.round(qtyInTon);
    return `${roundedQty.toLocaleString()} Ton`;
  }
  const roundedQty = Math.round(quantityInKg);
  return `${roundedQty.toLocaleString()} KG`;
};

/**
 * Format Partner Available Qty.
 * - Always converts dynamically from KG to TON using TON = KG / getTonToKgRate().
 * - Shows up to 3 decimal places, removing unnecessary trailing zeros.
 * - Example: 2000 KG / getTonToKgRate() = TON -> TON
 * 
 * @param quantityInKg - Quantity in KG
 * @returns Formatted string with TON unit
 */
export const formatPartnerAvailableQty = (quantityInKg: number | null | undefined): string => {
  if (quantityInKg === null || quantityInKg === undefined || !Number.isFinite(quantityInKg) || quantityInKg < 0) {
    return "—";
  }
  const qtyInTon = quantityInKg / getTonToKgRate();
  const qtyStr = qtyInTon.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  });
  return `${qtyStr} TON`;
};

/**
 * Format Partner Allocated Qty.
 * - Always converts dynamically from KG to TON using TON = KG / getTonToKgRate().
 * - Shows up to 3 decimal places, removing unnecessary trailing zeros.
 * - Example: 2000 KG / getTonToKgRate() = TON -> TON
 * 
 * @param quantityInKg - Quantity in KG
 * @returns Formatted string with TON unit
 */
export const formatPartnerAllocatedQty = (quantityInKg: number | null | undefined): string => {
  return formatPartnerAvailableQty(quantityInKg);
};
