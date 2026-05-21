import {
  ColumnDef,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { AlertCircle, Globe, Loader2, RotateCcw, Upload } from "lucide-react";
import { format } from "date-fns";


import { useCallback, useEffect, useMemo, useState } from "react";
import { ActionButton } from "@/components/common/action-button";
import { RowActionsMenu } from "@/components/common/row-actions-menu";
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

import { useDistrictsInfiniteQuery, useDistrictMutation } from "../hooks/use-district-queries";
import { uploadDistrictExcel, downloadDistrictExcel, streamDistrictImport, downloadDistrictImportErrorSheet } from "../services/district.api";

import { useStatesInfiniteQuery } from "../../states-management/hooks/use-state-queries";
import { DistrictForm } from "../components/DistrictForm";
import { CommonExcelUploadModal } from "../../components/CommonExcelUploadModal";
import { DistrictItem, DistrictFormValues } from "../types";
import { toast } from "sonner";
import { getApiSortParams } from "@/lib/api-sorting";

export function DistrictListPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);
  const [stateFilter, setStateFilter] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [viewOnly, setViewOnly] = useState(false);
  const [lastErrorJobId, setLastErrorJobId] = useState<string | null>(
    localStorage.getItem('LAST_IMPORT_ERROR_JOB_ID_DISTRICT')
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

  const { sortBy, sortOrder } = getApiSortParams({
    sorting,
    defaultSortBy: "createdAt" as const,
    columnToSortByMap: {
      name: "name",
      createdAt: "createdAt",
    },
  });

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useDistrictsInfiniteQuery({
      search: debouncedSearchTerm,
      stateId: stateFilter || undefined,
      sortBy,
      sortOrder,
    });

  const formatCreatedDate = (value?: string) => {
    if (!value) return "-";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "-";
    return format(parsed, "dd MMM, yyyy");
  };

  const districtsData = useMemo(() => data?.pages.flatMap(p => p.data) || [], [data]);

  const mutation = useDistrictMutation(selectedDistrict?.id, () => {
    setIsDialogOpen(false);
    setSelectedDistrict(null);
  });

  const columns = useMemo<ColumnDef<DistrictItem>[]>(() => [
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
      id: "stateName",
      accessorFn: (row) => (typeof row.stateName === "string" ? row.stateName : row.stateName?.en),
      header: ({ column }) => <DataGridColumnHeader title="State" column={column} />,
      enableSorting: false,
      cell: ({ row }) => <TruncatedCell value={(typeof row.original.stateName === "string" ? row.original.stateName : row.original.stateName?.en) || "-"} maxWidth="max-w-[150px]" />,
      size: 150,
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
        <RowActionsMenu
          items={[
            {
              label: "View District",
              actionType: "view",
              onSelect: () => {
                setSelectedDistrict(row.original);
                setViewOnly(true);
                setIsDialogOpen(true);
              },
            },
            {
              label: "Edit District",
              actionType: "edit",
              onSelect: () => {
                setSelectedDistrict(row.original);
                setViewOnly(false);
                setIsDialogOpen(true);
              },
            },
          ]}
        />
      ),
      size: 72,
    },
  ], []);

  const table = useReactTable({
    data: districtsData,
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
    setSorting([{ id: "createdAt", desc: true }]);
  }, []);

  const handleDownloadErrors = async () => {
    if (!lastErrorJobId) return;
    setIsDownloadingErrors(true);
    try {
      const blob = await downloadDistrictImportErrorSheet(lastErrorJobId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `District_Import_Errors_${lastErrorJobId}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      localStorage.removeItem("LAST_IMPORT_ERROR_JOB_ID_DISTRICT");
      setLastErrorJobId(null);
    } catch (error: unknown) {
      if (error instanceof Error && "status" in error && (error as { status?: number }).status === 422) {
        toast.error("This report has already been downloaded or has expired.");
        localStorage.removeItem("LAST_IMPORT_ERROR_JOB_ID_DISTRICT");
        setLastErrorJobId(null);
      } else {
        toast.error("Failed to download error sheet");
      }
    } finally {
      setIsDownloadingErrors(false);
    }
  };

  const districtQueryKey = useMemo(() => ["districts"], []);

  return (
    <Container className="pb-8">
      <div className="flex h-full min-h-0 flex-col gap-6">
        <Card variant="listing" className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <CardHeader className="flex flex-col gap-3 shrink-0 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center xl:flex-1">
              <CardTitle className="text-xl flex items-center gap-2 whitespace-nowrap shrink-0">
                <Globe className="h-5 w-5 text-primary" />
                Districts
              </CardTitle>
              <SearchInput value={searchTerm} onChange={setSearchTerm} tooltip="Search by district or state name"
                className="w-full sm:max-w-[250px]" inputClassName="h-9 text-[13px]" />
              <div className="w-[160px]">
                <SearchableSelect
                  options={stateOptions}
                  value={stateFilter}
                  onValueChange={setStateFilter}
                  placeholder="Select State"
                  triggerClassName="h-8.5 text-[12px]"
                  contentClassName="w-[200px] max-h-[55vh]"
                  align="start"
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2 xl:shrink-0">
              <Button variant="outline" onClick={handleReset}
                disabled={
                  !searchTerm &&
                  !stateFilter &&
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
                onClick={() => { setSelectedDistrict(null); setViewOnly(false); setIsDialogOpen(true); }}>
                Add District
              </ActionButton>
            </div>
          </CardHeader>

          <CardTable className="min-h-0 flex-1 overflow-hidden">
            <DataGrid table={table} recordCount={districtsData.length} isLoading={isLoading}
              emptyMessage={debouncedSearchTerm ? "No districts match your search." : "No districts found."}
              tableLayout={{ dense: true, headerSticky: true, columnsPinnable: true, columnsVisibility: true, cellBorder: true, width: "auto", columnsResizable: true }}
              tableClassNames={{ headerRow: "[&_th]:text-xs", bodyRow: "[&_td]:text-[13px]" }}>
              <InfiniteScrollContainer
                className="max-h-[78vh]"
                isLoading={isLoading}
                isFetchingNextPage={isFetchingNextPage}
                hasNextPage={hasNextPage}
                onLoadMore={() => fetchNextPage()}
                overflowX="auto"
                overflowY="auto">
                <DataGridTable />
              </InfiniteScrollContainer>
            </DataGrid>
          </CardTable>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col gap-0 overflow-hidden p-0">
          <DialogHeader className="mb-0 shrink-0 border-b px-6 py-4">
            <DialogTitle className="text-xl font-bold">
              {viewOnly ? "View" : selectedDistrict ? "Edit" : "Create"} District
            </DialogTitle>
            {!viewOnly && (
              <DialogDescription className="mt-1 text-[13.5px] text-muted-foreground">
                Enter the English content first, then use auto-translate to generate other languages.
              </DialogDescription>
            )}
          </DialogHeader>
          <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-6 pb-6">
            <DistrictForm
              initialData={selectedDistrict}
              states={stateOptions}
              onSubmit={(val: DistrictFormValues) => mutation.mutate(val)}
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
        title="Upload Districts"
        templateDownloadName="District_Translations_Template.xlsx"
        storageKey="LAST_IMPORT_ERROR_JOB_ID_DISTRICT"
        queryKey={districtQueryKey}
        uploadFn={uploadDistrictExcel}
        downloadTemplateFn={downloadDistrictExcel}
        streamFn={streamDistrictImport}
      />
    </Container>
  );
}
