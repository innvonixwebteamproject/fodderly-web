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
import { useInfiniteQuery, UseInfiniteQueryResult, InfiniteData } from "@tanstack/react-query";
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

const getNextPageFromMeta = <T,>(
  data: InfiniteData<InfiniteSelectResponse<T>> | undefined,
): number | undefined => {
  const lastPage = data?.pages[data.pages.length - 1];
  if (!lastPage?.meta) return undefined;

  const { page, totalPages, hasNextPage } = lastPage.meta;
  if (hasNextPage === false) return undefined;
  if (totalPages > 0 && page >= totalPages) return undefined;
  if (hasNextPage || page < totalPages) return page + 1;

  return undefined;
};

function useInfiniteSelectScroll<T>({
  data,
  fetchNextPage,
  hasNextPage,
  isFetching,
  isLoading,
  queryIdentity,
}: {
  data: InfiniteData<InfiniteSelectResponse<T>> | undefined;
  fetchNextPage: UseInfiniteQueryResult<InfiniteData<InfiniteSelectResponse<T>>, Error>["fetchNextPage"];
  hasNextPage: boolean;
  isFetching: boolean;
  isLoading: boolean;
  queryIdentity: string;
}) {
  const loadingPageRef = useRef<number | null>(null);

  useEffect(() => {
    loadingPageRef.current = null;
  }, [queryIdentity]);

  const loadNextPage = useCallback(() => {
    const nextPage = getNextPageFromMeta(data);
    if (!nextPage || !hasNextPage || isFetching || isLoading) return;
    if (loadingPageRef.current === nextPage) return;

    loadingPageRef.current = nextPage;
    void fetchNextPage({ cancelRefetch: false }).finally(() => {
      if (loadingPageRef.current === nextPage) {
        loadingPageRef.current = null;
      }
    });
  }, [data, fetchNextPage, hasNextPage, isFetching, isLoading]);

  const handleScroll = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      const target = event.currentTarget;
      const distanceFromBottom =
        target.scrollHeight - target.scrollTop - target.clientHeight;

      if (distanceFromBottom <= 48) {
        loadNextPage();
      }
    },
    [loadNextPage],
  );

  return { handleScroll };
}

function useDebounce<T>(value: T, delay?: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay || 500);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

export interface InfiniteSearchableSelectProps<T> {
  value: string | string[];
  onValueChange: (val: string | string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  isClearable?: boolean;
  multiple?: boolean;
  selectedOptionLabels?: Record<string, string>;
  queryKeyPrefix: string[];
  queryFn: (params: { page: number; limit: number; search: string }) => Promise<InfiniteSelectResponse<T>>;
  limit?: number;
  getItemId: (item: T) => string;
  getItemLabel: (item: T) => string;
  triggerClassName?: string;
  contentClassName?: string;
  align?: "center" | "end" | "start";
}

export function InfiniteSearchableSelect<T>({
  value,
  onValueChange,
  placeholder,
  searchPlaceholder = "Search...",
  disabled = false,
  multiple = false,
  isClearable = false,
  queryKeyPrefix,
  queryFn,
  limit = 10,
  getItemId,
  getItemLabel,
  triggerClassName,
  contentClassName,
  align = "start",
  selectedOptionLabels,
}: InfiniteSearchableSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);

