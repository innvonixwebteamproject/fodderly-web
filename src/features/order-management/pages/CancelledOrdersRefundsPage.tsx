import {
  ColumnDef,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import DatePicker from "@/components/ui/date-picker";
import { format } from "date-fns";
import { Ban, BadgeCheck, ClipboardList, Filter, Landmark, RotateCcw } from "lucide-react";
import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Container } from "@/components/common/container";
import { InfiniteScrollContainer } from "@/components/common/infinite-scroll-container";
import { SearchInput } from "@/components/common/search-input";
import { TruncatedCell } from "@/components/common/truncated-cell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTable, CardTitle } from "@/components/ui/card";
import { DataGrid } from "@/components/ui/data-grid";
import { DataGridColumnHeader } from "@/components/ui/data-grid-column-header";
import { DataGridTable } from "@/components/ui/data-grid-table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { SearchableSelect } from "@/components/ui/searchable-select";
import { ActionButton } from "@/components/common/action-button";
import { getApiSortParams } from "@/lib/api-sorting";
import { formatOrderListRupeeAmount } from "../utils/format-order-list-rupee";
import type { AdminCancelledOrdersSortBy, CancellationRefundListFilters, RefundQueueItem } from "../types/refund.types";
import type { CancelledBy } from "../types/refund.types";
import { useCancelledRefundsInfiniteQuery } from "../hooks/useCancelledRefundsQuery";
import { RefundStatusBadge } from "../components/RefundStatusBadge";

const ProcessRefundConfirmDialog = lazy(() => import("../components/ProcessRefundConfirmDialog"));
const RefundManualModal = lazy(() => import("../components/RefundManualModal"));
import {
  ADMIN_CANCELLED_PAYMENT_MODE_FILTER_OPTIONS,
  ADMIN_CANCELLED_REFUND_STATUS_FILTER_OPTIONS,
} from "../constants/cancellation-refund.constants";
import { CANCELLATION_REASON_OPTIONS } from "../constants/order.constants";

import {
  canShowManualRefundAction,
  canShowProcessRefundAction,
  isCashPayment,
} from "../utils/cancellation-rules";
import { PaymentModeBadge } from "../components/PaymentModeBadge";

const formatTs = (value: string) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return format(d, "dd MMM yyyy, HH:mm");
};

function cancelledByLabel(row: RefundQueueItem): string {
  if (row.cancelledByLabel?.trim()) return row.cancelledByLabel;
  const map: Record<CancelledBy, string> = {
    FARMER: "Farmer",
    FODDERMAN: "Fodderman",
    ADMIN: "Admin",
    SYSTEM: "System",
    PARTNER: "Partner",
  };
  return row.cancelledBy ? map[row.cancelledBy] : "—";
}

function reasonLabel(code: string | null | undefined) {
  if (!code) return "—";
  return CANCELLATION_REASON_OPTIONS.find((r) => r.value === code)?.label ?? code;
}

