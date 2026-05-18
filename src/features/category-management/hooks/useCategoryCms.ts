import {
  InfiniteData,
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CategorySortOrder,
  createInventoryCategory,
  createProductCategory,
  deleteInventoryCategory,
  deleteProductCategory,
  getInventoryCategories,
  InventoryCategorySortBy,
  getProductCategories,
  ProductCategorySortBy,
  toggleInventoryCategoryStatus,
  updateInventoryCategory,
  updateProductCategory,
} from "../services";
import type {
  CategoryStatus,
  InventoryCategoryFormValues,
  InventoryCategoryItem,
  ProductCategoryFormValues,
  ProductCategoryItem,
} from "../types";

const PRODUCT_CATEGORY_QUERY_KEY = "product-categories";
const INVENTORY_CATEGORY_QUERY_KEY = "inventory-categories";

interface CategoryErrorResponse {
  response?: { data?: { message?: string } };
  message?: string;
}

const getCategoryErrorMessage = (
  error: unknown,
  fallbackMessage: string,
): string => {
  const typedError = error as CategoryErrorResponse;
  return typedError?.response?.data?.message || typedError?.message || fallbackMessage;
};

const CATEGORY_LIST_STALE_MS = 30_000;

type CategoryInfinitePage<T> = {
  data: T[];
};

type CategoryInfiniteData<T> = InfiniteData<CategoryInfinitePage<T>>;

const patchInfiniteCategoryItem = <T extends { id: string }>(
  oldData: CategoryInfiniteData<T> | undefined,
  updatedItem: T,
): CategoryInfiniteData<T> | undefined => {
  if (!oldData) return oldData;

  return {
    ...oldData,
    pages: oldData.pages.map((page) => ({
      ...page,
      data: page.data.map((item) =>
        item.id === updatedItem.id ? updatedItem : item,
      ),
    })),
  };
};

export const useProductCategoriesQuery = ({
  page = 1,
  limit = 10,
  search,
  status,
  sortBy,
  sortOrder,
  enabled = true,
}: {
  page?: number;
  limit?: number;
  search?: string;
  status?: CategoryStatus;
  sortBy?: ProductCategorySortBy;
  sortOrder?: CategorySortOrder;
  enabled?: boolean;
}) =>
  useQuery({
    queryKey: [PRODUCT_CATEGORY_QUERY_KEY, page, limit, search, status, sortBy, sortOrder],
    queryFn: ({ signal }) =>
      getProductCategories({ page, limit, search, status, sortBy, sortOrder, signal }),
    placeholderData: keepPreviousData,
    staleTime: CATEGORY_LIST_STALE_MS,
    enabled,
  });

export const useInventoryCategoriesQuery = ({
  page = 1,
  limit = 10,
  search,
  status,
  sortBy,
  sortOrder,
  enabled = true,
}: {
  page?: number;
  limit?: number;
  search?: string;
  status?: CategoryStatus;
  sortBy?: InventoryCategorySortBy;
  sortOrder?: CategorySortOrder;
  enabled?: boolean;
}) =>
  useQuery({
    queryKey: [INVENTORY_CATEGORY_QUERY_KEY, page, limit, search, status, sortBy, sortOrder],
    queryFn: ({ signal }) =>
      getInventoryCategories({ page, limit, search, status, sortBy, sortOrder, signal }),
    placeholderData: keepPreviousData,
    staleTime: CATEGORY_LIST_STALE_MS,
    enabled,
  });

export const useProductCategoriesInfiniteQuery = ({
  search,
  status,
  sortBy,
  sortOrder,
  enabled = true,
}: {
  search?: string;
  status?: CategoryStatus;
  sortBy?: ProductCategorySortBy;
  sortOrder?: CategorySortOrder;
  enabled?: boolean;
}) =>
  useInfiniteQuery({
    queryKey: [PRODUCT_CATEGORY_QUERY_KEY, "infinite", search, status, sortBy, sortOrder],
    queryFn: ({ pageParam = 1, signal }) =>
      getProductCategories({
        page: pageParam as number,
        limit: 10,
        search,
        status,
        sortBy,
        sortOrder,
        signal,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasNextPage ? lastPage.meta.page + 1 : undefined,
    initialPageParam: 1,
    staleTime: CATEGORY_LIST_STALE_MS,
    enabled,
  });

export const useInventoryCategoriesInfiniteQuery = ({
  search,
  status,
  sortBy,
  sortOrder,
  enabled = true,
}: {
  search?: string;
  status?: CategoryStatus;
  sortBy?: InventoryCategorySortBy;
  sortOrder?: CategorySortOrder;
  enabled?: boolean;
}) =>
  useInfiniteQuery({
    queryKey: [INVENTORY_CATEGORY_QUERY_KEY, "infinite", search, status, sortBy, sortOrder],
    queryFn: ({ pageParam = 1, signal }) =>
      getInventoryCategories({
        page: pageParam as number,
        limit: 10,
        search,
        status,
        sortBy,
        sortOrder,
        signal,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasNextPage ? lastPage.meta.page + 1 : undefined,
    initialPageParam: 1,
    staleTime: CATEGORY_LIST_STALE_MS,
    enabled,
  });

export const useProductCategoryMutation = (
  id?: string,
  onSuccess?: () => void,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: ProductCategoryFormValues) =>
      id ? updateProductCategory(id, values) : createProductCategory(values),
    onSuccess: (response) => {
      if (id) {
        // Edit: patch updated item in-place so row order remains unchanged
        queryClient.setQueriesData<CategoryInfiniteData<ProductCategoryItem>>(
          { queryKey: [PRODUCT_CATEGORY_QUERY_KEY, "infinite"] },
          (oldData) => patchInfiniteCategoryItem(oldData, response.data),
        );
      } else {
        // Create: keep existing behavior (server source of truth)
        queryClient.invalidateQueries({ queryKey: [PRODUCT_CATEGORY_QUERY_KEY] });
      }
      toast.success(
        response.message ||
          (id
            ? "Product category updated successfully."
            : "Product category created successfully."),
      );
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(
        getCategoryErrorMessage(
          error,
          "Unable to save product category right now.",
        ),
      );
    },
  });
};

export const useDeleteProductCategoryMutation = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteProductCategory(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: [PRODUCT_CATEGORY_QUERY_KEY] });
      toast.success(response.message || "Product category deleted successfully.");
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(
        getCategoryErrorMessage(
          error,
          "Unable to delete product category right now.",
        ),
      );
    },
  });
};

