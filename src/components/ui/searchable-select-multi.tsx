import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SearchableSelectProps } from "@/interfaces/common.interface";
import { Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";

export const SearchableSelectMulti = ({
  options,
  value = [],
  onValueChange,
  placeholder,
  searchPlaceholder,
  disabled = false,
}: Omit<SearchableSelectProps, "value" | "onValueChange"> & {
  value: string[];
  onValueChange: (values: string[]) => void;
}) => {
  const [open, setOpen] = useState(false);

  const selectedOptions = options.filter((option) =>
    value.includes(option.value)
  );

  const getDisplayText = () => {
    if (selectedOptions.length === 0) return placeholder;
    if (selectedOptions.length === 1) return selectedOptions[0].label;
    if (selectedOptions.length <= 2) {
      return selectedOptions.map((o) => o.label).join(", ");
    }
    return `${selectedOptions[0].label} +${selectedOptions.length - 1} more`;
  };

  const handleSelect = (selectedValue: string) => {
    let newValue;
    if (value.includes(selectedValue)) {
      // remove from selection
      newValue = value.filter((v) => v !== selectedValue);
    } else {
      // add to selection
      newValue = [...value, selectedValue];
    }
    onValueChange(newValue);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          <span
            className="truncate min-w-0"
            title={selectedOptions.map((o) => o.label).join(", ")}
          >
            {getDisplayText()}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popper-anchor-width)] min-w-[200px] max-w-[500px] p-0 max-h-72 overflow-y-auto custom-scrollbar"
        side="bottom"
        align="start"
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandEmpty>No option found.</CommandEmpty>
          <CommandGroup>
            {/* Selected options */}
            {options
              .filter((option) => value.includes(option.value))
              .map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => handleSelect(option.value)}
                  className="bg-accent/50 mb-1"
                >
                  <Check className="mr-2 h-4 w-4 opacity-100" />
                  <span className="truncate max-w-[300px]" title={option.label}>
                    {option.label}
                  </span>
                </CommandItem>
              ))}

            {/* Add separator if there are selected items */}
            {value.length > 0 &&
              options.filter((option) => !value.includes(option.value)).length >
                0 && (
                <div className="px-2 py-1">
                  <div className="h-px bg-border" />
                </div>
              )}

            {/* Unselected options */}
            {options
              .filter((option) => !value.includes(option.value))
              .map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => handleSelect(option.value)}
                >
                  <Check className="mr-2 h-4 w-4 opacity-0" />
                  <span className="break-words whitespace-normal" title={option.label}>
                    {option.label}
                  </span>
                </CommandItem>
              ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
