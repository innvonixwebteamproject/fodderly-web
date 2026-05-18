
export interface SelectOption {
  label: string;
  value: string;
}

export interface SearchableSelectProps {
  options: SelectOption[];
  value: string;
  onValueChange: (val: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  searchInputClassName?: string;
  disabled?: boolean;
  isClearable?: boolean;
  contentClassName?: string;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
}

export interface MultiSelectPopoverProps {
  options: SelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  value: string[];
  toggleSelection: (val: string) => void;
  removeSelection: (val: string) => void;
  onSelectAll?: () => void;
  disabled?: boolean;
  isClearable?: boolean;
}
