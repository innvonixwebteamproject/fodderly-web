import {
  ColumnDef,
  getCoreRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { ClipboardList, Info, RotateCcw, Truck, Calendar } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Container } from "@/components/common/container";
import { RowActionsMenu } from "@/components/common/row-actions-menu";
import { InfiniteScrollContainer } from "@/components/common/infinite-scroll-container";
import { SearchInput } from "@/components/common/search-input";
import { TruncatedCell } from "@/components/common/truncated-cell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTable, CardTitle } from "@/components/ui/card";
import { DataGrid } from "@/components/ui/data-grid";
import { DataGridColumnHeader } from "@/components/ui/data-grid-column-header";
import { DataGridTable } from "@/components/ui/data-grid-table";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getApiSortParams } from "@/lib/api-sorting";
import type {
  AdminOrderListApiStatus,
  AdminOrderListItem,
  OrderSortBy,
  PartnerDailyOrderListFilters,
} from "../types/order.types";
import { usePartnerOrdersInfiniteQuery } from "../hooks/usePartnerOrdersQuery";
import {
  PARTNER_DAILY_ORDER_STATUS_FILTER_OPTIONS,
} from "../constants/order.constants";
import { OrderStatusBadge } from "../components/OrderStatusBadge";
import { PaymentModeBadge } from "../components/PaymentModeBadge";
import { PartnerDispatchModal } from "../components/PartnerDispatchModal";
import { PartnerEtaRevisionModal } from "../components/PartnerEtaRevisionModal";
import {
  isPartnerListVisibleStatus,
  partnerCanDispatch,
  partnerCanReviseEta,
  partnerCanScheduleDelivery,
  partnerOrderNeedsDispatchHighlight,
} from "../utils/partner-order-rules";
import { RETURN_QUERY_SESSION_KEY } from "../utils/partner-order-history-url";
import { DateRangeFilterPopover } from "../components/DateRangeFilterPopover";
import type { DateFilterPresetKey } from "../utils/date-filter-presets";
import { resolvePresetDates } from "../utils/date-filter-presets";
import { formatOrderListRupeeAmount } from "../utils/format-order-list-rupee";

const formatPlacedAt = (value: string) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return format(d, "dd/MM/yy hh:mm a");
};

