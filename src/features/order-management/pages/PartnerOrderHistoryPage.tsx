import {
  ColumnDef,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { format } from "date-fns";
import {
  Download,
  Eye,
  Filter,
  History,
  Loader2,
  MoreHorizontal,
  Package,
  RotateCcw,
  Search,
} from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { CancelButtonContent } from "@/components/common/cancel-button-content";
import { Container } from "@/components/common/container";
import { InfiniteScrollContainer } from "@/components/common/infinite-scroll-container";
import { SearchInput } from "@/components/common/search-input";
import { TruncatedCell } from "@/components/common/truncated-cell";
import { MultiSelectPopover } from "@/components/ui/searchable-mutiselect";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTable, CardTitle } from "@/components/ui/card";
import { DataGrid } from "@/components/ui/data-grid";
import { DataGridColumnHeader } from "@/components/ui/data-grid-column-header";
import { DataGridTable } from "@/components/ui/data-grid-table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { ApiError } from "@/lib/api-error";
import { getApiSortParams } from "@/lib/api-sorting";
import { useProductCategoriesQuery } from "@/features/category-management/hooks/useCategoryCms";
import { useProductsQuery } from "@/features/product-management/hooks/useProducts";
import type { AdminOrderListItem, OrderSortBy, PartnerOrderDatePreset, PartnerOrderHistoryStatusGroup } from "../types/order.types";
import { usePartnerOrderHistoryInfiniteQuery } from "../hooks/usePartnerOrdersQuery";
import { OrderStatusBadge } from "../components/OrderStatusBadge";
import { PaymentModeBadge } from "../components/PaymentModeBadge";
import { getOrderStatusLabel } from "../utils/order-labels";
import {
  PARTNER_ORDER_HISTORY_DATE_PRESETS,
  PARTNER_ORDER_HISTORY_SORT_DIR,
  PARTNER_ORDER_HISTORY_SORT_OPTIONS,
  PARTNER_ORDER_HISTORY_STATUS_GROUPS,
} from "../constants/partner-order-history.constants";
import { isValidYyyyMmDdRange } from "../utils/partner-order-history-dates";
import {
  HISTORY_URL,
  RETURN_QUERY_SESSION_KEY,
  SCROLL_STORAGE_KEY,
  buildHistorySearchParamsFromFilters,
  parseHistoryListFilters,
  parseHistorySort,
} from "../utils/partner-order-history-url";
import { PAYMENT_MODE_FILTER_OPTIONS } from "../constants/order.constants";
import { formatOrderListRupeeAmount } from "../utils/format-order-list-rupee";

const formatPlaced = (v: string) => {
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "-";
  return format(d, "dd/MM/yyyy hh:mm a");
};

const formatDelivery = (row: AdminOrderListItem) => {
  if (row.orderStatus === "ORDER_DELIVERED" && row.deliveredAt) {
    const d = new Date(row.deliveredAt);
    if (!Number.isNaN(d.getTime())) return format(d, "dd/MM/yyyy hh:mm a");
  }
  return "—";
};

function productLabel(name: { en?: string } | undefined, fallback: string) {
  return name?.en?.trim() || fallback;
}

