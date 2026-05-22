import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/lib/api-error";
import {
  allocateProducts,
  deletePartnerAllocation,
  getPartnerAllocations,
  updatePartnerAllocation,
  updatePartnerStock,
} from "../services/allocation.api";
import type { AllocateProductPayload, AllocationListRequest } from "../types/allocation.types";

const PARTNER_ALLOCATIONS_QUERY_KEY = "partner-allocations";

export const usePartnerAllocationsQuery = (params: AllocationListRequest, enabled = true) =>
  useQuery({
    queryKey: [
      PARTNER_ALLOCATIONS_QUERY_KEY,
      params.partner_uuid,
      params.category_uuid,
      params.search,
      params.page,
      params.limit,
      params.sortBy,
      params.sortOrder,
    ],
    queryFn: () => getPartnerAllocations(params),
    enabled,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });

export const usePartnerAllocationsInfiniteQuery = (
  params: Omit<AllocationListRequest, "page">,
  enabled = true,
) =>
  useInfiniteQuery({
    queryKey: [
      PARTNER_ALLOCATIONS_QUERY_KEY,
      "infinite",
      params.partner_uuid,
      params.category_uuid,
      params.search,
      params.sortBy,
      params.sortOrder,
    ],
    queryFn: ({ pageParam = 1 }) =>
      getPartnerAllocations({ ...params, page: pageParam as number }),
    enabled,
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasNextPage ? lastPage.meta.page + 1 : undefined,
    initialPageParam: 1,
    staleTime: 30_000,
  });

const getErrorMessage = (error: unknown, fallback: string) => ApiError.getErrorMessage(error, fallback);

export const useAllocateProductsMutation = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payloads: AllocateProductPayload[]) => allocateProducts(payloads),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: [PARTNER_ALLOCATIONS_QUERY_KEY] });
      toast.success(response.message || "Products allocated successfully.");
      onSuccess?.();
    },
    onError: (error) => toast.error(getErrorMessage(error, "Unable to allocate products.")),
  });
};

export const useUpdatePartnerAllocationMutation = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, allocated_quantity, unit }: { id: string; allocated_quantity: number; unit?: number }) =>
      updatePartnerAllocation(id, allocated_quantity, unit),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: [PARTNER_ALLOCATIONS_QUERY_KEY] });
      toast.success(response.message || "Partner allocation updated successfully.");
      onSuccess?.();
    },
    onError: (error) => toast.error(getErrorMessage(error, "Unable to update allocation.")),
  });
};

export const useDeletePartnerAllocationMutation = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePartnerAllocation(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: [PARTNER_ALLOCATIONS_QUERY_KEY] });
      toast.success(response.message || "Partner allocation deleted successfully.");
      onSuccess?.();
    },
    onError: (error) => toast.error(getErrorMessage(error, "Unable to remove allocation.")),
  });
};

export const useUpdatePartnerStockMutation = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, stock }: { id: string; stock: number }) =>
      updatePartnerStock(id, stock),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: [PARTNER_ALLOCATIONS_QUERY_KEY] });
      toast.success(response.message || "Stock updated successfully.");
      onSuccess?.();
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, "Qty must be between 0 and 100000.")),
  });
};
