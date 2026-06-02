import { useEffect, useState } from "react";
import {
  ColumnDef,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { History } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardTable } from "@/components/ui/card";
import { DataGrid } from "@/components/ui/data-grid";
import { DataGridColumnHeader } from "@/components/ui/data-grid-column-header";
import { DataGridTable } from "@/components/ui/data-grid-table";
import { SearchInput } from "@/components/common/search-input";
import { DataGridPagination } from "@/components/ui/data-grid-pagination";
import { getCommissionAuditLogs } from "../services/commission.api";
import { type CommissionAuditLog } from "../types";

const formatDateTime = (value?: string) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return format(parsed, "dd/MM/yyyy HH:mm");
};

export function CommissionAuditTrail() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearchTerm(searchTerm), 350);
    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  const { data, isLoading } = useQuery({
    queryKey: ["commission-audit-logs", debouncedSearchTerm, pagination.pageIndex, pagination.pageSize, sorting],
    queryFn: () =>
      getCommissionAuditLogs({
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        search: debouncedSearchTerm || undefined,
        sortBy: sorting[0]?.id,
        sortOrder: sorting[0]?.desc ? "DESC" : "ASC",
      }),
  });

  const columns: ColumnDef<CommissionAuditLog>[] = [
    {
      id: "serial",
      header: ({ column }) => <DataGridColumnHeader title="Sr No" column={column} />,
      cell: ({ row }) => row.index + 1 + pagination.pageIndex * pagination.pageSize,
      size: 60,
    },
    {
      id: "previousRate",
      accessorKey: "previousRate",
      header: ({ column }) => <DataGridColumnHeader title="Previous Rate" column={column} />,
      enableSorting: true,
      cell: ({ row }) => row.original.previousRate != null ? `${row.original.previousRate.toFixed(1)}%` : '-',
      size: 120,
    },
    {
      id: "newRate",
      accessorKey: "newRate",
      header: ({ column }) => <DataGridColumnHeader title="New Rate" column={column} />,
      enableSorting: true,
      cell: ({ row }) => row.original.newRate != null ? `${row.original.newRate.toFixed(1)}%` : '-',
      size: 100,
    },
    {
      id: "updatedBy",
      accessorKey: "updatedBy",
      header: ({ column }) => <DataGridColumnHeader title="Updated By" column={column} />,
      enableSorting: false,
      cell: ({ row }) => row.original.updatedBy || "-",
      size: 150,
    },
    {
      id: "remarks",
      accessorKey: "remarks",
      header: ({ column }) => <DataGridColumnHeader title="Remarks" column={column} />,
      enableSorting: false,
      cell: ({ row }) => row.original.remarks || "-",
      size: 200,
    },
    {
      id: "createdAt",
      accessorKey: "createdAt",
      header: ({ column }) => <DataGridColumnHeader title="Updated Date & Time" column={column} />,
      enableSorting: true,
      cell: ({ row }) => formatDateTime(row.original.createdAt),
      size: 180,
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
        <CardTitle className="text-lg flex items-center gap-2">
          <History className="h-4.5 w-4.5 text-primary" />
          Commission Audit Trail
        </CardTitle>
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          tooltip="Search by updated by or remarks"
          className="w-[200px]"
          inputClassName="h-8.5 text-[12.5px]"
        />
      </CardHeader>
      <CardTable className="min-h-0 flex-1 overflow-hidden">
        <DataGrid
          table={table}
          recordCount={data?.data.length || 0}
          isLoading={isLoading}
          emptyMessage="No audit logs found."
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
