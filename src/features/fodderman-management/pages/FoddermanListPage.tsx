import {
  ColumnDef,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { useInfiniteQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useMemo, useState, useEffect, useCallback } from "react";
import { Circle, Filter, Info, RotateCcw, UserCheck } from "lucide-react";
import { ActionButton } from "@/components/common/action-button";
import { RowActionsMenu } from "@/components/common/row-actions-menu";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { getApiSortParams } from "@/lib/api-sorting";
import { Container } from "@/components/common/container";
import { SearchInput } from "@/components/common/search-input";
import { TruncatedCell } from "@/components/common/truncated-cell";
import { DataGrid } from "@/components/ui/data-grid";
import { DataGridColumnHeader } from "@/components/ui/data-grid-column-header";
import { DataGridTable } from "@/components/ui/data-grid-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardHeader, CardTable, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  StatusConfig,
  StatusDropdown,
} from "@/components/common/status-dropdown";
import {
  useFoddermenInfiniteQuery,
  useUpdateFoddermanStatusMutation,
} from "../hooks";
import { getFarmers } from "@/features/farmer-management/services/farmer.api";
import type { IFarmer } from "@/features/farmer-management/types/farmer.types";
import { InfiniteScrollContainer } from "@/components/common/infinite-scroll-container";
import { IFodderman } from "../types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { STATUS_OPTIONS } from "../constants";
import {
  usePartnerDistrictsQuery,
  usePartnerStatesQuery,
  usePartnersQuery,
} from "@/features/partner-management/hooks";
import { useTalukaOptionsQuery } from "@/features/farmer-management/hooks/useFarmerGeoStubs";
import { useAuthStore } from "@/features/auth/store/auth.store";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FoddermanDetailModal } from "../components/FoddermanDetailModal";

export const getFoddermanStatusConfig = (status: boolean): StatusConfig => {
  if (status) {
    return {
      label: "Active",
      variant: "success",
      color: "text-emerald-700 dark:text-emerald-300",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/20",
      borderColor: "border-emerald-200 dark:border-emerald-800/80",
      icon: <Circle className="h-2 w-2 fill-current" />,
    };
  }

  return {
    label: "Inactive",
    variant: "warning",
    color: "text-rose-700 dark:text-rose-300",
    bgColor: "bg-rose-50 dark:bg-rose-950/20",
    borderColor: "border-rose-200 dark:border-rose-800/80",
    icon: <Circle className="h-2 w-2 fill-current" />,
  };
};

type FoddermanStatusEntity = Omit<IFodderman, "status"> & {
  name: string;
  status: boolean;
};

interface VillagesModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  fodderman: IFodderman | null;
}

