import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toggleFarmerStatus } from "../services";
import type { IFarmer } from "../types/farmer.types";

interface ErrorResponse {
  response?: { data?: { message?: string } };
  message?: string;
}

const getFarmerStatusErrorMessage = (
  error: unknown,
  fallbackMessage: string,
  ongoingOrderMessage?: string,
) => {
  const err = error as ErrorResponse;
  const apiMessage = err?.response?.data?.message || err?.message || "";
  const normalizedMessage = apiMessage.toLowerCase();

  if (
    ongoingOrderMessage &&
    (normalizedMessage.includes("ongoing order") ||
      normalizedMessage.includes("active ongoing order") ||
      normalizedMessage.includes("active order"))
  ) {
    return ongoingOrderMessage;
  }

  return apiMessage || fallbackMessage;
};

export const useFarmerToggleStatusMutation = () => {
  const queryClient = useQueryClient();

  const updateFarmerStatusInCache = (targetId: string, nextStatus: boolean) => {
    queryClient.setQueriesData({ queryKey: ["farmers-infinite"] }, (oldData: unknown) => {
      if (
        !oldData ||
        typeof oldData !== "object" ||
        !("pages" in oldData) ||
        !Array.isArray((oldData as { pages?: unknown[] }).pages)
      ) {
        return oldData;
      }

      const typed = oldData as {
        pages: Array<{ data?: IFarmer[] } & Record<string, unknown>>;
      } & Record<string, unknown>;

      return {
        ...typed,
        pages: typed.pages.map((page) => ({
          ...page,
          data: Array.isArray(page.data)
            ? page.data.map((farmer) =>
                farmer.id === targetId
                  ? { ...farmer, isActive: nextStatus, status: nextStatus ? "ACTIVE" : "INACTIVE" }
                  : farmer,
              )
            : page.data,
        })),
      };
    });

    queryClient.setQueriesData({ queryKey: ["farmers"] }, (oldData: unknown) => {
      if (!oldData || typeof oldData !== "object" || !("data" in oldData)) {
        return oldData;
      }

      const typed = oldData as { data?: IFarmer[] } & Record<string, unknown>;
      return {
        ...typed,
        data: Array.isArray(typed.data)
          ? typed.data.map((farmer) =>
              farmer.id === targetId
                ? { ...farmer, isActive: nextStatus, status: nextStatus ? "ACTIVE" : "INACTIVE" }
                : farmer,
            )
          : typed.data,
      };
    });
  };

  return useMutation({
    mutationFn: (id: string) => toggleFarmerStatus(id),
    onMutate: async (id) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ["farmers-infinite"] }),
        queryClient.cancelQueries({ queryKey: ["farmers"] }),
      ]);

      const previousInfinite = queryClient.getQueriesData({ queryKey: ["farmers-infinite"] });
      const previousFarmers = queryClient.getQueriesData({ queryKey: ["farmers"] });

      let currentStatus: boolean | undefined;
      for (const [, queryData] of previousInfinite) {
        if (
          queryData &&
          typeof queryData === "object" &&
          "pages" in queryData &&
          Array.isArray((queryData as { pages?: unknown[] }).pages)
        ) {
          const typed = queryData as { pages: Array<{ data?: IFarmer[] }> };
          for (const page of typed.pages) {
            const found = Array.isArray(page.data)
              ? page.data.find((farmer) => farmer.id === id)
              : undefined;
            if (found) {
              currentStatus = found.isActive;
              break;
            }
          }
        }
        if (currentStatus !== undefined) break;
      }

      if (currentStatus !== undefined) {
        updateFarmerStatusInCache(id, !currentStatus);
      }

      return { previousInfinite, previousFarmers };
    },
    onSuccess: (res) => {
      if (res?.data?.id) {
        updateFarmerStatusInCache(res.data.id, res.data.isActive);
      }
      queryClient.invalidateQueries({ queryKey: ["farmers-infinite"] });
      queryClient.invalidateQueries({ queryKey: ["farmers"] });
      toast.success(res.message || "Farmer status updated successfully.");
    },
    onError: (error: unknown, _id, context) => {
      if (context?.previousInfinite) {
        context.previousInfinite.forEach(([key, value]) => {
          queryClient.setQueryData(key, value);
        });
      }
      if (context?.previousFarmers) {
        context.previousFarmers.forEach(([key, value]) => {
          queryClient.setQueryData(key, value);
        });
      }
      const errorMessage = getFarmerStatusErrorMessage(
        error,
        "Unable to update status at the moment. Please try again.",
        "Cannot deactivate a farmer with ongoing orders.",
      );
      toast.error(errorMessage);
    },
  });
};
