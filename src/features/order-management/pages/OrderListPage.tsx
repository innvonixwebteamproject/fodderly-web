import {
  ColumnDef,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { Ban, Calendar, ClipboardList, Download, FileSpreadsheet, Filter, Info, RotateCcw } from "lucide-react";
import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ActionButton } from "@/components/common/action-button";
import { Container } from "@/components/common/container";
import { InfiniteScrollContainer } from "@/components/common/infinite-scroll-container";
import { SearchInput } from "@/components/common/search-input";
import { TruncatedCell } from "@/components/common/truncated-cell";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getApiSortParams } from "@/lib/api-sorting";
import { formatOrderListRupeeAmount } from "../utils/format-order-list-rupee";
import { canAdminCancelOrder, canAdminScheduleDelivery } from "../utils/order-schedule-rules";
import {
  useFoddermanOptionsQuery,
  useTalukaOptionsQuery,
  useVillageOptionsQuery,
} from "@/features/farmer-management/hooks";
import { usePartnerDistrictsQuery, usePartnerStatesQuery, usePartnersQuery } from "@/features/partner-management";
import type {
  AdminOrderListApiPaymentMode,
  AdminOrderListApiPaymentStatus,
  AdminOrderListApiStatus,
  AdminOrderListItem,
  OrderListFilters,
  AdminOrderListApiSortBy,
  OrderExportJobStatus,
} from "../types/order.types";
import { useOrdersInfiniteQuery } from "../hooks/useOrdersQuery";
import {
  exportAdminOrderList,
  enqueueAdminOrderExport,
  getAdminOrderExportJobStatus,
  downloadAdminOrderExport,
} from "../services/order.api";
import { saveBlobAsFile } from "../utils/order-export.utils";
import {
  ADMIN_ORDER_LIST_PAYMENT_MODE_FILTER_OPTIONS,
  ADMIN_ORDER_LIST_PAYMENT_STATUS_FILTER_OPTIONS,
  ADMIN_ORDER_LIST_STATUS_FILTER_OPTIONS,
} from "../constants/order.constants";
import { OrderStatusBadge } from "../components/OrderStatusBadge";
import { PaymentStatusBadge } from "../components/PaymentStatusBadge";
import { PaymentModeBadge } from "../components/PaymentModeBadge";

const OrderQuickUpdateModal = lazy(() => import("../components/OrderQuickUpdateModal"));
const AdminCancelOrderModal = lazy(() => import("../components/AdminCancelOrderModal"));

const formatPlacedAt = (value: string) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return format(d, "dd MMM yyyy, HH:mm");
};

