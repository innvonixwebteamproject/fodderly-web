import {
  ColumnDef,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { getApiSortParams } from "@/lib/api-sorting";
import { Loader2, RotateCcw, Warehouse } from "lucide-react";
import { ActionButton } from "@/components/common/action-button";
import { RowActionsMenu } from "@/components/common/row-actions-menu";
import { Container } from "@/components/common/container";
import { CancelButtonContent } from "@/components/common/cancel-button-content";
import { InfiniteScrollContainer } from "@/components/common/infinite-scroll-container";
import { SearchInput } from "@/components/common/search-input";
import { TruncatedCell } from "@/components/common/truncated-cell";
import { DataGrid } from "@/components/ui/data-grid";
import { DataGridColumnHeader } from "@/components/ui/data-grid-column-header";
import { DataGridTable } from "@/components/ui/data-grid-table";
import { Card, CardHeader, CardTable, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/ui/searchable-select";
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
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useInventoryCategoriesQuery } from "@/features/category-management/hooks";
import { usePartnerAllocationsQuery } from "@/features/product-management/hooks";
import { formatForDisplay } from "@/utils/unit-conversion";
import { InventoryForm } from "../components/InventoryForm";
import {
  useCreateInventoryMutation,
  useDeleteInventoryMutation,
  useInventoriesInfiniteQuery,
  useUpdateInventoryMutation,
} from "../hooks/useInventory";
import type { InventoryCategoryOption, InventoryFormValues, InventoryRow } from "../types";

const formatCreatedDate = (value?: string) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return format(parsed, "dd/MM/yyyy");
};