  const { data, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: [...queryKeyPrefix, "infinite-select", debouncedSearch, limit],
    queryFn: ({ pageParam = 1 }) => queryFn({ page: pageParam, limit, search: debouncedSearch }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.meta.hasNextPage === false) return undefined;
      if (lastPage.meta.totalPages > 0 && lastPage.meta.page >= lastPage.meta.totalPages) return undefined;
      if (lastPage.meta.hasNextPage || lastPage.meta.page < lastPage.meta.totalPages) return lastPage.meta.page + 1;
      return undefined;
    },
    // Only fetch when the dropdown is open — prevents background queries for every pre-selected value
    enabled: open,
    // Cache for 5 minutes — reuse data across multiple dropdown opens without re-fetching
    staleTime: 5 * 60 * 1000,
    // Keep data in memory for 10 minutes after last use
    gcTime: 10 * 60 * 1000,
    // Do NOT refetch when user switches browser tabs — avoids mass request bursts
    refetchOnWindowFocus: false,
  });

  // Flatten all pages into a single array
  const items = useMemo(() => {
    const seen = new Set<string>();
    return (
      data?.pages.flatMap((page: InfiniteSelectResponse<T>) => page.data).filter((item) => {
        const id = getItemId(item);
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      }) || []
    );
  }, [data, getItemId]);

  // Map items to options
  const options = useMemo(() => {
    return items.map((item) => ({
      value: getItemId(item),
      label: getItemLabel(item),
      original: item,
    }));
  }, [items, getItemId, getItemLabel]);

  // Reset search when popover closes
  useEffect(() => {
    if (!open) {
      setSearch("");
    }
  }, [open]);

  const { handleScroll } = useInfiniteSelectScroll({
    data,
    fetchNextPage,
    hasNextPage: Boolean(hasNextPage),
    isFetching,
    isLoading,
    queryIdentity: `${queryKeyPrefix.join("|")}|${debouncedSearch}|${limit}`,
  });

  // To preserve selected values that are not in the current search results or pages,
  // we would ideally need a separate query to fetch selected items by ID.
  // For now, we only show labels for items that exist in our loaded `options`.
  // If they don't exist, we show their ID as a fallback.
  const selectedOptions = useMemo(() => {
    if (multiple) {
      const values = Array.isArray(value) ? value : [];
      return values.map(v => {
        const found = options.find(o => o.value === v);
        return found || { value: v, label: selectedOptionLabels?.[v] || v };
      });
    }
    if (!value) return [];
    const found = options.find((opt) => opt.value === value);
    const fallbackValue = value as string;
    return found
      ? [found]
      : [{ value: fallbackValue, label: selectedOptionLabels?.[fallbackValue] || fallbackValue }];
  }, [multiple, options, selectedOptionLabels, value]);

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
          autoHeight={multiple}
          mode="input"
          placeholder={selectedOptions.length === 0}
          className={cn(
            "w-full justify-between px-2 py-1.5 text-left text-[12px] relative",
            triggerClassName,
          )}
        >
          <div className="flex items-center gap-1 truncate min-w-0">
            {selectedOptions.length > 0 ? (
              multiple ? (
                <div className="flex flex-wrap items-center gap-1 min-w-0">
                  {visibleItems.map((opt) => (
                    <Tooltip key={opt.value}>
                      <TooltipTrigger asChild>
                        <Badge
                          variant="outline"
                          className="max-w-[150px] shrink-0 text-[11px]"
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
                      className="cursor-pointer px-1.5 text-[11px] text-muted-foreground hover:bg-accent shrink-0"
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
                    <span className="truncate">
                      {selectedOptions[0].label}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>{selectedOptions[0].label}</TooltipContent>
                </Tooltip>
              )
            ) : (
              <span className="text-muted-foreground truncate">
                {placeholder || "Select option"}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {isClearable && value && (
              <X
                className="h-4 w-4 text-muted-foreground cursor-pointer"
                onClick={handleClear}
              />
            )}
            <ButtonArrow />
          </div>
        </Button>
      </PopoverTrigger>

      <PopoverPortal>
        <PopoverContent
          onWheel={(event) => event.stopPropagation()}
          className={cn(
            "z-[110] w-[var(--radix-popper-anchor-width)] min-w-[200px] max-w-[500px] max-h-[min(55vh,420px)] overflow-hidden p-0",
            contentClassName,
          )}
          align={align}
        >
          <div className="flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground">
            <div className="sticky top-0 z-10 bg-popover border-b p-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={searchPlaceholder}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                  className="pl-8 h-8 text-[12px] placeholder:text-[12px]"
                />
              </div>
            </div>

            <div
              className="custom-scrollbar max-h-[300px] overflow-y-auto overflow-x-hidden"
              onScroll={handleScroll}
              onWheel={(e) => e.stopPropagation()}
            >
              {isLoading && items.length === 0 ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : options.length === 0 ? (
                <div className="py-6 text-center text-[12px] text-muted-foreground">
                  {search ? "No results found" : "No options available"}
                </div>
              ) : (
                <div className="p-1.5 space-y-0.5">
                  {options.map((opt, index) => {
                    const isSelected = multiple
                      ? Array.isArray(value) && value.includes(opt.value)
                      : value === opt.value;
                    return (
                      <div
                        key={`${opt.value}-${index}`}
                        onClick={() => handleSelect(opt.value)}
                        className={cn(
                          "relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-[12px] outline-none hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer",
                          isSelected && "bg-accent/50"
                        )}
                      >
                        <span className="break-words whitespace-normal pe-8">{opt.label}</span>
                        {isSelected && (
                          <Check className="h-4 w-4 ms-auto text-primary shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div>
                {isFetchingNextPage && (
                  <div className="flex items-center justify-center gap-2 py-2">
                    <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      Loading more...
                    </span>
                  </div>
                )}
                {!isFetchingNextPage && hasNextPage && (
                  <div className="text-center text-xs text-muted-foreground py-2">
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
