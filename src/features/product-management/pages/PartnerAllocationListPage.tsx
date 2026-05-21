import { useEffect, useMemo, useState } from "react";
import {
  ColumnDef,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { Link2, Loader2, RotateCcw } from "lucide-react";
import { useParams } from "react-router-dom";
import { getApiSortParams } from "@/lib/api-sorting";
import { Container } from "@/components/common/container";
import { CancelButtonContent } from "@/components/common/cancel-button-content";
import { SearchInput } from "@/components/common/search-input";
import { TruncatedCell } from "@/components/common/truncated-cell";
import { ActionButton } from "@/components/common/action-button";
import { RowActionsMenu } from "@/components/common/row-actions-menu";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTable, CardTitle } from "@/components/ui/card";
import { DataGrid } from "@/components/ui/data-grid";
import { DataGridColumnHeader } from "@/components/ui/data-grid-column-header";
import { DataGridTable } from "@/components/ui/data-grid-table";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getInventoryUnitLabel } from "@/constants/unit.constants";
import { useProductCategoriesQuery } from "@/features/category-management/hooks";
import { usePartnersQuery } from "@/features/partner-management/hooks";
import { usePartnerAllocationProductDetailQuery, useProductsQuery } from "../hooks";
import {
  useAllocateProductsMutation,
  useDeletePartnerAllocationMutation,
  usePartnerAllocationsInfiniteQuery,
  useUpdatePartnerAllocationMutation,
} from "../hooks/usePartnerAllocations";
import { AllocateProductModal } from "../components/AllocateProductModal";
import { EditAllocationQuantityModal } from "../components/EditAllocationQuantityModal";
import { AllocationInventoryModal } from "../components/AllocationInventoryModal";
import { ProductDetailModal } from "../components/ProductDetailModal";
import type { AllocationItem } from "../types/allocation.types";
import {
  getPrimaryProductImageUrl,
  PRODUCT_NO_IMAGE_PLACEHOLDER,
} from "../utils/product-image";

import { InfiniteScrollContainer } from "@/components/common/infinite-scroll-container";

const formatCreatedDate = (value?: string) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return format(parsed, "dd MMM,yyyy");
};

