/**
 * Unit Conversion Utility
 * 
 * This utility handles all unit conversion logic for product quantities and prices.
 * The backend always stores values in KG format, while the UI can display in various units.
 * 
 * Conversion rates represent how many KG are in 1 unit of the given type.
 * For example: 1 TON = 907.1847 KG
 */

export type ProductUnit = "kg" | "ton";

/**
 * Precision handling constants.
 * Backend values use 4 decimal precision for storage.
 * UI values use 0 decimal precision for display (rounded to whole number).
 */
export const BACKEND_PRECISION = 4;
export const UI_PRECISION = 0;

/**
 * Conversion rates for different units.
 * Values represent how many KG are in 1 unit of the given type.
 * 
 * Future units can be added by simply extending this object.
 */
export const UNIT_CONVERSIONS: Record<ProductUnit, number> = {
  kg: 1,
  ton: 907.185,
};

/**
 * Get the conversion rate for a given unit.
 * Returns how many KG are in 1 unit of the given type.
 * 
 * @param unit - The unit to get the conversion rate for
 * @returns The conversion rate (KG per unit)
 */
export const getConversionRate = (unit: ProductUnit): number => {
  const rate = UNIT_CONVERSIONS[unit];
  if (rate === undefined) {
    throw new Error(`Unknown unit: ${unit}`);
  }
  return rate;
};

/**
 * Convert a value from the given unit to KG with backend precision.
 * 
 * @param value - The value to convert
 * @param unit - The unit of the input value
 * @returns The equivalent value in KG with backend precision
 */
export const convertToKg = (value: number, unit: ProductUnit): number => {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error("Invalid value for conversion to KG");
  }
  
  const conversionRate = getConversionRate(unit);
  const result = value * conversionRate;
  return Number(result.toFixed(BACKEND_PRECISION));
};

/**
 * Convert a value from KG to the given unit with UI precision.
 * 
 * @param value - The value in KG to convert
 * @param unit - The target unit
 * @returns The equivalent value in the target unit with UI precision
 */
export const convertFromKg = (value: number, unit: ProductUnit): number => {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error("Invalid value for conversion from KG");
  }
  
  const conversionRate = getConversionRate(unit);
  const result = value / conversionRate;
  return Number(result.toFixed(UI_PRECISION));
};

/**
 * Calculate the price per KG from a price in the given unit with backend precision.
 * 
 * @param price - The price per unit
 * @param unit - The unit of the price
 * @returns The price per KG with backend precision
 */
export const calculatePricePerKg = (price: number, unit: ProductUnit): number => {
  if (!Number.isFinite(price) || price < 0) {
    throw new Error("Invalid price for conversion to price per KG");
  }
  
  const conversionRate = getConversionRate(unit);
  const result = price / conversionRate;
  return Number(result.toFixed(BACKEND_PRECISION));
};

/**
 * Calculate the display price in the given unit from a price per KG with UI precision.
 * 
 * @param pricePerKg - The price per KG
 * @param unit - The target unit for display
 * @returns The price per unit in the target unit with UI precision
 */
export const calculateDisplayPrice = (pricePerKg: number, unit: ProductUnit): number => {
  if (!Number.isFinite(pricePerKg) || pricePerKg < 0) {
    throw new Error("Invalid price per KG for conversion to display price");
  }
  
  const conversionRate = getConversionRate(unit);
  const result = pricePerKg * conversionRate;
  return Number(result.toFixed(UI_PRECISION));
};

/**
 * Convert form values to KG format for API submission.
 * This ensures the backend always receives standardized KG values.
 * 
 * @param quantity - The quantity in the UI unit
 * @param price - The price per UI unit
 * @param unit - The UI unit
 * @returns Object with unit, quantity in KG, and price per KG
 */
export const convertToKgFormat = (
  quantity: number,
  price: number,
  unit: ProductUnit
): { unit: "kg"; quantity: number; price: number } => {
  const quantityInKg = convertToKg(quantity, unit);
  const pricePerKg = calculatePricePerKg(price, unit);
  
  return {
    unit: "kg",
    quantity: quantityInKg,
    price: pricePerKg,
  };
};