export function OrderListPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([{ id: "placedAt", desc: true }]);

  const [stateFilter, setStateFilter] = useState("");
  const [districtFilter, setDistrictFilter] = useState("");
  const [talukaFilter, setTalukaFilter] = useState("");
  const [villageFilter, setVillageFilter] = useState("");
  const [partnerFilter, setPartnerFilter] = useState("");
  const [foddermanFilter, setFoddermanFilter] = useState("");
  const [adminStatusFilter, setAdminStatusFilter] = useState<"" | AdminOrderListApiStatus>("");
  const [adminPaymentModeFilter, setAdminPaymentModeFilter] = useState<"" | AdminOrderListApiPaymentMode>("");
  const [adminPaymentStatusFilter, setAdminPaymentStatusFilter] = useState<"" | AdminOrderListApiPaymentStatus>("");

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [quickOrder, setQuickOrder] = useState<AdminOrderListItem | null>(null);
  const [cancelOrder, setCancelOrder] = useState<AdminOrderListItem | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<OrderExportJobStatus | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(searchTerm.trim()), 400);
    return () => window.clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => {
    setDistrictFilter("");
    setTalukaFilter("");
    setVillageFilter("");
    setFoddermanFilter("");
  }, [stateFilter]);

  useEffect(() => {
    setTalukaFilter("");
    setVillageFilter("");
    setFoddermanFilter("");
  }, [districtFilter]);

  useEffect(() => {
    setVillageFilter("");
    setFoddermanFilter("");
  }, [talukaFilter]);

  const { data: statesResponse, isLoading: isLoadingStates } = usePartnerStatesQuery();
  const { data: districtsResponse, isLoading: isLoadingDistricts } = usePartnerDistrictsQuery(
    stateFilter || undefined,
    Boolean(stateFilter),
  );
  const { data: talukaOptions } = useTalukaOptionsQuery(districtFilter || undefined);
  const { data: villageOptions, isLoading: isLoadingVillages } = useVillageOptionsQuery(
    talukaFilter || undefined,
    districtFilter || undefined,
    stateFilter || undefined,
  );
  const { data: foddermanOptions, isLoading: isLoadingFoddermen } = useFoddermanOptionsQuery({
    stateId: stateFilter || undefined,
    districtId: districtFilter || undefined,
    talukaId: talukaFilter || undefined,
    villageId: villageFilter || undefined,
  });
  /** Partner list API caps `limit` (e.g. @Max(100)); keep in sync with backend. */
  const { data: partnersResponse } = usePartnersQuery(1, 100);

  const states = useMemo(() => statesResponse?.data ?? [], [statesResponse?.data]);
  const districts = useMemo(() => districtsResponse?.data ?? [], [districtsResponse?.data]);
  const partnerOptions = useMemo(
    () =>
      (partnersResponse?.data ?? []).map((p) => {
        const name = p.fullName || p.companyName || p.email || p.id;
        return {
          value: p.id,
          label: p.phone ? `${name} (${p.phone})` : name,
        };
      }),
    [partnersResponse?.data],
  );

  const stateSelectOptions = useMemo(
    () => states.map((s) => ({ value: s.id, label: s.name })),
    [states],
  );
  const districtSelectOptions = useMemo(
    () => districts.map((d) => ({ value: d.id, label: d.name })),
    [districts],
  );

  const listFilters: OrderListFilters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      stateId: stateFilter || undefined,
      districtId: districtFilter || undefined,
      talukaId: talukaFilter || undefined,
      villageId: villageFilter || undefined,
      partnerId: partnerFilter || undefined,
      foddermanId: foddermanFilter || undefined,
      adminListStatus: adminStatusFilter || undefined,
      adminListPaymentMode: adminPaymentModeFilter || undefined,
      adminListPaymentStatus: adminPaymentStatusFilter || undefined,
    }),
    [
      debouncedSearch,
      stateFilter,
      districtFilter,
      talukaFilter,
      villageFilter,
      partnerFilter,
      foddermanFilter,
      adminStatusFilter,
      adminPaymentModeFilter,
      adminPaymentStatusFilter,
    ],
  );

  const { sortBy, sortOrder } = getApiSortParams<AdminOrderListApiSortBy>({
    sorting,
    defaultSortBy: "createdAt",
    columnToSortByMap: {
      placedAt: "createdAt",
      orderNumber: "orderId",
      totalAmount: "total",
      fodderman: "fodderman",
      partner: "partner",
    },
  });

  const {
    data: ordersData,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useOrdersInfiniteQuery(listFilters, sortBy, sortOrder, 10);

  const rows = useMemo(() => ordersData?.pages.flatMap((pageData) => pageData.data) ?? [], [ordersData]);

  const handleReset = () => {
    setSearchTerm("");
    setDebouncedSearch("");
    setSorting([{ id: "placedAt", desc: true }]);
    setStateFilter("");
    setDistrictFilter("");
    setTalukaFilter("");
    setVillageFilter("");
    setPartnerFilter("");
    setFoddermanFilter("");
    setAdminStatusFilter("");
    setAdminPaymentModeFilter("");
    setAdminPaymentStatusFilter("");
  };

  const activeFilterCount = [
    stateFilter,
    districtFilter,
    talukaFilter,
    villageFilter,
    partnerFilter,
    foddermanFilter,
    adminStatusFilter,
    adminPaymentModeFilter,
    adminPaymentStatusFilter,
  ].filter(Boolean).length;

  const sortIsDefault =
    sorting.length === 1 && sorting[0]?.id === "placedAt" && sorting[0]?.desc === true;

  const canReset =
    Boolean(searchTerm.trim()) || activeFilterCount > 0 || !sortIsDefault;

  const handleExportCsv = useCallback(async () => {
    setIsExporting(true);
    try {
      toast.message("Preparing CSV export (capped)…");
      const blob = await exportAdminOrderList(listFilters, "csv", sortBy, sortOrder);
      saveBlobAsFile(blob, `orders_${new Date().toISOString().slice(0, 10)}.csv`);
      toast.success("CSV downloaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed");
    } finally {
      setIsExporting(false);
    }
  }, [listFilters, sortBy, sortOrder]);

  const handleExportExcel = useCallback(async () => {
    setIsExporting(true);
    try {
      toast.message("Preparing Excel export (capped)…");
      const blob = await exportAdminOrderList(listFilters, "xlsx", sortBy, sortOrder);
      saveBlobAsFile(blob, `orders_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success("Excel downloaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed");
    } finally {
      setIsExporting(false);
    }
  }, [listFilters, sortBy, sortOrder]);

  const handleEnqueueExportJob = useCallback(async () => {
    setIsExporting(true);
    try {
      toast.message("Enqueuing background export (unlimited CSV)…");
      const { jobId } = await enqueueAdminOrderExport(listFilters, sortBy, sortOrder);
      setActiveJobId(jobId);
      toast.success("Job enqueued! You can stay on this page to wait for completion.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to enqueue job");
    } finally {
      setIsExporting(false);
    }
  }, [listFilters, sortBy, sortOrder]);

  useEffect(() => {
    let interval: number | undefined;
    if (activeJobId) {
      interval = window.setInterval(async () => {
        try {
          const status = await getAdminOrderExportJobStatus(activeJobId);
          setJobStatus(status);
          if (status.downloadReady) {
            window.clearInterval(interval);
            setActiveJobId(null);
            toast.success("Export job completed! Starting download...");
            const blob = await downloadAdminOrderExport(activeJobId);
            saveBlobAsFile(blob, `orders_unlimited_${new Date().toISOString().slice(0, 10)}.csv`);
            setJobStatus(null);
          } else if (status.state === "failed") {
            window.clearInterval(interval);
            setActiveJobId(null);
            toast.error(status.error || "Export job failed");
            setJobStatus(null);
          }
        } catch (e) {
          console.error("Job polling error", e);
        }
      }, 3000);
    }
    return () => {
      if (interval) window.clearInterval(interval);
    };
  }, [activeJobId]);

  const columns = useMemo<ColumnDef<AdminOrderListItem>[]>(
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
        cell: ({ row }) => <TruncatedCell value={row.original.orderNumber} className="font-medium" />,
        size: 120,
      },
      {
        id: "placedAt",
        accessorFn: (row) => row.placedAt,
        header: ({ column }) => <DataGridColumnHeader title="Date & Time" column={column} />,
        enableSorting: true,
        cell: ({ row }) => formatPlacedAt(row.original.placedAt),
        size: 150,
      },
      {
        id: "farmer",
        header: ({ column }) => <DataGridColumnHeader title="Farmer & Village" column={column} />,
        cell: ({ row }) => (
          <div className="flex min-w-0 flex-col gap-0.5">
            <TruncatedCell value={row.original.farmer.name} className="font-medium" maxWidth="max-w-[160px]" />
            <TruncatedCell
              value={row.original.farmer.villageName || "—"}
              className="text-xs text-muted-foreground"
              maxWidth="max-w-[160px]"
            />
          </div>
        ),
        size: 170,
      },
      {
        id: "fodderman",
        accessorFn: (row) => row.fodderman?.name ?? "",
        header: ({ column }) => <DataGridColumnHeader title="Fodderman" column={column} />,
        cell: ({ row }) =>
          row.original.fodderman?.name ? (
            <TruncatedCell value={row.original.fodderman.name} maxWidth="max-w-[140px]" />
          ) : (
            <span className="text-muted-foreground italic text-[13px]">Unassigned</span>
          ),
        size: 140,
      },
      {
        id: "partner",
        accessorFn: (row) => row.partner?.name ?? "",
        header: ({ column }) => <DataGridColumnHeader title="Partner" column={column} />,
        cell: ({ row }) =>
          row.original.partner?.name ? (
            <TruncatedCell value={row.original.partner.name} maxWidth="max-w-[140px]" />
          ) : (
            <span className="text-muted-foreground italic text-[13px]">—</span>
          ),
        size: 140,
      },
      {
        id: "totalAmount",
        accessorFn: (row) => row.totalAmount,
        header: ({ column }) => <DataGridColumnHeader title="Total" column={column} />,
        enableSorting: true,
        cell: ({ row }) => (
          <span className="tabular-nums">₹{formatOrderListRupeeAmount(row.original.totalAmount)}</span>
        ),
        size: 100,
      },
      {
        id: "paymentMode",
        header: ({ column }) => <DataGridColumnHeader title="Payment mode" column={column} />,
        cell: ({ row }) => (
          <PaymentModeBadge mode={row.original.paymentMode} labelFromApi={row.original.paymentModeApiRaw} />
        ),
        size: 130,
      },
      {
        id: "paymentStatus",
        header: ({ column }) => <DataGridColumnHeader title="Payment status" column={column} />,
        cell: ({ row }) => (
          <PaymentStatusBadge status={row.original.paymentStatus} labelFromApi={row.original.paymentStatusLabelApi} />
        ),
        size: 150,
      },
      {
        id: "orderStatus",
        header: ({ column }) => <DataGridColumnHeader title="Order status" column={column} />,
        cell: ({ row }) => (
          <OrderStatusBadge status={row.original.orderStatus} labelFromApi={row.original.orderStatusApiRaw} />
        ),
        size: 160,
      },
      {
        id: "actions",
        header: ({ column }) => <DataGridColumnHeader title="Actions" column={column} />,
        enableSorting: false,
        cell: ({ row }) => {
          const order = row.original;
          const canAdminCancel = canAdminCancelOrder(order);
          const canScheduleDelivery = canAdminScheduleDelivery(order);
          return (
            <div className="flex items-center gap-1">
              <ActionButton
                actionType="view"
                tooltip="View details"
                onClick={() => navigate(`/admin/orders/${order.id}`)}
              />
              {canScheduleDelivery ? (
                <ActionButton
                  actionType="edit"
                  icon={Calendar}
                  tooltip="Reschedule Delivery"
                  onClick={() => setQuickOrder(order)}
                />
              ) : null}
              {canAdminCancel ? (
                <ActionButton
                  actionType="delete"
                  icon={Ban}
                  tooltip="Cancel order"
                  onClick={() => setCancelOrder(order)}
                />
              ) : null}
            </div>
          );
        },
        size: 120,
      },
    ],
    [navigate, setQuickOrder, setCancelOrder],
  );

  const table = useReactTable({
    columns,
    data: rows,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    manualSorting: true,
    columnResizeMode: "onChange",
  });

  return (
    <Container className="pb-8">
      <div className="flex h-full min-h-0 flex-col gap-6">
        <Card variant="listing" className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <CardHeader className="flex shrink-0 flex-row flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <CardTitle className="text-xl flex items-center gap-2 whitespace-nowrap shrink-0">
                <ClipboardList className="h-5 w-5 text-primary" />
                All orders
              </CardTitle>
              <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                tooltip="Search by order id, farmer name, or fodderman name"
                className="w-full max-w-[280px] xl:max-w-[300px] 2xl:max-w-[340px]"
                inputClassName="h-9 text-[13px]"
              />
            </div>
            <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
              <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-8.5 gap-1 px-2.5 text-[13px] font-semibold border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/50 transition-all"
                  >
                    <Filter className="h-4 w-4" />
                    Filters
                    {activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span
                          role="button"
                          tabIndex={0}
                          aria-label="Filters info"
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                          className="ml-1 inline-flex items-center text-primary/80 hover:text-primary"
                        >
                          <Info className="h-3.5 w-3.5" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>Geography, partner, fodderman, order status, and payment filters.</p>
                      </TooltipContent>
                    </Tooltip>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[760px]">
                  <DialogHeader>
                    <DialogTitle>Order filters</DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <SearchableSelect
                      options={stateSelectOptions}
                      value={stateFilter}
                      onValueChange={setStateFilter}
                      placeholder="All states"
                      searchPlaceholder="Search state…"
                      searchInputClassName="text-xs placeholder:text-xs"
                      disabled={isLoadingStates}
                      triggerClassName="h-9 bg-background text-[13px]"
                    />
                    <SearchableSelect
                      options={districtSelectOptions}
                      value={districtFilter}
                      onValueChange={setDistrictFilter}
                      placeholder={stateFilter ? "All districts" : "Select state first"}
                      searchPlaceholder="Search district…"
                      searchInputClassName="text-xs placeholder:text-xs"
                      disabled={!stateFilter || isLoadingDistricts}
                      triggerClassName="h-9 bg-background text-[13px]"
                    />
                    <SearchableSelect
                      options={talukaOptions}
                      value={talukaFilter}
                      onValueChange={setTalukaFilter}
                      placeholder={
                        !stateFilter ? "Select state first" : !districtFilter ? "Select district first" : "All talukas"
                      }
                      searchPlaceholder="Search taluka…"
                      searchInputClassName="text-xs placeholder:text-xs"
                      disabled={!stateFilter || !districtFilter}
                      triggerClassName="h-9 bg-background text-[13px]"
                    />
                    <SearchableSelect
                      options={villageOptions}
                      value={villageFilter}
                      onValueChange={setVillageFilter}
                      placeholder={talukaFilter ? "All villages" : "Select taluka first"}
                      searchPlaceholder="Search village…"
                      searchInputClassName="text-xs placeholder:text-xs"
                      disabled={!talukaFilter || isLoadingVillages}
                      triggerClassName="h-9 bg-background text-[13px]"
                    />
                    <SearchableSelect
                      options={partnerOptions}
                      value={partnerFilter}
                      onValueChange={setPartnerFilter}
                      placeholder="All partners"
                      searchPlaceholder="Search partner…"
                      searchInputClassName="text-xs placeholder:text-xs"
                      triggerClassName="h-9 bg-background text-[13px]"
                      contentClassName="!w-[280px]"
                    />
                    <SearchableSelect
                      options={foddermanOptions}
                      value={foddermanFilter}
                      onValueChange={setFoddermanFilter}
                      placeholder="All foddermen"
                      searchPlaceholder="Search fodderman…"
                      searchInputClassName="text-xs placeholder:text-xs"
                      disabled={isLoadingFoddermen}
                      triggerClassName="h-9 bg-background text-[13px]"
                      contentClassName="!w-[280px]"
                    />
                    <SearchableSelect
                      options={ADMIN_ORDER_LIST_STATUS_FILTER_OPTIONS}
                      value={adminStatusFilter}
                      onValueChange={(v) => setAdminStatusFilter((v || "") as "" | AdminOrderListApiStatus)}
                      placeholder="All order status"
                      searchPlaceholder="Search…"
                      searchInputClassName="text-xs placeholder:text-xs"
                      triggerClassName="h-9 bg-background text-[13px]"
                    />
                    <SearchableSelect
                      options={ADMIN_ORDER_LIST_PAYMENT_MODE_FILTER_OPTIONS}
                      value={adminPaymentModeFilter}
                      onValueChange={(v) => setAdminPaymentModeFilter((v || "") as "" | AdminOrderListApiPaymentMode)}
                      placeholder="All payment modes"
                      searchPlaceholder="Search…"
                      searchInputClassName="text-xs placeholder:text-xs"
                      triggerClassName="h-9 bg-background text-[13px]"
                    />
                    <SearchableSelect
                      options={ADMIN_ORDER_LIST_PAYMENT_STATUS_FILTER_OPTIONS}
                      value={adminPaymentStatusFilter}
                      onValueChange={(v) =>
                        setAdminPaymentStatusFilter((v || "") as "" | AdminOrderListApiPaymentStatus)
                      }
                      placeholder="All payment status"
                      searchPlaceholder="Search…"
                      searchInputClassName="text-xs placeholder:text-xs"
                      triggerClassName="h-9 bg-background text-[13px]"
                    />
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

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-8.5 gap-1 px-2.5 text-[13px] font-semibold border-primary/30 text-primary hover:bg-primary/5"
                    disabled={isExporting}
                  >
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem className="gap-2 text-[13px]" onSelect={handleExportCsv}>
                    <Download className="h-3.5 w-3.5" />
                    CSV (capped)
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2 text-[13px]" onSelect={handleExportExcel}>
                    <FileSpreadsheet className="h-3.5 w-3.5" />
                    Excel (capped)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="gap-2 text-[13px] font-medium text-primary"
                    onSelect={handleEnqueueExportJob}
                    disabled={Boolean(activeJobId)}
                  >
                    <ClipboardList className="h-3.5 w-3.5" />
                    Unlimited CSV (Background)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

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
            </div>
            {jobStatus && activeJobId && (
              <div className="flex w-full items-center gap-3 rounded-md bg-primary/5 px-3 py-2 text-[13px] border border-primary/10 animate-in fade-in slide-in-from-top-1">
                <div className="flex h-2 w-2 animate-pulse rounded-full bg-primary" />
                <span className="font-medium text-primary">Export job in progress...</span>
                <div className="h-1.5 flex-1 rounded-full bg-primary/10 overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${jobStatus.progress || 0}%` }}
                  />
                </div>
                <span className="text-xs text-primary/70 tabular-nums">{jobStatus.progress || 0}%</span>
                {jobStatus.totalRows != null && (
                  <span className="text-xs text-primary/70">({jobStatus.totalRows} rows)</span>
                )}
              </div>
            )}
          </CardHeader>

          <CardTable className="min-h-0 flex-1 overflow-hidden">
            <DataGrid
              table={table}
              recordCount={rows.length}
              isLoading={isLoading}
              emptyMessage="No orders found."
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
        <OrderQuickUpdateModal
          order={quickOrder}
          open={Boolean(quickOrder)}
          onOpenChange={(o) => {
            if (!o) setQuickOrder(null);
          }}
        />
      </Suspense>
      {cancelOrder ? (
        <Suspense fallback={null}>
          <AdminCancelOrderModal
            orderId={cancelOrder.id}
            open
            onOpenChange={(o) => {
              if (!o) setCancelOrder(null);
            }}
          />
        </Suspense>
      ) : null}
    </Container>
  );
}
