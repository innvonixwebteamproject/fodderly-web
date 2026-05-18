/**
 * Rupee string for list cells: no forced ".00" on whole numbers (matches typical API integers).
 */
export function formatOrderListRupeeAmount(amount: number): string {
  if (!Number.isFinite(amount)) return "0";
  const fixed = amount.toFixed(2);
  if (fixed.endsWith(".00")) return fixed.slice(0, -3);
  return fixed.replace(/0+$/, "").replace(/\.$/, "");
}
