import * as React from "react";
import { Check, CirclePlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";

interface FilterDropdownProps {
  title: string;
  options: {
    label: string;
    value: string;
    icon?: React.ComponentType<{ className?: string }>;
  }[];
  selectedValues: string[];
  onSelect: (values: string[]) => void;
  isSingleSelect?: boolean;
  isClearable?: boolean;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
}

export function FilterDropdown({
  title,
  options,
  selectedValues,
  onSelect,
  isSingleSelect = false,
  isClearable = true,
  placeholder,
  className,
  triggerClassName,
}: FilterDropdownProps) {
  const selectedValuesSet = new Set(selectedValues);

  const handleSelect = (value: string) => {
    if (isSingleSelect) {
      if (selectedValuesSet.has(value)) {
        onSelect([]);
      } else {
        onSelect([value]);
      }
      return;
    }

    const newValues = new Set(selectedValuesSet);
    if (newValues.has(value)) {
      newValues.delete(value);
    } else {
      newValues.add(value);
    }
    onSelect(Array.from(newValues));
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-10 border-dashed bg-background hover:bg-accent hover:text-accent-foreground",
            selectedValuesSet.size > 0 && "border-solid",
            triggerClassName
          )}
        >
          <CirclePlus className="mr-2 h-4 w-4" />
          {title}
          {selectedValuesSet.size > 0 && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge
                variant="secondary"
                className="rounded-sm px-1 font-normal lg:hidden"
              >
                {selectedValuesSet.size}
              </Badge>
              <div className="hidden space-x-1 lg:flex">
                {selectedValuesSet.size > 2 ? (
                  <Badge
                    variant="secondary"
                    className="rounded-sm px-1 font-normal"
                  >
                    {selectedValuesSet.size} selected
                  </Badge>
                ) : (
                  options
                    .filter((option) => selectedValuesSet.has(option.value))
                    .map((option) => (
                      <Badge
                        variant="secondary"
                        key={option.value}
                        className="rounded-sm px-1 font-normal"
                      >
                        {option.label}
                      </Badge>
                    ))
                )}
              </div>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn("w-[200px] min-w-[200px] max-w-[500px] p-0", className)} align="start">
        <Command>
          <CommandInput placeholder={placeholder || title} />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selectedValuesSet.has(option.value);
                return (
                  <CommandItem
                    key={option.value}
                    onSelect={() => handleSelect(option.value)}
                  >
                    <div
                      className={cn(
                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "opacity-50 [&_svg]:invisible"
                      )}
                    >
                      <Check className={cn("h-4 w-4")} />
                    </div>
                    {option.icon && (
                      <option.icon className="mr-2 h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                    <span className="break-words whitespace-normal">{option.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {selectedValuesSet.size > 0 && isClearable && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => onSelect([])}
                    className="justify-center text-center"
                  >
                    Clear filters
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
