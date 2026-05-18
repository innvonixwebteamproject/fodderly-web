import { format, subDays } from "date-fns";
import type { PartnerOrderDatePreset } from "../types/order.types";

/** Inclusive yyyy-MM-dd for "last N days" including today. */
export function getOrderDateRangeForPreset(preset: PartnerOrderDatePreset): { from: string; to: string } | null {
  const to = format(new Date(), "yyyy-MM-dd");
  if (preset === "7d") {
    return { from: format(subDays(new Date(), 6), "yyyy-MM-dd"), to };
  }
  if (preset === "30d") {
    return { from: format(subDays(new Date(), 29), "yyyy-MM-dd"), to };
  }
  return null;
}

export function isValidYyyyMmDdRange(from: string, to: string): boolean {
  if (!from || !to) return false;
  const a = new Date(`${from}T00:00:00`);
  const b = new Date(`${to}T00:00:00`);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return false;
  return a.getTime() <= b.getTime();
}