/**
 * Convert KG values to the UI unit for display.
 * Used when loading edit form data.
 * 
 * @param quantityInKg - The quantity in KG
 * @param pricePerKg - The price per KG
 * @param unit - The target UI unit
 * @returns Object with quantity and price in the target unit
 */
export const convertFromKgFormat = (
  quantityInKg: number,
  pricePerKg: number,
  unit: ProductUnit
): { quantity: number; price: number } => {
  const displayQuantity = convertFromKg(quantityInKg, unit);
  const displayPrice = calculateDisplayPrice(pricePerKg, unit);
  
  return {
    quantity: displayQuantity,
    price: displayPrice,
  };
};

/**
 * Validate conversion results to prevent NaN and invalid values.
 * 
 * @param value - The value to validate
 * @param fieldName - The name of the field for error messages
 * @throws Error if the value is invalid
 */
export const validateConversionResult = (value: number, fieldName: string): void => {
  if (!Number.isFinite(value) || isNaN(value)) {
    throw new Error(`Invalid ${fieldName} after conversion`);
  }
  if (value < 0) {
    throw new Error(`${fieldName} cannot be negative after conversion`);
  }
};

/**
 * Determine the appropriate display unit based on the KG value.
 * If KG value is >= TON conversion rate (1 TON), display as TON, otherwise display as KG.
 * 
 * @param quantityInKg - The quantity in KG
 * @returns The appropriate display unit
 */
export const getDisplayUnit = (quantityInKg: number): ProductUnit => {
  if (!Number.isFinite(quantityInKg) || quantityInKg < 0) {
    return "kg";
  }
  return quantityInKg >= UNIT_CONVERSIONS.ton ? "ton" : "kg";
};

/**
 * Format quantity and price for display based on automatic unit selection.
 * Returns the quantity, price, and unit in the most appropriate format.
 * 
 * @param quantityInKg - The quantity in KG
 * @param pricePerKg - The price per KG
 * @returns Object with formatted quantity, price, and display unit
 */
export const formatForDisplay = (
  quantityInKg: number,
  pricePerKg: number
): { quantity: number; price: number; unit: ProductUnit } => {
  const displayUnit = getDisplayUnit(quantityInKg);
  const converted = convertFromKgFormat(quantityInKg, pricePerKg, displayUnit);
  
  return {
    quantity: converted.quantity,
    price: converted.price,
    unit: displayUnit,
  };
};

/**
 * Format Admin Available Qty.
 * - Converts to TON if display unit is TON.
 * - Rounds the value to the nearest whole number.
 * - Example: 198.126 TON -> 198 TON, 198.000 TON -> 198 TON.
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
    const qtyInTon = quantityInKg / UNIT_CONVERSIONS.ton;
    const roundedQty = Math.round(qtyInTon);
    return `${roundedQty.toLocaleString()} TON`;
  }
  const roundedQty = Math.round(quantityInKg);
  return `${roundedQty.toLocaleString()} KG`;
};

/**
 * Format Partner Available Qty.
 * - Always converts dynamically from KG to TON using TON = KG / 907.185.
 * - Removes unnecessary trailing zeros for whole TON values, showing up to 3 decimals.
 * - Example: 2000 KG / 907.185 = 2.205 TON -> 2.205 TON
 * 
 * @param quantityInKg - Quantity in KG
 * @returns Formatted string with TON unit
 */
export const formatPartnerAvailableQty = (quantityInKg: number | null | undefined): string => {
  if (quantityInKg === null || quantityInKg === undefined || !Number.isFinite(quantityInKg) || quantityInKg < 0) {
    return "—";
  }
  const qtyInTon = quantityInKg / UNIT_CONVERSIONS.ton;
  const trimmedQty = Number(qtyInTon.toFixed(3));
  const qtyStr = trimmedQty.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  });
  return `${qtyStr} TON`;
};

/**
 * Format Partner Allocated Qty.
 * - Always converts dynamically from KG to TON using TON = KG / 907.185.
 * - Removes unnecessary trailing zeros for whole TON values, showing up to 3 decimals.
 * 
 * @param quantityInKg - Quantity in KG
 * @returns Formatted string with TON unit
 */
export const formatPartnerAllocatedQty = (quantityInKg: number | null | undefined): string => {
  return formatPartnerAvailableQty(quantityInKg);
};
