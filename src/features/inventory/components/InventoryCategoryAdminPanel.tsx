import {
  ColumnDef,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Circle, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { ActionButton } from "@/components/common/action-button";
import { RowActionsMenu } from "@/components/common/row-actions-menu";
import { CancelButtonContent } from "@/components/common/cancel-button-content";
import { SearchInput } from "@/components/common/search-input";
import { TruncatedCell } from "@/components/common/truncated-cell";
import { DataGrid } from "@/components/ui/data-grid";
import { DataGridColumnHeader } from "@/components/ui/data-grid-column-header";
import { DataGridTable } from "@/components/ui/data-grid-table";
import { Card, CardHeader, CardTable, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  StatusConfig,
  StatusDropdown,
} from "@/components/common/status-dropdown";
import { InventoryCategoryForm } from "@/features/category-management/components/InventoryCategoryForm";
import {
  useDeleteInventoryCategoryMutation,
  useInventoryCategoriesQuery,
  useInventoryCategoryMutation,
  useToggleInventoryCategoryStatusMutation,
} from "@/features/category-management/hooks";
import type {
  CategoryStatus,
  CategoryStatusFilter,
  InventoryCategoryFormValues,
  InventoryCategoryItem,
} from "@/features/category-management/types";

const STATUS_FILTER_OPTIONS: Array<{
  value: CategoryStatus;
  label: string;
}> = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ];

const statusOptions = STATUS_FILTER_OPTIONS.map((option) => ({
  label: option.label,
  value: option.value,
}));

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

export function InventoryCategoryAdminPanel() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<CategoryStatusFilter>(undefined);
  const [sorting, setSorting] = useState<SortingState>([{ id: "updatedAt", desc: true }]);

  const [selectedCategory, setSelectedCategory] = useState<InventoryCategoryItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<InventoryCategoryItem | null>(null);
  const [statusPendingId, setStatusPendingId] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  const categoriesQuery = useInventoryCategoriesQuery({
    search: debouncedSearchTerm || undefined,
    status: statusFilter,
    limit: 10,
  });

  const closeDialog = () => {
    setIsDialogOpen(false);
    setSelectedCategory(null);
  };

  const categoryMutation = useInventoryCategoryMutation(selectedCategory?.id, closeDialog);
  const deleteMutation = useDeleteInventoryCategoryMutation(() => setDeleteTarget(null));
  const toggleStatusMutation = useToggleInventoryCategoryStatusMutation();

  const handleStatusChange = useCallback(
    async (item: InventoryCategoryItem, nextStatus: CategoryStatus) => {
      if (item.status === nextStatus) {
        toast.error(`Status is already set to ${nextStatus}.`);
        return;
      }

      setStatusPendingId(item.id);
      try {
        await toggleStatusMutation.mutateAsync({ id: item.id, status: nextStatus });
      } finally {
        setStatusPendingId((currentId) => (currentId === item.id ? null : currentId));
      }
    },
    [toggleStatusMutation],
  );

  const rows = categoriesQuery.data?.data || [];

  const columns = useMemo<ColumnDef<InventoryCategoryItem>[]>(
    () => [
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
        header: ({ column }) => <DataGridColumnHeader title="Category Name" column={column} />,
        enableSorting: true,
        cell: ({ row }) => (
          <TruncatedCell value={row.original.name} className="font-medium" maxWidth="max-w-[280px]" />
        ),
      },
      {
        id: "status",
        accessorKey: "status",
        header: ({ column }) => <DataGridColumnHeader title="Status" column={column} />,
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
            onStatusChange={handleStatusChange}
            onSameStatusSelected={(status) => {
              toast.error(`Status is already set to ${status}.`);
            }}
            entityType="category"
            disabled={statusPendingId === row.original.id}
            showConfirmation
            confirmationTitle="Confirm Status Change"
            getConfirmationMessage={(category, newStatus) =>
              `Are you sure you want to ${newStatus === "active" ? "activate" : "deactivate"} category ${category.name}?`
            }
          />
        ),
        size: 110,
      },
      {
        id: "updatedAt",
        accessorFn: (row) => row.updatedAt || row.createdAt || "",
        header: ({ column }) => <DataGridColumnHeader title="Updated" column={column} />,
        enableSorting: true,
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.updatedAt || row.original.createdAt || "-"}
          </span>
        ),
      },
      {
        id: "actions",
        header: ({ column }) => <DataGridColumnHeader title="Actions" column={column} />,
        enableSorting: false,
        cell: ({ row }) => (
          <RowActionsMenu
            items={[
              {
                label: "Edit category",
                actionType: "edit",
                onSelect: () => {
                  setSelectedCategory(row.original);
                  setIsDialogOpen(true);
                },
              },
              {
                label: "Delete category",
                actionType: "delete",
                onSelect: () => setDeleteTarget(row.original),
              },
            ]}
          />
        ),
        size: 72,
      },
    ],
    [handleStatusChange, statusPendingId],
  );

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { sorting },
    onSortingChange: setSorting,
    columnResizeMode: "onChange",
  });

  const handleReset = () => {
    setSearchTerm("");
    setStatusFilter(undefined);
  };

  const handleSubmit = (values: InventoryCategoryFormValues) => {
    categoryMutation.mutate(values);
  };

  return (
    <>
      <Card variant="listing" className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <CardHeader className="flex flex-col gap-3 shrink-0 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center xl:flex-1">
            <CardTitle className="text-xl flex items-center gap-2 whitespace-nowrap shrink-0">
              Inventory Categories
            </CardTitle>

            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              tooltip="Search by category name"
              className="w-full sm:max-w-[280px] xl:max-w-[300px] 2xl:max-w-[340px]"
              inputClassName="h-9 text-[13px]"
            />
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 xl:shrink-0 2xl:flex-nowrap">
            <div className="w-[120px]">
              <SearchableSelect
                options={statusOptions}
                value={statusFilter ?? ""}
                onValueChange={(value) =>
                  setStatusFilter(value ? (value as CategoryStatus) : undefined)
                }
                placeholder="Status"
                searchPlaceholder="Search Status..."
                searchInputClassName="text-xs placeholder:text-xs"
                triggerClassName="h-9 bg-background text-[13px]"
              />
            </div>

            <Button
              variant="outline"
              onClick={handleReset}
              className="h-8.5 gap-1 px-2.5 text-[13px] font-semibold border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/50 transition-all"
              disabled={!searchTerm && !statusFilter}
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
                setSelectedCategory(null);
                setIsDialogOpen(true);
              }}
            >
              Create
            </ActionButton>
          </div>
        </CardHeader>

        <CardTable className="min-h-0 flex-1 overflow-hidden">
          <DataGrid
            table={table}
            recordCount={rows.length}
            isLoading={categoriesQuery.isLoading}
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
            <DataGridTable />
          </DataGrid>
        </CardTable>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="flex max-h-[92vh] flex-col overflow-hidden p-0 sm:max-w-xl">
          <DialogHeader className="shrink-0 border-b bg-background px-6 py-4">
            <DialogTitle>{selectedCategory ? "Edit Inventory Category" : "Create Inventory Category"}</DialogTitle>
            <DialogDescription>Manage inventory category master data.</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6">
            <InventoryCategoryForm
              initialData={selectedCategory}
              onSubmit={handleSubmit}
              onCancel={closeDialog}
              isLoading={categoryMutation.isPending}
            />
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete category</AlertDialogTitle>
            <AlertDialogDescription className="break-words whitespace-pre-wrap">
              {deleteTarget
                ? `Delete ${deleteTarget.name}?\nThis action cannot be undone.`
                : "This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              <CancelButtonContent />
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
