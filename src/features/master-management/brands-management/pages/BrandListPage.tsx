import {
  ColumnDef,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import { Container } from "@/components/common/container";
import { InfiniteScrollContainer } from "@/components/common/infinite-scroll-container";
import { SearchInput } from "@/components/common/search-input";
import { TruncatedCell } from "@/components/common/truncated-cell";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTable, CardTitle } from "@/components/ui/card";
import { DataGrid } from "@/components/ui/data-grid";
import { DataGridColumnHeader } from "@/components/ui/data-grid-column-header";
import { DataGridTable } from "@/components/ui/data-grid-table";
import { useBrandsQuery } from "../hooks/use-brand-queries";
import type { BrandItem } from "../types";

export function BrandListPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const brandsQuery = useBrandsQuery();

  const allRows = useMemo(() => brandsQuery.data?.data || [], [brandsQuery.data?.data]);

  const filteredRows = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return allRows.filter((row) => {
      const searchMatch = normalizedSearch
        ? row.brand_name.toLowerCase().includes(normalizedSearch)
        : true;

      return searchMatch;
    });
  }, [allRows, searchTerm]);

  const columns = useMemo<ColumnDef<BrandItem>[]>(
    () => [
      {
        id: "serial",
        header: ({ column }) => <DataGridColumnHeader title="Sr." column={column} />,
        cell: ({ row }) => row.index + 1,
        enableSorting: false,
        size: 60,
      },
      {
        id: "brand_name",
        accessorKey: "brand_name",
        header: ({ column }) => <DataGridColumnHeader title="Brand Name" column={column} />,
        enableSorting: false,
        cell: ({ row }) => <TruncatedCell value={row.original.brand_name} maxWidth="max-w-[320px]" />,
        size: 320,
      },
    ],
    [],
  );

  const table = useReactTable({
    data: filteredRows,
    columns,
    enableSorting: false,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Container className="pb-8">
      <Card variant="listing" className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <CardHeader className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center xl:flex-1">
            <CardTitle className="text-xl flex items-center gap-2 whitespace-nowrap shrink-0">
              Brands
            </CardTitle>
            <SearchInput
              value={searchTerm}
              onChange={(value) => {
                setSearchTerm(value);
              }}
              tooltip="Search by brand name"
              className="w-full sm:max-w-[280px]"
              inputClassName="h-9 text-[13px]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
              }}
              className="h-8.5 gap-1 px-2.5 text-[13px] font-semibold border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/50 transition-all"
              disabled={searchTerm === ""}
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          </div>
        </CardHeader>

        <CardTable className="min-h-0 flex-1 overflow-hidden">
          <DataGrid
            table={table}
            recordCount={filteredRows.length}
            isLoading={brandsQuery.isLoading}
            emptyMessage={
              searchTerm
                ? "No brands found."
                : "No brands added yet. Click 'Add Brand' to create your first brand."
            }
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
              className="max-h-[72vh]"
              isLoading={brandsQuery.isLoading}
              isFetchingNextPage={false}
              hasNextPage={false}
              onLoadMore={() => undefined}
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

export default BrandListPage;
