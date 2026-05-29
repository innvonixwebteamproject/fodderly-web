"use client";

import { Info, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  tooltip: string;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
}

export function SearchInput({
  value,
  onChange,
  tooltip,
  placeholder = "Search...",
  className,
  inputClassName,
  disabled = false,
}: SearchInputProps) {
  return (
    <div className={cn("relative group", className)}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className={cn(
          "w-full bg-background pl-9 pr-10 focus:ring-1 focus:ring-primary",
          inputClassName,
        )}
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2">
        {value ? (
          <button
            type="button"
            tabIndex={-1}
            className="flex items-center text-muted-foreground/70 transition-colors hover:text-foreground"
            aria-label="Clear search"
            onClick={() => onChange("")}
          >
            <X className="h-4 w-4" />
          </button>
        ) : (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  tabIndex={-1}
                  className="flex items-center text-muted-foreground/70 transition-colors hover:text-primary"
                  aria-label={tooltip}
                >
                  <Info className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
}