export function PartnerOrderHistoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const scrollRootRef = useRef<HTMLDivElement | null>(null);
  const scrollSaveTimer = useRef(0);

  const [searchDraft, setSearchDraft] = useState(() => searchParams.get(HISTORY_URL.q) ?? "");
  const [filterOpen, setFilterOpen] = useState(false);
  const [productSearch, setProductSearch] = useState("");

  const [draftPreset, setDraftPreset] = useState<PartnerOrderDatePreset>(
    (searchParams.get(HISTORY_URL.preset) as PartnerOrderDatePreset) || "",
  );
  const [draftFrom, setDraftFrom] = useState(searchParams.get(HISTORY_URL.odf) ?? "");
  const [draftTo, setDraftTo] = useState(searchParams.get(HISTORY_URL.odt) ?? "");
  const [draftHsg, setDraftHsg] = useState(searchParams.get(HISTORY_URL.hsg) ?? "");
  const [draftProductId, setDraftProductId] = useState(searchParams.get(HISTORY_URL.pid) ?? "");
  const [draftCats, setDraftCats] = useState<string[]>(() => {
    const c = searchParams.get(HISTORY_URL.cats);
    return c ? c.split(",").map((s) => s.trim()).filter(Boolean) : [];
  });
  const [draftPm, setDraftPm] = useState(searchParams.get(HISTORY_URL.pm) ?? "");

  useEffect(() => {
    setSearchDraft(searchParams.get(HISTORY_URL.q) ?? "");
  }, [searchParams]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        const trimmed = searchDraft.trim();
        if (trimmed) next.set(HISTORY_URL.q, trimmed);
        else next.delete(HISTORY_URL.q);
        if (next.toString() === prev.toString()) return prev;
        return next;
      }, { replace: true });
    }, 400);
    return () => window.clearTimeout(t);
  }, [searchDraft, setSearchParams]);

  const listFilters = useMemo(() => parseHistoryListFilters(searchParams), [searchParams]);
  const { sortBy: apiSortBy, sortDesc } = useMemo(() => parseHistorySort(searchParams), [searchParams]);
  const sorting: SortingState = useMemo(
    () => [{ id: apiSortBy === "productCategory" ? "productCategory" : "placedAt", desc: sortDesc }],
    [apiSortBy, sortDesc],
  );

  const { sortBy, sortOrder } = getApiSortParams<OrderSortBy>({
    sorting,
    defaultSortBy: "placedAt",
    columnToSortByMap: {
      placedAt: "placedAt",
      productCategory: "productCategory",
    },
  });

  const {
    data,
    isLoading,
    isFetching,
    isFetchingNextPage,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    refetch,
  } = usePartnerOrderHistoryInfiniteQuery(listFilters, sortBy, sortOrder, 20);

  const rows = useMemo(() => data?.pages.flatMap((p) => p.data) ?? [], [data]);

  useLayoutEffect(() => {
    if (isLoading) return;
    const raw = sessionStorage.getItem(SCROLL_STORAGE_KEY);
    if (raw == null || !scrollRootRef.current) return;
    const y = Number.parseInt(raw, 10);
    if (!Number.isNaN(y)) {
      scrollRootRef.current.scrollTop = y;
    }
    sessionStorage.removeItem(SCROLL_STORAGE_KEY);
  }, [isLoading, rows.length]);

  const persistScroll = useCallback(() => {
    const el = scrollRootRef.current;
    if (!el) return;
    if (scrollSaveTimer.current) window.clearTimeout(scrollSaveTimer.current);
    scrollSaveTimer.current = window.setTimeout(() => {
      sessionStorage.setItem(SCROLL_STORAGE_KEY, String(el.scrollTop));
    }, 150) as unknown as number;
  }, []);

  const { data: categoriesData } = useProductCategoriesQuery({
    page: 1,
    limit: 200,
    enabled: filterOpen,
  });
  const categoryOptions = useMemo(
    () =>
      (categoriesData?.data ?? []).map((c) => ({
        value: c.id,
        label: c.name.en || "Category",
      })),
    [categoriesData?.data],
  );

  const { data: productsPayload } = useProductsQuery({
    page: 1,
    limit: 50,
    search: productSearch || undefined,
    enabled: filterOpen,
  });
  const productOptions = useMemo(
    () =>
      (productsPayload?.data ?? []).map((p) => ({
        value: p.id,
        label: productLabel(p.name, p.uniqueID),
      })),
    [productsPayload?.data],
  );

  const setFiltersUrl = useCallback(
    (patch: Partial<Parameters<typeof buildHistorySearchParamsFromFilters>[0]>) => {
      const { sortBy: sb, sortDesc: sd } = parseHistorySort(searchParams);
      const cur = {
        search: searchParams.get(HISTORY_URL.q) ?? "",
        sortBy: sb,
        sortDesc: sd,
        exposeSortFieldInUrl: searchParams.has(HISTORY_URL.sort),
        exposeSortDirInUrl: searchParams.has(HISTORY_URL.dir),
        historyStatusGroup: (searchParams.get(HISTORY_URL.hsg) ?? "") as PartnerOrderHistoryStatusGroup | "",
        datePreset: (searchParams.get(HISTORY_URL.preset) as PartnerOrderDatePreset) || ("" as PartnerOrderDatePreset),
        orderDateFrom: searchParams.get(HISTORY_URL.odf) ?? "",
        orderDateTo: searchParams.get(HISTORY_URL.odt) ?? "",
        productId: searchParams.get(HISTORY_URL.pid) ?? "",
        categoryIds: (searchParams.get(HISTORY_URL.cats)?.split(",") ?? []).map((s) => s.trim()).filter(Boolean),
        paymentMode: searchParams.get(HISTORY_URL.pm) ?? "",
        ...patch,
      };
      setSearchParams(buildHistorySearchParamsFromFilters(cur), { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const openFilterDialog = () => {
    setDraftPreset((searchParams.get(HISTORY_URL.preset) as PartnerOrderDatePreset) || "");
    setDraftFrom(searchParams.get(HISTORY_URL.odf) ?? "");
    setDraftTo(searchParams.get(HISTORY_URL.odt) ?? "");
    setDraftHsg(searchParams.get(HISTORY_URL.hsg) ?? "");
    setDraftProductId(searchParams.get(HISTORY_URL.pid) ?? "");
    const c = searchParams.get(HISTORY_URL.cats);
    setDraftCats(c ? c.split(",").map((s) => s.trim()).filter(Boolean) : []);
    setDraftPm(searchParams.get(HISTORY_URL.pm) ?? "");
    setFilterOpen(true);
  };

  const applyFilters = () => {
    if (draftPreset === "custom" && draftFrom && draftTo && !isValidYyyyMmDdRange(draftFrom, draftTo)) {
      toast.error("Please select a valid filter option.");
      return;
    }
    const { sortBy: sb, sortDesc: sd } = parseHistorySort(searchParams);
    setSearchParams(
      buildHistorySearchParamsFromFilters({
        search: searchParams.get(HISTORY_URL.q) ?? "",
        sortBy: sb,
        sortDesc: sd,
        exposeSortFieldInUrl: searchParams.has(HISTORY_URL.sort),
        exposeSortDirInUrl: searchParams.has(HISTORY_URL.dir),
        historyStatusGroup: (draftHsg as PartnerOrderHistoryStatusGroup | "") || "",
        datePreset: draftPreset,
        orderDateFrom: draftPreset === "custom" ? draftFrom : "",
        orderDateTo: draftPreset === "custom" ? draftTo : "",
        productId: draftProductId,
        categoryIds: draftCats,
        paymentMode: draftPm,
      }),
      { replace: true },
    );
    setFilterOpen(false);
  };

  const clearAllFilters = useCallback(() => {
    setSearchDraft("");
    setSearchParams(new URLSearchParams(), { replace: true });
    setDraftPreset("");
    setDraftFrom("");
    setDraftTo("");
    setDraftHsg("");
    setDraftProductId("");
    setDraftCats([]);
    setDraftPm("");
  }, [setSearchParams]);

  const hasActiveFilters = useMemo(() => {
    const q = searchParams.get(HISTORY_URL.q);
    const hsg = searchParams.get(HISTORY_URL.hsg);
    const preset = searchParams.get(HISTORY_URL.preset);
    const pm = searchParams.get(HISTORY_URL.pm);
    const pid = searchParams.get(HISTORY_URL.pid);
    const cats = searchParams.get(HISTORY_URL.cats);
    const sort = searchParams.get(HISTORY_URL.sort);
    const dir = searchParams.get(HISTORY_URL.dir);

    const isDefaultSort = (!sort || sort === "placedAt") && (!dir || dir === "desc");

    return Boolean(q) || Boolean(hsg) || Boolean(preset) || Boolean(pm) || Boolean(pid) || Boolean(cats) || !isDefaultSort;
  }, [searchParams]);

  const chips = useMemo(() => {
    const list: { id: string; label: string; onRemove: () => void }[] = [];
    const q = searchParams.get(HISTORY_URL.q);
    if (q)
      list.push({
        id: "q",
        label: `Search: ${q}`,
        onRemove: () => {
          const n = new URLSearchParams(searchParams);
          n.delete(HISTORY_URL.q);
          setSearchParams(n, { replace: true });
          setSearchDraft("");
        },
      });
    const hsg = searchParams.get(HISTORY_URL.hsg);
    if (hsg) {
      const label = PARTNER_ORDER_HISTORY_STATUS_GROUPS.find((o) => o.value === hsg)?.label ?? hsg;
      list.push({
        id: "hsg",
        label: `Status: ${label}`,
        onRemove: () => {
          const n = new URLSearchParams(searchParams);
          n.delete(HISTORY_URL.hsg);
          setSearchParams(n, { replace: true });
        },
      });
    }
    const preset = searchParams.get(HISTORY_URL.preset);
    if (preset) {
      const label = PARTNER_ORDER_HISTORY_DATE_PRESETS.find((o) => o.value === preset)?.label ?? preset;
      list.push({
        id: "preset",
        label: `Date: ${label}`,
        onRemove: () => {
          const n = new URLSearchParams(searchParams);
          n.delete(HISTORY_URL.preset);
          n.delete(HISTORY_URL.odf);
          n.delete(HISTORY_URL.odt);
          setSearchParams(n, { replace: true });
        },
      });
    }
    const pm = searchParams.get(HISTORY_URL.pm);
    if (pm) {
      list.push({
        id: "pm",
        label: `Payment: ${pm === "ONLINE_PAYMENT" ? "Online" : "Cash"}`,
        onRemove: () => {
          const n = new URLSearchParams(searchParams);
          n.delete(HISTORY_URL.pm);
          setSearchParams(n, { replace: true });
        },
      });
    }
    const pid = searchParams.get(HISTORY_URL.pid);
    if (pid) {
      const name = productOptions.find((o) => o.value === pid)?.label ?? pid;
      list.push({
        id: "pid",
        label: `Product: ${name}`,
        onRemove: () => {
          const n = new URLSearchParams(searchParams);
          n.delete(HISTORY_URL.pid);
          setSearchParams(n, { replace: true });
        },
      });
    }
    const cats = searchParams.get(HISTORY_URL.cats);
    if (cats) {
      list.push({
        id: "cats",
        label: `Categories (${cats.split(",").length})`,
        onRemove: () => {
          const n = new URLSearchParams(searchParams);
          n.delete(HISTORY_URL.cats);
          setSearchParams(n, { replace: true });
        },
      });
    }
    return list;
  }, [searchParams, setSearchParams, productOptions]);

  const onBeforeNavigateDetail = useCallback(() => {
    persistScroll();
    sessionStorage.setItem(RETURN_QUERY_SESSION_KEY, window.location.search ? `?${searchParams.toString()}` : "");
  }, [persistScroll, searchParams]);

  const columns = useMemo<ColumnDef<AdminOrderListItem>[]>(
    () => [
      {
        id: "serial",
        header: ({ column }) => <DataGridColumnHeader title="Sr." column={column} />,
        cell: ({ row }) => row.index + 1,
        size: 48,
      },
      {
        id: "orderNumber",
        accessorFn: (row) => row.orderNumber,
        header: ({ column }) => <DataGridColumnHeader title="Order ID" column={column} />,
        enableSorting: true,
        cell: ({ row }) => (
          <Button variant="ghost" className="h-auto p-0 text-[13px] text-primary underline" asChild>
            <Link to={`/partner/orders/${row.original.id}`} onClick={onBeforeNavigateDetail}>
              {row.original.orderNumber}
            </Link>
          </Button>
        ),
        size: 110,
      },
      {
        id: "placedAt",
        accessorFn: (row) => row.placedAt,
        header: ({ column }) => <DataGridColumnHeader title="Order date" column={column} />,
        enableSorting: true,
        cell: ({ row }) => formatPlaced(row.original.placedAt),
        size: 150,
      },
      {
        id: "farmer",
        header: ({ column }) => <DataGridColumnHeader title="Farmer name" column={column} />,
        cell: ({ row }) => (
          <TruncatedCell value={row.original.farmer.name} maxWidth="max-w-[130px]" className="text-[13px]" />
        ),
        size: 130,
      },
      {
        id: "products",
        header: ({ column }) => <DataGridColumnHeader title="Product names" column={column} />,
        cell: ({ row }) => (
          <TruncatedCell
            value={row.original.productNamesSummary || "—"}
            maxWidth="max-w-[200px]"
            className="text-[13px]"
          />
        ),
        size: 200,
      },
      {
        id: "categories",
        header: ({ column }) => <DataGridColumnHeader title="Product categories" column={column} />,
        enableSorting: true,
        cell: ({ row }) => (
          <TruncatedCell
            value={row.original.productCategoriesSummary || "—"}
            maxWidth="max-w-[160px]"
            className="text-[13px]"
          />
        ),
        size: 160,
      },
      {
        id: "total",
        accessorFn: (row) => row.totalAmount,
        header: ({ column }) => <DataGridColumnHeader title="Total amount" column={column} />,
        cell: ({ row }) => (
          <span className="tabular-nums text-[13px]">₹{formatOrderListRupeeAmount(row.original.totalAmount)}</span>
        ),
        size: 110,
      },
      {
        id: "paymentMode",
        header: ({ column }) => <DataGridColumnHeader title="Payment mode" column={column} />,
        cell: ({ row }) => <PaymentModeBadge mode={row.original.paymentMode} />,
        size: 120,
      },
      {
        id: "orderStatus",
        header: ({ column }) => <DataGridColumnHeader title="Final status" column={column} />,
        cell: ({ row }) => <OrderStatusBadge status={row.original.orderStatus} />,
        size: 150,
      },
      {
        id: "deliveryDate",
        header: ({ column }) => <DataGridColumnHeader title="Delivery date" column={column} />,
        cell: ({ row }) => <span className="text-[13px]">{formatDelivery(row.original)}</span>,
        size: 130,
      },
      {
        id: "actions",
        header: ({ column }) => <DataGridColumnHeader title="Action" column={column} />,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" mode="icon" className="h-8 w-8" aria-label="Row actions">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem asChild className="text-[13px]">
                <Link
                  to={`/partner/orders/${row.original.id}`}
                  className="flex cursor-pointer items-center gap-2"
                  onClick={onBeforeNavigateDetail}
                >
                  <Eye className="h-3.5 w-3.5" />
                  View order details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-[13px]"
                onSelect={() => toast.message("Invoice download is not available yet.")}
              >
                <Download className="mr-2 inline h-3.5 w-3.5" />
                Download invoice
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="text-[13px]">
                <Link
                  to={`/partner/orders/${row.original.id}#partner-order-timeline`}
                  className="flex cursor-pointer items-center gap-2"
                  onClick={onBeforeNavigateDetail}
                >
                  <History className="h-3.5 w-3.5" />
                  View tracking timeline
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
        size: 72,
      },
    ],
    [onBeforeNavigateDetail],
  );

  const table = useReactTable({
    columns,
    data: rows,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { sorting },
    onSortingChange: (updater) => {
      const next = typeof updater === "function" ? updater(sorting) : updater;
      const s0 = next[0];
      if (!s0) return;
      const sb = (s0.id === "productCategory" ? "productCategory" : "placedAt") as OrderSortBy;
      setFiltersUrl({
        sortBy: sb,
        sortDesc: Boolean(s0.desc),
        exposeSortFieldInUrl: true,
        exposeSortDirInUrl: true,
      });
    },
    manualSorting: true,
    columnResizeMode: "onChange",
  });

  const showEmptyState = !isLoading && rows.length === 0 && !isError;
  const tableBusy = isLoading || (isFetching && rows.length === 0);

  return (
    <Container className="pb-8">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Order history</h1>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <SearchInput
              value={searchDraft}
              onChange={setSearchDraft}
              tooltip="Search by order ID, farmer name, or product name"
              className="w-full sm:max-w-[280px]"
              inputClassName="h-9 text-[13px]"
            />
            <SearchableSelect
              options={PARTNER_ORDER_HISTORY_SORT_OPTIONS}
              value={
                searchParams.has(HISTORY_URL.sort)
                  ? apiSortBy === "productCategory"
                    ? "productCategory"
                    : "placedAt"
                  : ""
              }
              onValueChange={(v) => {
                if (v === "") {
                  setFiltersUrl({ exposeSortFieldInUrl: false });
                  return;
                }
                setFiltersUrl({ sortBy: v as OrderSortBy, exposeSortFieldInUrl: true });
              }}
              placeholder="Sort by"
              searchPlaceholder="Search…"
              triggerClassName="h-9 min-w-[160px] bg-background text-[13px]"
            />
            <SearchableSelect
              options={PARTNER_ORDER_HISTORY_SORT_DIR}
              value={searchParams.has(HISTORY_URL.dir) ? (sortDesc ? "desc" : "asc") : ""}
              onValueChange={(v) => {
                if (v === "") {
                  setFiltersUrl({ exposeSortDirInUrl: false });
                  return;
                }
                setFiltersUrl({ sortDesc: v === "desc", exposeSortDirInUrl: true });
              }}
              placeholder="Sort order"
              searchPlaceholder="Search…"
              triggerClassName="h-9 min-w-[140px] bg-background text-[13px]"
            />
            <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
              <DialogTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 gap-1 border-primary/30 text-[13px] font-semibold text-primary"
                  onClick={openFilterDialog}
                >
                  <Filter className="h-4 w-4" />
                  Filters
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Advanced filters</DialogTitle>
                </DialogHeader>
                <div className="grid gap-3 py-2">
                  <SearchableSelect
                    options={PARTNER_ORDER_HISTORY_STATUS_GROUPS}
                    value={draftHsg}
                    onValueChange={setDraftHsg}
                    placeholder="Order status"
                    searchPlaceholder="Search…"
                    triggerClassName="h-9 bg-background text-[13px]"
                  />
                  <SearchableSelect
                    options={PARTNER_ORDER_HISTORY_DATE_PRESETS}
                    value={draftPreset}
                    onValueChange={(v) => setDraftPreset(v as PartnerOrderDatePreset)}
                    placeholder="Order date"
                    searchPlaceholder="Search…"
                    triggerClassName="h-9 bg-background text-[13px]"
                  />
                  {draftPreset === "custom" ? (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">From</p>
                        <Input type="date" value={draftFrom} onChange={(e) => setDraftFrom(e.target.value)} className="h-9" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">To</p>
                        <Input type="date" value={draftTo} onChange={(e) => setDraftTo(e.target.value)} className="h-9" />
                      </div>
                    </div>
                  ) : null}
                  <SearchableSelect
                    options={PAYMENT_MODE_FILTER_OPTIONS.filter((o) => o.value)}
                    value={draftPm}
                    onValueChange={setDraftPm}
                    placeholder="Payment mode"
                    searchPlaceholder="Search…"
                    triggerClassName="h-9 bg-background text-[13px]"
                  />
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Product</p>
                    <SearchInput
                      value={productSearch}
                      onChange={setProductSearch}
                      tooltip="Search products"
                      className="w-full"
                      inputClassName="h-9 text-[13px]"
                    />
                    <SearchableSelect
                      options={[{ value: "", label: "Any product" }, ...productOptions]}
                      value={draftProductId}
                      onValueChange={setDraftProductId}
                      placeholder="Select product"
                      searchPlaceholder="Search…"
                      triggerClassName="h-9 bg-background text-[13px]"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Product categories</p>
                    <MultiSelectPopover
                      options={categoryOptions}
                      value={draftCats}
                      toggleSelection={(val) =>
                        setDraftCats((prev) => (prev.includes(val) ? prev.filter((x) => x !== val) : [...prev, val]))
                      }
                      removeSelection={(val) => setDraftCats((prev) => prev.filter((x) => x !== val))}
                      placeholder="Select categories"
                      searchPlaceholder="Search categories…"
                    />
                  </div>
                </div>
                <DialogFooter className="gap-2 sm:justify-end">
                  <Button type="button" variant="outline" onClick={() => setFilterOpen(false)}>
                    <CancelButtonContent />
                  </Button>
                  <Button type="button" onClick={applyFilters}>
                    Apply
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button
              type="button"
              variant="outline"
              onClick={clearAllFilters}
              disabled={!hasActiveFilters}
              className="h-9 gap-1 border-primary/30 text-[13px] font-semibold text-primary hover:bg-primary/5 disabled:pointer-events-none disabled:opacity-50"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          </div>
        </div>

        {chips.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            {chips.map((c) => (
              <Badge key={c.id} variant="secondary" appearance="light" className="gap-1 pr-1 font-normal">
                {c.label}
                <button
                  type="button"
                  className="rounded-sm p-0.5 hover:bg-muted"
                  aria-label={`Remove ${c.label}`}
                  onClick={c.onRemove}
                >
                  <span className="sr-only">Remove</span>×
                </button>
              </Badge>
            ))}
          </div>
        ) : null}

        {isError ? (
          <Alert variant="destructive" appearance="light">
            <AlertTitle>Could not load history</AlertTitle>
            <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <span>
                {error instanceof ApiError && error.isNetworkError
                  ? "Network error occurred. Please retry."
                  : ApiError.getErrorMessage(error, "Failed to load order history. Please try again.")}
              </span>
              <Button type="button" size="sm" variant="outline" onClick={() => refetch()}>
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}

        <Card variant="listing" className="relative overflow-hidden">
          {isFetching && rows.length > 0 ? (
            <div className="pointer-events-none absolute inset-0 z-[1] flex items-start justify-end p-2">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden />
            </div>
          ) : null}
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="h-4 w-4 text-primary" />
              All orders
            </CardTitle>
          </CardHeader>
          <CardTable className={isFetching && rows.length > 0 ? "opacity-60 transition-opacity" : ""}>
            {showEmptyState ? (
              <div className="flex flex-col items-center justify-center gap-4 px-4 py-16 text-center">
                <div className="rounded-full border border-dashed border-muted-foreground/40 p-6">
                  <Search className="h-10 w-10 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">No orders match your current filters.</p>
                  <p className="mt-1 text-xs text-muted-foreground">Try widening your search or clearing filters.</p>
                </div>
                <Button type="button" onClick={clearAllFilters}>
                  Clear filters
                </Button>
              </div>
            ) : (
              <>
                <div className="hidden md:block">
                  <DataGrid
                    table={table}
                    recordCount={rows.length}
                    isLoading={tableBusy}
                    loadingMode="skeleton"
                    emptyMessage="No orders match your current filters."
                    tableLayout={{
                      dense: true,
                      headerSticky: true,
                      columnsPinnable: true,
                      columnsVisibility: true,
                      cellBorder: true,
                      width: "auto",
                      columnsResizable: true,
                    }}
                    tableClassNames={{
                      headerRow: "[&_th]:text-xs",
                      bodyRow: "[&_td]:text-[13px]",
                    }}
                  >
                    <InfiniteScrollContainer
                      className="max-h-[76vh]"
                      scrollRootRef={scrollRootRef}
                      isLoading={tableBusy}
                      isFetchingNextPage={isFetchingNextPage}
                      hasNextPage={hasNextPage}
                      onLoadMore={() => fetchNextPage()}
                      onScroll={persistScroll}
                      threshold={0.5}
                      overflowX="auto"
                      overflowY="auto"
                    >
                      <DataGridTable />
                    </InfiniteScrollContainer>
                  </DataGrid>
                </div>

                <div className="md:hidden">
                  <div
                    className="max-h-[70vh] space-y-3 overflow-y-auto px-3 pb-4 pt-1"
                    onScroll={persistScroll}
                  >
                    {tableBusy ? (
                      <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      rows.map((row) => (
                        <Card key={row.id} className="border bg-card p-3 shadow-sm">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <Button variant="ghost" className="h-auto p-0 text-[15px] font-semibold text-primary underline" asChild>
                                <Link to={`/partner/orders/${row.id}`} onClick={onBeforeNavigateDetail}>
                                  {row.orderNumber}
                                </Link>
                              </Button>
                              <p className="text-xs text-muted-foreground">{formatPlaced(row.placedAt)}</p>
                            </div>
                            <OrderStatusBadge status={row.orderStatus} />
                          </div>
                          <p className="mt-2 text-sm font-medium">{row.farmer.name}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {row.productNamesSummary || "—"}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                            <PaymentModeBadge mode={row.paymentMode} />
                            <span className="tabular-nums font-medium">₹{formatOrderListRupeeAmount(row.totalAmount)}</span>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Delivery: {formatDelivery(row)} · {getOrderStatusLabel(row.orderStatus)}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Button size="sm" variant="outline" className="h-8 text-[12px]" asChild>
                              <Link to={`/partner/orders/${row.id}`} onClick={onBeforeNavigateDetail}>
                                View
                              </Link>
                            </Button>
                            <Button size="sm" variant="outline" className="h-8 text-[12px]" asChild>
                              <Link to={`/partner/orders/${row.id}#partner-order-timeline`} onClick={onBeforeNavigateDetail}>
                                Timeline
                              </Link>
                            </Button>
                          </div>
                        </Card>
                      ))
                    )}
                    {hasNextPage && !tableBusy ? (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => fetchNextPage()}
                        disabled={isFetchingNextPage}
                      >
                        {isFetchingNextPage ? "Loading…" : "Load more"}
                      </Button>
                    ) : null}
                  </div>
                </div>
              </>
            )}
          </CardTable>
        </Card>
      </div>
    </Container>
  );
}
