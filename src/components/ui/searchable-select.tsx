import { Button, ButtonArrow } from "@/components/ui/button";
import {
  Command,
  CommandCheck,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverPortal,
} from "@/components/ui/popover";
import { SearchableSelectProps } from "@/interfaces/common.interface";
import { X } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export const SearchableSelect = ({
  options,
  value,
  onValueChange,
  placeholder,
  searchPlaceholder,
  searchInputClassName,
  disabled = false,
  isClearable = true,
  triggerClassName,
  contentClassName,
  side,
  align,
}: SearchableSelectProps & { triggerClassName?: string }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open) setSearch("");
  }, [open]);

  const selectedLabel = options.find((option) => option.value === value)?.label;

  return (
    <Popover modal={false} open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <Button
          variant="outline"
          role="combobox"
          mode="input"
          className={cn(
            "w-full justify-between px-2 py-1.5 text-left relative",
            triggerClassName,
          )}
        >
          <div className="flex items-center gap-1 truncate">
            {selectedLabel ? (
              <span className="truncate">{selectedLabel}</span>
            ) : (
              <span className="text-muted-foreground">
                {placeholder || "Select option"}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {isClearable && value && (
              <X
                className="h-4 w-4 text-muted-foreground cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation(); // prevent opening popover
                  onValueChange("");
                }}
              />
            )}
            <ButtonArrow />
          </div>
        </Button>
      </PopoverTrigger>

      <PopoverPortal>
        <PopoverContent
          side={side}
          align={align}
          onWheel={(event) => event.stopPropagation()}
          className={cn(
            "z-[110] w-[var(--radix-popper-anchor-width)] min-w-[200px] max-w-[500px] max-h-[min(55vh,420px)] overflow-hidden p-0",
            contentClassName,
          )}
        >
          <Command className="h-auto max-h-[min(55vh,420px)] min-h-0">
            <CommandInput
              placeholder={searchPlaceholder || "Search..."}
              value={search}
              onValueChange={setSearch}
              className={searchInputClassName}
            />
            <CommandList className="max-h-[min(40vh,340px)] min-h-0 flex-1 overflow-y-auto overscroll-contain custom-scrollbar">
              <CommandEmpty>No option found.</CommandEmpty>
              <CommandGroup>
                {options.map((opt, index) => (
                  <CommandItem
                    key={`${opt.value}-${index}`}
                    value={opt.label + " " + opt.value}
                    onSelect={() => {
                      onValueChange(opt.value);
                      setOpen(false);
                    }}
                  >
                    <span className="break-words whitespace-normal">
                      {opt.label}
                    </span>
                    {value === opt.value && <CommandCheck />}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </PopoverPortal>
    </Popover>
  );
};
