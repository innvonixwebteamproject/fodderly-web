import {
  ColumnDef,
  getCoreRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { Calendar, ClipboardList, Info, RotateCcw, Truck } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Container } from "@/components/common/container";
import { ActionButton } from "@/components/common/action-button";
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
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverPortal,
} from "@/components/ui/popover";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatOrderListRupeeAmount } from "../utils/format-order-list-rupee";
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

const formatPlacedAt = (value: string) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return format(d, "dd MMM yyyy, HH:mm");
};

const formatExpected = (value: string | null | undefined) => {
  if (!value) return "—";
  const d = new Date(value);
  if (!Number.isNaN(d.getTime())) return format(d, "dd MMM yyyy");
  if (value.length >= 10) return format(new Date(`${value.slice(0, 10)}T12:00:00`), "dd MMM yyyy");
  return value;
};

const parseYyyyMmDd = (str?: string) => {
  if (!str) return undefined;
  const [y, m, d] = str.split("-").map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
};

export function PartnerOrderListPage() {
  const [statusFilter, setStatusFilter] = useState<AdminOrderListApiStatus | "">("");
  const [dispatchTarget, setDispatchTarget] = useState<AdminOrderListItem | null>(null);
  const [dispatchOpen, setDispatchOpen] = useState(false);
  const [dispatchMode, setDispatchMode] = useState<"schedule" | "dispatch">("dispatch");
  const [etaTarget, setEtaTarget] = useState<AdminOrderListItem | null>(null);
  const [etaOpen, setEtaOpen] = useState(false);

  // Date range filter state
  const [dateFilter, setDateFilter] = useState<"last_7_days" | "custom" | "">("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  // Popover open state
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);

  // Draft states to keep edits local until "Apply" is clicked
  const [draftDateFilter, setDraftDateFilter] = useState<"last_7_days" | "custom" | "">("");
  const [draftFromDate, setDraftFromDate] = useState<string>("");
  const [draftToDate, setDraftToDate] = useState<string>("");

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
      dateFilter: dateFilter || undefined,
      fromDate: dateFilter === "custom" && fromDate ? fromDate : undefined,
      toDate: dateFilter === "custom" && toDate ? toDate : undefined,
    }),
    [statusFilter, debouncedSearch, dateFilter, fromDate, toDate],
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
    setDateFilter("");
    setFromDate("");
    setToDate("");
    setSorting([]);
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

  const handleOpenDatePopover = useCallback(() => {
    setDraftDateFilter(dateFilter);
    setDraftFromDate(fromDate);
    setDraftToDate(toDate);
    setIsDatePopoverOpen(true);
  }, [dateFilter, fromDate, toDate]);

  const handleApplyDateFilter = useCallback(() => {
    if (draftDateFilter === "custom") {
      if (!draftFromDate || !draftToDate) {
        toast.error("Please select both start and end dates.");
        return;
      }
      if (new Date(draftFromDate) > new Date(draftToDate)) {
        toast.error("Start date cannot be after end date.");
        return;
      }
    }
    setDateFilter(draftDateFilter);
    setFromDate(draftDateFilter === "custom" ? draftFromDate : "");
    setToDate(draftDateFilter === "custom" ? draftToDate : "");
    setIsDatePopoverOpen(false);
  }, [draftDateFilter, draftFromDate, draftToDate]);

  const sortIsDefault =
    sorting.length === 0 ||
    (sorting.length === 1 && sorting[0]?.id === "placedAt" && sorting[0]?.desc === true);

  const canReset =
    Boolean(statusFilter) ||
    Boolean(searchTerm) ||
    Boolean(dateFilter) ||
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
              <OrderStatusBadge status={row.original.orderStatus} />
              {pending ? (
                <Badge variant="warning" appearance="light" size="sm" className="gap-0.5 font-normal">
                  <Truck className="h-3 w-3" />
                  Dispatch
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
            <div className="flex items-center gap-1">
              <ActionButton actionType="view" tooltip="View details" asChild>
                <Link to={`/partner/orders/${order.id}`} />
              </ActionButton>
              {canSchedule ? (
                <ActionButton
                  actionType="edit"
                  icon={Calendar}
                  tooltip="Reschedule Delivery"
                  onClick={() => handleScheduleDelivery(order)}
                />
              ) : null}
              {partnerCanDispatch(order.orderStatus, order.orderStatusApiRaw) ? (
                <ActionButton
                  actionType="edit"
                  icon={Truck}
                  tooltip="Mark as Dispatched"
                  className="hover:-translate-y-0.5"
                  onClick={() => handleQuickDispatch(order)}
                />
              ) : null}
            </div>
          );
        },
        size: 120,
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
                <Popover open={isDatePopoverOpen} onOpenChange={(open) => {
                  if (open) {
                    handleOpenDatePopover();
                  } else {
                    setIsDatePopoverOpen(false);
                  }
                }}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-9 gap-2 bg-background px-3 text-[13px] font-normal border-input hover:bg-accent/50"
                    >
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className={cn(
                        "truncate",
                        dateFilter ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {dateFilter === "last_7_days"
                          ? "Last 7 Days"
                          : dateFilter === "custom" && fromDate && toDate
                          ? (() => {
                              try {
                                const fromD = new Date(fromDate);
                                const toD = new Date(toDate);
                                if (Number.isNaN(fromD.getTime()) || Number.isNaN(toD.getTime())) return "Custom Range";
                                return `${format(fromD, "dd MMM")} - ${format(toD, "dd MMM yyyy")}`;
                              } catch {
                                return "Custom Range";
                              }
                            })()
                          : "Select Date"}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverPortal>
                    <PopoverContent className="w-[300px] p-4 flex flex-col gap-4 bg-popover border border-border shadow-lg rounded-md" align="start">
                      <div className="space-y-1">
                        <h4 className="font-semibold text-sm leading-none">Date Filter</h4>
                        <p className="text-xs text-muted-foreground">Select a range to filter orders.</p>
                      </div>

                      {/* Preset Pills */}
                      <div className="flex gap-2 p-1 bg-muted rounded-md text-[13px]">
                        <button
                          type="button"
                          className={cn(
                            "flex-1 py-1.5 rounded-sm font-medium transition-all text-center",
                            draftDateFilter === ""
                              ? "bg-background text-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                          onClick={() => setDraftDateFilter("")}
                        >
                          All
                        </button>
                        <button
                          type="button"
                          className={cn(
                            "flex-1 py-1.5 rounded-sm font-medium transition-all text-center",
                            draftDateFilter === "last_7_days"
                              ? "bg-background text-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                          onClick={() => setDraftDateFilter("last_7_days")}
                        >
                          Last 7 Days
                        </button>
                        <button
                          type="button"
                          className={cn(
                            "flex-1 py-1.5 rounded-sm font-medium transition-all text-center",
                            draftDateFilter === "custom"
                              ? "bg-background text-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                          onClick={() => setDraftDateFilter("custom")}
                        >
                          Custom
                        </button>
                      </div>

                      {/* Custom Range Inputs */}
                      {draftDateFilter === "custom" && (
                        <div className="grid grid-cols-2 gap-2 animate-in fade-in-50 duration-200">
                          <div className="space-y-1">
                            <label className="text-[11px] font-medium text-muted-foreground">From</label>
                            <DatePicker
                              date={parseYyyyMmDd(draftFromDate)}
                              setDate={(d) => {
                                const formatted = d ? format(d, "yyyy-MM-dd") : "";
                                setDraftFromDate(formatted);
                                if (d && draftToDate) {
                                  const toD = parseYyyyMmDd(draftToDate);
                                  if (toD && d > toD) {
                                    setDraftToDate("");
                                  }
                                }
                              }}
                              placeholder="Start Date"
                              className="h-8.5 text-[12px] px-2.5 bg-background border-input"
                              disabledDays={
                                draftToDate
                                  ? { after: parseYyyyMmDd(draftToDate) as Date }
                                  : undefined
                              }
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[11px] font-medium text-muted-foreground">To</label>
                            <DatePicker
                              date={parseYyyyMmDd(draftToDate)}
                              setDate={(d) => {
                                const formatted = d ? format(d, "yyyy-MM-dd") : "";
                                setDraftToDate(formatted);
                                if (d && draftFromDate) {
                                  const fromD = parseYyyyMmDd(draftFromDate);
                                  if (fromD && d < fromD) {
                                    setDraftFromDate("");
                                  }
                                }
                              }}
                              placeholder="End Date"
                              className="h-8.5 text-[12px] px-2.5 bg-background border-input"
                              disabledDays={
                                draftFromDate
                                  ? { before: parseYyyyMmDd(draftFromDate) as Date }
                                  : undefined
                              }
                            />
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2 justify-end border-t border-border pt-3 mt-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 text-[12px]"
                          onClick={() => setIsDatePopoverOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          className="h-8 text-[12px]"
                          onClick={handleApplyDateFilter}
                        >
                          Apply
                        </Button>
                      </div>
                    </PopoverContent>
                  </PopoverPortal>
                </Popover>
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
