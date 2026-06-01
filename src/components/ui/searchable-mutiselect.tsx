import { useMemo, useState, useEffect } from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandCheck,
} from "@/components/ui/command";
import { Button, ButtonArrow } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { MultiSelectPopoverProps } from "@/interfaces/common.interface";

export function MultiSelectPopover({
  options,
  placeholder = "Select option",
  searchPlaceholder = "Search...",
  value,
  toggleSelection,
  removeSelection,
  onSelectAll,
  disabled = false,
}: MultiSelectPopoverProps) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [search, setSearch] = useState("");

  // ✅ Clear search whenever popover closes
  useEffect(() => {
    if (!open) {
      setSearch("");
    }
  }, [open]);

  const visibleItems = expanded ? value : value.slice(0, 3);
  const hiddenCount = value.length - visibleItems.length;

  const filteredOptions = useMemo(() => {
    return options.filter((option) => {
      return option.label.toLowerCase().includes(search?.toLowerCase() || "");
    });
  }, [options, search]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          autoHeight
          mode="input"
          placeholder={value.length === 0}
          className="w-full px-1.5 py-1 text-[12px] relative"
          disabled={disabled}
        >
          <div className="flex flex-wrap items-center gap-1 pe-2.5">
            {value.length > 0 ? (
              <>
                {visibleItems.map((val) => {
                  const opt = options.find((o) => o.value === val);
                  return opt ? (
                    <Badge key={val} variant="outline" className="text-[11px]">
                      {opt.label}
                      <button
                        className="ml-1 hover:text-red-500"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSelection(val);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ) : null;
                })}
                {(hiddenCount > 0 || expanded) && (
                  <Badge
                    className="cursor-pointer px-1.5 text-[11px] text-muted-foreground hover:bg-accent"
                    appearance="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpanded((prev) => !prev);
                    }}
                  >
                    {expanded ? "Show Less" : `+${hiddenCount} more`}
                  </Badge>
                )}
              </>
            ) : (
              <span className="px-2.5">{placeholder}</span>
            )}
          </div>
          <ButtonArrow className="absolute top-2 end-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popper-anchor-width) p-0">
        {/* Override the default filter function */}
        <Command filter={() => 1}>
          <CommandInput
            placeholder={searchPlaceholder}
            onValueChange={setSearch}
            className="text-[12px] placeholder:text-[12px]"
          />
          <CommandList>
            <CommandEmpty className="text-[12px]">No options found.</CommandEmpty>
            <CommandGroup>
              {onSelectAll && (
                <CommandItem
                  key="select-all"
                  value="select-all"
                  onSelect={() => {
                    onSelectAll();
                  }}
                  className="font-medium text-[12px] text-primary"
                >
                  <span className="truncate">Select All</span>
                  {value.length === options.length && value.length > 0 && (
                    <CommandCheck />
                  )}
                </CommandItem>
              )}
              {filteredOptions.map((opt) => (
                <CommandItem
                  key={opt.value}
                  value={opt.value}
                  onSelect={() => toggleSelection(opt.value)}
                  className="text-[12px]"
                >
                  <span className="truncate">{opt.label}</span>
                  {value.includes(opt.value) && <CommandCheck />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
