import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface TimePickerProps {
  value?: string; // HH:mm format (24-hour)
  onChange?: (value: string) => void; // Returns HH:mm format (24-hour)
  onBlur?: () => void;
  disabled?: boolean;
  className?: string;
  name?: string;
}

export const TimePicker = React.forwardRef<HTMLDivElement, TimePickerProps>(
  ({ value = "", onChange, onBlur, disabled, className, name }, ref) => {
    const [displayValue, setDisplayValue] = React.useState(value || "00:00");
    const [isOpen, setIsOpen] = React.useState(false);
    const hoursRef = React.useRef<HTMLDivElement>(null);
    const minutesRef = React.useRef<HTMLDivElement>(null);

    // Update display when value prop changes
    React.useEffect(() => {
      if (value) {
        const formatted = formatTimeValue(value);
        setDisplayValue(formatted);
      }
    }, [value]);

    const formatTimeValue = (time: string): string => {
      if (!time || !time.includes(":")) {
        return "00:00";
      }
      const [hours, minutes] = time.split(":");
      return `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}`;
    };

    const parseTimeValue = (
      time: string
    ): { hours: number; minutes: number } => {
      const [hoursStr, minutesStr] = time.split(":");
      return {
        hours: parseInt(hoursStr, 10) || 0,
        minutes: parseInt(minutesStr, 10) || 0,
      };
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value;

      // Remove all non-digits
      const digitsOnly = input.replace(/\D/g, "");

      // Auto-format based on number of digits
      if (digitsOnly.length === 0) {
        setDisplayValue("");
      } else if (digitsOnly.length <= 2) {
        // Just hours (e.g., "1" or "14")
        setDisplayValue(digitsOnly);
      } else if (digitsOnly.length === 3) {
        // Auto-insert colon after 2 digits (e.g., "145" becomes "14:5")
        setDisplayValue(`${digitsOnly.slice(0, 2)}:${digitsOnly.slice(2)}`);
      } else {
        // Four or more digits (e.g., "1455" becomes "14:55")
        const hours = digitsOnly.slice(0, 2);
        const minutes = digitsOnly.slice(2, 4);
        setDisplayValue(`${hours}:${minutes}`);
      }
    };

    const handleInputBlur = () => {
      // Validate and format on blur
      const parts = displayValue.split(":");
      let hours = 0;
      let minutes = 0;

      if (parts.length > 0) {
        hours = Math.min(23, Math.max(0, parseInt(parts[0], 10) || 0));
      }
      if (parts.length > 1) {
        minutes = Math.min(59, Math.max(0, parseInt(parts[1], 10) || 0));
      }

      const formatted = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
      setDisplayValue(formatted);
      onChange?.(formatted);
      onBlur?.();
    };

    const handleTimeSelect = (hours: number, minutes: number) => {
      const formatted = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
      setDisplayValue(formatted);
      onChange?.(formatted);
    };

    const { hours: currentHours, minutes: currentMinutes } =
      parseTimeValue(displayValue);

    // Generate hours and minutes arrays
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const minutes = Array.from({ length: 60 }, (_, i) => i);

    // Scroll to selected time when popover opens
    React.useEffect(() => {
      if (isOpen) {
        setTimeout(() => {
          if (hoursRef.current) {
            const selectedHour = hoursRef.current.querySelector(
              '[data-selected="true"]'
            );
            selectedHour?.scrollIntoView({
              block: "center",
              behavior: "instant",
            });
          }
          if (minutesRef.current) {
            const selectedMinute = minutesRef.current.querySelector(
              '[data-selected="true"]'
            );
            selectedMinute?.scrollIntoView({
              block: "center",
              behavior: "instant",
            });
          }
        }, 0);
      }
    }, [isOpen]);

    return (
      <div ref={ref} className={cn("relative inline-flex", className)}>
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <div className="relative">
            <Input
              type="text"
              inputMode="numeric"
              placeholder="HH:MM"
              value={displayValue}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              disabled={disabled}
              className="pr-9 text-center font-mono"
              maxLength={5}
              name={name}
            />
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full w-9 hover:bg-transparent"
                disabled={disabled}
                tabIndex={-1}
              >
                <Clock className="h-4 w-4 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
          </div>
          <PopoverContent className="w-auto p-0" align="end">
            <div className="flex gap-1 p-2">
              {/* Hours Column */}
              <div className="flex flex-col">
                <div className="text-xs font-medium text-muted-foreground text-center mb-1 px-2">
                  Hours
                </div>
                <div
                  ref={hoursRef}
                  className="h-32 w-16 overflow-y-auto border rounded-md"
                  style={{ scrollbarWidth: "thin" }}
                >
                  {hours.map((hour) => (
                    <button
                      key={hour}
                      type="button"
                      data-selected={hour === currentHours}
                      onClick={() => handleTimeSelect(hour, currentMinutes)}
                      className={cn(
                        "w-full px-2 py-1 text-sm hover:bg-muted transition-colors text-center",
                        hour === currentHours &&
                          "bg-primary text-primary-foreground hover:bg-primary/90 rounded-md"
                      )}
                    >
                      {hour.toString().padStart(2, "0")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Minutes Column */}
              <div className="flex flex-col">
                <div className="text-xs font-medium text-muted-foreground text-center mb-1 px-2">
                  Minutes
                </div>
                <div
                  ref={minutesRef}
                  className="h-32 w-16 overflow-y-auto border rounded-md"
                  style={{ scrollbarWidth: "thin" }}
                >
                  {minutes.map((minute) => (
                    <button
                      key={minute}
                      type="button"
                      data-selected={minute === currentMinutes}
                      onClick={() => handleTimeSelect(currentHours, minute)}
                      className={cn(
                        "w-full px-2 py-1 text-sm hover:bg-muted transition-colors text-center",
                        minute === currentMinutes &&
                          "bg-primary text-primary-foreground hover:bg-primary/90 rounded-md"
                      )}
                    >
                      {minute.toString().padStart(2, "0")}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    );
  }
);

TimePicker.displayName = "TimePicker";
