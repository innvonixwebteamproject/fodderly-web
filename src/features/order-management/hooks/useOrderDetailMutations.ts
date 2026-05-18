import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/lib/api-error";
import {
  cancelOrderByAdmin,
  forceMarkOrderDelivered,
  getAdminOrderById,
  getOrderById,
  getPartnerOrderById,
  updateAdminExpectedDelivery,
  updatePartnerExpectedDelivery,
  dispatchOrderByPartner,
} from "../services/order.api";
import type { AdminCancelOrderPayload, ForceDeliverPayload, UpdateExpectedDeliveryPayload } from "../types/order.types";

export const orderDetailQueryKey = (id: string | undefined) => ["order-detail", id] as const;

export const adminOrderDetailQueryKey = (id: string | undefined) => ["admin-order-detail", id] as const;

export const partnerOrderDetailQueryKey = (id: string | undefined) => ["partner-order-detail", id] as const;

export function useOrderDetailQuery(orderId: string | undefined) {
  return useQuery({
    queryKey: orderDetailQueryKey(orderId),
    queryFn: () => getOrderById(orderId as string),
    enabled: Boolean(orderId),
  });
}

export function useAdminOrderDetailQuery(orderId: string | undefined) {
  return useQuery({
    queryKey: adminOrderDetailQueryKey(orderId),
    queryFn: () => getAdminOrderById(orderId as string),
    enabled: Boolean(orderId),
  });
}

export function usePartnerOrderDetailQuery(orderId: string | undefined) {
  return useQuery({
    queryKey: partnerOrderDetailQueryKey(orderId),
    queryFn: () => getPartnerOrderById(orderId as string),
    enabled: Boolean(orderId),
  });
}

export function useOrderQuickUpdateMutation(orderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateExpectedDeliveryPayload) => {
      if (!orderId) {
        return Promise.reject(new Error("Missing order"));
      }
      return updateAdminExpectedDelivery(orderId, payload);
    },
    onSuccess: (data) => {
      qc.setQueryData(orderDetailQueryKey(orderId), data);
      qc.setQueryData(partnerOrderDetailQueryKey(orderId), data);
      qc.setQueryData(adminOrderDetailQueryKey(orderId), data);
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["partner-orders"] });
      qc.invalidateQueries({ queryKey: ["partner-order-history"] });
      qc.invalidateQueries({ queryKey: ["cancelled-refunds"] });
      toast.success("Delivery schedule saved");
    },
    onError: (e: Error) => {
      toast.error(e.message || "Update failed");
    },
  });
}

export function usePartnerExpectedDeliveryMutation(orderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateExpectedDeliveryPayload) => {
      if (!orderId) {
        return Promise.reject(new Error("Missing order"));
      }
      return updatePartnerExpectedDelivery(orderId, payload);
    },
    onSuccess: (data) => {
      qc.setQueryData(partnerOrderDetailQueryKey(orderId), data);
      qc.setQueryData(orderDetailQueryKey(orderId), data);
      void qc.invalidateQueries({ queryKey: adminOrderDetailQueryKey(orderId) });
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["partner-orders"] });
      qc.invalidateQueries({ queryKey: ["partner-order-history"] });
      toast.success("Order updated. The farmer will be notified of dispatch or ETA changes.");
    },
    onError: (e: unknown) => {
      if (e instanceof ApiError && e.isNetworkError) {
        toast.error("Network error occurred. Please retry.");
        return;
      }
      toast.error(ApiError.getErrorMessage(e, "Failed to update status. Please try again."));
    },
  });
}

export function usePartnerDispatchMutation(orderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => {
      if (!orderId) {
        return Promise.reject(new Error("Missing order"));
      }
      return dispatchOrderByPartner(orderId);
    },
    onSuccess: (data) => {
      qc.setQueryData(partnerOrderDetailQueryKey(orderId), data);
      qc.setQueryData(orderDetailQueryKey(orderId), data);
      void qc.invalidateQueries({ queryKey: adminOrderDetailQueryKey(orderId) });
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["partner-orders"] });
      qc.invalidateQueries({ queryKey: ["partner-order-history"] });
      toast.success("Order dispatched successfully.");
    },
    onError: (e: unknown) => {
      if (e instanceof ApiError && e.isNetworkError) {
        toast.error("Network error occurred. Please retry.");
        return;
      }
      toast.error(ApiError.getErrorMessage(e, "Failed to dispatch order. Please try again."));
    },
  });
}

export function useAdminCancelOrderMutation(orderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AdminCancelOrderPayload) => {
      if (!orderId) {
        return Promise.reject(new Error("Missing order"));
      }
      return cancelOrderByAdmin(orderId, payload);
    },
    onSuccess: (data) => {
      qc.setQueryData(orderDetailQueryKey(orderId), data);
      qc.setQueryData(adminOrderDetailQueryKey(orderId), data);
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["partner-orders"] });
      qc.invalidateQueries({ queryKey: ["partner-order-history"] });
      qc.invalidateQueries({ queryKey: ["cancelled-refunds"] });
      qc.invalidateQueries({ queryKey: ["refunds"] });
      toast.success("Order cancelled");
    },
    onError: (e: Error) => {
      toast.error(e.message || "Cancellation failed");
    },
  });
}

export function useForceDeliverOrderMutation(orderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ForceDeliverPayload) => {
      if (!orderId) {
        return Promise.reject(new Error("Missing order"));
      }
      return forceMarkOrderDelivered(orderId, payload);
    },
    onSuccess: (data) => {
      qc.setQueryData(orderDetailQueryKey(orderId), data);
      void qc.invalidateQueries({ queryKey: adminOrderDetailQueryKey(orderId) });
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["partner-orders"] });
      qc.invalidateQueries({ queryKey: ["partner-order-history"] });
      qc.invalidateQueries({ queryKey: ["cancelled-refunds"] });
      toast.success("Order marked as delivered");
    },
    onError: (e: Error) => {
      toast.error(e.message || "Operation failed");
    },
  });
}
