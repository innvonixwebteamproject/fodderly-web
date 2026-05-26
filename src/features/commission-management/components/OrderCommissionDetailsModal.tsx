import { useState } from "react";
import {
  ColumnDef,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { IndianRupee } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DataGrid } from "@/components/ui/data-grid";
import { DataGridColumnHeader } from "@/components/ui/data-grid-column-header";
import { DataGridTable } from "@/components/ui/data-grid-table";
import { DataGridPagination } from "@/components/ui/data-grid-pagination";
import { Badge } from "@/components/ui/badge";
import { getOrderCommissionDetails } from "../services/commission.api";
import { type OrderCommissionDetail } from "../types";

interface OrderCommissionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  foddermanId: string;
  foddermanName: string;
}

const formatDate = (value?: string) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return format(parsed, "dd/MM/yyyy");
};

const getStatusBadge = (status: OrderCommissionDetail["status"]) => {
  switch (status) {
    case "pending":
      return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Pending</Badge>;
    case "earnable":
      return <Badge variant="outline" className="text-green-600 border-green-600">Earnable</Badge>;
    case "paid":
      return <Badge variant="outline" className="text-blue-600 border-blue-600">Paid</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export function OrderCommissionDetailsModal({
  isOpen,
  onClose,
  foddermanId,
  foddermanName,
}: OrderCommissionDetailsModalProps) {
  const [sorting, setSorting] = useState<SortingState>([{ id: "orderDate", desc: true }]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const { data, isLoading } = useQuery({
    queryKey: ["order-commission-details", foddermanId, pagination.pageIndex, pagination.pageSize, sorting],
    queryFn: () =>
      getOrderCommissionDetails({
        foddermanId,
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
      }),
    enabled: isOpen && !!foddermanId,
  });

  const columns: ColumnDef<OrderCommissionDetail>[] = [
    {
      id: "serial",
      header: ({ column }) => <DataGridColumnHeader title="Sr No" column={column} />,
      cell: ({ row }) => row.index + 1 + pagination.pageIndex * pagination.pageSize,
      size: 60,
    },
    {
      id: "orderId",
      accessorKey: "orderId",
      header: ({ column }) => <DataGridColumnHeader title="Order ID" column={column} />,
      enableSorting: false,
      cell: ({ row }) => row.original.orderId,
      size: 120,
    },
    {
      id: "orderDate",
      accessorKey: "orderDate",
      header: ({ column }) => <DataGridColumnHeader title="Order Date" column={column} />,
      enableSorting: true,
      cell: ({ row }) => formatDate(row.original.orderDate),
      size: 100,
    },
    {
      id: "orderAmount",
      accessorKey: "orderAmount",
      header: ({ column }) => <DataGridColumnHeader title="Order Amount" column={column} />,
      enableSorting: true,
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <IndianRupee className="h-3.5 w-3.5" />
          <span>{row.original.orderAmount.toLocaleString()}</span>
        </div>
      ),
      size: 120,
    },
    {
      id: "commissionPercentage",
      accessorKey: "commissionPercentage",
      header: ({ column }) => <DataGridColumnHeader title="Commission %" column={column} />,
      enableSorting: true,
      cell: ({ row }) => row.original.commissionPercentage != null ? `${row.original.commissionPercentage.toFixed(1)}%` : '-',
      size: 100,
    },
    {
      id: "commissionAmount",
      accessorKey: "commissionAmount",
      header: ({ column }) => <DataGridColumnHeader title="Commission Amount" column={column} />,
      enableSorting: true,
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <IndianRupee className="h-3.5 w-3.5" />
          <span className="font-medium">{row.original.commissionAmount.toLocaleString()}</span>
        </div>
      ),
      size: 140,
    },
    {
      id: "lockedCommissionRate",
      accessorKey: "lockedCommissionRate",
      header: ({ column }) => <DataGridColumnHeader title="Locked Rate" column={column} />,
      enableSorting: true,
      cell: ({ row }) => row.original.lockedCommissionRate != null ? `${row.original.lockedCommissionRate.toFixed(1)}%` : '-',
      size: 100,
    },
    {
      id: "status",
      accessorKey: "status",
      header: ({ column }) => <DataGridColumnHeader title="Status" column={column} />,
      enableSorting: true,
      cell: ({ row }) => getStatusBadge(row.original.status),
      size: 100,
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Order-wise Commission Details</DialogTitle>
          <DialogDescription>
            Fodderman: <span className="font-semibold text-foreground">{foddermanName}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-hidden flex flex-col">
          <DataGrid
            table={table}
            recordCount={data?.data.length || 0}
            isLoading={isLoading}
            emptyMessage="No commission details found."
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
