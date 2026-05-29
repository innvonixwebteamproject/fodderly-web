import {
  ColumnDef,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { Circle, Filter, Info, RotateCcw, UserRoundCog, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Container } from "@/components/common/container";
import { SearchInput } from "@/components/common/search-input";
import { TruncatedCell } from "@/components/common/truncated-cell";
import { getApiSortParams } from "@/lib/api-sorting";
import { ActionButton } from "@/components/common/action-button";
import { RowActionsMenu } from "@/components/common/row-actions-menu";
import { InfiniteScrollContainer } from "@/components/common/infinite-scroll-container";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTable, CardTitle } from "@/components/ui/card";
import { DataGrid } from "@/components/ui/data-grid";
import { DataGridColumnHeader } from "@/components/ui/data-grid-column-header";
import { DataGridTable } from "@/components/ui/data-grid-table";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { StatusConfig, StatusDropdown } from "@/components/common/status-dropdown";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { usePartnerDistrictsQuery, usePartnerStatesQuery } from "@/features/partner-management";
import {
  useFoddermanOptionsQuery,
  useFarmerToggleStatusMutation,
  useFarmersInfiniteQuery,
  useTalukaOptionsQuery,
  useVillageOptionsQuery,
} from "../hooks";
import type { IFarmer } from "../types/farmer.types";
import { AssignFoddermanModal } from "../components/AssignFoddermanModal";
import { FarmerDetailModal } from "../components/FarmerDetailModal";

const statusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

type FarmerStatusEntity = Omit<IFarmer, "status"> & {
  name: string;
  status: boolean;
};

const formatCreatedDate = (value?: string) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return format(date, "dd/MM/yyyy");
};

