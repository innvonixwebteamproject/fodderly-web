import {
  ColumnDef,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Package, RotateCcw } from "lucide-react";
import { getApiSortParams } from "@/lib/api-sorting";
import { Container } from "@/components/common/container";
import { SearchInput } from "@/components/common/search-input";
import { TruncatedCell } from "@/components/common/truncated-cell";
import { DataGrid } from "@/components/ui/data-grid";
import { DataGridColumnHeader } from "@/components/ui/data-grid-column-header";
import { DataGridTable } from "@/components/ui/data-grid-table";
import { Card, CardHeader, CardTable, CardTitle } from "@/components/ui/card";
import { ActionButton } from "@/components/common/action-button";
import { RowActionsMenu } from "@/components/common/row-actions-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useProductCategoriesQuery } from "@/features/category-management/hooks";
import { INVENTORY_UNITS } from "@/constants/unit.constants";
import type { AllocationItem } from "../types/allocation.types";
import { usePartnerAllocationProductDetailQuery } from "../hooks";
import {
  usePartnerAllocationsInfiniteQuery,
  useUpdatePartnerStockMutation,
} from "../hooks/usePartnerAllocations";
import { InfiniteScrollContainer } from "@/components/common/infinite-scroll-container";
import { ProductDetailModal } from "../components/ProductDetailModal";
import {
  getPrimaryProductImageUrl,
  PRODUCT_NO_IMAGE_PLACEHOLDER,
} from "../utils/product-image";
import {
  formatForDisplay,
  formatAdminAvailableQty,
  formatPartnerAvailableQty,
  formatPartnerAllocatedQty,
  getTonToKgRate,
} from "../utils/unit-conversion";

const formatCreatedDate = (value?: string) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return format(parsed, "dd/MM/yyyy");
};

