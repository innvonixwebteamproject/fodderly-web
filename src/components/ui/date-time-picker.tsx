"use client";

import * as React from "react";
import { format, parseISO, isValid } from "date-fns";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateTimePickerProps {
  value?: string | null; // ISO string
  onChange: (value?: string | null) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  modal?: boolean;
}

export function DateTimePicker({
  value,
  onChange,
  disabled,
  className,
  placeholder = "Select date and time",
  modal = true,
}: DateTimePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const dateValue = React.useMemo(() => {
    if (!value) return undefined;
    const d = parseISO(value);
    return isValid(d) ? d : undefined;
  }, [value]);

  const hoursRef = React.useRef<HTMLDivElement>(null);
  const minutesRef = React.useRef<HTMLDivElement>(null);

  const currentHours = dateValue ? dateValue.getHours() : 0;
  const currentMinutes = dateValue ? dateValue.getMinutes() : 0;

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  React.useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        if (hoursRef.current) {
          const selectedHour = hoursRef.current.querySelector(
            '[data-selected="true"]',
          );
          selectedHour?.scrollIntoView({
            block: "center",
            behavior: "instant",
          });
        }
        if (minutesRef.current) {
          const selectedMinute = minutesRef.current.querySelector(
            '[data-selected="true"]',
          );
          selectedMinute?.scrollIntoView({
            block: "center",
            behavior: "instant",
          });
        }
      }, 0);
    }
  }, [isOpen]);

  const handleDateSelect = (newDate?: Date) => {
    if (!newDate) {
      onChange(undefined);
      return;
    }

    const result = new Date(newDate);
    result.setHours(currentHours);
    result.setMinutes(currentMinutes);
    result.setSeconds(0);
    result.setMilliseconds(0);

    onChange(result.toISOString());
  };

  const handleTimeSelect = (type: "hours" | "minutes", val: number) => {
    const result = new Date(dateValue || new Date());
    if (type === "hours") {
      result.setHours(val);
    } else {
      result.setMinutes(val);
    }
    result.setSeconds(0);
    result.setMilliseconds(0);
    onChange(result.toISOString());
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen} modal={modal}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !dateValue && "text-muted-foreground",
            className,
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {dateValue ? format(dateValue, "dd/MM/yyyy p") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex flex-col sm:flex-row">
          <Calendar
            mode="single"
            selected={dateValue}
            onSelect={handleDateSelect}
            initialFocus
          />
          <div className="flex border-t sm:border-t-0 sm:border-l border-border p-3 gap-3">
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 px-2 mb-2 text-xs font-semibold text-muted-foreground">
                <Clock className="h-3 w-3" />
                Time
              </div>
              <div className="flex gap-2">
                {/* Hours */}
                <div className="flex flex-col">
                  <div className="text-[10px] uppercase font-bold text-muted-foreground text-center mb-1">
                    Hrs
                  </div>
                  <div
                    ref={hoursRef}
                    className="h-[200px] w-12 overflow-y-auto scrollbar-none border rounded-md"
                  >
                    {hours.map((hour) => (
                      <button
                        key={hour}
                        type="button"
                        data-selected={hour === currentHours}
                        onClick={() => handleTimeSelect("hours", hour)}
                        className={cn(
                          "w-full px-2 py-1.5 text-sm transition-colors text-center",
                          hour === currentHours
                            ? "bg-primary text-primary-foreground font-semibold"
                            : "hover:bg-muted",
                        )}
                      >
                        {hour.toString().padStart(2, "0")}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Minutes */}
                <div className="flex flex-col">
                  <div className="text-[10px] uppercase font-bold text-muted-foreground text-center mb-1">
                    Min
                  </div>
                  <div
                    ref={minutesRef}
                    className="h-[200px] w-12 overflow-y-auto scrollbar-none border rounded-md"
                  >
                    {minutes.map((minute) => (
                      <button
                        key={minute}
                        type="button"
                        data-selected={minute === currentMinutes}
                        onClick={() => handleTimeSelect("minutes", minute)}
                        className={cn(
                          "w-full px-2 py-1.5 text-sm transition-colors text-center",
                          minute === currentMinutes
                            ? "bg-primary text-primary-foreground font-semibold"
                            : "hover:bg-muted",
                        )}
                      >
                        {minute.toString().padStart(2, "0")}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