const getFarmerStatusConfig = (status: boolean): StatusConfig => {
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

export function FarmerListPage() {
  const role = useAuthStore((state) => state.role);
  const isPartnerUser = role === "partner";
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);
  const [stateFilter, setStateFilter] = useState("");
  const [districtFilter, setDistrictFilter] = useState("");
  const [talukaFilter, setTalukaFilter] = useState("");
  const [villageFilter, setVillageFilter] = useState("");
  const [foddermanFilter, setFoddermanFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState<IFarmer | null>(null);
  const [selectedFarmerId, setSelectedFarmerId] = useState<string | null>(null);

  const { data: statesResponse, isLoading: isLoadingStates } = usePartnerStatesQuery();
  const { data: districtsResponse, isLoading: isLoadingDistricts } =
    usePartnerDistrictsQuery(stateFilter || undefined, Boolean(stateFilter));

  const { data: talukas } = useTalukaOptionsQuery(districtFilter || undefined);
  const { data: villages, isLoading: isLoadingVillages } = useVillageOptionsQuery(
    talukaFilter || undefined,
    districtFilter || undefined,
    stateFilter || undefined,
  );
  const { data: foddermen, isLoading: isLoadingFoddermen } = useFoddermanOptionsQuery({
    stateId: stateFilter || undefined,
    districtId: districtFilter || undefined,
    talukaId: talukaFilter || undefined,
    villageId: villageFilter || undefined,
  });

  const farmerStatus =
    statusFilter === "" ? undefined : (statusFilter as "active" | "inactive");
  const { sortBy, sortOrder } = getApiSortParams({
    sorting,
    defaultSortBy: "createdAt" as const,
    columnToSortByMap: {
      name: "fullName",
      mobile: "mobile",
      createdAt: "createdAt",
    },
  });

  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useFarmersInfiniteQuery(debouncedSearchTerm, {
    stateId: stateFilter || undefined,
    districtId: districtFilter || undefined,
    talukaId: talukaFilter || undefined,
    villageId: villageFilter || undefined,
    foddermanId: foddermanFilter || undefined,
    status: farmerStatus,
    sortBy,
    sortOrder,
  });

  const statusMutation = useFarmerToggleStatusMutation();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
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

  const states = useMemo(() => statesResponse?.data ?? [], [statesResponse?.data]);
  const districts = useMemo(() => districtsResponse?.data ?? [], [districtsResponse?.data]);

  useEffect(() => {
    if (!isPartnerUser || districtFilter || districts.length !== 1) return;
    setDistrictFilter(districts[0].id);
  }, [isPartnerUser, districtFilter, districts]);

  const stateOptions = useMemo(
    () => states.map((state) => ({ value: state.id, label: state.name })),
    [states],
  );

  const districtOptions = useMemo(
    () => districts.map((district) => ({ value: district.id, label: district.name })),
    [districts],
  );

  const talukaOptions = useMemo(() => talukas ?? [], [talukas]);
  const villageOptions = useMemo(() => villages ?? [], [villages]);
  const foddermanOptions = useMemo(() => foddermen ?? [], [foddermen]);

  const farmers = useMemo(() => data?.pages.flatMap((pageData) => pageData.data) ?? [], [data]);

  const confirmStatusChange = useCallback(
    async (farmer: FarmerStatusEntity, newStatus: boolean) => {
      if (farmer.isActive === newStatus) {
        toast.error(`Status is already set to ${newStatus ? "Active" : "Inactive"}.`);
        return;
      }

      await statusMutation.mutateAsync(farmer.id);
    },
    [statusMutation],
  );

  const handleOpenAssignModal = useCallback((farmer: IFarmer) => {
    setSelectedFarmer(farmer);
    setIsAssignModalOpen(true);
  }, []);

  const handleOpenDetailModal = useCallback((farmerId: string) => {
    setSelectedFarmerId(farmerId);
    setIsDetailModalOpen(true);
  }, []);

  const handleReset = () => {
    setSearchTerm("");
    setDebouncedSearchTerm("");
    setStateFilter("");
    setDistrictFilter("");
    setTalukaFilter("");
    setVillageFilter("");
    setFoddermanFilter("");
    setStatusFilter("");
    setSorting([{ id: "createdAt", desc: true }]);
  };

  const activeFilterCount = [
    stateFilter,
    districtFilter,
    talukaFilter,
    villageFilter,
    foddermanFilter,
    statusFilter,
  ].filter(Boolean).length;

  const columns = useMemo<ColumnDef<IFarmer>[]>(() => {
    const baseColumns: ColumnDef<IFarmer>[] = [
      {
        id: "serial",
        header: ({ column }) => <DataGridColumnHeader title="Sr." column={column} />,
        cell: ({ row }) => row.index + 1,
        size: 58,
      },
      {
        id: "name",
        accessorFn: (row) => row.fullName,
        header: ({ column }) => <DataGridColumnHeader title="Full Name" column={column} />,
        enableSorting: true,
        cell: ({ row }) => <TruncatedCell value={row.original.fullName} className="font-medium" />,
        size: 160,
      },
      {
        id: "mobile",
        accessorFn: (row) => row.mobile,
        header: ({ column }) => <DataGridColumnHeader title="Mobile" column={column} />,
        enableSorting: true,
        cell: ({ row }) => <TruncatedCell value={row.original.mobile} maxWidth="max-w-[120px]" />,
        size: 120,
      },
      {
        id: "location",
        accessorFn: (row) =>
          [row.villageName, row.talukaName, row.districtName, row.stateName]
            .filter(Boolean)
            .join(", "),
        header: ({ column }) => <DataGridColumnHeader title="Location" column={column} />,
        enableSorting: false,
        cell: ({ row }) => {
          const value = [
            row.original.villageName,
            row.original.talukaName,
            row.original.districtName,
            row.original.stateName,
          ]
            .filter(Boolean)
            .join(", ");
          return <TruncatedCell value={value || "-"} maxWidth="max-w-[240px]" alwaysShowTooltip />;
        },
        size: 240,
      },
      {
        id: "assignedFodderman",
        accessorFn: (row) => row.foddermanName || "",
        header: ({ column }) => (
          <DataGridColumnHeader title="Assigned Fodderman" column={column} />
        ),
        enableSorting: false,
        cell: ({ row }) => {
          if (!row.original.foddermanName) {
            return <span className="text-muted-foreground italic">-</span>;
          }
          return <TruncatedCell value={row.original.foddermanName} maxWidth="max-w-[200px]" />;
        },
        size: 200,
      },
      {
        id: "assignedPartner",
        accessorFn: (row) => row.partnerName || "",
        header: ({ column }) => <DataGridColumnHeader title="Assigned Partner" column={column} />,
        enableSorting: false,
        cell: ({ row }) =>
          row.original.partnerName ? (
            <TruncatedCell value={row.original.partnerName} maxWidth="max-w-[180px]" />
          ) : (
            <span className="text-muted-foreground italic">-</span>
          ),
        size: 180,
      },
      {
        id: "registrationSource",
        accessorFn: (row) => row.registrationSource,
        header: ({ column }) => (
          <DataGridColumnHeader title="Registration Source" column={column} />
        ),
        enableSorting: false,
        cell: ({ row }) => row.original.registrationSource,
        size: 130,
      },
      {
        id: "createdAt",
        accessorFn: (row) => row.createdAt,
        header: ({ column }) => <DataGridColumnHeader title="Created Date" column={column} />,
        enableSorting: true,
        cell: ({ row }) => formatCreatedDate(row.original.createdAt),
        size: 120,
      },
      {
        id: "status",
        accessorFn: (row) => row.isActive,
        header: ({ column }) => <DataGridColumnHeader title="Status" column={column} />,
        enableSorting: false,
        cell: ({ row }) => (
          <StatusDropdown<FarmerStatusEntity, boolean>
            entity={{ ...row.original, name: row.original.fullName, status: row.original.isActive }}
            currentStatus={row.original.isActive}
            availableStatuses={[true, false]}
            getStatusConfig={getFarmerStatusConfig}
            onStatusChange={confirmStatusChange}
            onSameStatusSelected={(status) => {
              toast.error(`Status is already set to ${status ? "Active" : "Inactive"}.`);
            }}
            entityType="farmer"
            readOnly={isPartnerUser}
            showConfirmation={true}
            confirmationTitle="Confirm Status Change"
            getConfirmationMessage={(farmer, newStatus) =>
              `Are you sure you want to ${newStatus ? "activate" : "deactivate"} farmer "${farmer.fullName}"?`
            }
          />
        ),
        size: 110,
      },
    ];

    baseColumns.push({
      id: "actions",
      header: ({ column }) => <DataGridColumnHeader title="Actions" column={column} />,
      cell: ({ row }) => (
        <RowActionsMenu
          items={[
            {
              label: "View Farmer Details",
              actionType: "view",
              onSelect: () => handleOpenDetailModal(row.original.id),
            },
            {
              label: "Edit Farmer",
              actionType: "edit",
              hidden: isPartnerUser,
              asChild: true,
              children: <Link to={`/admin/farmers/edit/${row.original.id}`} />,
            },
            {
              label: "Assign / Reassign Fodderman",
              actionType: "view",
              icon: UserRoundCog,
              hidden: isPartnerUser,
              onSelect: () => handleOpenAssignModal(row.original),
            },
          ]}
        />
      ),
      enableSorting: false,
      size: isPartnerUser ? 72 : 72,
    });

    return baseColumns;
  }, [confirmStatusChange, handleOpenAssignModal, handleOpenDetailModal, isPartnerUser]);

  const table = useReactTable({
    columns,
    data: farmers,
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
                <Users className="h-5 w-5 text-primary" />
                Farmers
              </CardTitle>

              <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                tooltip="Search by full name, mobile number, and village"
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
                        <p>Filter records by State, District, Taluka, Village, Fodderman, or Status.</p>
                      </TooltipContent>
                    </Tooltip>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[760px]">
                  <DialogHeader>
                    <DialogTitle>Farmer Filters</DialogTitle>
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
                      disabled={!stateFilter || !districtFilter}
                      triggerClassName="h-9 bg-background text-[13px]"
                    />
                    <SearchableSelect
                      options={villageOptions}
                      value={villageFilter}
                      onValueChange={setVillageFilter}
                      placeholder={talukaFilter ? "All Villages" : "Select taluka first"}
                      searchPlaceholder="Search Village..."
                      searchInputClassName="text-xs placeholder:text-xs"
                      disabled={!talukaFilter || isLoadingVillages}
                      triggerClassName="h-9 bg-background text-[13px]"
                    />
                    <SearchableSelect
                      options={foddermanOptions}
                      value={foddermanFilter}
                      onValueChange={setFoddermanFilter}
                      placeholder="All Fodderman"
                      searchPlaceholder="Search Fodderman..."
                      searchInputClassName="text-xs placeholder:text-xs"
                      disabled={isLoadingFoddermen}
                      triggerClassName="h-9 bg-background text-[13px]"
                      contentClassName="!w-[280px]"
                    />
                    <SearchableSelect
                      options={statusOptions}
                      value={statusFilter}
                      onValueChange={setStatusFilter}
                      placeholder="All Status"
                      searchPlaceholder="Search Status..."
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
                  !villageFilter &&
                  !foddermanFilter &&
                  !statusFilter &&
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
                  className="h-8.5 text-[13px] font-semibold shadow-sm hover:translate-y-0"
                  asChild
                >
                  <Link to="/admin/farmers/create">Create</Link>
                </ActionButton>
              )}
            </div>
          </CardHeader>

          <CardTable className="min-h-0 flex-1 overflow-hidden">
            <DataGrid
              table={table}
              recordCount={farmers.length}
              isLoading={isLoading}
              emptyMessage="No farmers found."
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

      {!isPartnerUser && (
        <>
          <AssignFoddermanModal
            farmer={selectedFarmer}
            open={isAssignModalOpen}
            onOpenChange={setIsAssignModalOpen}
          />
        </>
      )}
      <FarmerDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        farmerId={selectedFarmerId}
      />
    </Container>
  );
}
