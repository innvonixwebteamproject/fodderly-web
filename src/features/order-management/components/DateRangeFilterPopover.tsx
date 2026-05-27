import { format, isValid, subMonths } from "date-fns";
import { Calendar as CalendarIcon, Check, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useCallback, useState } from "react";
import { DayPicker, type DateRange } from "react-day-picker";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverPortal,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import {
  DATE_FILTER_PRESETS,
  type DateFilterPresetKey,
  formatApiDate,
  getDateFilterLabel,
} from "../utils/date-filter-presets";

interface DateRangeFilterPopoverProps {
  presetKey: DateFilterPresetKey;
  fromDate: string;
  toDate: string;
  onApply: (values: {
    presetKey: DateFilterPresetKey;
    fromDate: string;
    toDate: string;
  }) => void;
  onClear: () => void;
}

const parseInputDate = (str: string): Date | undefined => {
  if (!str) return undefined;
  const d = new Date(str + "T00:00:00");
  return isValid(d) ? d : undefined;
};

export function DateRangeFilterPopover({
  presetKey,
  fromDate,
  toDate,
  onApply,
  onClear,
}: DateRangeFilterPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const previousMonth = subMonths(new Date(), 1);
  const [calendarMonth, setCalendarMonth] = useState<Date>(previousMonth);

  const [draftPreset, setDraftPreset] = useState<DateFilterPresetKey>(presetKey);
  const [draftRange, setDraftRange] = useState<DateRange | undefined>(() => {
    const from = parseInputDate(fromDate);
    const to = parseInputDate(toDate);
    return from ? { from, to } : undefined;
  });

  const handleOpen = useCallback(() => {
    setDraftPreset(presetKey);
    const from = parseInputDate(fromDate);
    const to = parseInputDate(toDate);
    setDraftRange(from ? { from, to } : undefined);
    setCalendarMonth(to ? subMonths(to, 1) : subMonths(new Date(), 1));
    setIsOpen(true);
  }, [presetKey, fromDate, toDate]);

  const handlePresetSelect = useCallback((key: DateFilterPresetKey) => {
    setDraftPreset(key);
    if (key === "" || key === "custom") {
      if (key === "") setDraftRange(undefined);
      return;
    }
    const preset = DATE_FILTER_PRESETS.find((p) => p.key === key);
    if (preset?.getRange) {
      const { from, to } = preset.getRange();
      setDraftRange({ from, to });
      setCalendarMonth(subMonths(to, 1));
    }
  }, []);

  const handleRangeSelect = useCallback((range: DateRange | undefined) => {
    setDraftRange(range);
    setDraftPreset("custom");
  }, []);



  const handleApply = useCallback(() => {
    if (!draftPreset) {
      onClear();
      setIsOpen(false);
      return;
    }
    if (draftPreset === "custom") {
      if (!draftRange?.from) { toast.error("Please select a start date."); return; }
      if (!draftRange?.to) { toast.error("Please select an end date."); return; }
      if (draftRange.from > draftRange.to) { toast.error("Start date cannot be after end date."); return; }
      onApply({ presetKey: "custom", fromDate: formatApiDate(draftRange.from), toDate: formatApiDate(draftRange.to) });
    } else {
      const preset = DATE_FILTER_PRESETS.find((p) => p.key === draftPreset);
      if (!preset?.getRange) return;
      const { from, to } = preset.getRange();
      onApply({ presetKey: draftPreset, fromDate: formatApiDate(from), toDate: formatApiDate(to) });
    }
    setIsOpen(false);
  }, [draftPreset, draftRange, onApply, onClear]);

  const handleClear = useCallback(() => {
    setDraftPreset("");
    setDraftRange(undefined);
    setCalendarMonth(subMonths(new Date(), 1));
    onClear();
  }, [onClear]);

  const isFiltered = Boolean(presetKey);
  const label = getDateFilterLabel(presetKey, fromDate, toDate);
  const today = new Date();

  return (
    <Popover open={isOpen} onOpenChange={(open) => { if (!open) setIsOpen(false); }}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          onClick={handleOpen}
          className={cn(
            "h-9 gap-1.5 bg-background px-3 text-[13px] font-normal border-input hover:bg-accent/50 max-w-[280px]",
            isFiltered && "border-primary/50 bg-primary/5 text-primary hover:bg-primary/10",
          )}
        >
          <CalendarIcon className={cn("h-4 w-4 shrink-0", isFiltered ? "text-primary" : "text-muted-foreground")} />
          <span className="truncate">{label}</span>
          {isFiltered && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleClear(); }}
              className="ml-0.5 rounded-full p-0.5 hover:bg-primary/20 text-primary/70 hover:text-primary shrink-0 transition-colors cursor-pointer"
              aria-label="Clear date filter"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverPortal>
        <PopoverContent
          className="w-auto p-0 overflow-hidden shadow-xl border border-border"
          align="center"
          side="bottom"
          sideOffset={5}
        >
          <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-border">

            {/* ── Desktop sidebar ── */}
            <div className="hidden sm:flex flex-col w-[130px] shrink-0 bg-muted/30 py-1">
              <p className="px-3 pt-2 pb-1 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                Quick Select
              </p>
              {DATE_FILTER_PRESETS.map((preset) => {
                const active = draftPreset === preset.key;
                return (
                  <button
                    key={preset.key}
                    type="button"
                    onClick={() => handlePresetSelect(preset.key)}
                    className={cn(
                      "flex items-center justify-between px-3 py-[5px] text-[12px] text-left transition-colors",
                      active ? "bg-primary/10 text-primary font-semibold" : "text-foreground hover:bg-accent",
                    )}
                  >
                    <span>{preset.label}</span>
                    {active && <Check className="h-3 w-3 text-primary shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* ── Mobile chips ── */}
            <div className="sm:hidden flex gap-1.5 px-3 pt-2 pb-1.5 overflow-x-auto">
              {DATE_FILTER_PRESETS.map((preset) => {
                const active = draftPreset === preset.key;
                return (
                  <button
                    key={preset.key}
                    type="button"
                    onClick={() => handlePresetSelect(preset.key)}
                    className={cn(
                      "shrink-0 px-2 py-0.5 rounded-full text-[11px] font-medium border transition-colors",
                      active ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-foreground hover:border-primary/50",
                    )}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            {/* ── Right panel ── */}
            <div className="flex flex-col flex-1 min-w-0">

              {/* ── Compact DayPicker: current month first, next month second ── */}
              <div className="flex justify-center overflow-x-auto px-1 py-1.5">
                <DayPicker
                  mode="range"
                  selected={draftRange}
                  onSelect={handleRangeSelect}
                  numberOfMonths={2}
                  month={calendarMonth}
                  onMonthChange={setCalendarMonth}
                  disabled={{ after: today }}
                  showOutsideDays
                  fixedWeeks
                  classNames={{
                    months: "flex flex-col sm:flex-row gap-3 relative",
                    month: "w-full",
                    month_caption: "relative mx-8 mb-1 flex h-7 items-center justify-center z-20",
                    caption_label: "text-[13px] font-semibold text-foreground",
                    nav: "absolute top-0 flex w-full justify-between z-10",
                    button_previous: cn(buttonVariants({ variant: "ghost" }), "size-7 text-muted-foreground/80 hover:text-foreground p-0"),
                    button_next: cn(buttonVariants({ variant: "ghost" }), "size-7 text-muted-foreground/80 hover:text-foreground p-0"),
                    weekday: "size-7 p-0 text-[10px] font-medium text-muted-foreground/80",
                    day_button:
                      "cursor-pointer relative flex size-7 items-center justify-center whitespace-nowrap rounded p-0 text-foreground group-[[data-selected]:not(.range-middle)]:[transition-property:color,background-color,border-radius,box-shadow] group-[[data-selected]:not(.range-middle)]:duration-150 group-data-disabled:pointer-events-none hover:not-in-data-selected:bg-accent group-data-selected:bg-primary hover:not-in-data-selected:text-foreground group-data-selected:text-primary-foreground group-data-disabled:text-foreground/30 group-data-disabled:line-through group-data-outside:pointer-events-none group-data-outside:!bg-transparent group-data-outside:!text-muted-foreground/40 outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px] group-[.range-start:not(.range-end)]:rounded-e-none group-[.range-end:not(.range-start)]:rounded-s-none group-[.range-middle]:rounded-none group-[.range-middle]:group-data-selected:bg-accent group-[.range-middle]:group-data-selected:text-foreground",
                    day: "group size-7 px-0 py-px text-xs",
                    range_start: "range-start",
                    range_end: "range-end",
                    range_middle: "range-middle",
                    today:
                      "*:after:pointer-events-none *:after:absolute *:after:bottom-0.5 *:after:start-1/2 *:after:z-10 *:after:size-[3px] *:after:-translate-x-1/2 *:after:rounded-full *:after:bg-primary [&[data-selected]:not(.range-middle)>*]:after:bg-background *:after:transition-colors",
                    outside: "text-muted-foreground/40 opacity-50",
                    hidden: "invisible",
                    dropdowns: "flex items-center gap-1",
                    caption_dropdowns: "flex gap-1",
                    dropdown: "max-h-36 overflow-y-auto z-50 text-xs",
                  }}
                  components={{
                    Chevron: (props) =>
                      props.orientation === "left"
                        ? <ChevronLeft className="h-3.5 w-3.5" />
                        : <ChevronRight className="h-3.5 w-3.5" />,
                  }}
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between gap-4 px-4 py-3 border-t border-border bg-background">
                <div className="text-[13px] font-medium text-foreground whitespace-nowrap">
                  {draftRange?.from ? format(draftRange.from, "dd/MM/yyyy") : ""}
                  {draftRange?.from || draftRange?.to ? " - " : ""}
                  {draftRange?.to ? format(draftRange.to, "dd/MM/yyyy") : ""}
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" className="h-9 px-4 text-[13px]" onClick={handleClear}>
                    Reset
                  </Button>
                  <Button type="button" size="sm" className="h-9 px-4 text-[13px]" onClick={handleApply}>
                    Apply
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </PopoverContent>
      </PopoverPortal>
    </Popover>
  );
}

export default DateRangeFilterPopover;