export function PartnerAllocationListPage() {
  const { partnerId = "" } = useParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isAllocateModalOpen, setIsAllocateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAllocation, setSelectedAllocation] = useState<AllocationItem | null>(null);
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [selectedInventories, setSelectedInventories] = useState<AllocationItem["inventories"]>([]);
  const [isProductDetailOpen, setIsProductDetailOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AllocationItem | null>(null);
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);
  const { sortBy, sortOrder } = getApiSortParams({
    sorting,
    defaultSortBy: "createdAt",
    columnToSortByMap: {
      product_name: "product_name",
      price_per_unit: "price",
      total_allocated_price: "total_allocated_price",
      allocated_quantity: "allocated_quantity",
      createdAt: "createdAt",
    },
  });

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchTerm.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  const partnersQuery = usePartnersQuery(1, 100, undefined, "active");
  const categoriesQuery = useProductCategoriesQuery({ page: 1, limit: 100, status: "active" });
  const productsQuery = useProductsQuery({
    page: 1,
    limit: 100,
    isActive: true,
    enabled: isAllocateModalOpen,
  });

  const activePartners = useMemo(
    () =>
      (partnersQuery.data?.data || []).filter((partner) => partner.isActive),
    [partnersQuery.data?.data],
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
      partner_uuid: partnerId || undefined,
      category_uuid: categoryFilter === "all" ? undefined : categoryFilter,
      search: debouncedSearch || undefined,
      limit: 10,
      sortBy,
      sortOrder,
    },
    Boolean(partnerId),
  );
  const isTableLoading = isLoading || (isFetching && !isFetchingNextPage);

  const rows = useMemo(
    () => data?.pages.flatMap((page) => page.data) || [],
    [data?.pages],
  );

  const normalizedSearch = debouncedSearch.trim().toLowerCase();
  const filteredRows = useMemo(() => {
    if (!normalizedSearch) return rows;
    return rows.filter((row) => {
      const productName = row.product_name?.toLowerCase() || "";
      const uniqueId = row.uniqueID?.toLowerCase() || "";
      return productName.includes(normalizedSearch) || uniqueId.includes(normalizedSearch);
    });
  }, [normalizedSearch, rows]);

  const allocateMutation = useAllocateProductsMutation(() => setIsAllocateModalOpen(false));
  const updateMutation = useUpdatePartnerAllocationMutation();
  const deleteMutation = useDeletePartnerAllocationMutation();
  const productDetailQuery = usePartnerAllocationProductDetailQuery(
    partnerId || undefined,
    selectedProductId || undefined,
  );

  const selectedPartnerLabel = useMemo(() => {
    const selectedPartner = activePartners.find((partner) => partner.id === partnerId);
    if (!selectedPartner) return "-";
    return (
      selectedPartner.fullName ||
      `${selectedPartner.firstName} ${selectedPartner.lastName}`.trim() ||
      selectedPartner.email
    );
  }, [activePartners, partnerId]);

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

  const products = useMemo(
    () => productsQuery.data?.data || [],
    [productsQuery.data?.data],
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
          <TruncatedCell value={row.original.product_name} maxWidth="max-w-[220px]" />
        ),
        size: 220,
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
        cell: ({ row }) => <TruncatedCell value={row.original.category_name || "—"} maxWidth="max-w-[200px]" />,
        size: 180,
      },
      {
        id: "inventory_name",
        header: ({ column }) => <DataGridColumnHeader title="Inventory" column={column} />,
        enableSorting: false,
        cell: ({ row }) => (
          <button
            type="button"
            className="min-w-0 cursor-pointer text-left text-primary underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
            disabled={row.original.inventories.length === 0}
            onClick={() => {
              setSelectedInventories(row.original.inventories);
              setIsInventoryModalOpen(true);
            }}
            title={
              row.original.inventories.length === 0
                ? "No inventory available"
                : "View inventory details"
            }
          >
            <TruncatedCell
              value={
                row.original.inventories.length === 0
                  ? "No inventory available"
                  : row.original.inventories.length === 1
                    ? row.original.inventories[0]?.name || "Inventory"
                    : `${row.original.inventories.length} inventories`
              }
              maxWidth="max-w-[200px]"
              showTooltip={false}
            />
          </button>
        ),
        size: 170,
      },
      {
        id: "admin_available_quantity",
        accessorKey: "admin_available_quantity",
        header: ({ column }) => <DataGridColumnHeader title="Admin Available Qty" column={column} />,
        enableSorting: false,
        cell: ({ row }) =>
          row.original.admin_available_quantity !== null &&
          row.original.admin_available_quantity !== undefined
            ? `${row.original.admin_available_quantity} ${getInventoryUnitLabel(row.original.admin_unit ?? row.original.unit)}`
            : "—",
        size: 80,
      },
      {
        id: "available_quantity",
        accessorKey: "available_quantity",
        header: ({ column }) => <DataGridColumnHeader title="Available Qty" column={column} />,
        enableSorting: false,
        cell: ({ row }) =>
          row.original.available_quantity !== null && row.original.available_quantity !== undefined
            ? `${row.original.available_quantity} ${getInventoryUnitLabel(row.original.unit)}`
            : "—",
        size: 80,
      },
      {
        id: "allocated_quantity",
        accessorKey: "allocated_quantity",
        header: ({ column }) => <DataGridColumnHeader title="Allocated Qty" column={column} />,
        enableSorting: true,
        cell: ({ row }) =>
          `${row.original.allocated_quantity.toLocaleString()} ${getInventoryUnitLabel(row.original.unit)}`,
        size: 70,
      },
      {
        id: "price_per_unit",
        accessorKey: "price_per_unit",
        header: ({ column }) => <DataGridColumnHeader title="Price" column={column} />,
        enableSorting: true,
        cell: ({ row }) =>
          `₹${row.original.price_per_unit.toLocaleString(undefined, { maximumFractionDigits: 2 })}/${getInventoryUnitLabel(row.original.unit)}`,
        size: 90,
      },
      {
        id: "total_allocated_price",
        accessorKey: "total_allocated_price",
        header: ({ column }) => <DataGridColumnHeader title="Total" column={column} />,
        enableSorting: true,
        cell: ({ row }) => <span className="font-semibold">₹{row.original.total_allocated_price.toLocaleString()}</span>,
        size: 100,
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
        cell: ({ row }) => (
          <RowActionsMenu
            items={[
              {
                label: "View product details",
                actionType: "view",
                onSelect: () => {
                  setSelectedProductId(row.original.product_uuid);
                  setIsProductDetailOpen(true);
                },
              },
              {
                label: "Edit allocation quantity",
                actionType: "edit",
                onSelect: () => {
                  setSelectedAllocation(row.original);
                  setIsEditModalOpen(true);
                },
                disabled: updateMutation.isPending,
              },
              {
                label:
                  row.original.sold_quantity > 0
                    ? "Cannot remove mapping once sold quantity exists"
                    : "Remove mapping",
                actionType: "delete",
                onSelect: () => {
                  if (row.original.sold_quantity > 0) return;
                  setDeleteTarget(row.original);
                },
                disabled: row.original.sold_quantity > 0 || deleteMutation.isPending,
              },
            ]}
          />
        ),
        size: 72,
      },
    ],
    [deleteMutation, updateMutation],
  );

  const table = useReactTable({
    data: filteredRows,
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
          {/* Title and Search */}
          <div className="flex items-center gap-3 min-w-0">
            <CardTitle className="text-lg flex items-center gap-2 whitespace-nowrap shrink-0">
              <Link2 className="h-4.5 w-4.5 text-primary" />
              Partner Allocations
            </CardTitle>
            <div className="hidden lg:block h-5 w-px bg-border mx-1" />
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              tooltip="Search by product code or product name"
              className="hidden xl:block w-[180px] 2xl:w-[240px]"
              inputClassName="h-8.5 text-[12.5px]"
            />
            <span className="hidden md:inline-flex h-8.5 max-w-[260px] items-center rounded-md border bg-background px-3 text-[12.5px] text-muted-foreground">
              <span className="mr-1 shrink-0">Partner:</span>
              <span className="truncate font-medium text-foreground">
                {selectedPartnerLabel}
              </span>
            </span>
          </div>

          {/* Filters and Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              tooltip="Search by product code or product name"
              className="xl:hidden w-[140px]"
              inputClassName="h-8.5 text-[12.5px]"
            />
            <div className="w-[140px]">
              <SearchableSelect
                options={categoryOptions}
                value={categoryFilter}
                onValueChange={(value) => setCategoryFilter(value)}
                placeholder="Category"
                triggerClassName="h-8.5 bg-background text-[12px]"
                isClearable={false}
              />
            </div>
            <Button
              variant="outline"
              className="h-8.5 gap-1 px-2.5 text-[13px] font-semibold border-primary/30 text-primary shrink-0 hover:bg-primary/5 hover:border-primary/50 transition-all"
              onClick={() => {
                setSearchTerm("");
                setDebouncedSearch("");
                setCategoryFilter("all");
                setSorting([{ id: "createdAt", desc: true }]);
              }}
              disabled={
                !searchTerm &&
                categoryFilter === "all" &&
                sorting.length === 1 &&
                sorting[0]?.id === "createdAt" &&
                sorting[0]?.desc === true
              }
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
            <div className="h-6 w-px bg-border mx-1" />
            <ActionButton
              actionType="add"
              showIconOnly={false}
              className="h-8.5 px-3 text-[12.5px] font-semibold"
              onClick={() => setIsAllocateModalOpen(true)}
            >
              Allocate
            </ActionButton>
          </div>
        </CardHeader>

        <CardTable className="min-h-0 flex-1 overflow-hidden">
          <DataGrid
            table={table}
            recordCount={filteredRows.length}
            isLoading={isTableLoading}
            emptyMessage="No partner allocations found."
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

      <AllocateProductModal
        open={isAllocateModalOpen}
        onOpenChange={setIsAllocateModalOpen}
        partners={activePartners}
        products={products}
        defaultPartnerUuid={partnerId}
        lockedPartnerLabel={selectedPartnerLabel}
        lockPartnerSelection
        onSubmit={(payloads) => allocateMutation.mutate(payloads)}
        isSubmitting={allocateMutation.isPending || productsQuery.isLoading || partnersQuery.isLoading}
      />

      <EditAllocationQuantityModal
        open={isEditModalOpen}
        onOpenChange={(open) => {
          setIsEditModalOpen(open);
          if (!open) setSelectedAllocation(null);
        }}
        allocation={selectedAllocation}
        onSubmit={(payload) => {
          updateMutation.mutate(payload, {
            onSuccess: () => {
              setIsEditModalOpen(false);
              setSelectedAllocation(null);
            },
          });
        }}
        isSubmitting={updateMutation.isPending}
      />

      <AllocationInventoryModal
        open={isInventoryModalOpen}
        onOpenChange={(open) => {
          setIsInventoryModalOpen(open);
          if (!open) setSelectedInventories([]);
        }}
        inventories={selectedInventories}
        title="Inventory Details"
      />

      <ProductDetailModal
        isOpen={isProductDetailOpen}
        onClose={() => {
          setIsProductDetailOpen(false);
          setSelectedProductId(null);
        }}
        englishOnly
        product={productDetailQuery.data || null}
      />

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete allocation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this allocation? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              <CancelButtonContent />
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) })}
              disabled={deleteMutation.isPending || !deleteTarget}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Container>
  );
}

export default PartnerAllocationListPage;
