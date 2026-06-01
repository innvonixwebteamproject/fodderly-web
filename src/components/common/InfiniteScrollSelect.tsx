import { useState, useMemo, useRef, useCallback } from "react";
import { UseInfiniteQueryResult, InfiniteData } from "@tanstack/react-query";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Loader2, Search, X } from "lucide-react";
import { FormControl } from "@/components/ui/form";

interface ApiResponse<T> {
    data: T[];
    meta: {
        page: number;
        totalPages: number;
    };
}

interface InfiniteScrollSelectProps<T> {
    value?: string;
    onValueChange: (value: string) => void;
    placeholder: string;
    query: UseInfiniteQueryResult<InfiniteData<ApiResponse<T>>, Error>;
    getItemId: (item: T) => string;
    getItemLabel: (item: T) => string;
    searchPlaceholder?: string;
    allOptionLabel?: string;
    allOptionValue?: string;
    clearable?: boolean;
}

export function InfiniteScrollSelect<T>({
    value,
    onValueChange,
    placeholder,
    query,
    getItemId,
    getItemLabel,
    searchPlaceholder = "Search...",
    allOptionLabel,
    allOptionValue = "all",
    clearable = false,
}: InfiniteScrollSelectProps<T>) {
    const [search, setSearch] = useState("");
    const [open, setOpen] = useState(false);
    const loadingPageRef = useRef<number | null>(null);

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isFetching,
    } = query;

    // Flatten all pages into a single array
    const items = useMemo(() => {
        return data?.pages.flatMap((page: ApiResponse<T>) => page.data) || [];
    }, [data]);

    const handleScroll = useCallback(
        (event: React.UIEvent<HTMLDivElement>) => {
            const lastPage = data?.pages[data.pages.length - 1];
            const currentPage = lastPage?.meta.page;
            const totalPages = lastPage?.meta.totalPages;
            const nextPage =
                currentPage && (!totalPages || currentPage < totalPages)
                    ? currentPage + 1
                    : undefined;

            if (!open || !nextPage || !hasNextPage || isFetching || isLoading) return;

            const target = event.currentTarget;
            const distanceFromBottom =
                target.scrollHeight - target.scrollTop - target.clientHeight;

            if (distanceFromBottom > 48 || loadingPageRef.current === nextPage) return;

            loadingPageRef.current = nextPage;
            void fetchNextPage({ cancelRefetch: false }).finally(() => {
                if (loadingPageRef.current === nextPage) {
                    loadingPageRef.current = null;
                }
            });
        },
        [data, fetchNextPage, hasNextPage, isFetching, isLoading, open]
    );

    return (
        <div className="relative w-full">
            <Select value={value} onValueChange={onValueChange} open={open} onOpenChange={setOpen}>
                <FormControl>
                    <SelectTrigger className={`w-full ${clearable && value ? "pr-8" : ""}`}>
                        <SelectValue placeholder={placeholder} />
                    </SelectTrigger>
                </FormControl>
                <SelectContent className="max-h-[300px] overflow-y-auto" onScroll={handleScroll}>
                    {/* Search Input */}
                    <div className="sticky top-0 z-10 bg-popover p-2 border-b">
                        <div className="relative">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={searchPlaceholder}
                                value={search}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                                className="pl-8 h-8"
                                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                            />
                        </div>
                    </div>

                    {/* All Option */}
                    {allOptionLabel && (
                        <SelectItem value={allOptionValue}>{allOptionLabel}</SelectItem>
                    )}

                    {/* Loading State */}
                    {isLoading && (
                        <div className="flex items-center justify-center py-6">
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                    )}

                    {/* Items */}
                    {!isLoading && items.length > 0 && (
                        <>
                            {items
                                .filter((item: T) =>
                                    getItemLabel(item)
                                        .toLowerCase()
                                        .includes(search.toLowerCase())
                                )
                                .map((item: T) => (
                                    <SelectItem key={getItemId(item)} value={getItemId(item)}>
                                        {getItemLabel(item)}
                                    </SelectItem>
                                ))}
                        </>
                    )}

                    {/* No Results */}
                    {!isLoading && items.length === 0 && (
                        <div className="py-6 text-center text-sm text-muted-foreground">
                            No results found
                        </div>
                    )}

                    {/* Observer Target & Loading More Indicator */}
                    <div className="w-full">
                        {isFetchingNextPage && (
                            <div className="flex items-center justify-center gap-2 py-2">
                                <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">
                                    Loading more...
                                </span>
                            </div>
                        )}
                    </div>
                </SelectContent>
            </Select>

            {clearable && value && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onValueChange("");
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors z-10"
                >
                    <X className="h-3 w-3" />
                </button>
            )}
        </div>
    );
}