function VillagesModal({ isOpen, onOpenChange, fodderman }: VillagesModalProps) {
  if (!fodderman) return null;

  const villageNames =
    fodderman.allocatedVillages && fodderman.allocatedVillages.length > 0
      ? fodderman.allocatedVillages.filter(Boolean)
      : fodderman.villages && fodderman.villages.length > 0
      ? fodderman.villages.map((village) => village.name).filter(Boolean)
      : fodderman.villageIds.filter(Boolean);

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            Assigned Villages
          </AlertDialogTitle>
          <AlertDialogDescription>
            {villageNames.length === 1 ? "Assigned village" : "Assigned villages"} for{" "}
            <strong>{fodderman.fullName}</strong>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
          {villageNames.length > 0 ? (
            <div className="grid grid-cols-2 gap-2 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
              {villageNames.map((name, index) => (
                <div
                  key={`${name}-${index}`}
                  className="flex items-center gap-2 p-2 rounded-md bg-muted/50 text-sm font-medium border border-border/50"
                >
                  <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  <span className="truncate">{name}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No villages assigned.</p>
          )}
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

interface FarmersModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  fodderman: IFodderman | null;
}

function FarmersModal({ isOpen, onOpenChange, fodderman }: FarmersModalProps) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ["fodderman-farmers", fodderman?.id],
    queryFn: ({ pageParam = 1 }) =>
      getFarmers(pageParam, 20, undefined, {
        foddermanId: fodderman?.id,
        sortBy: "createdAt",
        sortOrder: "DESC",
      }),
    enabled: isOpen && !!fodderman?.id,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.meta.page < lastPage.meta.totalPages) {
        return lastPage.meta.page + 1;
      }
      return undefined;
    },
  });

  const farmers = data?.pages.flatMap((page) => page.data) || [];

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    if (target.scrollTop + target.clientHeight >= target.scrollHeight - 50) {
      if (hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Assigned Farmers</DialogTitle>
        </DialogHeader>

        <DialogBody className="min-h-0">
          {isLoading ? (
            <div className="flex min-h-[160px] items-center justify-center rounded-md border bg-muted/30">
              <p className="text-sm text-muted-foreground">Loading farmers...</p>
            </div>
          ) : farmers.length === 0 ? (
            <div className="flex min-h-[160px] items-center justify-center rounded-md border bg-muted/30">
              <p className="text-sm text-muted-foreground">No farmers assigned</p>
            </div>
          ) : (
            <Table
              wrapperClassName="max-h-[70vh] custom-scrollbar rounded-md border"
              className="text-[12px]"
              onScroll={handleScroll}
            >
              <TableHeader>
                <TableRow className="[&>th]:h-9 [&>th]:px-2.5">
                  <TableHead className="text-xs font-semibold">#</TableHead>
                  <TableHead className="text-xs font-semibold">Farmer Name</TableHead>
                  <TableHead className="text-xs font-semibold">Mobile Number</TableHead>
                  <TableHead className="text-xs font-semibold">Village</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {farmers.map((farmer: IFarmer, index: number) => (
                  <TableRow key={farmer.id} className="[&>td]:px-2.5 [&>td]:py-2">
                    <TableCell className="text-[12px] font-medium">{index + 1}</TableCell>
                    <TableCell className="text-[12px] font-medium">{farmer.fullName}</TableCell>
                    <TableCell className="text-[12px] font-normal">{farmer.phone || "—"}</TableCell>
                    <TableCell className="text-[12px] font-normal">{farmer.villageName || "—"}</TableCell>
                  </TableRow>
                ))}
                {isFetchingNextPage && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4">
                      <p className="text-xs text-muted-foreground">Loading more farmers...</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

export function FoddermanListPage() {
  const role = useAuthStore((state) => state.role);
  const isPartnerUser = role === "partner";
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);
  const [stateFilter, setStateFilter] = useState("");
  const [districtFilter, setDistrictFilter] = useState("");
  const [talukaFilter, setTalukaFilter] = useState("");
  const [partnerFilter, setPartnerFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isVillagesModalOpen, setIsVillagesModalOpen] = useState(false);
  const [isFarmersModalOpen, setIsFarmersModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedVillagesFodderman, setSelectedVillagesFodderman] = useState<IFodderman | null>(
    null,
  );
  const [selectedFarmersFodderman, setSelectedFarmersFodderman] = useState<IFodderman | null>(
    null,
  );
  const [selectedFoddermanId, setSelectedFoddermanId] = useState<string | null>(null);
  const { data: statesResponse, isLoading: isLoadingStates } = usePartnerStatesQuery();
  const { data: districtsResponse, isLoading: isLoadingDistricts } = usePartnerDistrictsQuery(
    stateFilter || undefined,
    Boolean(stateFilter),
  );
  const { data: talukasResponse, isLoading: isLoadingTalukas } = useTalukaOptionsQuery(
    districtFilter || undefined,
  );
  const { data: partnersData, isLoading: isLoadingPartners } = usePartnersQuery(
    1,
    100,
    undefined,
    "active",
    districtFilter || undefined,
    undefined,
    undefined,
    { enabled: !isPartnerUser },
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setDistrictFilter("");
    setTalukaFilter("");
    setPartnerFilter("");
  }, [stateFilter]);

  useEffect(() => {
    setTalukaFilter("");
    setPartnerFilter("");
  }, [districtFilter]);

  const currentStatus = statusFilter === "all" ? undefined : (statusFilter as "active" | "inactive");
  const { sortBy, sortOrder } = getApiSortParams({
    sorting,
    defaultSortBy: "createdAt",
    columnToSortByMap: {
      name: "firstName",
      createdAt: "createdAt",
      lastName: "lastName",
    },
  });

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isFetching,
  } = useFoddermenInfiniteQuery(debouncedSearchTerm, {
    stateId: stateFilter || undefined,
    districtId: districtFilter || undefined,
    talukaId: talukaFilter || undefined,
    partnerId: !isPartnerUser ? partnerFilter || undefined : undefined,
    status: currentStatus,
    sortBy,
    sortOrder,
  });

  const statusMutation = useUpdateFoddermanStatusMutation();

  const handleStatusChange = useCallback(
    async (fodderman: FoddermanStatusEntity, newStatus: boolean) => {
      if (fodderman.isActive === newStatus) {
        toast.error(`Status is already set to ${newStatus ? "Active" : "Inactive"}.`);
        return;
      }
      await statusMutation.mutateAsync({
        id: fodderman.id,
        status: newStatus,
      });
    },
    [statusMutation],
  );

  const handleReset = () => {
    setSearchTerm("");
    setStateFilter("");
    setDistrictFilter("");
    setTalukaFilter("");
    setPartnerFilter("");
    setStatusFilter("all");
    setSorting([{ id: "createdAt", desc: true }]);
  };

  const foddermen: IFodderman[] = useMemo(() => {
    return data?.pages.flatMap((page) => page.data) || [];
  }, [data]);

  const states = useMemo(() => statesResponse?.data ?? [], [statesResponse?.data]);
  const districts = useMemo(() => districtsResponse?.data ?? [], [districtsResponse?.data]);
  const talukaOptions = useMemo(() => talukasResponse ?? [], [talukasResponse]);
  const partnerOptions = useMemo(
    () =>
      (partnersData?.data || []).map((partner) => {
        const name = partner.fullName || `${partner.firstName || ""} ${partner.lastName || ""}`.trim();
        return {
          label: partner.phone ? `${name} (${partner.phone})` : name,
          value: partner.id,
        };
      }),
    [partnersData?.data],
  );

  useEffect(() => {
    if (!isPartnerUser || districtFilter || districts.length !== 1) return;
    setDistrictFilter(districts[0].id);
  }, [isPartnerUser, districtFilter, districts]);

  const stateOptions = useMemo(
    () => states.map((state) => ({ label: state.name, value: state.id })),
    [states],
  );
  const districtOptions = useMemo(
    () => districts.map((district) => ({ label: district.name, value: district.id })),
    [districts],
  );

  const activeFilterCount = useMemo(
    () =>
      [
        stateFilter,
        districtFilter,
        talukaFilter,
        !isPartnerUser ? partnerFilter : "",
        statusFilter !== "all" ? statusFilter : "",
      ].filter(Boolean).length,
    [stateFilter, districtFilter, talukaFilter, partnerFilter, statusFilter, isPartnerUser],
  );

  const formatCreatedDate = (value?: string) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return format(date, "dd/MM/yyyy");
  };

  const columns = useMemo<ColumnDef<IFodderman>[]>(() => {
    const baseColumns: ColumnDef<IFodderman>[] = [
      {
        id: "serial",
        header: ({ column }) => <DataGridColumnHeader title="Sr No" column={column} />,
        // row.index is the index in the original data array; use sorted/display order for Sr No.
        cell: ({ row, table }) => {
          const position = table.getRowModel().rows.findIndex((r) => r.id === row.id);
          return position >= 0 ? position + 1 : "";
        },
        size: 70,
      },
      {
        id: "name",
        header: ({ column }) => <DataGridColumnHeader title="Full Name" column={column} />,
        accessorFn: (row) => `${row.firstName} ${row.lastName}`,
        enableSorting: true,
        cell: ({ row }) => (
          <TruncatedCell 
            value={`${row.original.firstName} ${row.original.lastName}`} 
            className="font-medium" 
            maxWidth="max-w-[200px]" 
          />
        ),
      },
      {
        id: "mobileNumber",
        accessorKey: "mobileNumber",
        header: ({ column }) => <DataGridColumnHeader title="Mobile Number" column={column} />,
        enableSorting: false,
        cell: ({ row }) => (
          <TruncatedCell value={row.original.mobileNumber} maxWidth="max-w-[150px]" />
        ),
      },
      {
        id: "villages",
        header: ({ column }) => <DataGridColumnHeader title="Allocated Villages" column={column} />,
        cell: ({ row }) => {
          const villageCount = row.original.totalAllocatedVillages ?? row.original.villageIds.length;

          if (!villageCount) {
            return <span className="text-[13px] text-muted-foreground">0 villages</span>;
          }

          return (
            <button
              onClick={() => {
                setSelectedVillagesFodderman(row.original);
                setIsVillagesModalOpen(true);
              }}
              className="group flex cursor-pointer items-center gap-1.5 text-primary transition-colors hover:text-primary/80"
            >
              <span className="font-semibold">
                {villageCount}
              </span>
              <span className="text-[13px]">
                villages
              </span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex shrink-0 cursor-pointer">
                      <Info className="h-3.5 w-3.5 opacity-40 transition-opacity group-hover:opacity-100" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Click to view all villages</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </button>
          );
        },
      },
      {
        id: "partner",
        header: ({ column }) => <DataGridColumnHeader title="Assigned Partner" column={column} />,
        cell: ({ row }) => (
          <TruncatedCell 
            value={row.original.partnerName || "-"} 
            className="text-[13px]" 
            maxWidth="max-w-[150px]" 
          />
        ),
      },
      {
        id: "farmers",
        header: ({ column }) => <DataGridColumnHeader title="Assigned Farmers" column={column} />,
        cell: ({ row }) => {
          const farmerCount = row.original.totalAllocatedFarmers ?? (row.original.farmers?.length || 0);

          if (!farmerCount) {
            return <span className="text-[13px] text-muted-foreground">0 farmers</span>;
          }

          return (
            <button
              onClick={() => {
                setSelectedFarmersFodderman(row.original);
                setIsFarmersModalOpen(true);
              }}
              className="group flex cursor-pointer items-center gap-1.5 text-primary transition-colors hover:text-primary/80"
            >
              <span className="font-semibold">
                {farmerCount}
              </span>
              <span className="text-[13px]">
                farmers
              </span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex shrink-0 cursor-pointer">
                      <Info className="h-3.5 w-3.5 opacity-40 transition-opacity group-hover:opacity-100" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Click to view all farmers</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </button>
          );
        },
      },
      {
        id: "location",
        accessorFn: (row) => `${row.districtName} ${row.talukaName}`.trim(),
        header: ({ column }) => <DataGridColumnHeader title="District / Taluka" column={column} />,
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex flex-col text-[13px]">
            <span className="text-[13px] font-medium">{row.original.districtName || "-"}</span>
            <span className="text-[13px] text-muted-foreground">{row.original.talukaName || "-"}</span>
          </div>
        ),
      },
      {
        id: "createdAt",
        accessorFn: (row) => row.createdAt || "",
        header: ({ column }) => <DataGridColumnHeader title="Created" column={column} />,
        enableSorting: true,
        cell: ({ row }) => formatCreatedDate(row.original.createdAt),
      },
      {
        id: "status",
        accessorKey: "status",
        header: ({ column }) => <DataGridColumnHeader title="Status" column={column} />,
        enableSorting: false,
        cell: (info) => (
          <StatusDropdown<FoddermanStatusEntity, boolean>
            entity={{
              ...info.row.original,
              name: info.row.original.fullName,
              status: info.row.original.isActive,
            }}
            currentStatus={info.row.original.isActive}
            availableStatuses={[true, false]}
            getStatusConfig={getFoddermanStatusConfig}
            onStatusChange={handleStatusChange}
            onSameStatusSelected={(status) => {
              toast.error(`Status is already set to ${status ? "Active" : "Inactive"}.`);
            }}
            entityType="fodderman"
            readOnly={isPartnerUser}
            showConfirmation={true}
            confirmationTitle="Confirm Status Change"
            getConfirmationMessage={(fodderman, newStatus: boolean) =>
              newStatus
                ? `Are you sure you want to activate ${fodderman.fullName}? This will restore their access to the system.`
                : `Are you sure you want to deactivate ${fodderman.fullName}?

This action will immediately freeze all connected Farmers. To continue smooth supply chain operations, please select a replacement Fodderman for this village before proceeding.

This action will update the fodderman's status immediately.`
            }
          />
        ),
      },
    ];

    baseColumns.push({
      id: "actions",
      header: ({ column }) => <DataGridColumnHeader title="Actions" column={column} />,
      cell: ({ row }) => (
        <RowActionsMenu
          items={[
            {
              label: "View Profile",
              actionType: "view",
              onSelect: () => {
                setSelectedFoddermanId(row.original.id);
                setIsDetailsModalOpen(true);
              },
            },
            {
              label: "Edit Profile",
              actionType: "edit",
              hidden: isPartnerUser,
              asChild: true,
              children: <Link to={`/admin/fodderman/edit/${row.original.id}`} />,
            },
          ]}
        />
      ),
      size: 72,
    });

    return baseColumns;
  }, [handleStatusChange, isPartnerUser]);

  const table = useReactTable({
    columns,
    data: foddermen,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { sorting },
    onSortingChange: setSorting,
  });

  return (
    <Container className="pb-8">
      <div className="flex h-full min-h-0 flex-col gap-6">
        <Card variant="listing" className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <CardHeader className="flex shrink-0 flex-row flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <CardTitle className="text-xl flex items-center gap-2 whitespace-nowrap shrink-0">
                <UserCheck className="h-6 w-6 text-primary" />
                {isFetching && !isFetchingNextPage ? "Loading..." : "Fodderman"}
              </CardTitle>
              <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                tooltip="Search by name or mobile number"
                className="w-full max-w-[280px] xl:max-w-[300px] 2xl:max-w-[340px]"
                inputClassName="h-9 text-[13px]"
              />
            </div>
            <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
              <Dialog open={isFilterModalOpen} onOpenChange={setIsFilterModalOpen}>
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
                        <p>
                          {isPartnerUser
                            ? "Filter by state, district, taluka, or status. Select a state before choosing a district."
                            : "Filter by state, district, taluka, partner, or status. Select a state before choosing a district."}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[760px]">
                  <DialogHeader>
                    <DialogTitle>Fodderman Filters</DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                    <SearchableSelect
                      options={districtOptions}
                      value={districtFilter}
                      onValueChange={setDistrictFilter}
                      placeholder={stateFilter ? "All Districts" : "Select state first"}
                      searchPlaceholder="Search District..."
                      searchInputClassName="text-xs placeholder:text-xs"
                      disabled={!stateFilter || isLoadingDistricts}
                      triggerClassName="h-9 bg-background text-[13px]"
                    />
                    <SearchableSelect
                      options={talukaOptions}
                      value={talukaFilter}
                      onValueChange={setTalukaFilter}
                      placeholder={
                        !stateFilter
                          ? "Select state first"
                          : !districtFilter
                            ? "Select district first"
                            : "All Talukas"
                      }
                      searchPlaceholder="Search Taluka..."
                      searchInputClassName="text-xs placeholder:text-xs"
                      disabled={!stateFilter || !districtFilter || isLoadingTalukas}
                      triggerClassName="h-9 bg-background text-[13px]"
                    />
                    {!isPartnerUser && (
                      <SearchableSelect
                        options={partnerOptions}
                        value={partnerFilter}
                        onValueChange={setPartnerFilter}
                        placeholder="All Partners"
                        searchPlaceholder="Search Partner..."
                        searchInputClassName="text-xs placeholder:text-xs"
                        disabled={isLoadingPartners}
                        triggerClassName="h-9 bg-background text-[13px]"
                        contentClassName="!w-[280px]"
                      />
                    )}
                    <SearchableSelect
                      options={[{ label: "All status", value: "all" }, ...STATUS_OPTIONS]}
                      value={statusFilter}
                      onValueChange={setStatusFilter}
                      placeholder="Status"
                      searchPlaceholder="Search Status..."
                      isClearable={false}
                      searchInputClassName="text-xs placeholder:text-xs"
                      triggerClassName="h-9 bg-background text-[13px]"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      variant="outline"
                      onClick={handleReset}
                      className="h-8.5 gap-1 px-2.5 text-[13px] font-semibold border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/50 transition-all"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Reset
                    </Button>
                    <Button
                      className="h-8.5 px-3 text-[13px] font-semibold"
                      onClick={() => setIsFilterModalOpen(false)}
                    >
                      Apply
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Button
                variant="outline"
                onClick={handleReset}
                className="h-8.5 gap-1 px-2.5 text-[13px] font-semibold border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/50 transition-all"
                disabled={
                  !searchTerm &&
                  !stateFilter &&
                  !districtFilter &&
                  !talukaFilter &&
                  !partnerFilter &&
                  statusFilter === "all" &&
                  sorting.length === 1 &&
                  sorting[0]?.id === "createdAt" &&
                  sorting[0]?.desc === true
                }
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>

              {!isPartnerUser && (
                <ActionButton
                  actionType="add"
                  showIconOnly={false}
                  iconClassName="mr-1"
                  className="h-8.5 min-w-[90px] gap-0 px-2.5 text-[13px] font-semibold shadow-sm hover:translate-y-0"
                  asChild
                >
                  <Link to="/admin/fodderman/create">Create</Link>
                </ActionButton>
              )}
            </div>
          </CardHeader>
          <CardTable className="min-h-0 flex-1 overflow-hidden">
            <DataGrid
              table={table}
              recordCount={foddermen.length}
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
                overflowX="auto"
                overflowY="auto"
              >
                <DataGridTable />
              </InfiniteScrollContainer>
            </DataGrid>
          </CardTable>
        </Card>
      </div>

      <VillagesModal
        isOpen={isVillagesModalOpen}
        onOpenChange={setIsVillagesModalOpen}
        fodderman={selectedVillagesFodderman}
      />
      <FarmersModal
        isOpen={isFarmersModalOpen}
        onOpenChange={setIsFarmersModalOpen}
        fodderman={selectedFarmersFodderman}
      />
      <FoddermanDetailModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        foddermanId={selectedFoddermanId}
      />
    </Container>
  );
}
