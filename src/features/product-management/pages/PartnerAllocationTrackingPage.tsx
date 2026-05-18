import { useMemo, useState } from "react";
import { ColumnDef, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { ArrowLeft, Boxes } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Container } from "@/components/common/container";
import { SearchInput } from "@/components/common/search-input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTable, CardTitle } from "@/components/ui/card";
import { DataGrid } from "@/components/ui/data-grid";
import { DataGridTable } from "@/components/ui/data-grid-table";
import { Input } from "@/components/ui/input";
import type { PartnerTracking } from "../types/allocation.types";

const PAGE_SIZE = 10;

export function PartnerAllocationTrackingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const allocationId = searchParams.get("allocationId") || "";
  const partnerName = searchParams.get("partnerName") || "Partner";
  const productName = searchParams.get("productName") || "Product";
  const allocated = Number(searchParams.get("allocated") || 0);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<PartnerTracking[]>([
    {
      allocation_id: allocationId,
      partnerName,
      productName,
      allocatedQuantity: allocated,
      availableQuantity: allocated,
      totalQuantityAvailable: allocated,
    },
  ]);

  const normalizedSearch = search.trim().slice(0, 50).toLowerCase();

  const filteredRows = useMemo(
    () =>
      rows.filter((row) => row.partnerName.toLowerCase().includes(normalizedSearch)),
    [normalizedSearch, rows],
  );

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedRows = filteredRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const updateRow = (id: string, partial: Partial<PartnerTracking>) => {
    setRows((prev) => prev.map((row) => (row.allocation_id === id ? { ...row, ...partial } : row)));
  };

  const columns = useMemo<ColumnDef<PartnerTracking>[]>(
    () => [
      {
        id: "partnerName",
        header: "Partner Name",
        cell: ({ row }) => <span className="font-medium">{row.original.partnerName}</span>,
      },
      {
        id: "allocatedQuantity",
        header: "Allocated Quantity",
        cell: ({ row }) => row.original.allocatedQuantity,
      },
      {
        id: "availableQuantity",
        header: "Total Available Quantity (Partner-wise)",
        cell: ({ row }) => {
          const hasError =
            row.original.availableQuantity <= 0 ||
            row.original.availableQuantity > row.original.allocatedQuantity;
          return (
            <div className="space-y-1">
              <Input
                type="number"
                min={1}
                value={row.original.availableQuantity}
                onChange={(event) =>
                  updateRow(row.original.allocation_id, {
                    availableQuantity: Number(event.target.value || 0),
                  })
                }
              />
              {hasError ? (
                <p className="text-xs text-destructive">
                  Quantity must be a valid positive number and cannot exceed the allocated amount.
                </p>
              ) : null}
            </div>
          );
        },
      },
      {
        id: "totalQuantityAvailable",
        header: "Total Quantity Available",
        cell: ({ row }) => {
          const hasError = row.original.totalQuantityAvailable <= 0;
          return (
            <div className="space-y-1">
              <Input
                type="number"
                min={1}
                value={row.original.totalQuantityAvailable}
                onChange={(event) =>
                  updateRow(row.original.allocation_id, {
                    totalQuantityAvailable: Number(event.target.value || 0),
                  })
                }
              />
              {hasError ? (
                <p className="text-xs text-destructive">
                  Total quantity must be a valid positive number.
                </p>
              ) : null}
            </div>
          );
        },
      },
    ],
    [],
  );

  const table = useReactTable({
    data: pagedRows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Container className="pb-8">
      <Card variant="listing" className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <CardHeader className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => navigate("/admin/products/partner-allocations")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Boxes className="h-5 w-5 text-primary" />
              Partner-Wise Product Tracking
            </CardTitle>
          </div>
          <SearchInput
            value={search}
            onChange={(value) => {
              setSearch(value.trimStart().slice(0, 50));
              setPage(1);
            }}
            tooltip="Search by partner name"
            className="w-full xl:w-[300px]"
          />
        </CardHeader>
        <CardTable className="min-h-0 flex-1 overflow-hidden">
          <DataGrid
            table={table}
            recordCount={pagedRows.length}
            isLoading={false}
            emptyMessage="No partner tracking records."
            tableLayout={{ headerSticky: true, cellBorder: true, width: "auto" }}
          >
            <div className="max-h-[72vh] overflow-auto">
              <DataGridTable />
            </div>
          </DataGrid>
        </CardTable>
        <div className="flex items-center justify-between border-t px-4 py-3">
          <Button variant="outline" disabled={safePage <= 1} onClick={() => setPage((prev) => Math.max(1, prev - 1))}>
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {safePage} of {totalPages}
          </span>
          <Button
            variant="outline"
            disabled={safePage >= totalPages}
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
          >
            Next
          </Button>
        </div>
      </Card>
    </Container>
  );
}
