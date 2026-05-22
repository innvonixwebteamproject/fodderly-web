import {
  ColumnDef,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { AlertCircle, Loader2, Map, RotateCcw, Upload } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useStatesInfiniteQuery, useStateMutation } from "../hooks/use-state-queries";
import { uploadStateExcel, downloadStateExcel, streamStateImport, downloadStateImportErrorSheet } from "../services/state.api";

import { StateForm } from "../components/StateForm";
import { CommonExcelUploadModal } from "../../components/CommonExcelUploadModal";
import type { StateItem, StateFormValues } from "../types";
import { toast } from "sonner";
import { getApiSortParams } from "@/lib/api-sorting";

export function StateListPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);

  const [selectedState, setSelectedState] = useState<StateItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [viewOnly, setViewOnly] = useState(false);
  const [lastErrorJobId, setLastErrorJobId] = useState<string | null>(
    localStorage.getItem('LAST_IMPORT_ERROR_JOB_ID')
  );
  const [isDownloadingErrors, setIsDownloadingErrors] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { sortBy, sortOrder } = getApiSortParams({
    sorting,
    defaultSortBy: "createdAt" as const,
    columnToSortByMap: {
      name: "name",
      createdAt: "createdAt",
    },
  });

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useStatesInfiniteQuery({
    search: debouncedSearchTerm,
    sortBy,
    sortOrder,
  });

  const formatCreatedDate = (value?: string) => {
    if (!value) return "-";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "-";
    return format(parsed, "dd/MM/yyyy");
  };

  const statesData = useMemo(
    () => data?.pages.flatMap((page) => page.data) || [],
    [data]
  );

  const mutation = useStateMutation(selectedState?.id, () => {
    setIsDialogOpen(false);
    setSelectedState(null);
  });

  const columns = useMemo<ColumnDef<StateItem>[]>(
    () => [
      {
        id: "serial",
        header: ({ column }) => (
          <DataGridColumnHeader title="Sr." column={column} />
        ),
        cell: ({ row }) => row.index + 1,
        enableSorting: false,
        size: 60,
      },
      {
        id: "name",
        accessorFn: (row) => (typeof row.name === "string" ? row.name : row.name?.en),
        header: ({ column }) => (
          <DataGridColumnHeader title="Name" column={column} />
        ),
        cell: ({ row }) => (
          <TruncatedCell
            value={(typeof row.original.name === "string" ? row.original.name : row.original.name?.en) || "-"}
            className="font-medium"
            maxWidth="max-w-[300px]"
          />
        ),
        size: 300,
      },
      {
        id: "createdAt",
        accessorFn: (row) => row.createdAt || "",
        header: ({ column }) => (
          <DataGridColumnHeader title="Created" column={column} />
        ),
        enableSorting: true,
        cell: ({ row }) => formatCreatedDate(row.original.createdAt),
        size: 140,
      },
      {
        id: "actions",
        header: ({ column }) => (
          <DataGridColumnHeader title="Actions" column={column} />
        ),
        enableSorting: false,
        cell: ({ row }) => (
          <RowActionsMenu
            items={[
              {
                label: "View State Details",
                actionType: "view",
                onSelect: () => {
                  setSelectedState(row.original);
                  setViewOnly(true);
                  setIsDialogOpen(true);
                },
              },
              {
                label: "Edit State",
                actionType: "edit",
                onSelect: () => {
                  setSelectedState(row.original);
                  setViewOnly(false);
                  setIsDialogOpen(true);
                },
              },
            ]}
          />
        ),
        size: 100,
      },
    ],
    []
  );

  const table = useReactTable({
    data: statesData,
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
    setSorting([{ id: "createdAt", desc: true }]);
  }, []);

  const handleDownloadErrors = async () => {
    if (!lastErrorJobId) return;
    setIsDownloadingErrors(true);
    try {
      const blob = await downloadStateImportErrorSheet(lastErrorJobId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Import_Errors_${lastErrorJobId}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      localStorage.removeItem("LAST_IMPORT_ERROR_JOB_ID");
      setLastErrorJobId(null);
    } catch (error: unknown) {
      if (error instanceof Error && "status" in error && (error as { status?: number }).status === 422) {
        toast.error("This report has already been downloaded or has expired.");
        localStorage.removeItem("LAST_IMPORT_ERROR_JOB_ID");
        setLastErrorJobId(null);
      } else {
        toast.error("Failed to download error sheet");
      }
    } finally {
      setIsDownloadingErrors(false);
    }
  };

  const stateQueryKey = useMemo(() => ["states"], []);

  return (
    <Container className="pb-8">
      <div className="flex min-h-0 flex-col gap-6">
        <Card variant="listing" className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <CardHeader className="flex shrink-0 flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center xl:flex-1">
              <CardTitle className="text-xl flex shrink-0 items-center gap-2 whitespace-nowrap">
                <Map className="h-5 w-5 text-primary" />
                States
              </CardTitle>
              <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                tooltip="Search by state name"
                className="w-full sm:max-w-[280px] xl:max-w-[300px]"
                inputClassName="h-9 text-[13px]"
              />
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 xl:shrink-0">
              <Button
                variant="outline"
                className="h-8.5 gap-1 px-2.5 text-[13px] font-semibold border-primary/30 text-primary transition-all hover:border-primary/50 hover:bg-primary/5"
                onClick={handleReset}
                disabled={
                  !searchTerm &&
                  sorting.length === 1 &&
                  sorting[0]?.id === "createdAt" &&
                  sorting[0]?.desc === true
                }
              >
                <RotateCcw className="h-4 w-4" />
                Reset
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

              <ActionButton
                actionType="add"
                showIconOnly={false}
                iconClassName="mr-1"
                className="h-8.5 min-w-[90px] gap-0 px-2.5 text-[13px] font-semibold shadow-sm hover:translate-y-0"
                onClick={() => {
                  setSelectedState(null);
                  setViewOnly(false);
                  setIsDialogOpen(true);
                }}
              >
                Add State
              </ActionButton>
            </div>
          </CardHeader>

          <CardTable className="min-h-0 flex-1 overflow-hidden">
            <DataGrid
              table={table}
              recordCount={statesData.length}
              isLoading={isLoading}
              emptyMessage={debouncedSearchTerm ? "No states match your search." : "No states found."}
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
                className="max-h-[70vh]"
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0 custom-scrollbar">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle className="text-xl font-bold">
              {viewOnly ? "View" : selectedState ? "Edit" : "Create"} State
            </DialogTitle>
            {!viewOnly && (
              <DialogDescription className="text-[13.5px] text-muted-foreground mt-1">
                Enter the English content first, then use auto-translate to generate other languages.
              </DialogDescription>
            )}
          </DialogHeader>
          <div className="px-6 ">
            <StateForm
              initialData={selectedState}
              onSubmit={(val: StateFormValues) => mutation.mutate(val)}
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
        title="Upload States"
        templateDownloadName="State_Translations_Template.xlsx"
        storageKey="LAST_IMPORT_ERROR_JOB_ID"
        queryKey={stateQueryKey}
        uploadFn={uploadStateExcel}
        downloadTemplateFn={downloadStateExcel}
        streamFn={streamStateImport}
      />
    </Container>
  );
}
