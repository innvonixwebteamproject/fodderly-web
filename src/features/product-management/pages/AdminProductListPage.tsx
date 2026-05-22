import {
  ColumnDef,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Circle, Link2, Package, RotateCcw } from "lucide-react";
import { getApiSortParams } from "@/lib/api-sorting";
import { Container } from "@/components/common/container";
import { SearchInput } from "@/components/common/search-input";
import { TruncatedCell } from "@/components/common/truncated-cell";
import { InfiniteScrollContainer } from "@/components/common/infinite-scroll-container";
import { CancelButtonContent } from "@/components/common/cancel-button-content";
import { DataGrid } from "@/components/ui/data-grid";
import { DataGridColumnHeader } from "@/components/ui/data-grid-column-header";
import { DataGridTable } from "@/components/ui/data-grid-table";
import { Card, CardHeader, CardTable, CardTitle } from "@/components/ui/card";
import { ActionButton } from "@/components/common/action-button";
import { RowActionsMenu } from "@/components/common/row-actions-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { getInventoryUnitLabel } from "@/constants/unit.constants";
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
import { ProductDetailModal } from "../components/ProductDetailModal";
import { useProductCategoriesQuery } from "@/features/category-management/hooks";
import {
  useDeleteProductMutation,
  useProductQuery,
  useUpdateProductStatusMutation,
  useProductsInfiniteQuery,
} from "../hooks";
import { ProductRecord } from "../types";
import type { AllocationInventory } from "../types/allocation.types";
import { getLanguageLabel } from "../services/product.api";
import {
  getPrimaryProductImageUrl,
  PRODUCT_NO_IMAGE_PLACEHOLDER,
} from "../utils/product-image";
import { AllocationInventoryModal } from "../components/AllocationInventoryModal";
import { StatusConfig, StatusDropdown } from "@/components/common/status-dropdown";

type ProductStatusEntity = {
  id: string;
  name: string;
  status: boolean;
};

const formatCreatedDate = (value?: string) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return format(parsed, "dd/MM/yyyy");
};