export function InventoryListPage() {
  const role = useAuthStore((state) => state.role);
  const userId = useAuthStore((state) => state.userId);
  const isAdmin = role === "admin";
  const isPartner = role === "partner";

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<InventoryRow | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearchTerm(searchTerm), 350);
    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  const categoriesQuery = useInventoryCategoriesQuery({
    page: 1,
    limit: 100,
    status: "active",
  });

  const categoryOptions: InventoryCategoryOption[] = useMemo(() => {
    return (categoriesQuery.data?.data || []).map((category) => ({
      id: category.id,
      name: category.name,
      isActive: category.isActive,
    }));
  }, [categoriesQuery.data?.data]);

  const categorySelectOptions = useMemo(() => {
    return categoryOptions.map((category) => ({ label: category.name, value: category.id }));
  }, [categoryOptions]);

  const { sortBy, sortOrder } = getApiSortParams({
    sorting,
    defaultSortBy: "createdAt",
    columnToSortByMap: {
      name: "name",
      quantity: "quantity",
      price: "price",
      createdAt: "createdAt",
    },
  });

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInventoriesInfiniteQuery(
    debouncedSearchTerm.trim() || undefined,
    categoryFilter === "" ? undefined : categoryFilter,
    sortBy,
    sortOrder,
    {
      enabled: true,
      refetchInterval: isPartner ? 15_000 : undefined,
    },
  );

  const partnerAllocationsQuery = usePartnerAllocationsQuery(
    {
      partner_uuid: isPartner ? userId || undefined : undefined,
      page: 1,
      limit: 200,
    },
    Boolean(isPartner && userId),
  );

  const rows = useMemo<InventoryRow[]>(() => {
    const pages = data?.pages ?? [];
    return pages.flatMap((page) =>
      (page.data || []).map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        unit: item.unit,
        quantity: item.quantity,
        hsn_code: item.hsn_code,
        price: item.price,
        category_uuid: item.category_uuid,
        categoryName: item.category?.name,
        createdAt: item.createdAt,
      })),
    );
  }, [data?.pages]);

  const allocatedInventoryIdSet = useMemo(() => {
    const ids = new Set<string>();
    if (!isPartner) return ids;
    const allocations = partnerAllocationsQuery.data?.data || [];
    allocations.forEach((allocation) => {
      allocation.inventories.forEach((inventory) => {
        if (inventory.id) ids.add(inventory.id);
      });
    });
    return ids;
  }, [isPartner, partnerAllocationsQuery.data?.data]);

  const roleScopedRows = useMemo(() => {
    if (!isPartner) return rows;
    if (allocatedInventoryIdSet.size === 0) return [];
    return rows.filter((row) => allocatedInventoryIdSet.has(row.id));
  }, [allocatedInventoryIdSet, isPartner, rows]);

  const createMutation = useCreateInventoryMutation(() => {
    setIsFormOpen(false);
    setSelectedItem(null);
  });
  const updateMutation = useUpdateInventoryMutation(() => {
    setIsFormOpen(false);
    setSelectedItem(null);
  });
  const deleteMutation = useDeleteInventoryMutation(() => setDeleteTarget(null));

  const isDefaultSort =
    sorting.length === 1 && sorting[0]?.id === "createdAt" && sorting[0]?.desc === true;

  const handleReset = () => {
    setSearchTerm("");
    setCategoryFilter("");
    setSorting([{ id: "createdAt", desc: true }]);
  };

  const openCreate = () => {
    setSelectedItem(null);
    setIsFormOpen(true);
  };

  const openEdit = (item: InventoryRow) => {
    setSelectedItem(item);
    setIsFormOpen(true);
  };

  const handleSubmit = (values: InventoryFormValues) => {
    const payload = {
      name: values.name.trim(),
      description: values.description.trim(),
      unit: values.unit,
      quantity: values.quantity,
      category_uuid: values.category_uuid.trim(),
      hsn_code: values.hsn_code.trim(),
      price: values.price,
    };

    if (selectedItem) {
      updateMutation.mutate({ id: selectedItem.id, body: payload });
      return;
    }

    createMutation.mutate(payload);
  };

  const columns = useMemo<ColumnDef<InventoryRow>[]>(() => {
    const baseColumns: ColumnDef<InventoryRow>[] = [
      {
        id: "serial",
        header: ({ column }) => <DataGridColumnHeader title="Sr." column={column} />,
        cell: ({ row }) => row.index + 1,
        enableSorting: false,
        size: 48,
      },
      {
        id: "name",
        accessorKey: "name",
        header: ({ column }) => <DataGridColumnHeader title="Name" column={column} />,
        enableSorting: true,
        cell: ({ row }) => (
          <TruncatedCell value={row.original.name} className="font-medium" maxWidth="max-w-[180px]" />
        ),
      },
      {
        id: "description",
        accessorKey: "description",
        header: ({ column }) => <DataGridColumnHeader title="Description" column={column} />,
        enableSorting: false,
        cell: ({ row }) => (
          <TruncatedCell
            value={row.original.description || "—"}
            className="text-foreground"
            maxWidth="max-w-[220px]"
            tooltipClassName="max-w-[560px]"
          />
        ),
      },
      {
        id: "category",
        accessorFn: (row) => row.categoryName || row.category_uuid,
        header: ({ column }) => <DataGridColumnHeader title="Category" column={column} />,
        enableSorting: false,
        cell: ({ row }) => (
          <TruncatedCell value={row.original.categoryName || "—"} maxWidth="max-w-[200px]" />
        ),
      },
      {
        id: "quantity",
        accessorKey: "quantity",
        header: ({ column }) => <DataGridColumnHeader title="Total Quantity" column={column} />,
        enableSorting: true,
        cell: ({ row }) => {
          const display = formatForDisplay(row.original.quantity, row.original.price);
          return (
            <span>
              {display.quantity.toLocaleString()} {display.unit.toUpperCase()}
            </span>
          );
        },
      },
    ];

    if (isAdmin) {
      baseColumns.push({
        id: "hsn_code",
        accessorKey: "hsn_code",
        header: ({ column }) => <DataGridColumnHeader title="HSN" column={column} />,
        enableSorting: false,
        cell: ({ row }) => <span>{row.original.hsn_code}</span>,
      });
    }

    baseColumns.push({
      id: "price",
      accessorKey: "price",
      header: ({ column }) => (
        <DataGridColumnHeader title={isPartner ? "Total Inventory Price" : "Price"} column={column} />
      ),
      enableSorting: true,
      cell: ({ row }) => {
        const display = formatForDisplay(row.original.quantity, row.original.price);
        return (
          <span>
            ₹{display.price.toLocaleString()}/{display.unit.toUpperCase()}
          </span>
        );
      },
    });

    baseColumns.push({
      id: "createdAt",
      accessorFn: (row) => row.createdAt || "",
      header: ({ column }) => <DataGridColumnHeader title="Created" column={column} />,
      enableSorting: true,
      cell: ({ row }) => <span>{formatCreatedDate(row.original.createdAt)}</span>,
      size: 110,
    });

    if (isAdmin) {
      baseColumns.push({
        id: "actions",
        header: ({ column }) => <DataGridColumnHeader title="Actions" column={column} />,
        enableSorting: false,
        cell: ({ row }) => (
          <RowActionsMenu
            items={[
              {
                label: "Edit inventory",
                actionType: "edit",
                onSelect: () => openEdit(row.original),
              },
              {
                label: "Delete inventory",
                actionType: "delete",
                onSelect: () => setDeleteTarget(row.original),
                disabled: deleteMutation.isPending,
              },
            ]}
          />
        ),
        size: 72,
      });
    }

    return baseColumns;
  }, [deleteMutation.isPending, isAdmin, isPartner]);

  const table = useReactTable({
    data: roleScopedRows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { sorting },
    onSortingChange: setSorting,
    manualSorting: true,
    columnResizeMode: "onChange",
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <Container className="pb-8">
      <div className="flex h-full min-h-0 flex-col gap-6">
        <Card variant="listing" className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <CardHeader className="flex flex-col gap-3 shrink-0 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center xl:flex-1">
              <CardTitle className="text-xl flex items-center gap-2 whitespace-nowrap shrink-0">
                <Warehouse className="h-5 w-5 text-primary" />
                Inventory
              </CardTitle>

              <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                tooltip="Search by name"
                className="w-full sm:max-w-[280px] xl:max-w-[300px] 2xl:max-w-[340px]"
                inputClassName="h-9 text-[13px]"
              />
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 xl:shrink-0 2xl:flex-nowrap">
              <div className="w-[160px]">
                <SearchableSelect
                  options={categorySelectOptions}
                  value={categoryFilter}
                  onValueChange={setCategoryFilter}
                  placeholder="Category"
                  searchPlaceholder="Search category..."
                  searchInputClassName="text-xs placeholder:text-xs"
                  triggerClassName="h-9 bg-background text-[13px]"
                />
              </div>

              <Button
                variant="outline"
                onClick={handleReset}
                className="h-8.5 gap-1 px-2.5 text-[13px] font-semibold border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/50 transition-all"
                disabled={
                  !searchTerm &&
                  !categoryFilter &&
                  isDefaultSort
                }
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>

              {isAdmin && (
                <ActionButton
                  actionType="add"
                  showIconOnly={false}
                  iconClassName="mr-1"
                  className="h-8.5 min-w-[90px] gap-0 px-2.5 text-[13px] font-semibold shadow-sm hover:translate-y-0"
                  onClick={openCreate}
                >
                  Create
                </ActionButton>
              )}
            </div>
          </CardHeader>

          <CardTable className="min-h-0 flex-1 overflow-hidden">
            <DataGrid
              table={table}
                recordCount={roleScopedRows.length}
              isLoading={isLoading || (isPartner && partnerAllocationsQuery.isLoading)}
              emptyMessage={
                isPartner
                  ? "No inventory mapped to your allocated products."
                  : "No inventory items found."
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
                className="max-h-[78vh]"
                isLoading={isLoading}
                isFetchingNextPage={isFetchingNextPage}
                hasNextPage={hasNextPage}
                onLoadMore={() => fetchNextPage()}
                threshold={0.5}
                overflowX="auto"
                overflowY="auto"
              >
                <DataGridTable />
              </InfiniteScrollContainer>
            </DataGrid>
          </CardTable>
        </Card>
      </div>

      <Dialog open={isFormOpen} onOpenChange={(open) => !open && setIsFormOpen(false)}>
        <DialogContent className="flex max-h-[92vh] flex-col overflow-hidden p-0 sm:max-w-3xl">
          <DialogHeader className="shrink-0 border-b bg-background px-6 py-4">
            <DialogTitle>{selectedItem ? "Edit Inventory" : "Create Inventory"}</DialogTitle>
            <DialogDescription>
              {selectedItem ? "Update inventory details." : "Add a new inventory record."}
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar px-6">
            <InventoryForm
              initialData={selectedItem}
              categories={categoriesQuery.data?.data || []}
              onSubmit={handleSubmit}
              onCancel={() => setIsFormOpen(false)}
              isOpen={isFormOpen}
              isLoading={isSaving}
            />
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete inventory</AlertDialogTitle>
            <AlertDialogDescription className="break-words">
              <div className="flex flex-col gap-1">
                <span>Are you sure you want to delete inventory item </span>
                <span className="inline-block max-w-full align-top">
                  <strong className="block overflow-hidden break-all text-left font-semibold text-foreground" style={{
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                  }}>
                    {deleteTarget?.name}
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
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending || !deleteTarget}
            >
              {deleteMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Container>
  );
}
