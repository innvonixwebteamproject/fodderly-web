import {
  ColumnDef,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { AlertCircle, Home, Loader2, RotateCcw, Upload } from "lucide-react";
import { format } from "date-fns";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ActionButton } from "@/components/common/action-button";
import { Container } from "@/components/common/container";
import { SearchInput } from "@/components/common/search-input";
import { InfiniteScrollContainer } from "@/components/common/infinite-scroll-container";
import { TruncatedCell } from "@/components/common/truncated-cell";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTable, CardTitle } from "@/components/ui/card";
import { DataGrid } from "@/components/ui/data-grid";
import { DataGridColumnHeader } from "@/components/ui/data-grid-column-header";
import { DataGridTable } from "@/components/ui/data-grid-table";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useVillagesInfiniteQuery, useVillageMutation } from "../hooks/use-village-queries";
import { uploadVillageExcel, downloadVillageExcel, streamVillageImport, downloadVillageImportErrorSheet } from "../services/village.api";

import { useStatesInfiniteQuery } from "../../states-management/hooks/use-state-queries";
import { useDistrictsQuery } from "../../districts-management/hooks/use-district-queries";
import { useTalukasQuery } from "../../talukas-management/hooks/use-taluka-queries";
import { VillageForm } from "../components/VillageForm";
import { CommonExcelUploadModal } from "../../components/CommonExcelUploadModal";
import { VillageItem, VillageFormValues } from "../types";
import { toast } from "sonner";
import { getApiSortParams } from "@/lib/api-sorting";