export function AdminProductListPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [selectedInventories, setSelectedInventories] = useState<AllocationInventory[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<ProductRecord | null>(null);
  const [productStatusPendingId, setProductStatusPendingId] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearchTerm(searchTerm), 350);
    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  const { sortBy, sortOrder } = getApiSortParams({
    sorting,
    defaultSortBy: "createdAt",
    columnToSortByMap: {
      name: "name",
      price: "price",
      stock: "stock",
      createdAt: "createdAt",
    },
  });

  const productsQuery = useProductsInfiniteQuery({
    search: debouncedSearchTerm || undefined,
    categoryUuid: categoryFilter === "all" ? undefined : categoryFilter,
    sortBy,
    sortOrder,
    isActive: statusFilter === "all" ? undefined : statusFilter === "active",
  });

  const categoriesQuery = useProductCategoriesQuery({ page: 1, limit: 100, status: "active" });

  const rows = useMemo(
    () => productsQuery.data?.pages.flatMap((page) => page.data) || [],
    [productsQuery.data?.pages],
  );

  const categoryOptions = useMemo(
    () => [
      { label: "All Categories", value: "all" },
      ...(categoriesQuery.data?.data || []).map((item) => ({
        label: getLanguageLabel(item.name, "Category"),
        value: item.id,
      })),
    ],
    [categoriesQuery.data?.data],
  );

  const statusOptions = [
    { label: "All Status", value: "all" },
    { label: "Active", value: "active" },
    { label: "Inactive", value: "inactive" },
  ];

  const deleteMutation = useDeleteProductMutation(() => setDeleteTarget(null));
  const updateProductStatusMutation = useUpdateProductStatusMutation();
  const productDetailQuery = useProductQuery(selectedProductId || undefined);

  const getProductStatusConfig = useCallback((status: boolean): StatusConfig => {
    if (status) {
      return {
        label: "Active",
        variant: "success",
        color: "text-emerald-700 dark:text-emerald-300",
        bgColor: "bg-emerald-50 dark:bg-emerald-950/20",
        borderColor: "border-emerald-200 dark:border-emerald-800/80",
        icon: <Circle className="h-2 w-2 fill-current" />,
      };
    }

    return {
      label: "Inactive",
      variant: "warning",
      color: "text-rose-700 dark:text-rose-300",
      bgColor: "bg-rose-50 dark:bg-rose-950/20",
      borderColor: "border-rose-200 dark:border-rose-800/80",
      icon: <Circle className="h-2 w-2 fill-current" />,
    };
  }, []);

  const handleProductStatusChange = useCallback(
    async (item: ProductStatusEntity, nextStatus: boolean) => {
      if (item.status === nextStatus) return;
      setProductStatusPendingId(item.id);
      try {
        await updateProductStatusMutation.mutateAsync({ id: item.id, isActive: nextStatus });
      } finally {
        setProductStatusPendingId((currentId) => (currentId === item.id ? null : currentId));
      }
    },
    [updateProductStatusMutation],
  );

  const columns = useMemo<ColumnDef<ProductRecord>[]>(
    () => [
      {
        id: "serial",
        header: ({ column }) => <DataGridColumnHeader title="Sr No" column={column} />,
        cell: ({ row }) => row.index + 1,
        size: 60,
      },
      {
        id: "name",
        accessorFn: (row) => getLanguageLabel(row.name),
        header: ({ column }) => <DataGridColumnHeader title="Name" column={column} />,
        enableSorting: true,
        cell: ({ row }) => (
          <div className="flex min-w-0 flex-col">
            <TruncatedCell
              value={getLanguageLabel(row.original.name)}
              className="font-medium"
              maxWidth="max-w-[120px]"
            />
            <TruncatedCell
              value={row.original.uniqueID}
              className="text-xs text-muted-foreground"
              maxWidth="max-w-[120px]"
              tooltipClassName="sm:max-w-[300px]"
            />
          </div>
        ),
        size: 130,
      },
      {
        id: "description",
        accessorFn: (row) => getLanguageLabel(row.description, "—"),
        header: ({ column }) => <DataGridColumnHeader title="Description" column={column} />,
        enableSorting: false,
        cell: ({ row }) => (
          <TruncatedCell
            value={getLanguageLabel(row.original.description, "—")}
            maxWidth="max-w-[180px]"
            tooltipClassName="sm:max-w-[560px]"
          />
        ),
        size: 180,
      },
      {
        id: "image",
        header: ({ column }) => <DataGridColumnHeader title="Image" column={column} />,
        cell: ({ row }) => {
          const imageSrc = getPrimaryProductImageUrl(row.original.images) || PRODUCT_NO_IMAGE_PLACEHOLDER;

          return (
            <div className="h-11 w-11 overflow-hidden rounded border bg-muted/30">
              <img
                src={imageSrc}
                alt={getLanguageLabel(row.original.name)}
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
        id: "category",
        accessorFn: (row) => getLanguageLabel(row.category_name),
        header: ({ column }) => <DataGridColumnHeader title="Category" column={column} />,
        enableSorting: false,
        cell: ({ row }) => <Badge variant="outline">{getLanguageLabel(row.original.category_name)}</Badge>,
      },
      {
        id: "inventories",
        accessorFn: (row) => row.inventories?.map((item) => item.name).join(", ") || "",
        header: ({ column }) => <DataGridColumnHeader title="Inventory" column={column} />,
        enableSorting: false,
        cell: ({ row }) => {
          const inventories = row.original.inventories || [];
          const inventoryLabel =
            inventories.length === 0
              ? "No inventory available"
              : inventories.length === 1
                ? inventories[0]?.name || "Inventory"
                : `${inventories.length} inventories`;

          return (
            <button
              type="button"
              className="min-w-0 cursor-pointer text-left text-primary underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
              disabled={inventories.length === 0}
              onClick={() => {
                setSelectedInventories(
                  inventories.map((item) => ({
                    id: item.id,
                    name: item.name || "",
                    description: item.description,
                    unit: item.unit,
                    quantity: item.quantity,
                    hsn_code: item.hsn_code,
                    price: item.price,
                    category_name: item.category_name,
                  })),
                );
                setIsInventoryModalOpen(true);
              }}
              title={inventories.length === 0 ? "No inventory available" : "View inventory details"}
            >
              <TruncatedCell value={inventoryLabel} maxWidth="max-w-[220px]" showTooltip={false} />
            </button>
          );
        },
      },
      {
        id: "price",
        accessorKey: "price",
        header: ({ column }) => <DataGridColumnHeader title="Price" column={column} />,
        enableSorting: true,
        cell: ({ row }) => (
          <TruncatedCell
            value={`₹${row.original.price.toLocaleString()}`}
            className="font-semibold"
            maxWidth="max-w-[90px]"
            tooltipClassName="sm:max-w-[280px]"
          />
        ),
        size: 95,
      },
      {
        id: "stock",
        accessorKey: "stock",
        header: ({ column }) => <DataGridColumnHeader title="Qty" column={column} />,
        enableSorting: true,
        cell: ({ row }) => (
          <TruncatedCell
            value={`${row.original.admin_available_quantity ?? row.original.stock} ${getInventoryUnitLabel(row.original.admin_unit ?? row.original.quantity_indicator)}`}
            maxWidth="max-w-[110px]"
            tooltipClassName="sm:max-w-[280px]"
          />
        ),
        size: 110,
      },
      {
        id: "is_active",
        accessorKey: "is_active",
        header: ({ column }) => <DataGridColumnHeader title="Status" column={column} />,
        enableSorting: false,
        cell: ({ row }) => (
          <StatusDropdown<ProductStatusEntity, boolean>
            entity={{
              id: row.original.id,
              name: getLanguageLabel(row.original.name),
              status: row.original.is_active,
            }}
            currentStatus={row.original.is_active}
            availableStatuses={[true, false]}
            getStatusConfig={getProductStatusConfig}
            onStatusChange={handleProductStatusChange}
            onSameStatusSelected={() => null}
            entityType="product"
            disabled={productStatusPendingId === row.original.id}
            showConfirmation
            confirmationTitle="Confirm Status Change"
            getConfirmationMessage={(product, newStatus) =>
              `Are you sure you want to ${newStatus ? "activate" : "deactivate"} product "${product.name}"? This will affect product visibility in the system.`
            }
          />
        ),
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
        cell: ({ row }) => (
          <RowActionsMenu
            items={[
              {
                label: "View details",
                actionType: "view",
                onSelect: () => {
                  setSelectedProductId(row.original.id);
                  setIsDetailModalOpen(true);
                },
              },
              {
                label: "Edit product",
                actionType: "edit",
                onSelect: () => navigate(`/admin/products/edit/${row.original.id}`),
              },
              {
                label: "View Partner Allocations",
                actionType: "view",
                icon: Link2,
                onSelect: () =>
                  navigate(
                    `/admin/products/${row.original.id}/partner-allocations?productName=${encodeURIComponent(getLanguageLabel(row.original.name))}`,
                  ),
              },
              {
                label: "Delete product",
                actionType: "delete",
                onSelect: () => setDeleteTarget(row.original),
                disabled: deleteMutation.isPending,
              },
            ]}
          />
        ),
      },
    ],
    [deleteMutation.isPending, getProductStatusConfig, handleProductStatusChange, navigate, productStatusPendingId],
  );

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
    manualSorting: true,
    manualPagination: true,
  });

  return (
    <Container className="pb-8">
      <div className="flex h-full min-h-0 flex-col gap-6">
        <Card variant="listing" className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <CardHeader className="sticky top-0 z-10 flex flex-row items-center justify-between gap-4 bg-background pb-4 border-b">
            {/* Title and Search */}
            <div className="flex items-center gap-3 min-w-0">
              <CardTitle className="text-lg flex items-center gap-2 whitespace-nowrap shrink-0">
                <Package className="h-4.5 w-4.5 text-primary" />
                Product Management
              </CardTitle>
              <div className="hidden lg:block h-5 w-px bg-border mx-1" />
              <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                tooltip="Search by product name or code"
                className="hidden xl:block w-[160px] 2xl:w-[200px]"
                inputClassName="h-8.5 text-[12.5px]"
              />
            </div>

            {/* Filters and Actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                tooltip="Search by product name or code"
                className="xl:hidden w-[130px]"
                inputClassName="h-8.5 text-[12.5px]"
              />
              <div className="w-[110px]">
                <SearchableSelect
                  options={statusOptions}
                  value={statusFilter}
                  onValueChange={(val) => setStatusFilter(val as "all" | "active" | "inactive")}
                  placeholder="Status"
                  triggerClassName="h-8.5 bg-background text-[12px]"
                  isClearable={false}
                />
              </div>
              <div className="w-[140px]">
                <SearchableSelect
                  options={categoryOptions}
                  value={categoryFilter}
                  onValueChange={setCategoryFilter}
                  placeholder="Category"
                  triggerClassName="h-8.5 bg-background text-[12.5px]"
                  isClearable={false}
                />
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setCategoryFilter("all");
                  setStatusFilter("all");
                  setSorting([{ id: "createdAt", desc: true }]);
                }}
                className="h-8.5 gap-1 px-2.5 text-[13px] font-semibold border-primary/30 text-primary shrink-0 hover:bg-primary/5 hover:border-primary/50 transition-all"
                disabled={!searchTerm && categoryFilter === "all" && statusFilter === "all" && sorting[0]?.id === "createdAt"}
                title="Reset Filters"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
              <div className="h-6 w-px bg-border mx-1" />
              <ActionButton
                actionType="add"
                showIconOnly={false}
                iconClassName="mr-1"
                className="h-8.5 px-3 gap-0 text-[13px] font-semibold shadow-sm hover:translate-y-0"
                onClick={() => navigate("/admin/products/create")}
              >
                Create
              </ActionButton>
            </div>
          </CardHeader>

          <CardTable className="min-h-0 flex-1 overflow-hidden">
            <DataGrid
              table={table}
              recordCount={rows.length}
              isLoading={productsQuery.isLoading}
              emptyMessage="No products found."
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
                isLoading={productsQuery.isLoading}
                isFetchingNextPage={productsQuery.isFetchingNextPage}
                hasNextPage={productsQuery.hasNextPage}
                onLoadMore={() => productsQuery.fetchNextPage()}
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
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedProductId(null);
        }}
        product={productDetailQuery.data || null}
        showAllocatedQty={false}
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

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete product</AlertDialogTitle>
            <AlertDialogDescription className="break-words">
              <div className="flex flex-col gap-1">
                <span>Are you sure you want to delete product </span>
                <span className="inline-block max-w-full align-top">
                  <strong className="block overflow-hidden break-all text-left font-semibold text-foreground" style={{
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                  }}>
                    {deleteTarget ? getLanguageLabel(deleteTarget.name) : "—"}
                  </strong>
                </span>
                <span className="text-destructive font-medium mt-1">This action cannot be undone.</span>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              <CancelButtonContent />
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending || !deleteTarget}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Container>
  );
}
