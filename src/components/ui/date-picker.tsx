"use client";

import { format } from "date-fns";
import { Calendar as CalendarIcon, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverPortal,
} from "@/components/ui/popover";

interface DatePickerProps {
  date?: Date;
  setDate: (date?: Date) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  isClearable?: boolean;
  /** react-day-picker matcher for disabling specific dates. */
  disabledDays?: import("react-day-picker").Matcher | import("react-day-picker").Matcher[];
}

export function DatePicker({
  date,
  setDate,
  placeholder = "Pick a date",
  disabled,
  className,
  isClearable = true,
  disabledDays,
}: DatePickerProps) {
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setDate(undefined);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-between text-left font-normal pr-2 pl-3",
            !date && "text-muted-foreground",
            className,
          )}
          disabled={disabled}
        >
          <div className="flex items-center min-w-0 flex-1">
            <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
            <span className="truncate">
              {date ? format(date, "dd/MM/yyyy") : placeholder}
            </span>
          </div>
          {isClearable && date && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="rounded-full p-0.5 hover:bg-muted text-muted-foreground hover:text-foreground shrink-0 transition-colors cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverPortal>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            disabled={disabledDays}
            initialFocus
          />
        </PopoverContent>
      </PopoverPortal>
    </Popover>
  );
}

export default DatePicker;