const formatExpected = (value: string | null | undefined) => {
  if (!value) return "—";
  const d = new Date(value);
  if (!Number.isNaN(d.getTime())) return format(d, "dd/MM/yy");
  if (value.length >= 10) return format(new Date(`${value.slice(0, 10)}T12:00:00`), "dd/MM/yy");
  return value;
};
export function PartnerOrderListPage() {
  const [statusFilter, setStatusFilter] = useState<AdminOrderListApiStatus | "">("");
  const [dispatchTarget, setDispatchTarget] = useState<AdminOrderListItem | null>(null);
  const [dispatchOpen, setDispatchOpen] = useState(false);
  const [dispatchMode, setDispatchMode] = useState<"schedule" | "dispatch">("dispatch");
  const [etaTarget, setEtaTarget] = useState<AdminOrderListItem | null>(null);
  const [etaOpen, setEtaOpen] = useState(false);

  // ── Advanced date range filter state (applied / committed values) ──
  const [datePresetKey, setDatePresetKey] = useState<DateFilterPresetKey>("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  useEffect(() => {
    sessionStorage.removeItem(RETURN_QUERY_SESSION_KEY);
  }, []);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);

  const { sortBy: rawSortBy, sortOrder } = getApiSortParams<OrderSortBy>({
    sorting,
    defaultSortBy: "orderDate",
    columnToSortByMap: {
      placedAt: "orderDate",
      farmer: "farmerName",
      totalAmount: "total",
    },
  });

  const sortBy = useMemo(() => {
    if (rawSortBy === "orderDate" || rawSortBy === "total" || rawSortBy === "farmerName") {
      return rawSortBy;
    }
    return undefined;
  }, [rawSortBy]);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(searchTerm.trim()), 400);
    return () => window.clearTimeout(t);
  }, [searchTerm]);

  const listFilters: PartnerDailyOrderListFilters = useMemo(
    () => ({
      status: statusFilter || undefined,
      search: debouncedSearch || undefined,
      // Always send "custom" so the backend range-filters by fromDate/toDate.
      // The datePresetKey is kept in local state only for UI label/highlight.
      dateFilter: datePresetKey && fromDate && toDate ? "custom" : undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
    }),
    [statusFilter, debouncedSearch, datePresetKey, fromDate, toDate],
  );

  const {
    data: ordersData,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = usePartnerOrdersInfiniteQuery(listFilters, sortBy, sortOrder, 10);

  const rawRows = useMemo(() => ordersData?.pages.flatMap((pageData) => pageData.data) ?? [], [ordersData]);

  const rows = useMemo(() => {
    let list = rawRows.filter((r) => isPartnerListVisibleStatus(r.orderStatus));

    const activeSort = sorting[0];
    if (activeSort) {
      const { id, desc } = activeSort;
      if (id === "orderNumber" || id === "orderStatus") {
        list = [...list].sort((a, b) => {
          let valA = "";
          let valB = "";
          if (id === "orderNumber") {
            valA = a.orderNumber || "";
            valB = b.orderNumber || "";
          } else if (id === "orderStatus") {
            valA = a.orderStatus || "";
            valB = b.orderStatus || "";
          }
          return desc ? valB.localeCompare(valA) : valA.localeCompare(valB);
        });
      }
    }
    return list;
  }, [rawRows, sorting]);

  const handleReset = useCallback(() => {
    setStatusFilter("");
    setSearchTerm("");
    setDatePresetKey("");
    setFromDate("");
    setToDate("");
    setSorting([]);
  }, []);

  /** Called by DateRangeFilterPopover when user clicks "Apply Filter". */
  const handleDateFilterApply = useCallback(
    (values: { presetKey: DateFilterPresetKey; fromDate: string; toDate: string }) => {
      const resolved = resolvePresetDates(values.presetKey, values.fromDate, values.toDate);
      if (!resolved) return;
      setDatePresetKey(values.presetKey);
      setFromDate(resolved.fromDate);
      setToDate(resolved.toDate);
    },
    [],
  );

  /** Called by DateRangeFilterPopover when user clicks "Clear filter". */
  const handleDateFilterClear = useCallback(() => {
    setDatePresetKey("");
    setFromDate("");
    setToDate("");
  }, []);

  const handleScheduleDelivery = useCallback((order: AdminOrderListItem) => {
    if (partnerCanDispatch(order.orderStatus, order.orderStatusApiRaw)) {
      setDispatchTarget(order);
      setDispatchMode("schedule");
      setDispatchOpen(true);
      return;
    }
    if (partnerCanReviseEta(order.orderStatus)) {
      setEtaTarget(order);
      setEtaOpen(true);
    }
  }, []);

  const handleDispatchModalOpenChange = useCallback((open: boolean) => {
    setDispatchOpen(open);
    if (!open) setDispatchTarget(null);
  }, []);

  const handleEtaModalOpenChange = useCallback((open: boolean) => {
    setEtaOpen(open);
    if (!open) setEtaTarget(null);
  }, []);

  const handleQuickDispatch = useCallback((order: AdminOrderListItem) => {
    setDispatchTarget(order);
    setDispatchMode("dispatch");
    setDispatchOpen(true);
  }, []);

  const sortIsDefault =
    sorting.length === 0 ||
    (sorting.length === 1 && sorting[0]?.id === "placedAt" && sorting[0]?.desc === true);

  const canReset =
    Boolean(statusFilter) ||
    Boolean(searchTerm) ||
    Boolean(datePresetKey) ||
    !sortIsDefault;


  const columns = useMemo<ColumnDef<AdminOrderListItem>[]>(
    () => [
      {
        id: "serial",
        header: ({ column }) => <DataGridColumnHeader title="Sr." column={column} />,
        cell: ({ row }) => row.index + 1,
        size: 52,
      },
      {
        id: "orderNumber",
        accessorFn: (row) => row.orderNumber,
        header: ({ column }) => <DataGridColumnHeader title="Order ID" column={column} />,
        enableSorting: true,
        cell: ({ row }) => (
          <Button variant="ghost" className="h-auto p-0 text-[13px] text-primary underline" asChild>
            <Link to={`/partner/orders/${row.original.id}`}>{row.original.orderNumber}</Link>
          </Button>
        ),
        size: 120,
      },
      {
        id: "placedAt",
        accessorFn: (row) => row.placedAt,
        header: ({ column }) => <DataGridColumnHeader title="Order date" column={column} />,
        enableSorting: true,
        cell: ({ row }) => formatPlacedAt(row.original.placedAt),
        size: 150,
      },
      {
        id: "farmer",
        accessorFn: (row) => row.farmer.name,
        header: ({ column }) => <DataGridColumnHeader title="Farmer Name & Village" column={column} />,
        enableSorting: true,
        cell: ({ row }) => (
          <div className="flex flex-col">
            <TruncatedCell value={row.original.farmer.name} className="font-medium" maxWidth="max-w-[140px]" />
            <span className="text-[11px] text-muted-foreground">{row.original.farmer.villageName || "—"}</span>
          </div>
        ),
        size: 160,
      },
      {
        id: "fodderman",
        header: ({ column }) => <DataGridColumnHeader title="Fodderman" column={column} />,
        cell: ({ row }) => (
          <TruncatedCell value={row.original.fodderman?.name || "—"} maxWidth="max-w-[130px]" />
        ),
        size: 130,
      },
      {
        id: "partner",
        header: ({ column }) => <DataGridColumnHeader title="Partner" column={column} />,
        cell: ({ row }) => (
          <TruncatedCell value={row.original.partner?.name || "—"} maxWidth="max-w-[130px]" />
        ),
        size: 130,
      },
      {
        id: "productName",
        header: ({ column }) => <DataGridColumnHeader title="Product name" column={column} />,
        cell: ({ row }) => (
          <TruncatedCell value={row.original.productNamesSummary || "—"} maxWidth="max-w-[160px]" />
        ),
        size: 160,
      },
      {
        id: "totalAmount",
        accessorFn: (row) => row.totalAmount,
        header: ({ column }) => <DataGridColumnHeader title="Total amount" column={column} />,
        enableSorting: true,
        cell: ({ row }) => (
          <span className="tabular-nums">₹{formatOrderListRupeeAmount(row.original.totalAmount)}</span>
        ),
        size: 110,
      },
      {
        id: "paymentMode",
        header: ({ column }) => <DataGridColumnHeader title="Payment mode" column={column} />,
        cell: ({ row }) => (
          <PaymentModeBadge mode={row.original.paymentMode} labelFromApi={row.original.paymentModeApiRaw} />
        ),
        size: 120,
      },
      {
        id: "orderStatus",
        accessorFn: (row) => row.orderStatus,
        header: ({ column }) => <DataGridColumnHeader title="Current status" column={column} />,
        enableSorting: true,
        cell: ({ row }) => {
          const pending = partnerOrderNeedsDispatchHighlight(row.original.orderStatus, row.original.orderStatusApiRaw);
          return (
            <div className="flex flex-wrap items-center gap-1.5">
              <OrderStatusBadge status={row.original.orderStatus} labelFromApi={row.original.orderStatusApiRaw} />
              {pending ? (
                <Badge variant="warning" appearance="light" size="sm" className="gap-0.5 font-normal">
                  <Truck className="h-3 w-3" />
                  Ready to dispatch
                </Badge>
              ) : null}
            </div>
          );
        },
        size: 180,
      },
      {
        id: "expectedDelivery",
        header: ({ column }) => <DataGridColumnHeader title="Expected delivery" column={column} />,
        cell: ({ row }) => (
          <span className="text-[13px]">{formatExpected(row.original.expectedDeliveryDate)}</span>
        ),
        size: 130,
      },
      {
        id: "delay",
        header: ({ column }) => <DataGridColumnHeader title="Delay status" column={column} />,
        cell: ({ row }) => {
          const delayed = row.original.orderStatus === "DELAYED" || Boolean(row.original.isDelayed);
          return delayed ? (
            <Badge variant="warning" appearance="light" size="sm" shape="circle">
              Delay
            </Badge>
          ) : (
            <span className="text-muted-foreground pl-4">—</span>
          );
        },
        size: 100,
      },
      {
        id: "actions",
        header: ({ column }) => <DataGridColumnHeader title="Actions" column={column} />,
        cell: ({ row }) => {
          const order = row.original;
          const canSchedule = partnerCanScheduleDelivery(order);
          return (
            <RowActionsMenu
              items={[
                {
                  label: "View details",
                  actionType: "view",
                  asChild: true,
                  children: <Link to={`/partner/orders/${order.id}`} />,
                },
                {
                  label: "Reschedule Delivery",
                  actionType: "edit",
                  icon: Calendar,
                  hidden: !canSchedule,
                  onSelect: () => handleScheduleDelivery(order),
                },
                {
                  label: "Mark as Dispatched",
                  actionType: "edit",
                  icon: Truck,
                  hidden: !partnerCanDispatch(order.orderStatus, order.orderStatusApiRaw),
                  onSelect: () => handleQuickDispatch(order),
                },
              ]}
            />
          );
        },
        size: 72,
      },
    ],
    [
      handleScheduleDelivery,
      handleQuickDispatch,
    ],
  );

  const table = useReactTable({
    columns,
    data: rows,
    getCoreRowModel: getCoreRowModel(),
    state: { sorting },
    onSortingChange: setSorting,
    manualSorting: true,
    columnResizeMode: "onChange",
  });

  const getPartnerRowClassName = useCallback(
    (row: AdminOrderListItem) =>
      partnerOrderNeedsDispatchHighlight(row.orderStatus, row.orderStatusApiRaw) ? "bg-amber-50/90 dark:bg-amber-950/30" : "",
    [],
  );

  return (
    <Container className="pb-8">
      <div className="flex h-full min-h-0 flex-col gap-6">
        <Card variant="listing" className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <CardHeader className="flex shrink-0 flex-row flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
              <CardTitle className="text-xl flex items-center gap-2 whitespace-nowrap shrink-0">
                <ClipboardList className="h-5 w-5 text-primary" />
                Daily Orders
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex cursor-help text-primary/80">
                      <Info className="h-4 w-4" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs text-left text-xs">
                    <p>Fodderman-approved orders only.</p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <SearchInput
                  value={searchTerm}
                  onChange={setSearchTerm}
                  tooltip="Search by order ID or farmer name"
                  className="w-[240px] max-w-full"
                  inputClassName="h-9 text-[13px]"
                />
                <SearchableSelect
                  options={PARTNER_DAILY_ORDER_STATUS_FILTER_OPTIONS}
                  value={statusFilter}
                  onValueChange={(v) => setStatusFilter((v || "") as "" | AdminOrderListApiStatus)}
                  placeholder="Current status"
                  searchPlaceholder="Search…"
                  triggerClassName="h-9 w-[180px] max-w-full bg-background text-[13px]"
                />
                <DateRangeFilterPopover
                  presetKey={datePresetKey}
                  fromDate={fromDate}
                  toDate={toDate}
                  onApply={handleDateFilterApply}
                  onClear={handleDateFilterClear}
                />
              </div>
            </div>
            <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={!canReset}
                title={!canReset ? "Change status filter to enable reset" : undefined}
                className="h-8.5 gap-1 px-2.5 text-[13px] font-semibold border-primary/30 text-primary hover:bg-primary/5 disabled:pointer-events-none disabled:opacity-50"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
            </div>
          </CardHeader>



          <CardTable className="min-h-0 flex-1 overflow-hidden">
            <DataGrid
              table={table}
              recordCount={rows.length}
              isLoading={isLoading}
              emptyMessage="No orders assigned to you yet."
              getRowClassName={getPartnerRowClassName}
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
                isLoading={isLoading}
                isFetchingNextPage={isFetchingNextPage}
                hasNextPage={hasNextPage}
                onLoadMore={() => fetchNextPage()}
                threshold={0.5}
                overflowX="auto"
                overflowY="auto"
              >
                <DataGridTable />
              </InfiniteScrollContainer>
            </DataGrid>
          </CardTable>
        </Card>
      </div>

      <PartnerDispatchModal order={dispatchTarget} open={dispatchOpen} onOpenChange={handleDispatchModalOpenChange} mode={dispatchMode} />
      <PartnerEtaRevisionModal order={etaTarget} open={etaOpen} onOpenChange={handleEtaModalOpenChange} />

    </Container>
  );
}

export default PartnerOrderListPage;
