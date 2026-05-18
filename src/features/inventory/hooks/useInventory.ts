import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/lib/api-error";
import {
  createInventory,
  deleteInventory,
  getInventories,
  getInventoryById,
  InventorySortOrder,
  updateInventory,
} from "../services/inventory.api";

const INVENTORY_LIST_KEY = "inventory-list";
const INVENTORY_ITEM_KEY = "inventory-item";

const getInventoryMutationMessage = (error: unknown, fallback: string) =>
  ApiError.getErrorMessage(error, fallback);

type ListParams = {
  page: number;
  limit?: number;
  search?: string;
  categoryUuid?: string;
  sortBy?: string;
  sortOrder?: InventorySortOrder;
};

export const useInventoriesQuery = (params: ListParams) =>
  useQuery({
    queryKey: [
      INVENTORY_LIST_KEY,
      "page",
      params.page,
      params.limit,
      params.search,
      params.categoryUuid,
      params.sortBy,
      params.sortOrder,
    ],
    queryFn: () => getInventories(params),
  });

export const useInventoriesInfiniteQuery = (
  search?: string,
  categoryUuid?: string,
  sortBy?: string,
  sortOrder?: InventorySortOrder,
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
  },
) =>
  useInfiniteQuery({
    queryKey: [INVENTORY_LIST_KEY, "infinite", search, categoryUuid, sortBy, sortOrder],
    queryFn: ({ pageParam = 1 }) =>
      getInventories({
        page: pageParam as number,
        search,
        categoryUuid,
        sortBy,
        sortOrder,
      }),
    getNextPageParam: (lastPage) => {
      const { hasNextPage, page } = lastPage.meta;
      return hasNextPage ? page + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: options?.enabled ?? true,
    refetchInterval: options?.refetchInterval,
  });

export const useInventoryQuery = (id?: string) =>
  useQuery({
    queryKey: [INVENTORY_ITEM_KEY, id],
    queryFn: () => getInventoryById(id!),
    enabled: Boolean(id),
  });

export const useCreateInventoryMutation = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createInventory,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: [INVENTORY_LIST_KEY] });
      toast.success(response.message || "Inventory created successfully.");
      onSuccess?.();
    },
    onError: (error: unknown) => {
      const message = getInventoryMutationMessage(error, "Unable to create inventory.");
      toast.error(message);
    },
  });
};

export const useUpdateInventoryMutation = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof updateInventory>[1] }) =>
      updateInventory(id, body),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: [INVENTORY_LIST_KEY] });
      if (response.data.id) {
        queryClient.invalidateQueries({ queryKey: [INVENTORY_ITEM_KEY, response.data.id] });
      }
      toast.success(response.message || "Inventory updated successfully.");
      onSuccess?.();
    },
    onError: (error: unknown) => {
      const message = getInventoryMutationMessage(error, "Unable to update inventory.");
      toast.error(message);
    },
  });
};

export const useDeleteInventoryMutation = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteInventory(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: [INVENTORY_LIST_KEY] });
      toast.success(response.message || "Inventory deleted successfully.");
      onSuccess?.();
    },
    onError: (error: unknown) => {
      const message = getInventoryMutationMessage(error, "Unable to delete inventory.");
      toast.error(message);
    },
  });
};
