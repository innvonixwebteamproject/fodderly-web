import {
  ColumnDef,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { Circle, Loader2, Package2, RotateCcw, Tags } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { getApiSortParams } from "@/lib/api-sorting";
import { ActionButton } from "@/components/common/action-button";
import { Container } from "@/components/common/container";
import { CancelButtonContent } from "@/components/common/cancel-button-content";
import { SearchInput } from "@/components/common/search-input";
import { InfiniteScrollContainer } from "@/components/common/infinite-scroll-container";
import { TruncatedCell } from "@/components/common/truncated-cell";
import {
  StatusConfig,
  StatusDropdown,
} from "@/components/common/status-dropdown";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTable, CardTitle } from "@/components/ui/card";
import { DataGrid } from "@/components/ui/data-grid";
import { DataGridColumnHeader } from "@/components/ui/data-grid-column-header";
import { DataGridTable } from "@/components/ui/data-grid-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useDeleteInventoryCategoryMutation,
  useDeleteProductCategoryMutation,
  useInventoryCategoriesInfiniteQuery,
  useInventoryCategoryMutation,
  useProductCategoriesInfiniteQuery,
  useProductCategoryMutation,
  useToggleInventoryCategoryStatusMutation,
  useToggleProductCategoryStatusMutation,
} from "../hooks";
import { InventoryCategoryForm } from "../components/InventoryCategoryForm";
import { ProductCategoryViewDialog } from "../components/ProductCategoryViewDialog";
import { ProductCategoryForm } from "../components/ProductCategoryForm";
import type {
  CategoryStatus,
  CategoryStatusFilter,
  InventoryCategoryFormValues,
  InventoryCategoryItem,
  ProductCategoryFormValues,
  ProductCategoryItem,
} from "../types";

type DeleteTarget =
  | {
      type: "product";
      item: ProductCategoryItem;
    }
  | {
      type: "inventory";
      item: InventoryCategoryItem;
    }
  | null;

