import { useEffect, useState } from "react";
import {
  ColumnDef,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { format as formatDateFn } from "date-fns";
import { IndianRupee, FileSpreadsheet, FileText } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardTable } from "@/components/ui/card";
import { DataGrid } from "@/components/ui/data-grid";
import { DataGridColumnHeader } from "@/components/ui/data-grid-column-header";
import { DataGridTable } from "@/components/ui/data-grid-table";
import { SearchInput } from "@/components/common/search-input";
import { DataGridPagination } from "@/components/ui/data-grid-pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { getPayoutHistory, exportPayoutHistory } from "../services/commission.api";
import { type PayoutHistoryItem } from "../types";

const formatDate = (value?: string) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return formatDateFn(parsed, "dd/MM/yyyy");
};

export function PayoutHistory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [sorting, setSorting] = useState<SortingState>([{ id: "payoutDate", desc: true }]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearchTerm(searchTerm), 350);
    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  const { data, isLoading } = useQuery({
    queryKey: ["payout-history", debouncedSearchTerm, startDate, endDate, pagination.pageIndex, pagination.pageSize, sorting],
    queryFn: () =>
      getPayoutHistory({
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        search: debouncedSearchTerm || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        sortBy: sorting[0]?.id,
        sortOrder: sorting[0]?.desc ? "DESC" : "ASC",
      }),
  });

  const exportMutation = useMutation({
    mutationFn: ({ format: fileFormat }: { format: "csv" | "excel" }) =>
      exportPayoutHistory({
        format: fileFormat,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        search: debouncedSearchTerm || undefined,
      }),
    onSuccess: (blob, variables) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `payout-history-${new Date().toISOString().split("T")[0]}.${variables.format === "csv" ? "csv" : "xlsx"}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(`Payout history exported as ${variables.format.toUpperCase()}`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to export payout history");
    },
  });

  const columns: ColumnDef<PayoutHistoryItem>[] = [
    {
      id: "serial",
      header: ({ column }) => <DataGridColumnHeader title="Sr No" column={column} />,
      cell: ({ row }) => row.index + 1 + pagination.pageIndex * pagination.pageSize,
      size: 60,
    },
    {
      id: "payoutDate",
      accessorKey: "payoutDate",
      header: ({ column }) => <DataGridColumnHeader title="Payout Date" column={column} />,
      enableSorting: true,
      cell: ({ row }) => formatDate(row.original.payoutDate),
      size: 120,
    },
    {
      id: "foddermanName",
      accessorKey: "foddermanName",
      header: ({ column }) => <DataGridColumnHeader title="Fodderman Name" column={column} />,
      enableSorting: false,
      cell: ({ row }) => row.original.foddermanName,
      size: 150,
    },
    {
      id: "amountPaid",
      accessorKey: "amountPaid",
      header: ({ column }) => <DataGridColumnHeader title="Amount Paid" column={column} />,
      enableSorting: true,
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <IndianRupee className="h-3.5 w-3.5" />
          <span className="font-medium">{row.original.amountPaid.toLocaleString()}</span>
        </div>
      ),
      size: 140,
    },
    {
      id: "transactionReferenceId",
      accessorKey: "transactionReferenceId",
      header: ({ column }) => <DataGridColumnHeader title="Transaction Reference" column={column} />,
      enableSorting: false,
      cell: ({ row }) => row.original.transactionReferenceId,
      size: 180,
    },
    {
      id: "processedBy",
      accessorKey: "processedBy",
      header: ({ column }) => <DataGridColumnHeader title="Processed By" column={column} />,
      enableSorting: false,
      cell: ({ row }) => row.original.processedBy || "-",
      size: 120,
    },
  ];

  const table = useReactTable({
    data: data?.data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    state: { sorting, pagination },
    manualSorting: true,
    manualPagination: true,
    pageCount: data?.meta.totalPages || 0,
  });

  return (
    <Card>
      <CardHeader className="sticky top-0 z-10 flex flex-row items-center justify-between gap-4 bg-background pb-4 border-b">
        <CardTitle className="text-lg">Payout History</CardTitle>
        <div className="flex items-center gap-2">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            tooltip="Search by Fodderman Name or Transaction Reference"
            className="w-[200px]"
            inputClassName="h-8.5 text-[12.5px]"
          />
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-[140px] h-8.5 text-[12.5px]"
          />
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-[140px] h-8.5 text-[12.5px]"
          />
          <div className="h-6 w-px bg-border" />
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportMutation.mutate({ format: "csv" })}
            disabled={exportMutation.isPending || isLoading}
            className="gap-1.5"
          >
            <FileText className="h-4 w-4" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportMutation.mutate({ format: "excel" })}
            disabled={exportMutation.isPending || isLoading}
            className="gap-1.5"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export Excel
          </Button>
        </div>
      </CardHeader>
      <CardTable className="min-h-0 flex-1 overflow-hidden">
        <DataGrid
          table={table}
          recordCount={data?.data.length || 0}
          isLoading={isLoading}
          emptyMessage="No payout history found."
          tableLayout={{
            dense: true,
            headerSticky: true,
            cellBorder: true,
            width: "auto",
          }}
          tableClassNames={{
            headerRow: "[&_th]:text-xs",
            bodyRow: "[&_td]:text-[13px]",
          }}
        >
          <DataGridTable />
          <div className="border-t p-2">
            <DataGridPagination />
          </div>
        </DataGrid>
      </CardTable>
    </Card>
  );
}
