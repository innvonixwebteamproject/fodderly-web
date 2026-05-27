import {
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
  subWeeks,
} from "date-fns";

export type DateFilterPresetKey =
  | "today"
  | "yesterday"
  | "this_week"
  | "last_week"
  | "last_7_days"
  | "last_30_days"
  | "this_month"
  | "last_month"
  | "custom"
  | "";

export interface DatePresetConfig {
  key: DateFilterPresetKey;
  label: string;
  /** Returns computed from/to when this preset is selected. Absent for "custom" and "". */
  getRange?: () => { from: Date; to: Date };
  isCustom?: boolean;
}

export const DATE_FILTER_PRESETS: DatePresetConfig[] = [
  {
    key: "today",
    label: "Today",
    getRange: () => {
      const today = new Date();
      return { from: today, to: today };
    },
  },
  {
    key: "yesterday",
    label: "Yesterday",
    getRange: () => {
      const d = subDays(new Date(), 1);
      return { from: d, to: d };
    },
  },
  {
    key: "this_week",
    label: "This Week",
    getRange: () => {
      const now = new Date();
      return {
        from: startOfWeek(now, { weekStartsOn: 1 }),
        to: endOfWeek(now, { weekStartsOn: 1 }),
      };
    },
  },
  {
    key: "last_week",
    label: "Last Week",
    getRange: () => {
      const d = subWeeks(new Date(), 1);
      return {
        from: startOfWeek(d, { weekStartsOn: 1 }),
        to: endOfWeek(d, { weekStartsOn: 1 }),
      };
    },
  },
  {
    key: "last_7_days",
    label: "Last 7 Days",
    getRange: () => {
      const now = new Date();
      return { from: subDays(now, 6), to: now };
    },
  },
  {
    key: "last_30_days",
    label: "Last 30 Days",
    getRange: () => {
      const now = new Date();
      return { from: subDays(now, 29), to: now };
    },
  },
  {
    key: "this_month",
    label: "This Month",
    getRange: () => {
      const now = new Date();
      return { from: startOfMonth(now), to: endOfMonth(now) };
    },
  },
  {
    key: "last_month",
    label: "Last Month",
    getRange: () => {
      const d = subMonths(new Date(), 1);
      return { from: startOfMonth(d), to: endOfMonth(d) };
    },
  },
];

/** Format Date → `yyyy-MM-dd` for API payloads. */
export const formatApiDate = (date: Date): string => format(date, "yyyy-MM-dd");

/** Human-readable label for the currently applied filter. */
export const getDateFilterLabel = (
  presetKey: DateFilterPresetKey,
  fromDate: string,
  toDate: string,
): string => {
  if (!presetKey) return "Select Date Range";
  if (presetKey === "custom") {
    if (!fromDate || !toDate) return "Custom Range";
    try {
      const from = new Date(fromDate + "T00:00:00");
      const to = new Date(toDate + "T00:00:00");
      return `${format(from, "dd/MM/yyyy")} – ${format(to, "dd/MM/yyyy")}`;
    } catch {
      return "Custom Range";
    }
  }
  return DATE_FILTER_PRESETS.find((p) => p.key === presetKey)?.label ?? "Select Date Range";
};

/** Resolve the committed `fromDate`/`toDate` for a given preset. Returns `null` if invalid. */
export const resolvePresetDates = (
  presetKey: DateFilterPresetKey,
  customFrom?: string,
  customTo?: string,
): { fromDate: string; toDate: string } | null => {
  if (!presetKey) return null;
  if (presetKey === "custom") {
    if (!customFrom || !customTo) return null;
    return { fromDate: customFrom, toDate: customTo };
  }
  const preset = DATE_FILTER_PRESETS.find((p) => p.key === presetKey);
  if (!preset?.getRange) return null;
  const { from, to } = preset.getRange();
  return { fromDate: formatApiDate(from), toDate: formatApiDate(to) };
};