export function VillageListPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);
  const [stateFilter, setStateFilter] = useState("");
  const [districtFilter, setDistrictFilter] = useState("");
  const [talukaFilter, setTalukaFilter] = useState("");
  const [selectedVillage, setSelectedVillage] = useState<VillageItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [viewOnly, setViewOnly] = useState(false);
  const [lastErrorJobId, setLastErrorJobId] = useState<string | null>(
    localStorage.getItem('LAST_IMPORT_ERROR_JOB_ID_VILLAGE')
  );
  const [isDownloadingErrors, setIsDownloadingErrors] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchTerm(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: statesData } = useStatesInfiniteQuery({
    prefetchAllPages: true,
    limit: 100,
    sortBy: "name",
    sortOrder: "ASC",
  });
  const stateOptions = useMemo(
    () =>
      statesData?.pages.flatMap((p) =>
        p.data.map((s) => ({
          value: s.id,
          label:
            s.translations?.en || (typeof s.name === "string" ? s.name : s.name?.en) || "",
        })),
      ) || [],
    [statesData],
  );

  const { data: districtsData, isLoading: isLoadingDistricts } = useDistrictsQuery({ stateId: stateFilter || undefined });
  const districtOptions = useMemo(
    () =>
      (districtsData?.data || []).map((d) => ({
        value: d.id,
        label: d.translations?.en || (typeof d.name === "string" ? d.name : d.name?.en) || "",
      })),
    [districtsData],
  );

  const { data: talukasData, isLoading: isLoadingTalukas } = useTalukasQuery({
    stateId: stateFilter || undefined,
    districtId: districtFilter || undefined,
  });
  const talukaOptions = useMemo(
    () =>
      (talukasData?.data || []).map((t) => ({
        value: t.id,
        label: t.translations?.en || (typeof t.name === "string" ? t.name : t.name?.en) || "",
      })),
    [talukasData],
  );

  const { sortBy, sortOrder } = getApiSortParams({
    sorting,
    defaultSortBy: "createdAt" as const,
    columnToSortByMap: {
      name: "name",
      createdAt: "createdAt",
    },
  });

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useVillagesInfiniteQuery({
      search: debouncedSearchTerm,
      stateId: stateFilter || undefined,
      districtId: districtFilter || undefined,
      talukaId: talukaFilter || undefined,
      sortBy,
      sortOrder,
    });

  const formatCreatedDate = (value?: string) => {
    if (!value) return "-";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "-";
    return format(parsed, "dd MMM, yyyy");
  };

  // Build sets from already-fetched dropdown data for reliable client-side filtering
  const stateDistrictIdSet = useMemo(() =>
    new Set((districtsData?.data || []).map(d => d.id)),
    [districtsData]
  );
  const districtTalukaIdSet = useMemo(() =>
    new Set((talukasData?.data || []).map(t => t.id)),
    [talukasData]
  );

  const villagesData = useMemo(() => {
    const allVillages = data?.pages.flatMap(p => p.data) || [];
    return allVillages.filter(v => {
      // Filter by state: stateId if available, else check districtId belongs to state's districts
      if (stateFilter) {
        const matchesState = v.stateId
          ? v.stateId === stateFilter
          : stateDistrictIdSet.size > 0 && stateDistrictIdSet.has(v.districtId);
        if (!matchesState) return false;
      }
      // Filter by district: districtId if available, else check talukaId belongs to district's talukas
      if (districtFilter) {
        const matchesDistrict = v.districtId
          ? v.districtId === districtFilter
          : districtTalukaIdSet.size > 0 && districtTalukaIdSet.has(v.talukaId);
        if (!matchesDistrict) return false;
      }
      // Filter by taluka
      if (talukaFilter && v.talukaId && v.talukaId !== talukaFilter) return false;
      return true;
    });
  }, [data, stateFilter, districtFilter, talukaFilter, stateDistrictIdSet, districtTalukaIdSet]);

  const mutation = useVillageMutation(selectedVillage?.id, () => {
    setIsDialogOpen(false);
    setSelectedVillage(null);
  });

  const columns = useMemo<ColumnDef<VillageItem>[]>(() => [
    {
      id: "serial",
      header: ({ column }) => <DataGridColumnHeader title="Sr." column={column} />,
      cell: ({ row }) => row.index + 1,
      enableSorting: false,
      size: 60,
    },
    {
      id: "name",
      accessorFn: (row) => row.translations?.en || (typeof row.name === "string" ? row.name : row.name?.en),
      header: ({ column }) => <DataGridColumnHeader title="Name" column={column} />,
      cell: ({ row }) => (
        <TruncatedCell value={row.original.translations?.en || (typeof row.original.name === "string" ? row.original.name : row.original.name?.en) || "-"} className="font-medium" maxWidth="max-w-[200px]" />
      ),
      size: 200,
    },
    {
      id: "talukaName",
      accessorFn: (row) => (typeof row.talukaName === "string" ? row.talukaName : row.talukaName?.en),
      header: ({ column }) => <DataGridColumnHeader title="Taluka" column={column} />,
      enableSorting: false,
      cell: ({ row }) => <TruncatedCell value={(typeof row.original.talukaName === "string" ? row.original.talukaName : row.original.talukaName?.en) || "-"} maxWidth="max-w-[120px]" />,
      size: 120,
    },
    {
      id: "districtName",
      accessorFn: (row) => (typeof row.districtName === "string" ? row.districtName : row.districtName?.en),
      header: ({ column }) => <DataGridColumnHeader title="District" column={column} />,
      enableSorting: false,
      cell: ({ row }) => <TruncatedCell value={(typeof row.original.districtName === "string" ? row.original.districtName : row.original.districtName?.en) || "-"} maxWidth="max-w-[120px]" />,
      size: 120,
    },
    {
      id: "stateName",
      accessorFn: (row) => (typeof row.stateName === "string" ? row.stateName : row.stateName?.en),
      header: ({ column }) => <DataGridColumnHeader title="State" column={column} />,
      enableSorting: false,
      cell: ({ row }) => <TruncatedCell value={(typeof row.original.stateName === "string" ? row.original.stateName : row.original.stateName?.en) || "-"} maxWidth="max-w-[120px]" />,
      size: 120,
    },
    {
      id: "createdAt",
      accessorFn: (row) => row.createdAt || "",
      header: ({ column }) => <DataGridColumnHeader title="Created" column={column} />,
      enableSorting: true,
      cell: ({ row }) => formatCreatedDate(row.original.createdAt),
      size: 140,
    },
    {
      id: "actions",
      header: ({ column }) => <DataGridColumnHeader title="Actions" column={column} />,
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <ActionButton actionType="view" tooltip="View Village" onClick={() => { setSelectedVillage(row.original); setViewOnly(true); setIsDialogOpen(true); }} />
          <ActionButton actionType="edit" tooltip="Edit Village" onClick={() => { setSelectedVillage(row.original); setViewOnly(false); setIsDialogOpen(true); }} />
        </div>
      ),
      size: 100,
    },
  ], []);

  const table = useReactTable({
    data: villagesData,
    columns,
    getSortedRowModel: getSortedRowModel(),
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    state: { sorting },
    onSortingChange: setSorting,
    columnResizeMode: "onChange",
  });

  const handleReset = useCallback(() => {
    setSearchTerm("");
    setStateFilter("");
    setDistrictFilter("");
    setTalukaFilter("");
    setSorting([{ id: "createdAt", desc: true }]);
  }, []);

  const handleDownloadErrors = async () => {
    if (!lastErrorJobId) return;
    setIsDownloadingErrors(true);
    try {
      const blob = await downloadVillageImportErrorSheet(lastErrorJobId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Village_Import_Errors_${lastErrorJobId}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      localStorage.removeItem("LAST_IMPORT_ERROR_JOB_ID_VILLAGE");
      setLastErrorJobId(null);
    } catch (error: unknown) {
      if (error instanceof Error && "status" in error && (error as { status?: number }).status === 422) {
        toast.error("This report has already been downloaded or has expired.");
        localStorage.removeItem("LAST_IMPORT_ERROR_JOB_ID_VILLAGE");
        setLastErrorJobId(null);
      } else {
        toast.error("Failed to download error sheet");
      }
    } finally {
      setIsDownloadingErrors(false);
    }
  };

  const villageQueryKey = useMemo(() => ["villages"], []);

  return (
    <Container className="pb-8">
      <div className="flex h-full min-h-0 flex-col gap-6">
        <Card variant="listing" className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <CardHeader className="flex flex-col gap-3 shrink-0 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center xl:flex-1">
              <CardTitle className="text-xl flex items-center gap-2 whitespace-nowrap shrink-0">
                <Home className="h-5 w-5 text-primary" />
                Villages
              </CardTitle>
              <SearchInput value={searchTerm} onChange={setSearchTerm} tooltip="Search by village name"
                className="w-full sm:max-w-[200px]" inputClassName="h-9 text-[13px]" />
              <div className="w-[130px]">
                <SearchableSelect options={stateOptions} value={stateFilter}
                  onValueChange={(val) => { setStateFilter(val); setDistrictFilter(""); setTalukaFilter(""); }}
                  placeholder="State"
                  triggerClassName="h-8.5 text-[12px]"
                  contentClassName="w-[200px] max-h-[55vh]"
                  align="start" />
              </div>
              <div className="w-[130px]">
                <SearchableSelect options={districtOptions} value={districtFilter}
                  onValueChange={(val) => { setDistrictFilter(val); setTalukaFilter(""); }}
                  placeholder={stateFilter ? "District" : "Select State"}
                  disabled={isLoadingDistricts && !!stateFilter}
                  triggerClassName="h-8.5 text-[12px]"
                  contentClassName="w-[200px] max-h-[55vh]"
                  align="start" />
              </div>
              <div className="w-[130px]">
                <SearchableSelect options={talukaOptions} value={talukaFilter} onValueChange={setTalukaFilter}
                  placeholder={districtFilter ? "Taluka" : "Select District"}
                  disabled={isLoadingTalukas && !!districtFilter}
                  triggerClassName="h-8.5 text-[12px]"
                  contentClassName="w-[200px] max-h-[55vh]"
                  align="start" />
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2 xl:shrink-0">
              <Button variant="outline" onClick={handleReset}
                disabled={
                  !searchTerm &&
                  !stateFilter &&
                  !districtFilter &&
                  !talukaFilter &&
                  sorting.length === 1 &&
                  sorting[0]?.id === "createdAt" &&
                  sorting[0]?.desc === true
                }
                className="h-8.5 gap-1 px-2.5 text-[13px] font-semibold border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/50 transition-all">
                <RotateCcw className="h-4 w-4" /> Reset
              </Button>

              <div className="flex items-center gap-1">
                {lastErrorJobId && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8.5 w-8.5 text-destructive bg-destructive/5 hover:bg-destructive/10 border border-destructive/20 rounded-md"
                    onClick={handleDownloadErrors}
                    disabled={isDownloadingErrors}
                    title="Download latest import error report"
                  >
                    {isDownloadingErrors ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <AlertCircle className="h-4 w-4" />
                    )}
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="h-8.5 gap-1 px-2.5 text-[13px] font-semibold border-primary/30 text-primary transition-all hover:border-primary/50 hover:bg-primary/5"
                  onClick={() => setIsUploadModalOpen(true)}
                >
                  <Upload className="h-4 w-4" />
                  Upload Excel
                </Button>
              </div>

              <ActionButton actionType="add" showIconOnly={false} iconClassName="mr-1"
                className="h-8.5 min-w-[90px] gap-0 px-2.5 text-[13px] font-semibold shadow-sm hover:translate-y-0"
                onClick={() => { setSelectedVillage(null); setViewOnly(false); setIsDialogOpen(true); }}>
                Add Village
              </ActionButton>
            </div>
          </CardHeader>

          <CardTable className="min-h-0 flex-1 overflow-hidden">
            <DataGrid table={table} recordCount={villagesData.length} isLoading={isLoading}
              emptyMessage={debouncedSearchTerm ? "No villages match your search." : "No villages found."}
              tableLayout={{ dense: true, headerSticky: true, columnsPinnable: true, columnsVisibility: true, cellBorder: true, width: "auto", columnsResizable: true }}
              tableClassNames={{ headerRow: "[&_th]:text-xs", bodyRow: "[&_td]:text-[13px]" }}>
              <InfiniteScrollContainer className="max-h-[78vh]" isLoading={isLoading}
                isFetchingNextPage={isFetchingNextPage} hasNextPage={hasNextPage}
                onLoadMore={() => fetchNextPage()} overflowX="auto" overflowY="auto">
                <DataGridTable />
              </InfiniteScrollContainer>
            </DataGrid>
          </CardTable>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0 custom-scrollbar">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle className="text-xl font-bold">
              {viewOnly ? "View" : selectedVillage ? "Edit" : "Create"} Village
            </DialogTitle>
            {!viewOnly && (
              <DialogDescription className="text-[13.5px] text-muted-foreground mt-1">
                Enter the English content first, then use auto-translate to generate other languages.
              </DialogDescription>
            )}
          </DialogHeader>
          <div className="px-6 ">
            <VillageForm
              initialData={selectedVillage}
              states={stateOptions}
              onSubmit={(val: VillageFormValues) => mutation.mutate(val)}
              onCancel={() => setIsDialogOpen(false)}
              isLoading={mutation.isPending}
              viewOnly={viewOnly}
            />
          </div>
        </DialogContent>
      </Dialog>

      <CommonExcelUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onImportError={(jobId) => setLastErrorJobId(jobId)}
        title="Upload Villages"
        templateDownloadName="Village_Translations_Template.xlsx"
        storageKey="LAST_IMPORT_ERROR_JOB_ID_VILLAGE"
        queryKey={villageQueryKey}
        uploadFn={uploadVillageExcel}
        downloadTemplateFn={downloadVillageExcel}
        streamFn={streamVillageImport}
      />
    </Container>
  );
}
