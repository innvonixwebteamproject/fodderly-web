import {
  ColumnDef,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { Link2, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Container } from "@/components/common/container";
import { InfiniteScrollContainer } from "@/components/common/infinite-scroll-container";
import { SearchInput } from "@/components/common/search-input";
import { TruncatedCell } from "@/components/common/truncated-cell";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTable, CardTitle } from "@/components/ui/card";
import { DataGrid } from "@/components/ui/data-grid";
import { DataGridColumnHeader } from "@/components/ui/data-grid-column-header";
import { DataGridTable } from "@/components/ui/data-grid-table";
import { useToolbarStore } from "@/hooks/use-toolbar-store";
import { getApiSortParams } from "@/lib/api-sorting";
import { useProductPartnerAllocationsInfiniteQuery } from "../hooks";
import type { ProductPartnerAllocationItem } from "../types";
import { formatForDisplay, formatPartnerAllocatedQty } from "@/utils/unit-conversion";

const formatCreatedDate = (value?: string) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return format(parsed, "dd/MM/yyyy");
};

export function ProductPartnerAllocationsPage() {
  const { productId = "" } = useParams();
  const [searchParams] = useSearchParams();
  const productName = searchParams.get("productName") || "Product";
  const setExtraBreadcrumbs = useToolbarStore((state) => state.setExtraBreadcrumbs);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchTerm.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setExtraBreadcrumbs([{ title: "View Partner Allocations", path: "" }]);
    return () => setExtraBreadcrumbs(null);
  }, [setExtraBreadcrumbs]);

  const { sortBy, sortOrder } = getApiSortParams({
    sorting,
    defaultSortBy: "createdAt",
    columnToSortByMap: {
      partner_name: "partnerName",
      allocated_price: "price",
      total_allocated_price: "total",
      allocated_quantity: "quantity",
      createdAt: "createdAt",
    },
  });

  const allocationsQuery = useProductPartnerAllocationsInfiniteQuery({
    productUuid: productId,
    search: debouncedSearch || undefined,
    sortBy,
    sortOrder,
    enabled: Boolean(productId),
  });

  const rows = useMemo(
    () => allocationsQuery.data?.pages.flatMap((page) => page.data) || [],
    [allocationsQuery.data?.pages],
  );

  const columns = useMemo<ColumnDef<ProductPartnerAllocationItem>[]>(
    () => [
      {
        id: "serial",
        header: ({ column }) => <DataGridColumnHeader title="Sr." column={column} />,
        cell: ({ row }) => row.index + 1,
        enableSorting: false,
        size: 56,
      },
      {
        id: "partner_name",
        accessorKey: "partner_name",
        header: ({ column }) => <DataGridColumnHeader title="Partner" column={column} />,
        enableSorting: true,
        cell: ({ row }) => (
          <TruncatedCell value={row.original.partner_name || "-"} maxWidth="max-w-[220px]" />
        ),
        size: 220,
      },
      {
        id: "company_name",
        accessorKey: "company_name",
        header: ({ column }) => <DataGridColumnHeader title="Company" column={column} />,
        enableSorting: false,
        cell: ({ row }) => (
          <TruncatedCell value={row.original.company_name || "-"} maxWidth="max-w-[220px]" />
        ),
        size: 220,
      },
      {
        id: "allocated_quantity",
        accessorKey: "allocated_quantity",
        header: ({ column }) => <DataGridColumnHeader title="Allocated Qty" column={column} />,
        enableSorting: true,
        cell: ({ row }) => {
          return formatPartnerAllocatedQty(row.original.allocated_quantity);
        },
        size: 130,
      },
      {
        id: "allocated_price",
        accessorKey: "allocated_price",
        header: ({ column }) => <DataGridColumnHeader title="Price/Unit" column={column} />,
        enableSorting: true,
        cell: ({ row }) => {
          const display = formatForDisplay(row.original.allocated_quantity, row.original.allocated_price);
          const roundedPrice = Math.round(display.price);
          return `₹${roundedPrice.toLocaleString()}/${display.unit.toUpperCase()}`;
        },
        size: 130,
      },
      {
        id: "total_allocated_price",
        accessorKey: "total_allocated_price",
        header: ({ column }) => <DataGridColumnHeader title="Total" column={column} />,
        enableSorting: true,
        cell: ({ row }) => `₹${row.original.total_allocated_price.toLocaleString()}`,
        size: 130,
      },
      {
        id: "createdAt",
        accessorFn: (row) => row.createdAt || "",
        header: ({ column }) => <DataGridColumnHeader title="Created" column={column} />,
        enableSorting: true,
        cell: ({ row }) => formatCreatedDate(row.original.createdAt),
        size: 110,
      },
    ],
    [],
  );

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualSorting: true,
  });

  return (
    <Container className="pb-8">
      <Card variant="listing" className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <CardHeader className="sticky top-0 z-10 flex flex-row items-center justify-between gap-4 bg-background pb-4 border-b">
          <div className="flex items-center gap-3 min-w-0">
            <CardTitle className="text-lg flex items-center gap-2 whitespace-nowrap shrink-0">
              <Link2 className="h-4.5 w-4.5 text-primary" />
              View Partner Allocations
            </CardTitle>
            <div className="hidden lg:block h-5 w-px bg-border mx-1" />
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              tooltip="Search by partner name"
              className="hidden xl:block w-[220px]"
              inputClassName="h-8.5 text-[12.5px]"
            />
            <span className="hidden md:inline-flex h-8.5 max-w-[300px] items-center rounded-md border bg-background px-3 text-[12.5px] text-muted-foreground">
              <span className="mr-1 shrink-0">Product:</span>
              <span className="truncate font-medium text-foreground">{productName}</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              tooltip="Search by partner name"
              className="xl:hidden w-[160px]"
              inputClassName="h-8.5 text-[12.5px]"
            />
            <Button
              variant="outline"
              className="h-8.5 gap-1 px-2.5 text-[13px] font-semibold border-primary/30 text-primary shrink-0 hover:bg-primary/5 hover:border-primary/50 transition-all"
              onClick={() => {
                setSearchTerm("");
                setDebouncedSearch("");
                setSorting([{ id: "createdAt", desc: true }]);
              }}
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
          </div>
        </CardHeader>

        <CardTable className="min-h-0 flex-1 overflow-hidden">
          <DataGrid
            table={table}
            recordCount={rows.length}
            isLoading={allocationsQuery.isLoading}
            emptyMessage="No partner allocations found for this product."
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
              headerRow: "[&_th]:text-[11px] [&_th]:h-9 [&_th]:px-2.5",
              bodyRow: "[&_td]:text-[12px] [&_td]:px-2.5 [&_td]:py-2",
            }}
          >
            <InfiniteScrollContainer
              className="max-h-[72vh]"
              isLoading={allocationsQuery.isLoading}
              isFetchingNextPage={allocationsQuery.isFetchingNextPage}
              hasNextPage={allocationsQuery.hasNextPage}
              onLoadMore={() => allocationsQuery.fetchNextPage()}
              overflowX="auto"
              overflowY="auto"
            >
              <DataGridTable />
            </InfiniteScrollContainer>
          </DataGrid>
        </CardTable>
      </Card>
    </Container>
  );
}

export default ProductPartnerAllocationsPage;