const STATUS_FILTER_OPTIONS: Array<{
  value: CategoryStatusFilter;
  label: string;
}> = [
  { value: "all", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const statusOptions = STATUS_FILTER_OPTIONS.map((option) => ({
  label: option.label,
  value: option.value,
}));

const formatDateOnly = (value?: string) => {
  if (!value) {
    return "-";
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return "-";
  }

  return format(parsedDate, "dd MMM,yyyy");
};

const getProductCategoryLabel = (item: ProductCategoryItem) =>
  item.name.en || Object.values(item.name).find(Boolean) || "Untitled Category";

type ProductCategoryStatusEntity = ProductCategoryItem & {
  name: string;
  status: CategoryStatus;
};

type InventoryCategoryStatusEntity = InventoryCategoryItem & {
  name: string;
  status: CategoryStatus;
};

const getCategoryStatusConfig = (status: CategoryStatus): StatusConfig => {
  if (status === "active") {
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
};

export function CategoryCmsPage() {
  const [activeTab, setActiveTab] = useState<"product" | "inventory">("product");
  const [productSorting, setProductSorting] = useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);
  const [inventorySorting, setInventorySorting] = useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);

  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [debouncedProductSearchTerm, setDebouncedProductSearchTerm] = useState("");
  const [productStatusFilter, setProductStatusFilter] =
    useState<CategoryStatusFilter>("all");
  const [selectedProductCategory, setSelectedProductCategory] =
    useState<ProductCategoryItem | null>(null);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [isProductViewDialogOpen, setIsProductViewDialogOpen] = useState(false);
  const [selectedProductCategoryForView, setSelectedProductCategoryForView] =
    useState<ProductCategoryItem | null>(null);
  const [productStatusPendingId, setProductStatusPendingId] = useState<string | null>(
    null,
  );

  const [isProductCategorySubmitting, setIsProductCategorySubmitting] = useState(false);

  const [inventorySearchTerm, setInventorySearchTerm] = useState("");
  const [debouncedInventorySearchTerm, setDebouncedInventorySearchTerm] =
    useState("");
  const [inventoryStatusFilter, setInventoryStatusFilter] =
    useState<CategoryStatusFilter>("all");
  const [selectedInventoryCategory, setSelectedInventoryCategory] =
    useState<InventoryCategoryItem | null>(null);
  const [isInventoryDialogOpen, setIsInventoryDialogOpen] = useState(false);
  const [inventoryStatusPendingId, setInventoryStatusPendingId] = useState<
    string | null
  >(null);

  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedProductSearchTerm(productSearchTerm);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [productSearchTerm]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedInventorySearchTerm(inventorySearchTerm);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [inventorySearchTerm]);

  const productSort = getApiSortParams({
    sorting: productSorting,
    defaultSortBy: "createdAt",
    columnToSortByMap: {
      name: "name",
      createdAt: "createdAt",
    },
  });

  const inventorySort = getApiSortParams({
    sorting: inventorySorting,
    defaultSortBy: "createdAt",
    columnToSortByMap: {
      name: "name",
      createdAt: "createdAt",
    },
  });

  const productCategoriesQuery = useProductCategoriesInfiniteQuery({
    search: debouncedProductSearchTerm || undefined,
    status:
      productStatusFilter === "all"
        ? undefined
        : (productStatusFilter as CategoryStatus),
    sortBy: productSort.sortBy,
    sortOrder: productSort.sortOrder,
    enabled: activeTab === "product",
  });

  const inventoryCategoriesQuery = useInventoryCategoriesInfiniteQuery({
    search: debouncedInventorySearchTerm || undefined,
    status:
      inventoryStatusFilter === "all"
        ? undefined
        : (inventoryStatusFilter as CategoryStatus),
    sortBy: inventorySort.sortBy,
    sortOrder: inventorySort.sortOrder,
    enabled: activeTab === "inventory",
  });

  const productGridBlockingLoad =
    productCategoriesQuery.isFetching && productCategoriesQuery.data === undefined;

  const inventoryGridBlockingLoad =
    inventoryCategoriesQuery.isFetching && inventoryCategoriesQuery.data === undefined;

  const closeProductDialog = () => {
    setIsProductDialogOpen(false);
    setSelectedProductCategory(null);
  };

  const closeInventoryDialog = () => {
    setIsInventoryDialogOpen(false);
    setSelectedInventoryCategory(null);
  };

  const productCategoryMutation = useProductCategoryMutation(
    selectedProductCategory?.id,
    closeProductDialog,
  );

  useEffect(() => {
    if (!productCategoryMutation.isPending) {
      setIsProductCategorySubmitting(false);
    }
  }, [productCategoryMutation.isPending]);
  const inventoryCategoryMutation = useInventoryCategoryMutation(
    selectedInventoryCategory?.id,
    closeInventoryDialog,
  );
  const deleteProductCategoryMutation = useDeleteProductCategoryMutation(() =>
    setDeleteTarget(null),
  );
  const deleteInventoryCategoryMutation = useDeleteInventoryCategoryMutation(() =>
    setDeleteTarget(null),
  );
  const toggleProductCategoryStatusMutation =
    useToggleProductCategoryStatusMutation();
  const toggleInventoryCategoryStatusMutation =
    useToggleInventoryCategoryStatusMutation();

  const handleProductSubmit = (values: ProductCategoryFormValues) => {
    const normalizedName = values.name.en.trim().toLowerCase();

    if (productCategoryMutation.isPending || isProductCategorySubmitting) return;

    const existingProductCategories =
      productCategoriesQuery.data?.pages.flatMap((page) => page.data) || [];

    const hasConflict = existingProductCategories.some((item) => {
      const itemName = getProductCategoryLabel(item).trim().toLowerCase();
      if (!itemName) return false;
      if (selectedProductCategory?.id && item.id === selectedProductCategory.id) return false;
      return itemName === normalizedName;
    });

    if (hasConflict) {
      toast.error("A category with this name already exists.");
      return;
    }

    setIsProductCategorySubmitting(true);
    productCategoryMutation.mutate(values);
  };

  const handleInventorySubmit = (values: InventoryCategoryFormValues) => {
    inventoryCategoryMutation.mutate(values);
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) {
      return;
    }

    if (deleteTarget.type === "product") {
      deleteProductCategoryMutation.mutate(deleteTarget.item.id);
      return;
    }

    deleteInventoryCategoryMutation.mutate(deleteTarget.item.id);
  };

  const handleProductStatusChange = useCallback(
    async (item: ProductCategoryItem, nextStatus: CategoryStatus) => {
      if (item.status === nextStatus) {
        toast.error(`Status is already set to ${nextStatus}.`);
        return;
      }

      setProductStatusPendingId(item.id);
      try {
        await toggleProductCategoryStatusMutation.mutateAsync({
          id: item.id,
          status: nextStatus,
        });
      } finally {
        setProductStatusPendingId((currentId) =>
          currentId === item.id ? null : currentId,
        );
      }
    },
    [toggleProductCategoryStatusMutation],
  );

  const handleInventoryStatusChange = useCallback(
    async (item: InventoryCategoryItem, nextStatus: CategoryStatus) => {
      if (item.status === nextStatus) {
        toast.error(`Status is already set to ${nextStatus}.`);
        return;
      }

      setInventoryStatusPendingId(item.id);
      try {
        await toggleInventoryCategoryStatusMutation.mutateAsync({
          id: item.id,
          status: nextStatus,
        });
      } finally {
        setInventoryStatusPendingId((currentId) =>
          currentId === item.id ? null : currentId,
        );
      }
    },
    [toggleInventoryCategoryStatusMutation],
  );

  const productData = useMemo(
    () => productCategoriesQuery.data?.pages.flatMap((page) => page.data) || [],
    [productCategoriesQuery.data?.pages],
  );

  const inventoryData = useMemo(
    () => inventoryCategoriesQuery.data?.pages.flatMap((page) => page.data) || [],
    [inventoryCategoriesQuery.data?.pages],
  );

  const productColumns = useMemo<ColumnDef<ProductCategoryItem>[]>(
    () => [
      {
        id: "serial",
        header: ({ column }) => (
          <DataGridColumnHeader title="Sr." column={column} />
        ),
        cell: ({ row }) => row.index + 1,
        enableSorting: false,
        size: 48,
      },
      {
        id: "name",
        accessorFn: (row) => getProductCategoryLabel(row),
        header: ({ column }) => (
          <DataGridColumnHeader title="Name" column={column} />
        ),
        enableSorting: true,
        cell: ({ row }) => (
          <div className="min-w-0">
            <TruncatedCell
              value={getProductCategoryLabel(row.original)}
              className="font-medium"
              maxWidth="max-w-[240px]"
            />
          </div>
        ),
        size: 220,
      },
      {
        id: "description",
        accessorFn: (row) => row.description.en || "No description",
        header: ({ column }) => (
          <DataGridColumnHeader title="Description" column={column} />
        ),
        enableSorting: false,
        cell: ({ row }) => (
          <TruncatedCell
            value={row.original.description.en || "No description"}
            maxWidth="max-w-[260px]"
            tooltipClassName="sm:max-w-[560px]"
          />
        ),
        size: 260,
      },
      {
        id: "status",
        accessorKey: "status",
        header: ({ column }) => (
          <DataGridColumnHeader title="Status" column={column} />
        ),
        enableSorting: false,
        cell: ({ row }) => (
          <StatusDropdown<ProductCategoryStatusEntity, CategoryStatus>
            entity={{
              ...row.original,
              name: getProductCategoryLabel(row.original),
              status: row.original.status,
            }}
            currentStatus={row.original.status}
            availableStatuses={["active", "inactive"]}
            getStatusConfig={getCategoryStatusConfig}
            onStatusChange={handleProductStatusChange}
            onSameStatusSelected={(status) => {
              toast.error(`Status is already set to ${status}.`);
            }}
            entityType="category"
            disabled={productStatusPendingId === row.original.id}
            showConfirmation
            confirmationTitle="Confirm Status Change"
            getConfirmationMessage={(category, newStatus) =>
              `Are you sure you want to ${
                newStatus === "active" ? "activate" : "deactivate"
              } category "${category.name}"? This will affect its visibility in the system.`
            }
          />
        ),
        size: 110,
      },
      {
        id: "createdAt",
        accessorFn: (row) => row.createdAt || "",
        header: ({ column }) => (
          <DataGridColumnHeader title="Created" column={column} />
        ),
        enableSorting: true,
        cell: ({ row }) => (
          <>{formatDateOnly(row.original.createdAt)}</>
        ),
      },
      {
        id: "actions",
        header: ({ column }) => (
          <DataGridColumnHeader title="Actions" column={column} />
        ),
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <ActionButton
              actionType="view"
              tooltip="View category"
              onClick={() => {
                setSelectedProductCategoryForView(row.original);
                setIsProductViewDialogOpen(true);
              }}
            />
            <ActionButton
              actionType="edit"
              tooltip="Edit category"
              onClick={() => {
                setSelectedProductCategory(row.original);
                setIsProductDialogOpen(true);
              }}
            />
            <ActionButton
              actionType="delete"
              tooltip="Delete category"
              onClick={() =>
                setDeleteTarget({ type: "product", item: row.original })
              }
            />
          </div>
        ),
        size: 88,
      },
    ],
    [handleProductStatusChange, productStatusPendingId],
  );

  const inventoryColumns = useMemo<ColumnDef<InventoryCategoryItem>[]>(
    () => [
      {
        id: "serial",
        header: ({ column }) => (
          <DataGridColumnHeader title="Sr." column={column} />
        ),
        cell: ({ row }) => row.index + 1,
        enableSorting: false,
        size: 48,
      },
      {
        id: "name",
        accessorKey: "name",
        header: ({ column }) => (
          <DataGridColumnHeader title="Name" column={column} />
        ),
        enableSorting: true,
        cell: ({ row }) => (
          <TruncatedCell
            value={row.original.name}
            className="font-medium"
            maxWidth="max-w-[280px]"
          />
        ),
        size: 240,
      },
      {
        id: "status",
        accessorKey: "status",
        header: ({ column }) => (
          <DataGridColumnHeader title="Status" column={column} />
        ),
        enableSorting: false,
        cell: ({ row }) => (
          <StatusDropdown<InventoryCategoryStatusEntity, CategoryStatus>
            entity={{
              ...row.original,
              name: row.original.name,
              status: row.original.status,
            }}
            currentStatus={row.original.status}
            availableStatuses={["active", "inactive"]}
            getStatusConfig={getCategoryStatusConfig}
            onStatusChange={handleInventoryStatusChange}
            onSameStatusSelected={(status) => {
              toast.error(`Status is already set to ${status}.`);
            }}
            entityType="category"
            disabled={inventoryStatusPendingId === row.original.id}
            showConfirmation
            confirmationTitle="Confirm Status Change"
            getConfirmationMessage={(category, newStatus) =>
              `Are you sure you want to ${
                newStatus === "active" ? "activate" : "deactivate"
              } category "${category.name}"? This will affect its visibility in the system.`
            }
          />
        ),
        size: 110,
      },
      {
        id: "createdAt",
        accessorFn: (row) => row.createdAt || "",
        header: ({ column }) => (
          <DataGridColumnHeader title="Created" column={column} />
        ),
        enableSorting: true,
        cell: ({ row }) => (
          <>{formatDateOnly(row.original.createdAt)}</>
        ),
      },
      {
        id: "actions",
        header: ({ column }) => (
          <DataGridColumnHeader title="Actions" column={column} />
        ),
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <ActionButton
              actionType="edit"
              tooltip="Edit category"
              onClick={() => {
                setSelectedInventoryCategory(row.original);
                setIsInventoryDialogOpen(true);
              }}
            />
            <ActionButton
              actionType="delete"
              tooltip="Delete category"
              onClick={() =>
                setDeleteTarget({ type: "inventory", item: row.original })
              }
            />
          </div>
        ),
        size: 88,
      },
    ],
    [handleInventoryStatusChange, inventoryStatusPendingId],
  );

  const productTable = useReactTable({
    data: productData,
    columns: productColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting: productSorting,
    },
    onSortingChange: setProductSorting,
    manualSorting: true,
    columnResizeMode: "onChange",
  });

  const inventoryTable = useReactTable({
    data: inventoryData,
    columns: inventoryColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting: inventorySorting,
    },
    onSortingChange: setInventorySorting,
    manualSorting: true,
    columnResizeMode: "onChange",
  });

  return (
    <Container className="pb-8">
      <div className="flex min-h-0 flex-col gap-6">
        

        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "product" | "inventory")}
        >
          <TabsList variant="line" size="md" className="w-full justify-start">
            <TabsTrigger value="product">Product Categories</TabsTrigger>
            <TabsTrigger value="inventory">Inventory Categories</TabsTrigger>
          </TabsList>

          <TabsContent value="product" className="mt-4">
            <Card variant="listing" className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <CardHeader className="flex shrink-0 flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center xl:flex-1">
                  <CardTitle className="text-xl flex shrink-0 items-center gap-2 whitespace-nowrap">
                    <Tags className="h-5 w-5 text-primary" />
                    Product Category
                  </CardTitle>
                  <SearchInput
                    value={productSearchTerm}
                    onChange={setProductSearchTerm}
                    tooltip="Search by name"
                    className="w-full sm:max-w-[280px] xl:max-w-[300px] 2xl:max-w-[340px]"
                    inputClassName="h-9 text-[13px]"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2 xl:shrink-0 2xl:flex-nowrap">
                  <div className="w-[120px]">
                    <SearchableSelect
                      options={statusOptions}
                      value={productStatusFilter}
                      onValueChange={(value) =>
                        setProductStatusFilter(value as CategoryStatusFilter)
                      }
                      placeholder="Status"
                      searchPlaceholder="Search Status..."
                      searchInputClassName="text-xs placeholder:text-xs"
                      isClearable={false}
                      triggerClassName="h-9 bg-background text-[13px]"
                    />
                  </div>

                  <Button
                    variant="outline"
                    className="h-8.5 gap-1 px-2.5 text-[13px] font-semibold border-primary/30 text-primary transition-all hover:border-primary/50 hover:bg-primary/5"
                    onClick={() => {
                      setProductSearchTerm("");
                      setProductStatusFilter("all");
                      setProductSorting([{ id: "createdAt", desc: true }]);
                    }}
                    disabled={
                      !productSearchTerm &&
                      productStatusFilter === "all" &&
                      productSorting.length === 1 &&
                      productSorting[0]?.id === "createdAt" &&
                      productSorting[0]?.desc === true
                    }
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reset
                  </Button>

                  <ActionButton
                    actionType="add"
                    showIconOnly={false}
                    iconClassName="mr-1"
                    className="h-8.5 min-w-[90px] gap-0 px-2.5 text-[13px] font-semibold shadow-sm hover:translate-y-0"
                    onClick={() => {
                      setSelectedProductCategory(null);
                      setIsProductDialogOpen(true);
                    }}
                  >
                    Create
                  </ActionButton>
                </div>
              </CardHeader>

              <CardTable className="min-h-0 flex-1 overflow-hidden">
                <DataGrid
                  table={productTable}
                  recordCount={productData.length}
                  isLoading={productGridBlockingLoad}
                  emptyMessage="No product categories found."
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
                    className="max-h-[78vh]"
                    isLoading={productGridBlockingLoad}
                    isFetchingNextPage={productCategoriesQuery.isFetchingNextPage}
                    hasNextPage={productCategoriesQuery.hasNextPage}
                    onLoadMore={() => productCategoriesQuery.fetchNextPage()}
                    overflowX="auto"
                    overflowY="auto"
                  >
                    <DataGridTable />
                  </InfiniteScrollContainer>
                </DataGrid>
              </CardTable>
            </Card>
          </TabsContent>

          <TabsContent value="inventory" className="mt-4">
            <Card variant="listing" className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <CardHeader className="flex shrink-0 flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center xl:flex-1">
                  <CardTitle className="text-xl flex shrink-0 items-center gap-2 whitespace-nowrap">
                    <Package2 className="h-5 w-5 text-primary" />
                    Inventory Category
                  </CardTitle>
                  <SearchInput
                    value={inventorySearchTerm}
                    onChange={setInventorySearchTerm}
                    tooltip="Search by name"
                    className="w-full sm:max-w-[280px] xl:max-w-[300px] 2xl:max-w-[340px]"
                    inputClassName="h-9 text-[13px]"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2 xl:shrink-0 2xl:flex-nowrap">
                  <div className="w-[120px]">
                    <SearchableSelect
                      options={statusOptions}
                      value={inventoryStatusFilter}
                      onValueChange={(value) =>
                        setInventoryStatusFilter(value as CategoryStatusFilter)
                      }
                      placeholder="Status"
                      searchPlaceholder="Search Status..."
                      searchInputClassName="text-xs placeholder:text-xs"
                      isClearable={false}
                      triggerClassName="h-9 bg-background text-[13px]"
                    />
                  </div>

                  <Button
                    variant="outline"
                    className="h-8.5 gap-1 px-2.5 text-[13px] font-semibold border-primary/30 text-primary transition-all hover:border-primary/50 hover:bg-primary/5"
                    onClick={() => {
                      setInventorySearchTerm("");
                      setInventoryStatusFilter("all");
                      setInventorySorting([{ id: "createdAt", desc: true }]);
                    }}
                    disabled={
                      !inventorySearchTerm &&
                      inventoryStatusFilter === "all" &&
                      inventorySorting.length === 1 &&
                      inventorySorting[0]?.id === "createdAt" &&
                      inventorySorting[0]?.desc === true
                    }
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reset
                  </Button>

                  <ActionButton
                    actionType="add"
                    showIconOnly={false}
                    iconClassName="mr-1"
                    className="h-8.5 min-w-[90px] gap-0 px-2.5 text-[13px] font-semibold shadow-sm hover:translate-y-0"
                    onClick={() => {
                      setSelectedInventoryCategory(null);
                      setIsInventoryDialogOpen(true);
                    }}
                  >
                    Create
                  </ActionButton>
                </div>
              </CardHeader>

              <CardTable className="min-h-0 flex-1 overflow-hidden">
                <DataGrid
                  table={inventoryTable}
                  recordCount={inventoryData.length}
                  isLoading={inventoryGridBlockingLoad}
                  emptyMessage="No inventory categories found."
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
                    className="max-h-[78vh]"
                    isLoading={inventoryGridBlockingLoad}
                    isFetchingNextPage={inventoryCategoriesQuery.isFetchingNextPage}
                    hasNextPage={inventoryCategoriesQuery.hasNextPage}
                    onLoadMore={() => inventoryCategoriesQuery.fetchNextPage()}
                    overflowX="auto"
                    overflowY="auto"
                  >
                    <DataGridTable />
                  </InfiniteScrollContainer>
                </DataGrid>
              </CardTable>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
        <DialogContent className="flex max-h-[92vh] flex-col overflow-hidden p-0 sm:max-w-6xl">
          <DialogHeader className="shrink-0 border-b bg-background px-6 py-4">
            <DialogTitle>
              {selectedProductCategory
                ? "Edit Product Category"
                : "Create Product Category"}
            </DialogTitle>
            <DialogDescription>
              Enter the English content first, then use auto-translate to generate other languages.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden px-6">
            <ProductCategoryForm
              initialData={selectedProductCategory}
              onSubmit={handleProductSubmit}
              onCancel={closeProductDialog}
              isLoading={productCategoryMutation.isPending}
            />
          </div>
        </DialogContent>
      </Dialog>

      <ProductCategoryViewDialog
        open={isProductViewDialogOpen}
        onOpenChange={(open) => {
          setIsProductViewDialogOpen(open);
          if (!open) {
            setSelectedProductCategoryForView(null);
          }
        }}
        category={selectedProductCategoryForView}
      />

      <Dialog
        open={isInventoryDialogOpen}
        onOpenChange={setIsInventoryDialogOpen}
      >
        <DialogContent className="flex max-h-[92vh] flex-col overflow-hidden p-0 sm:max-w-xl">
          <DialogHeader className="shrink-0 border-b bg-background px-6 py-4">
            <DialogTitle>
              {selectedInventoryCategory
                ? "Edit Inventory Category"
                : "Create Inventory Category"}
            </DialogTitle>
            <DialogDescription>
              Keep your inventory category master clean and up to date.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 custom-scrollbar">
            <InventoryCategoryForm
              initialData={selectedInventoryCategory}
              onSubmit={handleInventorySubmit}
              onCancel={closeInventoryDialog}
              isLoading={inventoryCategoryMutation.isPending}
            />
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete category</AlertDialogTitle>
            <AlertDialogDescription className="break-words">
              {deleteTarget?.type === "product" ? (
                <div className="flex flex-col gap-1">
                  <span>Are you sure you want to delete category </span>
                  <span className="inline-block max-w-full align-top">
                    <strong className="block overflow-hidden break-all text-left font-semibold text-foreground" style={{
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                    }}>
                      {getProductCategoryLabel(deleteTarget.item)}
                    </strong>
                  </span>
                  <span className="text-destructive font-medium mt-1">This action cannot be undone.</span>
                </div>
              ) : deleteTarget?.type === "inventory" ? (
                <div className="flex flex-col gap-1">
                  <span>Are you sure you want to delete category </span>
                  <span className="inline-block max-w-full align-top">
                    <strong className="block overflow-hidden break-all text-left font-semibold text-foreground" style={{
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                    }}>
                      {deleteTarget.item.name}
                    </strong>
                  </span>
                  <span className="text-destructive font-medium mt-1">This action cannot be undone.</span>
                </div>
              ) : (
                "This action cannot be undone."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>
              <CancelButtonContent />
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteProductCategoryMutation.isPending ||
              deleteInventoryCategoryMutation.isPending ? (
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
