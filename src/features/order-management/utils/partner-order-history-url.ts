import type { ReadonlyURLSearchParams } from "react-router-dom";
import type {
  OrderListFilters,
  OrderSortBy,
  PartnerOrderDatePreset,
  PartnerOrderHistoryStatusGroup,
} from "../types/order.types";
import { getOrderDateRangeForPreset, isValidYyyyMmDdRange } from "./partner-order-history-dates";

export const HISTORY_URL = {
  q: "q",
  sort: "sort",
  dir: "dir",
  hsg: "hsg",
  preset: "preset",
  odf: "odf",
  odt: "odt",
  pid: "pid",
  cats: "cats",
  pm: "pm",
} as const;

export const SCROLL_STORAGE_KEY = "partner-order-history:scrollTop";

export const RETURN_QUERY_SESSION_KEY = "partner-order-history:returnQuery";

export function parseHistorySort(
  params: ReadonlyURLSearchParams,
): { sortBy: OrderSortBy; sortDesc: boolean } {
  const sortRaw = params.get(HISTORY_URL.sort);
  const sortBy: OrderSortBy = sortRaw === "productCategory" ? "productCategory" : "placedAt";
  const dir = params.get(HISTORY_URL.dir);
  const sortDesc = dir !== "asc";
  return { sortBy, sortDesc };
}

export function parseHistoryListFilters(params: ReadonlyURLSearchParams): OrderListFilters {
  const search = params.get(HISTORY_URL.q)?.trim() || undefined;
  const historyStatusGroup = (params.get(HISTORY_URL.hsg) as PartnerOrderHistoryStatusGroup | "") || "";
  const preset = (params.get(HISTORY_URL.preset) as PartnerOrderDatePreset) || "";
  const orderDateFromParam = params.get(HISTORY_URL.odf)?.trim() || "";
  const orderDateToParam = params.get(HISTORY_URL.odt)?.trim() || "";
  const productId = params.get(HISTORY_URL.pid)?.trim() || undefined;
  const catsRaw = params.get(HISTORY_URL.cats)?.trim();
  const categoryIds = catsRaw
    ? catsRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : undefined;
  const paymentMode = (params.get(HISTORY_URL.pm) as OrderListFilters["paymentMode"]) || "";

  let orderDateFrom: string | undefined;
  let orderDateTo: string | undefined;
  let orderDatePreset: PartnerOrderDatePreset = preset || "";

  if (preset === "7d" || preset === "30d") {
    const r = getOrderDateRangeForPreset(preset);
    if (r) {
      orderDateFrom = r.from;
      orderDateTo = r.to;
    }
  } else if (preset === "custom") {
    if (orderDateFromParam && orderDateToParam && isValidYyyyMmDdRange(orderDateFromParam, orderDateToParam)) {
      orderDateFrom = orderDateFromParam;
      orderDateTo = orderDateToParam;
    } else {
      orderDatePreset = "";
    }
  }

  const filters: OrderListFilters = {
    ...(search ? { search } : {}),
    ...(historyStatusGroup ? { historyStatusGroup: historyStatusGroup as PartnerOrderHistoryStatusGroup } : {}),
    ...(orderDateFrom ? { orderDateFrom } : {}),
    ...(orderDateTo ? { orderDateTo } : {}),
    ...(orderDatePreset ? { orderDatePreset } : {}),
    ...(productId ? { productId } : {}),
    ...(categoryIds?.length ? { categoryIds } : {}),
    ...(paymentMode ? { paymentMode } : {}),
  };

  return filters;
}

export function buildHistorySearchParamsFromFilters(input: {
  search: string;
  sortBy: OrderSortBy;
  sortDesc: boolean;
  /** When false, `sort` is omitted from the URL; list still defaults to `placedAt` via `parseHistorySort`. */
  exposeSortFieldInUrl?: boolean;
  /** When false, `dir` is omitted from the URL; list still defaults to newest-first via `parseHistorySort`. */
  exposeSortDirInUrl?: boolean;
  historyStatusGroup: PartnerOrderHistoryStatusGroup | "";
  datePreset: PartnerOrderDatePreset;
  orderDateFrom: string;
  orderDateTo: string;
  productId: string;
  categoryIds: string[];
  paymentMode: string;
}): URLSearchParams {
  const p = new URLSearchParams();
  if (input.search.trim()) p.set(HISTORY_URL.q, input.search.trim());
  if (input.exposeSortFieldInUrl) {
    p.set(HISTORY_URL.sort, input.sortBy === "productCategory" ? "productCategory" : "placedAt");
  }
  if (input.exposeSortDirInUrl) {
    p.set(HISTORY_URL.dir, input.sortDesc ? "desc" : "asc");
  }
  if (input.historyStatusGroup) p.set(HISTORY_URL.hsg, input.historyStatusGroup);
  if (input.datePreset) p.set(HISTORY_URL.preset, input.datePreset);
  if (input.datePreset === "custom" && input.orderDateFrom && input.orderDateTo) {
    p.set(HISTORY_URL.odf, input.orderDateFrom);
    p.set(HISTORY_URL.odt, input.orderDateTo);
  }
  if (input.productId.trim()) p.set(HISTORY_URL.pid, input.productId.trim());
  if (input.categoryIds.length) p.set(HISTORY_URL.cats, input.categoryIds.join(","));
  if (input.paymentMode) p.set(HISTORY_URL.pm, input.paymentMode);
  return p;
}