export const useToggleProductCategoryStatusMutation = (
  onSuccess?: () => void,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: CategoryStatus;
    }) => updateProductCategory(id, { status }),
    onSuccess: (response, variables) => {
      const { id } = variables;

      // Update product categories in-place without changing ordering
      queryClient.setQueriesData<CategoryInfiniteData<ProductCategoryItem>>(
        { queryKey: [PRODUCT_CATEGORY_QUERY_KEY, "infinite"] },
        (oldData) =>
          patchInfiniteCategoryItem(oldData, { ...response.data, id }),
      );

      toast.success(
        response.message || "Product category status updated successfully.",
      );
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(
        getCategoryErrorMessage(
          error,
          "Unable to update product category status right now.",
        ),
      );
    },
  });
};

export const useInventoryCategoryMutation = (
  id?: string,
  onSuccess?: () => void,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: InventoryCategoryFormValues) => {
      const response = id
        ? await updateInventoryCategory(id, values)
        : await createInventoryCategory(values);

      return response;
    },
    onSuccess: (response) => {
      if (id) {
        // Edit: patch updated item in-place so row order remains unchanged
        queryClient.setQueriesData<CategoryInfiniteData<InventoryCategoryItem>>(
          { queryKey: [INVENTORY_CATEGORY_QUERY_KEY, "infinite"] },
          (oldData) => patchInfiniteCategoryItem(oldData, response.data),
        );
      } else {
        // Create: keep existing behavior (server source of truth)
        queryClient.invalidateQueries({ queryKey: [INVENTORY_CATEGORY_QUERY_KEY] });
      }
      toast.success(
        response.message ||
          (id
            ? "Inventory category updated successfully."
            : "Inventory category created successfully."),
      );
      onSuccess?.();
    },
    onError: (error) => {
      const message = getCategoryErrorMessage(
        error,
        "Unable to save inventory category right now.",
      );
      const normalized = message.toLowerCase();

      if (normalized.includes("already exists") || normalized.includes("duplicate")) {
        toast.error("A category with this name already exists.");
        return;
      }

      toast.error(message);
    },
  });
};

export const useDeleteInventoryCategoryMutation = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteInventoryCategory(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: [INVENTORY_CATEGORY_QUERY_KEY] });
      toast.success(response.message || "Inventory category deleted successfully.");
      onSuccess?.();
    },
    onError: (error) => {
      const message = getCategoryErrorMessage(
        error,
        "Unable to delete inventory category right now.",
      );
      const normalized = message.toLowerCase();

      if (
        normalized.includes("associated") ||
        normalized.includes("inventory") ||
        normalized.includes("in use")
      ) {
        toast.error(
          "Cannot delete this category as it is associated with existing inventory items. Please reassign or delete those items first, or mark this category as Inactive.",
        );
        return;
      }

      toast.error(message);
    },
  });
};

export const useToggleInventoryCategoryStatusMutation = (
  onSuccess?: () => void,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status: _status,
    }: {
      id: string;
      status: CategoryStatus;
    }) => toggleInventoryCategoryStatus(id),
    onSuccess: (response, variables) => {
      const { id } = variables;

      // Update inventory categories in-place without changing ordering
      queryClient.setQueriesData<CategoryInfiniteData<InventoryCategoryItem>>(
        { queryKey: [INVENTORY_CATEGORY_QUERY_KEY, "infinite"] },
        (oldData) =>
          patchInfiniteCategoryItem(oldData, { ...response.data, id }),
      );

      toast.success(
        response.message || "Inventory category status updated successfully.",
      );
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(
        getCategoryErrorMessage(
          error,
          "Unable to update inventory category status right now.",
        ),
      );
    },
  });
};
