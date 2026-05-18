import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/lib/api-error";
import {
  createProduct,
  deleteProduct,
  deleteProductImage,
  getPartnersAllocatedToProduct,
  getPartnerAllocationProductDetails,
  getProductById,
  getProducts,
  updateProductStatus,
  updateProduct,
} from "../services/product.api";
import type {
  ProductFormValues,
  ProductPartnerAllocationSortBy,
  ProductSortBy,
  ProductSortOrder,
} from "../types";

const PRODUCT_LIST_KEY = "products-list";
const PRODUCT_ITEM_KEY = "product-item";
const PRODUCT_PARTNER_ALLOCATIONS_KEY = "product-partner-allocations";

const getProductErrorMessage = (error: unknown, fallback: string) =>
  ApiError.getErrorMessage(error, fallback);

export const useProductsInfiniteQuery = ({
  search,
  categoryUuid,
  sortBy,
  sortOrder,
  isActive,
  enabled = true,
}: {
  search?: string;
  categoryUuid?: string;
  sortBy?: ProductSortBy;
  sortOrder?: ProductSortOrder;
  isActive?: boolean;
  enabled?: boolean;
}) =>
  useInfiniteQuery({
    queryKey: [
      PRODUCT_LIST_KEY,
      "infinite",
      search,
      categoryUuid,
      sortBy,
      sortOrder,
      isActive,
    ],
    queryFn: ({ pageParam = 1, signal }) =>
      getProducts({
        page: pageParam as number,
        limit: 10,
        search,
        category_uuid: categoryUuid,
        sortBy,
        sortOrder,
        is_active: isActive,
        signal,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasNextPage ? lastPage.meta.page + 1 : undefined,
    initialPageParam: 1,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    enabled,
  });

export const useProductsQuery = ({
  page = 1,
  limit = 10,
  search,
  categoryUuid,
  sortBy,
  sortOrder,
  isActive,
  enabled = true,
}: {
  page?: number;
  limit?: number;
  search?: string;
  categoryUuid?: string;
  sortBy?: ProductSortBy;
  sortOrder?: ProductSortOrder;
  isActive?: boolean;
  enabled?: boolean;
}) =>
  useQuery({
    queryKey: [
      PRODUCT_LIST_KEY,
      "page",
      page,
      limit,
      search,
      categoryUuid,
      sortBy,
      sortOrder,
      isActive,
    ],
    queryFn: ({ signal }) =>
      getProducts({
        page,
        limit,
        search,
        category_uuid: categoryUuid,
        sortBy,
        sortOrder,
        is_active: isActive,
        signal,
      }),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    enabled,
  });

export const useProductQuery = (id?: string) =>
  useQuery({
    queryKey: [PRODUCT_ITEM_KEY, id],
    queryFn: () => getProductById(id!),
    enabled: Boolean(id),
  });

export const usePartnerAllocationProductDetailQuery = (
  partnerUuid?: string,
  productUuid?: string,
) =>
  useQuery({
    queryKey: [PRODUCT_ITEM_KEY, "allocation-details", partnerUuid, productUuid],
    queryFn: () => getPartnerAllocationProductDetails(partnerUuid!, productUuid!),
    enabled: Boolean(partnerUuid && productUuid),
  });

export const useProductPartnerAllocationsInfiniteQuery = ({
  productUuid,
  search,
  sortBy,
  sortOrder,
  enabled = true,
}: {
  productUuid?: string;
  search?: string;
  sortBy?: ProductPartnerAllocationSortBy;
  sortOrder?: ProductSortOrder;
  enabled?: boolean;
}) =>
  useInfiniteQuery({
    queryKey: [
      PRODUCT_PARTNER_ALLOCATIONS_KEY,
      productUuid,
      search,
      sortBy,
      sortOrder,
    ],
    queryFn: ({ pageParam = 1, signal }) =>
      getPartnersAllocatedToProduct({
        product_uuid: productUuid!,
        page: pageParam as number,
        limit: 10,
        search,
        sortBy,
        sortOrder,
        signal,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasNextPage ? lastPage.meta.page + 1 : undefined,
    initialPageParam: 1,
    staleTime: 30_000,
    enabled: enabled && Boolean(productUuid),
  });

export const useCreateProductMutation = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: ProductFormValues) => createProduct(values),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: [PRODUCT_LIST_KEY] });
      toast.success(response.message || "Product created successfully.");
      onSuccess?.();
    },
    onError: (error: unknown) => {
      toast.error(getProductErrorMessage(error, "Unable to create product."));
    },
  });
};

export const useUpdateProductMutation = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: ProductFormValues }) =>
      updateProduct(id, values),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: [PRODUCT_LIST_KEY] });
      queryClient.invalidateQueries({ queryKey: [PRODUCT_ITEM_KEY, response.data.id] });
      toast.success(response.message || "Product updated successfully.");
      onSuccess?.();
    },
    onError: (error: unknown) => {
      toast.error(getProductErrorMessage(error, "Unable to update product."));
    },
  });
};

export const useDeleteProductMutation = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: [PRODUCT_LIST_KEY] });
      toast.success(response.message || "Product deleted successfully.");
      onSuccess?.();
    },
    onError: (error: unknown) => {
      toast.error(getProductErrorMessage(error, "Unable to delete product."));
    },
  });
};

export const useUpdateProductStatusMutation = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateProductStatus(id, isActive),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: [PRODUCT_LIST_KEY] });
      queryClient.invalidateQueries({ queryKey: [PRODUCT_ITEM_KEY, response.data.id] });
      toast.success(response.message || "Product status updated successfully.");
      onSuccess?.();
    },
    onError: (error: unknown) => {
      toast.error(getProductErrorMessage(error, "Unable to update product status."));
    },
  });
};

export const useDeleteProductImageMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (imageId: string) => deleteProductImage(imageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PRODUCT_LIST_KEY] });
    },
    onError: (error: unknown) => {
      toast.error(getProductErrorMessage(error, "Unable to delete product image."));
    },
  });
};
