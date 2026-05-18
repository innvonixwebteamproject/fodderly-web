import { Button, ButtonArrow } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverPortal,
} from "@/components/ui/popover";
import { X, Loader2, Search, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { UseInfiniteQueryResult, InfiniteData } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface InfiniteSelectResponse<T> {
  data: T[];
  meta: {
    page: number;
    totalPages: number;
    hasNextPage?: boolean;
  };
}

interface InfiniteSearchableSelectProps<T> {
  value: string | string[];
  onValueChange: (val: string | string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  isClearable?: boolean;
  multiple?: boolean;
  query: UseInfiniteQueryResult<InfiniteData<InfiniteSelectResponse<T>>, Error>;
  getItemId: (item: T) => string;
  getItemLabel: (item: T) => string;
  triggerClassName?: string;
}

export function InfiniteSearchableSelect<T>({
  value,
  onValueChange,
  placeholder,
  searchPlaceholder = "Search...",
  disabled = false,
  multiple = false,
  isClearable = false,
  query,
  getItemId,
  getItemLabel,
  triggerClassName,
}: InfiniteSearchableSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [search, setSearch] = useState("");

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const observerTargetRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    query;

  // Flatten all pages into a single array
  const items = useMemo(() => {
    return (
      data?.pages.flatMap((page: InfiniteSelectResponse<T>) => page.data) || []
    );
  }, [data]);

  // Map items to options
  const options = useMemo(() => {
    return items.map((item) => ({
      value: getItemId(item),
      label: getItemLabel(item),
    }));
  }, [items, getItemId, getItemLabel]);

  // Client-side filtering
  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const searchLower = search.toLowerCase();
    return options.filter((opt) =>
      opt.label.toLowerCase().includes(searchLower),
    );
  }, [options, search]);

  // Reset search when popover closes
  useEffect(() => {
    if (!open) {
      setSearch("");
    }
  }, [open]);

  // Set up intersection observer - using a delayed effect after DOM is ready
  useEffect(() => {
    if (!open) {
      return;
    }

    // Small delay to ensure both refs are set
    const timer = setTimeout(() => {
      const target = observerTargetRef.current;
      const container = scrollContainerRef.current;

      if (!target) {
        return;
      }

      if (!container) {
        return;
      }

      // Cleanup existing observer
      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      // Create new observer
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (
              entry.isIntersecting &&
              hasNextPage &&
              !isFetchingNextPage &&
              !isLoading
            ) {
              fetchNextPage();
            }
          });
        },
        {
          root: container,
          threshold: 0.1,
          rootMargin: "20px",
        },
      );

      observerRef.current.observe(target);
    }, 100); // 100ms delay to ensure DOM is ready

    return () => {
      clearTimeout(timer);
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [open, hasNextPage, isFetchingNextPage, isLoading, fetchNextPage]);

  // Manual scroll handler as backup
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;

    // If scrolled to 80% or more, fetch next page
    if (
      scrollPercentage > 0.8 &&
      hasNextPage &&
      !isFetchingNextPage &&
      !isLoading
    ) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, isLoading, fetchNextPage]);

  // Attach scroll listener
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !open) return;

    container.addEventListener("scroll", handleScroll);

    // Trigger initial check in case content is already scrollable
    setTimeout(() => handleScroll(), 100);

    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [open, handleScroll]);

  const selectedOptions = useMemo(() => {
    if (multiple) {
      const values = Array.isArray(value) ? value : [];
      return options.filter((opt) => values.includes(opt.value));
    }
    const opt = options.find((opt) => opt.value === value);
    return opt ? [opt] : [];
  }, [options, value, multiple]);

  const handleSelect = (val: string) => {
    if (multiple) {
      const currentValues = Array.isArray(value) ? value : [];
      const newValues = currentValues.includes(val)
        ? currentValues.filter((v) => v !== val)
        : [...currentValues, val];
      onValueChange(newValues);
    } else {
      onValueChange(val);
      setOpen(false);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (multiple) {
      onValueChange([]);
    } else {
      onValueChange("");
    }
  };

  const visibleItems = expanded ? selectedOptions : selectedOptions.slice(0, 3);
  const hiddenCount = selectedOptions.length - visibleItems.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <Button
          variant="outline"
          role="combobox"
          autoHeight
          mode="input"
          placeholder={selectedOptions.length === 0}
          className={cn("w-full px-1.5 py-1 relative", triggerClassName)}
        >
          <div className="flex items-center gap-1 pe-2.5 min-w-0 w-full">
            {selectedOptions.length > 0 ? (
              multiple ? (
                <div className="flex flex-wrap items-center gap-1 min-w-0">
                  {visibleItems.map((opt) => (
                    <Tooltip key={opt.value}>
                      <TooltipTrigger asChild>
                        <Badge
                          variant="outline"
                          className="max-w-[150px] shrink-0"
                        >
                          <span className="truncate">{opt.label}</span>
                          <button
                            className="ml-1 hover:text-red-500 shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelect(opt.value);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>{opt.label}</TooltipContent>
                    </Tooltip>
                  ))}
                  {(hiddenCount > 0 || expanded) && (
                    <Badge
                      className="cursor-pointer px-1.5 text-muted-foreground hover:bg-accent shrink-0"
                      appearance="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpanded((prev) => !prev);
                      }}
                    >
                      {expanded ? "Show Less" : `+${hiddenCount} more`}
                    </Badge>
                  )}
                </div>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="px-2.5 truncate flex-1 text-left min-w-0">
                      {selectedOptions[0].label}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>{selectedOptions[0].label}</TooltipContent>
                </Tooltip>
              )
            ) : (
              <span className="px-2.5 text-muted-foreground truncate flex-1 text-left min-w-0">
                {placeholder || "Select option"}
              </span>
            )}
          </div>
          {isClearable && value && (
            <button
              type="button"
              className="absolute right-9 top-1/2 -translate-y-1/2 p-1 hover:text-red-500 text-muted-foreground z-10"
              onClick={handleClear}
            >
              <X className="h-3 w-3" />
            </button>
          )}
          <ButtonArrow className="absolute top-2 end-3" />
        </Button>
      </PopoverTrigger>

      <PopoverPortal>
        <PopoverContent
          className="w-(--radix-popper-anchor-width) p-0"
          align="start"
        >
          <div className="flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground">
            {/* Search Input */}
            <div className="sticky top-0 z-10 bg-popover border-b p-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={searchPlaceholder}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                  className="pl-8 h-8"
                />
              </div>
            </div>

            {/* List Container */}
            <div
              ref={scrollContainerRef}
              className="max-h-[300px] overflow-y-auto overflow-x-hidden"
              onWheel={(e) => e.stopPropagation()}
            >
              {/* Loading State */}
              {isLoading && items.length === 0 ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : filteredOptions.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  {search ? "No results found" : "No options available"}
                </div>
              ) : (
                <div className="p-1.5 space-y-0.5">
                  {filteredOptions.map((opt, index) => {
                    const isSelected = multiple
                      ? Array.isArray(value) && value.includes(opt.value)
                      : value === opt.value;
                    return (
                      <div
                        key={`${opt.value}-${index}`}
                        onClick={() => handleSelect(opt.value)}
                        className={cn(
                          "relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer",
                          isSelected && "bg-accent/50",
                        )}
                      >
                        <span className="truncate pe-8">{opt.label}</span>
                        {isSelected && (
                          <Check className="h-4 w-4 ms-auto text-primary shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Observer Target */}
              <div ref={observerTargetRef}>
                {isFetchingNextPage && (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      Loading more...
                    </span>
                  </div>
                )}
                {!isFetchingNextPage && hasNextPage && (
                  <div className="text-center text-xs text-muted-foreground">
                    Scroll for more
                  </div>
                )}
              </div>
            </div>
          </div>
        </PopoverContent>
      </PopoverPortal>
    </Popover>
  );
}