export function CancelledOrdersRefundsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([{ id: "cancelledAt", desc: true }]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [refundStatusFilter, setRefundStatusFilter] = useState("");
  const [paymentModeFilter, setPaymentModeFilter] = useState("");
  const [cancellationFrom, setCancellationFrom] = useState("");
  const [cancellationTo, setCancellationTo] = useState("");
  const [refundFrom, setRefundFrom] = useState("");
  const [refundTo, setRefundTo] = useState("");

  const [processRow, setProcessRow] = useState<RefundQueueItem | null>(null);
  const [manualRow, setManualRow] = useState<RefundQueueItem | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(searchTerm.trim()), 400);
    return () => window.clearTimeout(t);
  }, [searchTerm]);

  const listFilters: CancellationRefundListFilters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      refundStatuses: refundStatusFilter ? [refundStatusFilter] : undefined,
      paymentModes: paymentModeFilter ? [paymentModeFilter] : undefined,
      cancellationFrom: cancellationFrom || undefined,
      cancellationTo: cancellationTo || undefined,
      refundFrom: refundFrom || undefined,
      refundTo: refundTo || undefined,
    }),
    [
      debouncedSearch,
      refundStatusFilter,
      paymentModeFilter,
      cancellationFrom,
      cancellationTo,
      refundFrom,
      refundTo,
    ],
  );

  const { sortBy, sortOrder } = getApiSortParams<AdminCancelledOrdersSortBy>({
    sorting,
    defaultSortBy: "cancellationDate",
    columnToSortByMap: {
      cancelledAt: "cancellationDate",
      orderNumber: "orderId",
      farmerName: "farmer",
      refundAmount: "refundAmount",
      refundStatus: "refundStatus",
    },
  });

  const {
    data: refundsData,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useCancelledRefundsInfiniteQuery(listFilters, sortBy, sortOrder, 10);

  const rows = useMemo(() => refundsData?.pages.flatMap((p) => p.data) ?? [], [refundsData]);

  const handleReset = useCallback(() => {
    setSearchTerm("");
    setDebouncedSearch("");
    setSorting([{ id: "cancelledAt", desc: true }]);
    setRefundStatusFilter("");
    setPaymentModeFilter("");
    setCancellationFrom("");
    setCancellationTo("");
    setRefundFrom("");
    setRefundTo("");
  }, []);

  const activeFilterCount = [
    refundStatusFilter,
    paymentModeFilter,
    cancellationFrom,
    cancellationTo,
    refundFrom,
    refundTo,
  ].filter(Boolean).length;

  const sortIsDefault =
    sorting.length === 0 ||
    (sorting.length === 1 && sorting[0]?.id === "cancelledAt" && sorting[0]?.desc === true);

  const canReset = Boolean(searchTerm.trim()) || activeFilterCount > 0 || !sortIsDefault;

  const columns = useMemo<ColumnDef<RefundQueueItem>[]>(
    () => [
      {
        id: "serial",
        header: ({ column }) => <DataGridColumnHeader title="Sr." column={column} />,
        cell: ({ row }) => row.index + 1,
        size: 58,
      },
      {
        id: "orderNumber",
        accessorFn: (row) => row.orderNumber,
        header: ({ column }) => <DataGridColumnHeader title="Order ID" column={column} />,
        enableSorting: true,
        cell: ({ row }) => row.original.orderNumber,
        size: 120,
      },
      {
        id: "farmerName",
        accessorFn: (row) => row.farmerName,
        header: ({ column }) => <DataGridColumnHeader title="Farmer" column={column} />,
        enableSorting: true,
        cell: ({ row }) => (
          <div className="flex flex-col">
            <TruncatedCell value={row.original.farmerName} className="font-medium" maxWidth="max-w-[140px]" />
            <span className="text-[11px] text-muted-foreground">{row.original.farmerVillage}</span>
          </div>
        ),
        size: 160,
      },
      {
        id: "farmerMobile",
        header: ({ column }) => <DataGridColumnHeader title="Farmer contact" column={column} />,
        cell: ({ row }) => (
          <TruncatedCell value={row.original.farmerMobile || "—"} maxWidth="max-w-[120px]" />
        ),
        size: 120,
      },
      {
        id: "cancelledAt",
        accessorFn: (row) => row.cancelledAt,
        header: ({ column }) => <DataGridColumnHeader title="Cancellation date" column={column} />,
        enableSorting: true,
        cell: ({ row }) => formatTs(row.original.cancelledAt),
        size: 150,
      },
      {
        id: "cancelledBy",
        header: ({ column }) => <DataGridColumnHeader title="Cancelled by" column={column} />,
        cell: ({ row }) => (
          <Badge variant="outline" size="sm" className="font-normal">
            {cancelledByLabel(row.original)}
          </Badge>
        ),
        size: 110,
      },
      {
        id: "reason",
        header: ({ column }) => <DataGridColumnHeader title="Cancellation reason" column={column} />,
        cell: ({ row }) => (
          <TruncatedCell
            value={row.original.cancellationReasonLabel ?? reasonLabel(row.original.cancellationReason ?? undefined)}
            maxWidth="max-w-[180px]"
          />
        ),
        size: 180,
      },
      {
        id: "paymentMode",
        header: ({ column }) => <DataGridColumnHeader title="Payment mode" column={column} />,
        cell: ({ row }) => (
          <PaymentModeBadge mode={row.original.paymentMode || "CASH_IN_HAND"} labelFromApi={row.original.paymentModeApiRaw} />
        ),
        size: 120,
      },
      {
        id: "refundAmount",
        accessorFn: (row) => row.refundAmount,
        header: ({ column }) => <DataGridColumnHeader title="Refund amount" column={column} />,
        enableSorting: true,
        cell: ({ row }) => (
          <span className="tabular-nums">₹{formatOrderListRupeeAmount(row.original.refundAmount)}</span>
        ),
        size: 120,
      },
      {
        id: "refundDate",
        accessorFn: (row) => row.refundDate || "",
        header: ({ column }) => <DataGridColumnHeader title="Refund date" column={column} />,
        enableSorting: false,
        cell: ({ row }) => row.original.refundDate ? formatTs(row.original.refundDate) : "—",
        size: 150,
      },
      {
        id: "refundStatus",
        accessorFn: (row) => row.refundStatus,
        header: ({ column }) => <DataGridColumnHeader title="Refund status" column={column} />,
        enableSorting: true,
        cell: ({ row }) => <RefundStatusBadge status={row.original.refundStatus} />,
        size: 130,
      },
      {
        id: "actions",
        header: ({ column }) => <DataGridColumnHeader title="Actions" column={column} />,
        enableSorting: false,
        cell: ({ row }) => {
          const r = row.original;
          const cash = isCashPayment(r.paymentMode);
          const showProcess = canShowProcessRefundAction(r);
          const showManual = canShowManualRefundAction(r);

          return (
            <div className="flex flex-wrap items-center gap-1">
              {!cash && showProcess ? (
                <ActionButton
                  actionType="edit"
                  icon={Landmark}
                  tooltip="Process online refund (gateway)"
                  onClick={() => setProcessRow(r)}
                />
              ) : null}
              {!cash && showManual ? (
                <ActionButton
                  actionType="edit"
                  icon={BadgeCheck}
                  tooltip="Mark manually refunded"
                  onClick={() => setManualRow(r)}
                />
              ) : null}
            </div>
          );
        },
        size: 100,
      },
    ],
    [],
  );

  const table = useReactTable({
    columns,
    data: rows,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { sorting },
    onSortingChange: setSorting,
    manualSorting: true,
    columnResizeMode: "onChange",
  });

  return (
    <Container className="pb-8">
      <div className="flex h-full min-h-0 flex-col gap-6">
        <Card variant="listing" className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <CardHeader className="flex shrink-0 flex-row flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
              <CardTitle className="text-xl flex items-center gap-2 whitespace-nowrap shrink-0">
                <Ban className="h-5 w-5 text-primary" />
                Cancelled orders & refunds
              </CardTitle>
              <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                tooltip="Search by order ID, farmer name, or farmer mobile"
                className="w-full max-w-[280px] xl:max-w-[300px] 2xl:max-w-[340px]"
                inputClassName="h-9 text-[13px]"
              />
            </div>
            <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
              <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-8.5 gap-1 px-2.5 text-[13px] font-semibold border-primary/30 text-primary hover:bg-primary/5"
                  >
                    <Filter className="h-4 w-4" />
                    Filters
                    {activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[640px]">
                  <DialogHeader>
                    <DialogTitle>Filters</DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <SearchableSelect
                      options={ADMIN_CANCELLED_REFUND_STATUS_FILTER_OPTIONS}
                      value={refundStatusFilter}
                      onValueChange={setRefundStatusFilter}
                      placeholder="All refund status"
                      searchPlaceholder="Search…"
                      triggerClassName="h-9 bg-background text-[13px]"
                    />
                    <SearchableSelect
                      options={ADMIN_CANCELLED_PAYMENT_MODE_FILTER_OPTIONS}
                      value={paymentModeFilter}
                      onValueChange={setPaymentModeFilter}
                      placeholder="All payment modes"
                      searchPlaceholder="Search…"
                      triggerClassName="h-9 bg-background text-[13px]"
                    />
                    <div className="sm:col-span-2 grid gap-2 sm:grid-cols-2">
                      <div className="flex flex-col gap-1">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Cancellation from</p>
                        <DatePicker
                          date={cancellationFrom ? new Date(cancellationFrom) : undefined}
                          setDate={(d) => setCancellationFrom(d ? format(d, "yyyy-MM-dd") : "")}
                          disabledDays={cancellationTo ? { after: new Date(cancellationTo) } : undefined}
                          placeholder="Select date"
                          className="h-9 text-[13px]"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Cancellation to</p>
                        <DatePicker
                          date={cancellationTo ? new Date(cancellationTo) : undefined}
                          setDate={(d) => setCancellationTo(d ? format(d, "yyyy-MM-dd") : "")}
                          disabledDays={cancellationFrom ? { before: new Date(cancellationFrom) } : undefined}
                          placeholder="Select date"
                          className="h-9 text-[13px]"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Refund from</p>
                        <DatePicker
                          date={refundFrom ? new Date(refundFrom) : undefined}
                          setDate={(d) => setRefundFrom(d ? format(d, "yyyy-MM-dd") : "")}
                          disabledDays={refundTo ? { after: new Date(refundTo) } : undefined}
                          placeholder="Select date"
                          className="h-9 text-[13px]"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Refund to</p>
                        <DatePicker
                          date={refundTo ? new Date(refundTo) : undefined}
                          setDate={(d) => setRefundTo(d ? format(d, "yyyy-MM-dd") : "")}
                          disabledDays={refundFrom ? { before: new Date(refundFrom) } : undefined}
                          placeholder="Select date"
                          className="h-9 text-[13px]"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleReset}
                      disabled={!canReset}
                      title={!canReset ? "Change search, filters, or sort to enable reset" : undefined}
                      className="h-8.5 gap-1 text-[13px]"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Reset
                    </Button>
                    <Button className="h-8.5 text-[13px]" onClick={() => setIsFilterOpen(false)}>
                      Apply
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={!canReset}
                title={!canReset ? "Change search, filters, or sort to enable reset" : undefined}
                className="h-8.5 gap-1 px-2.5 text-[13px] font-semibold border-primary/30 text-primary hover:bg-primary/5 disabled:pointer-events-none disabled:opacity-50"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
              <Button asChild variant="outline" size="sm" className="h-8.5 gap-1 text-[13px]">
                <Link to="/admin/orders">
                  <ClipboardList className="h-3.5 w-3.5" />
                  All orders
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardTable className="min-h-0 flex-1 overflow-hidden">
            <DataGrid
              table={table}
              recordCount={rows.length}
              isLoading={isLoading}
              emptyMessage="No cancelled orders in queue."
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

      <Suspense fallback={null}>
        <ProcessRefundConfirmDialog row={processRow} open={Boolean(processRow)} onOpenChange={(o) => !o && setProcessRow(null)} />
      </Suspense>
      {manualRow ? (
        <Suspense fallback={null}>
          <RefundManualModal
            orderId={manualRow.orderId}
            orderNumber={manualRow.orderNumber}
            open
            onOpenChange={(o) => {
              if (!o) setManualRow(null);
            }}
          />
        </Suspense>
      ) : null}
    </Container>
  );
}