export function PartnerProductListPage() {
  const userId = useAuthStore((state) => state.userId);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [stockInputValue, setStockInputValue] = useState("");
  const [stockError, setStockError] = useState("");
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);
  const { sortBy, sortOrder } = getApiSortParams({
    sorting,
    defaultSortBy: "createdAt",
    columnToSortByMap: {
      product_name: "product_name",
      price_per_unit: "price",
      total_allocated_price: "total_allocated_price",
      qty: "allocated_quantity",
      stock: "available_quantity",
      createdAt: "createdAt",
    },
  });
  const [isProductDetailOpen, setIsProductDetailOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearchTerm(searchTerm), 350);
    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  const categoriesQuery = useProductCategoriesQuery({ page: 1, limit: 100, status: "active" });

  const categoryOptions = useMemo(
    () => [
      { value: "all", label: "All Categories" },
      ...(categoriesQuery.data?.data || []).map((category) => ({
        value: category.id,
        label: category.name.en || "-",
      })),
    ],
    [categoriesQuery.data?.data],
  );

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
    isLoading,
  } = usePartnerAllocationsInfiniteQuery(
    {
      partner_uuid: userId || undefined,
      category_uuid: categoryFilter === "all" ? undefined : categoryFilter,
      search: debouncedSearchTerm || undefined,
      limit: 10,
      sortBy,
      sortOrder,
    },
    Boolean(userId),
  );
  const isTableLoading = isLoading || (isFetching && !isFetchingNextPage);

  const updateStockMutation = useUpdatePartnerStockMutation(() => {
    setEditingRowId(null);
    setStockInputValue("");
    setStockError("");
  });
  const productDetailQuery = usePartnerAllocationProductDetailQuery(
    userId || undefined,
    selectedProductId || undefined,
  );

  const rows = useMemo(
    () => data?.pages.flatMap((page) => page.data) || [],
    [data?.pages],
  );

  const normalizedSearch = debouncedSearchTerm.trim().toLowerCase();
  const filteredRows = useMemo(() => {
    if (!normalizedSearch) return rows;
    return rows.filter((row) => {
      const productName = row.product_name?.toLowerCase() || "";
      const uniqueId = row.uniqueID?.toLowerCase() || "";
      return productName.includes(normalizedSearch) || uniqueId.includes(normalizedSearch);
    });
  }, [normalizedSearch, rows]);

  const startEdit = useCallback((row: AllocationItem) => {
    setEditingRowId(row.id);
    setStockInputValue(String(row.allocated_quantity));
    setStockError("");
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingRowId(null);
    setStockInputValue("");
    setStockError("");
  }, []);

  const validateStockValue = useCallback((value: string, currentAllocatedQty: number) => {
    if (value.trim() === "") {
      return "Qty must be 0 or greater.";
    }
    if (!/^\d+$/.test(value)) {
      return "Qty must be 0 or greater.";
    }
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return "Qty must be 0 or greater.";
    }
    if (parsed < currentAllocatedQty) {
      return "Cannot decrease allocated qty.";
    }
    return "";
  }, []);

  const saveStock = useCallback(
    (row: AllocationItem) => {
      const validationMessage = validateStockValue(stockInputValue, row.allocated_quantity);
      if (validationMessage) {
        setStockError(validationMessage);
        return;
      }

      setStockError("");
      updateStockMutation.mutate({ id: row.id, stock: Number(stockInputValue) });
    },
    [stockInputValue, updateStockMutation, validateStockValue],
  );

  const columns = useMemo<ColumnDef<AllocationItem>[]>(
    () => [
      {
        id: "serial",
        header: ({ column }) => <DataGridColumnHeader title="Sr." column={column} />,
        cell: ({ row }) => row.index + 1,
        enableSorting: false,
        size: 56,
      },
      {
        id: "uniqueID",
        accessorKey: "uniqueID",
        header: ({ column }) => <DataGridColumnHeader title="Product Code" column={column} />,
        enableSorting: false,
        cell: ({ row }) => (
          <TruncatedCell value={row.original.uniqueID || "—"} maxWidth="max-w-[140px]" />
        ),
        size: 140,
      },
      {
        id: "product_name",
        accessorKey: "product_name",
        header: ({ column }) => <DataGridColumnHeader title="Product" column={column} />,
        enableSorting: true,
        cell: ({ row }) => (
          <TruncatedCell value={row.original.product_name} maxWidth="max-w-[180px]" />
        ),
        size: 180,
      },
      {
        id: "image",
        header: ({ column }) => <DataGridColumnHeader title="Image" column={column} />,
        enableSorting: false,
        cell: ({ row }) => {
          const imageSrc =
            getPrimaryProductImageUrl(row.original.images) || PRODUCT_NO_IMAGE_PLACEHOLDER;
          return (
            <div className="h-10 w-10 overflow-hidden rounded border bg-muted/30">
              <img
                src={imageSrc}
                alt={row.original.product_name || "Product"}
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const img = e.currentTarget;
                  if (img.src === PRODUCT_NO_IMAGE_PLACEHOLDER) return;
                  img.style.display = "none";
                }}
              />
            </div>
          );
        },
        size: 70,
      },
      {
        id: "category_name",
        accessorKey: "category_name",
        header: ({ column }) => <DataGridColumnHeader title="Category" column={column} />,
        enableSorting: false,
        cell: ({ row }) => (
          <TruncatedCell value={row.original.category_name || "—"} maxWidth="max-w-[150px]" />
        ),
        size: 150,
      },
      {
        id: "adminAvailableQty",
        accessorKey: "admin_available_quantity",
        header: ({ column }) => <DataGridColumnHeader title="Admin Available Qty" column={column} />,
        enableSorting: false,
        cell: ({ row }) => {
          const stockInKg = row.original.admin_available_quantity ?? 0;
          const adminUnit = row.original.admin_unit;
          // Convert to KG if admin_unit is TON
          const quantityInKg = adminUnit === INVENTORY_UNITS.TON ? stockInKg * getTonToKgRate() : stockInKg;
          return (
            <span>
              {formatAdminAvailableQty(quantityInKg)}
            </span>
          );
        },
        size: 140,
      },
      {
        id: "qty",
        header: ({ column }) => <DataGridColumnHeader title="Available Qty" column={column} />,
        enableSorting: true,
        cell: ({ row }) => {
          const stockInKg = row.original.available_quantity ?? 0;
          const unit = row.original.unit;
          // Convert to KG if unit is TON (backend might send in TON format)
          const quantityInKg = unit === INVENTORY_UNITS.TON ? stockInKg * getTonToKgRate() : stockInKg;
          return (
            <span>
              {formatPartnerAvailableQty(quantityInKg)}
            </span>
          );
        },
        size: 120,
      },
      {
        id: "stock",
        accessorKey: "allocated_quantity",
        header: ({ column }) => <DataGridColumnHeader title="Allocated Qty" column={column} />,
        enableSorting: true,
        cell: ({ row }) => {
          const isEditing = editingRowId === row.original.id;
          const stockInKg = row.original.allocated_quantity;
          const unit = row.original.unit;
          // Convert to KG if unit is TON (backend might send in TON format)
          const quantityInKg = unit === INVENTORY_UNITS.TON ? stockInKg * getTonToKgRate() : stockInKg;
          
          if (!isEditing) {
            return (
              <span>
                {formatPartnerAllocatedQty(quantityInKg)}
              </span>
            );
          }
          return (
            <div className="space-y-1 min-w-[120px]">
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoFocus
                value={stockInputValue}
                onClick={(event) => event.stopPropagation()}
                onKeyDown={(event) => event.stopPropagation()}
                onChange={(event) => {
                  const digitsOnly = event.target.value.replace(/\D/g, "");
                  setStockInputValue(digitsOnly);
                  if (stockError) {
                    setStockError("");
                  }
                }}
                onBlur={() => {
                  const validationMessage = validateStockValue(
                    stockInputValue,
                    row.original.allocated_quantity,
                  );
                  setStockError(validationMessage);
                }}
                className={stockError ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {stockError ? <p className="text-xs text-destructive">{stockError}</p> : null}
            </div>
          );
        },
        size: 140,
      },
      {
        id: "price_per_unit",
        accessorKey: "price_per_unit",
        header: ({ column }) => <DataGridColumnHeader title="Price" column={column} />,
        enableSorting: true,
        cell: ({ row }) => {
          const stockInKg = row.original.available_quantity ?? 0;
          const pricePerKg = row.original.price_per_unit;
          const formatted = formatForDisplay(stockInKg, pricePerKg);
          
          return `₹${formatted.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
        },
        size: 100,
      },
      {
        id: "total_allocated_price",
        accessorKey: "total_allocated_price",
        header: ({ column }) => <DataGridColumnHeader title="Total" column={column} />,
        enableSorting: true,
        cell: ({ row }) => `₹${row.original.total_allocated_price.toLocaleString()}`,
        size: 110,
      },
      {
        id: "createdAt",
        accessorFn: (row) => row.createdAt || "",
        header: ({ column }) => <DataGridColumnHeader title="Created" column={column} />,
        enableSorting: true,
        cell: ({ row }) => formatCreatedDate(row.original.createdAt),
        size: 110,
      },
      {
        id: "actions",
        header: ({ column }) => <DataGridColumnHeader title="Actions" column={column} />,
        enableSorting: false,
        cell: ({ row }) => {
          const isEditing = editingRowId === row.original.id;
          if (isEditing) {
            return (
              <div className="flex items-center gap-1">
                <ActionButton
                  actionType="cancel"
                  tooltip="Cancel"
                  onClick={cancelEdit}
                  disabled={updateStockMutation.isPending}
                />
                <ActionButton
                  actionType="save"
                  tooltip="Save"
                  onClick={() => saveStock(row.original)}
                  disabled={updateStockMutation.isPending}
                />
              </div>
            );
          }

          return (
            <RowActionsMenu
              items={[
                {
                  label: "Update stock",
                  actionType: "edit",
                  onSelect: () => startEdit(row.original),
                  disabled: Boolean(editingRowId) || updateStockMutation.isPending,
                },
                {
                  label: "View product details",
                  actionType: "view",
                  onSelect: () => {
                    setSelectedProductId(row.original.product_uuid);
                    setIsProductDetailOpen(true);
                  },
                  disabled: Boolean(editingRowId),
                },
              ]}
            />
          );
        },
        size: 110,
      },
    ],
    [
      cancelEdit,
      editingRowId,
      saveStock,
      startEdit,
      stockError,
      stockInputValue,
      updateStockMutation.isPending,
      validateStockValue,
    ],
  );

  const table = useReactTable({
    data: filteredRows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { sorting },
    onSortingChange: setSorting,
    manualSorting: true,
  });

  return (
    <Container className="pb-8">
      <div className="flex h-full min-h-0 flex-col gap-6">
        <Card variant="listing" className="flex min-h-0 flex-col overflow-hidden">
          <CardHeader className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between shrink-0">
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center xl:flex-1">
              <CardTitle className="text-xl flex items-center gap-2 whitespace-nowrap">
                <Package className="h-6 w-6 text-primary" />
                Product Management
              </CardTitle>
              <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                tooltip="Search by product code or product name"
                className="w-full sm:max-w-[320px]"
                inputClassName="h-9 text-[13px]"
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="w-[170px]">
                <SearchableSelect
                  options={categoryOptions}
                  value={categoryFilter}
                  onValueChange={(value) => setCategoryFilter(value)}
                  placeholder="Category"
                  searchPlaceholder="Search Category..."
                  isClearable={false}
                  triggerClassName="h-9 bg-background text-[13px]"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setDebouncedSearchTerm("");
                  setCategoryFilter("all");
                  cancelEdit();
                  setSorting([{ id: "createdAt", desc: true }]);
                }}
                className="h-8.5 gap-1 px-2.5 text-[13px] font-semibold border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/50 transition-all"
                disabled={
                  !searchTerm &&
                  categoryFilter === "all" &&
                  !editingRowId &&
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
              recordCount={filteredRows.length}
              isLoading={isTableLoading}
              emptyMessage="No assigned products found."
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
                className="max-h-[78vh]"
                isLoading={isTableLoading}
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

      <ProductDetailModal
        isOpen={isProductDetailOpen}
        onClose={() => {
          setIsProductDetailOpen(false);
          setSelectedProductId(null);
        }}
        englishOnly
        product={productDetailQuery.data || null}
      />
    </Container>
  );
}
