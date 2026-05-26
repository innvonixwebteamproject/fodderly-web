import { useEffect, useState } from "react";
import {
  ColumnDef,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { IndianRupee, Eye, Wallet } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardTable } from "@/components/ui/card";
import { DataGrid } from "@/components/ui/data-grid";
import { DataGridColumnHeader } from "@/components/ui/data-grid-column-header";
import { DataGridTable } from "@/components/ui/data-grid-table";
import { SearchInput } from "@/components/common/search-input";
import { DataGridPagination } from "@/components/ui/data-grid-pagination";
import { RowActionsMenu } from "@/components/common/row-actions-menu";
import { getCommissionLedger } from "../services/commission.api";
import { type CommissionLedgerItem } from "../types";

interface MasterCommissionLedgerProps {
  onViewOrderDetails: (foddermanId: string, foddermanName: string) => void;
  onSettleAccount: (fodderman: CommissionLedgerItem) => void;
}

export function MasterCommissionLedger({ onViewOrderDetails, onSettleAccount }: MasterCommissionLedgerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [districtFilter, setDistrictFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([{ id: "earnableCommission", desc: true }]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearchTerm(searchTerm), 350);
    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  const { data, isLoading } = useQuery({
    queryKey: ["commission-ledger", debouncedSearchTerm, districtFilter, pagination.pageIndex, pagination.pageSize, sorting],
    queryFn: () =>
      getCommissionLedger({
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        search: debouncedSearchTerm || undefined,
        district: districtFilter || undefined,
        sortBy: sorting[0]?.id,
        sortOrder: sorting[0]?.desc ? "DESC" : "ASC",
      }),
  });

  const columns: ColumnDef<CommissionLedgerItem>[] = [
    {
      id: "serial",
      header: ({ column }) => <DataGridColumnHeader title="Sr No" column={column} />,
      cell: ({ row }) => row.index + 1 + pagination.pageIndex * pagination.pageSize,
      size: 60,
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
      id: "foddermanId",
      accessorKey: "foddermanId",
      header: ({ column }) => <DataGridColumnHeader title="Fodderman ID" column={column} />,
      enableSorting: false,
      cell: ({ row }) => row.original.foddermanId,
      size: 120,
    },
    {
      id: "district",
      accessorKey: "district",
      header: ({ column }) => <DataGridColumnHeader title="District" column={column} />,
      enableSorting: false,
      cell: ({ row }) => row.original.district || "-",
      size: 120,
    },
    {
      id: "village",
      accessorKey: "village",
      header: ({ column }) => <DataGridColumnHeader title="Village" column={column} />,
      enableSorting: false,
      cell: ({ row }) => row.original.village || "-",
      size: 120,
    },
    {
      id: "totalOrdersDelivered",
      accessorKey: "totalOrdersDelivered",
      header: ({ column }) => <DataGridColumnHeader title="Total Orders" column={column} />,
      enableSorting: true,
      cell: ({ row }) => row.original.totalOrdersDelivered,
      size: 100,
    },
    {
      id: "pendingCommission",
      accessorKey: "pendingCommission",
      header: ({ column }) => <DataGridColumnHeader title="Pending Commission" column={column} />,
      enableSorting: true,
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <IndianRupee className="h-3.5 w-3.5" />
          <span className="font-medium">{row.original.pendingCommission.toLocaleString()}</span>
        </div>
      ),
      size: 140,
    },
    {
      id: "earnableCommission",
      accessorKey: "earnableCommission",
      header: ({ column }) => <DataGridColumnHeader title="Earnable Commission" column={column} />,
      enableSorting: true,
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <IndianRupee className="h-3.5 w-3.5" />
          <span className="font-semibold text-green-600 dark:text-green-400">{row.original.earnableCommission.toLocaleString()}</span>
        </div>
      ),
      size: 150,
    },
    {
      id: "lifetimePaid",
      accessorKey: "lifetimePaid",
      header: ({ column }) => <DataGridColumnHeader title="Lifetime Paid" column={column} />,
      enableSorting: true,
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <IndianRupee className="h-3.5 w-3.5" />
          <span>{row.original.lifetimePaid.toLocaleString()}</span>
        </div>
      ),
      size: 120,
    },
    {
      id: "actions",
      header: ({ column }) => <DataGridColumnHeader title="Actions" column={column} />,
      enableSorting: false,
      cell: ({ row }) => (
        <RowActionsMenu
          items={[
            {
              label: "View Order-wise Commission",
              actionType: "view",
              icon: Eye,
              onSelect: () => onViewOrderDetails(row.original.foddermanId, row.original.foddermanName),
            },
            {
              label: "Settle Account",
              actionType: "edit",
              icon: Wallet,
              onSelect: () => onSettleAccount(row.original),
              disabled: row.original.earnableCommission <= 0,
            },
          ]}
        />
      ),
      size: 80,
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
        <CardTitle className="text-lg">Master Commission Ledger</CardTitle>
        <div className="flex items-center gap-2">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            tooltip="Search by Fodderman Name"
            className="w-[180px]"
            inputClassName="h-8.5 text-[12.5px]"
          />
          <SearchInput
            value={districtFilter}
            onChange={setDistrictFilter}
            tooltip="Filter by District"
            placeholder="District"
            className="w-[140px]"
            inputClassName="h-8.5 text-[12.5px]"
          />
        </div>
      </CardHeader>
      <CardTable className="min-h-0 flex-1 overflow-hidden">
        <DataGrid
          table={table}
          recordCount={data?.data.length || 0}
          isLoading={isLoading}
          emptyMessage="No commission records found."
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
