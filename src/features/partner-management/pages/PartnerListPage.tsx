import {
  ColumnDef,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { useMemo, useState, useEffect, useCallback } from "react";
import { Circle, Handshake, Info, Package, RefreshCw, RotateCcw } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { getApiSortParams } from "@/lib/api-sorting";
import { Container } from "@/components/common/container";
import { SearchInput } from "@/components/common/search-input";
import { TruncatedCell } from "@/components/common/truncated-cell";
import { DataGrid } from "@/components/ui/data-grid";
import { DataGridColumnHeader } from "@/components/ui/data-grid-column-header";
import { DataGridTable } from "@/components/ui/data-grid-table";
import { Card, CardHeader, CardTable, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  StatusConfig,
  StatusDropdown,
} from "@/components/common/status-dropdown";
import { ActionButton } from "@/components/common/action-button";
import { RowActionsMenu } from "@/components/common/row-actions-menu";
import { PartnerStatus } from "@/lib/enum";
import {
  usePartnerDistrictsQuery,
  usePartnerStatesQuery,
  usePartnersInfiniteQuery,
  useResendPartnerEmailMutation,
  useUpdatePartnerStatusMutation,
} from "../hooks";
import { InfiniteScrollContainer } from "@/components/common/infinite-scroll-container";
import { IPartner } from "../types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PartnerDetailModal } from "../components/PartnerDetailModal";

const statusOptions = [
  { value: "all", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

type PartnerStatusEntity = IPartner & {
  name: string;
  status: boolean;
};

interface DistrictsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  partner: IPartner | null;
  districtNameMap: Map<string, string>;
}

function DistrictsModal({
  isOpen,
  onOpenChange,
  partner,
  districtNameMap,
}: DistrictsModalProps) {
  if (!partner) return null;

  const districtNames =
    partner.districts && partner.districts.length > 0
      ? partner.districts.map((district) => district.name).filter(Boolean)
      : partner.districtIds
          .map((id) => districtNameMap.get(id) || id)
          .filter(Boolean);

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            Assigned Districts
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-1">
            <span>
              {districtNames.length === 1 ? "Assigned district" : "Assigned districts"} for{" "}
            </span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-block max-w-full cursor-help align-top">
                    <strong
                      className="block overflow-hidden break-all text-left"
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {partner.fullName}
                    </strong>
                  </span>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  align="start"
                  sideOffset={6}
                  className="max-w-xs break-all"
                >
                  <p>{partner.fullName}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
          <div className="grid grid-cols-2 gap-2 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
            {districtNames.map((name, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-2 rounded-md bg-muted/50 text-sm font-medium border border-border/50"
              >
                <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span className="truncate">{name}</span>
              </div>
            ))}
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogAction onClick={() => onOpenChange(false)}>
            Close
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export const getPartnerStatusConfig = (status: boolean): StatusConfig => {
  if (status) {
    return {
      label: PartnerStatus.ACTIVE,
      variant: "success",
      color: "text-emerald-700 dark:text-emerald-300",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/20",
      borderColor: "border-emerald-200 dark:border-emerald-800/80",
      icon: <Circle className="h-2 w-2 fill-current" />,
    };
  }

  return {
    label: PartnerStatus.INACTIVE,
    variant: "warning",
    color: "text-rose-700 dark:text-rose-300",
    bgColor: "bg-rose-50 dark:bg-rose-950/20",
    borderColor: "border-rose-200 dark:border-rose-800/80",
    icon: <Circle className="h-2 w-2 fill-current" />,
  };
};

const formatCreatedDate = (value?: string) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return format(date, "dd MMM,yyyy");
};

export function PartnerListPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [sorting, setSorting] = useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);
  const [stateFilter, setStateFilter] = useState("");
  const [districtFilter, setDistrictFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDistrictsModalOpen, setIsDistrictsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<IPartner | null>(null);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [resendingPartnerId, setResendingPartnerId] = useState<string | null>(null);
  const { data: statesResponse, isLoading: isLoadingStates } =
    usePartnerStatesQuery();
  const { data: districtsResponse, isLoading: isLoadingDistricts } =
    usePartnerDistrictsQuery(stateFilter || undefined, Boolean(stateFilter));
  const { data: allDistrictsResponse } = usePartnerDistrictsQuery();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setDistrictFilter("");
  }, [stateFilter]);

  const partnerStatus =
    statusFilter === "all" ? undefined : (statusFilter as "active" | "inactive");
  const { sortBy, sortOrder } = getApiSortParams({
    sorting,
    defaultSortBy: "createdAt",
    columnToSortByMap: {
      name: "name",
      email: "email",
      createdAt: "createdAt",
    },
  });

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = usePartnersInfiniteQuery(
    debouncedSearchTerm,
    partnerStatus,
    districtFilter || undefined,
    sortBy,
    sortOrder,
  );

  const statusMutation = useUpdatePartnerStatusMutation();
  const resendEmailMutation = useResendPartnerEmailMutation();

  const handleResendActivationEmail = useCallback(
    (partnerId: string) => {
      setResendingPartnerId(partnerId);
      resendEmailMutation.mutate(partnerId, {
        onSettled: () => {
          setResendingPartnerId((currentId) =>
            currentId === partnerId ? null : currentId,
          );
        },
      });
    },
    [resendEmailMutation],
  );

  const confirmStatusChange = useCallback(
    async (partner: PartnerStatusEntity, newStatus: boolean) => {
      if (partner.isActive === newStatus) {
        toast.error(
          `Status is already set to ${newStatus ? "Active" : "Inactive"}.`,
        );
        return;
      }

      await statusMutation.mutateAsync({ id: partner.id });
    },
    [statusMutation],
  );

  const handleReset = () => {
    setSearchTerm("");
    setStateFilter("");
    setDistrictFilter("");
    setStatusFilter("all");
    setSorting([{ id: "createdAt", desc: true }]);
  };

  const partners: IPartner[] = useMemo(() => {
    return data?.pages.flatMap((page) => page.data) || [];
  }, [data]);

  const states = useMemo(() => statesResponse?.data ?? [], [statesResponse?.data]);
  const districts = useMemo(
    () => districtsResponse?.data ?? [],
    [districtsResponse?.data],
  );
  const allDistricts = useMemo(
    () => allDistrictsResponse?.data ?? [],
    [allDistrictsResponse?.data],
  );

  const districtNameMap = useMemo(
    () => new Map(allDistricts.map((district) => [district.id, district.name])),
    [allDistricts],
  );

  const districtStateMap = useMemo(
    () => new Map(allDistricts.map((district) => [district.id, district.stateId])),
    [allDistricts],
  );

  const stateOptions = useMemo(() => {
    return states.map((state) => ({
      value: state.id,
      label: state.name,
    }));
  }, [states]);

  const districtOptions = useMemo(() => {
    return districts.map((district) => ({
      value: district.id,
      label: district.name,
    }));
  }, [districts]);

  const filteredPartners = useMemo(() => {
    const normalizedSearch = debouncedSearchTerm.trim().toLowerCase();
    const matchesSearch = (partner: IPartner) => {
      if (!normalizedSearch) {
        return true;
      }

      return [
        partner.fullName,
        partner.email,
        partner.phone,
        partner.companyName,
      ].some((value) => (value || "").toLowerCase().includes(normalizedSearch));
    };

    const bySearch = partners.filter(matchesSearch);

    if (!stateFilter || districtFilter) {
      return bySearch;
    }

    return bySearch.filter((partner) =>
      partner.state?.id
        ? partner.state.id === stateFilter
        : partner.districtIds.some(
            (districtId) => districtStateMap.get(districtId) === stateFilter,
          ),
    );
  }, [debouncedSearchTerm, districtStateMap, districtFilter, partners, stateFilter]);

  const columns = useMemo<ColumnDef<IPartner>[]>(
    () => [
      {
        id: "serial",
        header: ({ column }) => (
          <DataGridColumnHeader title="Sr." column={column} />
        ),
        cell: ({ row }) => row.index + 1,
        size: 48,
      },
      {
        id: "name",
        accessorFn: (row) => row.fullName,
        header: ({ column }) => (
          <DataGridColumnHeader title="Name" column={column} />
        ),
        enableSorting: true,
        cell: ({ row }) => (
          <div className="flex items-center gap-2 min-w-0">
            <TruncatedCell 
              value={row.original.fullName} 
              className="font-medium" 
              maxWidth="max-w-[130px]"
            />
            {!row.original.forcePasswordChange && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help shrink-0" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Password update pending</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        ),
        size: 130,
      },
      {
        id: "email",
        accessorKey: "email",
        header: ({ column }) => (
          <DataGridColumnHeader title="Email" column={column} />
        ),
        cell: ({ row }) => (
          <TruncatedCell
            value={row.original.email}
            maxWidth="max-w-[180px]"
            alwaysShowTooltip
          />
        ),
        size: 180,
      },
      {
        id: "companyName",
        accessorKey: "companyName",
        header: ({ column }) => (
          <DataGridColumnHeader title="Company" column={column} />
        ),
        enableSorting: false,
        cell: ({ row }) => (
          <TruncatedCell
            value={row.original.companyName || "-"}
            maxWidth="max-w-[180px]"
            alwaysShowTooltip
          />
        ),
        size: 180,
      },
      {
        id: "phone",
        accessorKey: "phone",
        header: ({ column }) => (
          <DataGridColumnHeader title="Mobile" column={column} />
        ),
        enableSorting: false,
        cell: ({ row }) => (
          <TruncatedCell value={row.original.phone} maxWidth="max-w-[120px]" />
        ),
        size: 120,
      },
      {
        id: "districts",
        accessorFn: (row) =>
          row.districts && row.districts.length > 0
            ? row.districts.map((district) => district.name).join(", ")
            : row.districtIds
                .map((districtId) => districtNameMap.get(districtId) || districtId)
                .join(", "),
        header: ({ column }) => (
          <DataGridColumnHeader title="Districts" column={column} />
        ),
        enableSorting: false,
        cell: ({ row }) => {
          const districtNames =
            row.original.districts && row.original.districts.length > 0
              ? row.original.districts.map((district) => district.name).filter(Boolean)
              : row.original.districtIds
                  .map((districtId) => districtNameMap.get(districtId) || districtId)
                  .filter(Boolean);

          if (districtNames.length === 0) return <span className="text-muted-foreground italic">-</span>;

          return (
            <button
              onClick={() => {
                setSelectedPartner(row.original);
                setIsDistrictsModalOpen(true);
              }}
              className="group flex cursor-pointer items-center gap-1.5 text-primary transition-colors duration-200 hover:text-primary/80"
            >
              <span className="max-w-[125px] cursor-pointer truncate font-medium underline decoration-primary/30 underline-offset-4 group-hover:decoration-primary">
                {districtNames.length === 1
                  ? districtNames[0]
                  : `${districtNames[0]} +${districtNames.length - 1}`}
              </span>
              {districtNames.length > 1 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex shrink-0 cursor-pointer">
                        <Info className="h-3.5 w-3.5 cursor-pointer opacity-40 transition-opacity group-hover:opacity-100" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p>Click to view all districts</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </button>
          );
        },
        size: 140,
      },
      {
        id: "createdAt",
        accessorFn: (row) => row.createdAt || "",
        header: ({ column }) => (
          <DataGridColumnHeader title="Created" column={column} />
        ),
        enableSorting: true,
        cell: ({ row }) =>
          formatCreatedDate(row.original.createdAt),
        size: 110,
      },
      {
        id: "status",
        accessorKey: "isActive",
        header: ({ column }) => <DataGridColumnHeader title="Status" column={column} />,
        enableSorting: false,
        cell: (info) => (
          <StatusDropdown<PartnerStatusEntity, boolean>
            entity={{
              ...info.row.original,
              name: info.row.original.fullName,
              status: info.row.original.isActive,
            }}
            currentStatus={info.row.original.isActive}
            availableStatuses={[true, false]}
            getStatusConfig={getPartnerStatusConfig}
            onStatusChange={confirmStatusChange}
            onSameStatusSelected={(status) => {
              toast.error(
                `Status is already set to ${status ? "Active" : "Inactive"}.`,
              );
            }}
            entityType="partner"
            showConfirmation={true}
            confirmationTitle="Confirm Status Change"
            getConfirmationMessage={(partner, newStatus: boolean) =>
              newStatus
                ? `Are you sure you want to activate partner "${partner.fullName}"? This will restore their access to the system.`
                : `Are you sure you want to deactivate ${partner.fullName}?

This action will immediately freeze their inventory and all connected Foddermen. To continue smooth supply chain operations, please select a replacement Partner for this district before proceeding.

This action will update the partner's status immediately.`
            }
          />
        ),
        size: 110,
      },
      {
        id: "actions",
        header: ({ column }) => (
          <DataGridColumnHeader title="Actions" column={column} />
        ),
        cell: ({ row }) => (
          <RowActionsMenu
            items={[
              {
                key: "resend-activation",
                label: "Resend Activation Email",
                actionType: "view",
                icon: RefreshCw,
                hidden: row.original.forcePasswordChange,
                disabled: resendingPartnerId === row.original.id,
                onSelect: () => handleResendActivationEmail(row.original.id),
              },
              {
                label: "View Partner Details",
                actionType: "view",
                onSelect: () => {
                  setSelectedPartnerId(row.original.id);
                  setIsDetailsModalOpen(true);
                },
              },
              {
                label: "Edit Partner",
                actionType: "edit",
                asChild: true,
                children: <Link to={`/admin/partners/edit/${row.original.id}`} />,
              },
              {
                label: "Partner allocations",
                actionType: "view",
                icon: Package,
                asChild: true,
                children: <Link to={`/admin/partners/${row.original.id}/allocations`} />,
              },
            ]}
          />
        ),
        size: 72,
      },
    ],
    [confirmStatusChange, districtNameMap, handleResendActivationEmail, resendingPartnerId],
  );

  const table = useReactTable({
    columns,
    data: filteredPartners,
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
          <CardHeader className="flex flex-col gap-3 shrink-0 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center xl:flex-1">
              <CardTitle className="text-xl flex items-center gap-2 whitespace-nowrap shrink-0">
                <Handshake className="h-5 w-5 text-primary" />
                Partners
              </CardTitle>

              <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                tooltip="Search by name, email, mobile, and company name"
                className="w-full sm:max-w-[280px] xl:max-w-[300px] 2xl:max-w-[340px]"
                inputClassName="h-9 text-[13px]"
              />
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 xl:shrink-0 2xl:flex-nowrap">
              <div className="w-[145px]">
                <SearchableSelect
                  options={stateOptions}
                  value={stateFilter}
                  onValueChange={setStateFilter}
                  placeholder="All States"
                  searchPlaceholder="Search State..."
                  searchInputClassName="text-xs placeholder:text-xs"
                  disabled={isLoadingStates}
                  triggerClassName="h-9 bg-background text-[13px]"
                />
              </div>

              <div className="w-[145px]">
                <SearchableSelect
                  options={districtOptions}
                  value={districtFilter}
                  onValueChange={setDistrictFilter}
                  placeholder={
                    stateFilter ? "All Districts" : "Select state first"
                  }
                  searchPlaceholder="Search District..."
                  searchInputClassName="text-xs placeholder:text-xs"
                  disabled={!stateFilter || isLoadingDistricts}
                  triggerClassName="h-9 bg-background text-[13px]"
                />
              </div>

              <div className="w-[120px]">
                <SearchableSelect
                  options={statusOptions}
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                  placeholder="Status"
                  searchPlaceholder="Search Status..."
                  searchInputClassName="text-xs placeholder:text-xs"
                  isClearable={false}
                  triggerClassName="h-9 bg-background text-[13px]"
                />
              </div>

              <Button
                variant="outline"
                onClick={handleReset}
                className="h-8.5 gap-1 px-2.5 text-[13px] font-semibold border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/50 transition-all"
                disabled={
                  !searchTerm &&
                  !stateFilter &&
                  !districtFilter &&
                  statusFilter === "all" &&
                  sorting.length === 1 &&
                  sorting[0]?.id === "createdAt" &&
                  sorting[0]?.desc === true
                }
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>

              <ActionButton
                actionType="add"
                showIconOnly={false}
                iconClassName="mr-1"
                className="h-8.5 min-w-[90px] gap-0 px-2.5 text-[13px] font-semibold shadow-sm hover:translate-y-0"
                asChild
              >
                <Link to="/admin/partners/create">Create</Link>
              </ActionButton>
            </div>
          </CardHeader>
          <CardTable className="min-h-0 flex-1 overflow-hidden">
            <DataGrid
              table={table}
              recordCount={filteredPartners.length}
              isLoading={isLoading}
              emptyMessage="No records found."
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
                className="max-h-[78vh]"
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

      <DistrictsModal
        isOpen={isDistrictsModalOpen}
        onOpenChange={setIsDistrictsModalOpen}
        partner={selectedPartner}
        districtNameMap={districtNameMap}
      />
      <PartnerDetailModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        partnerId={selectedPartnerId}
      />

    </Container>
  );
}
