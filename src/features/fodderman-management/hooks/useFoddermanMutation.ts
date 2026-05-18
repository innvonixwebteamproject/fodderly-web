import { useMutation, useQueryClient } from "@tanstack/react-query";
import { foddermanApi } from "../services/fodderman.api";
import { toast } from "sonner";
import { FoddermanSchemaType, IFoddermanListResponse } from "../types";
import { ApiError } from "@/lib/api-error";

const getErrorMessage = (error: unknown) => {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Failed to handle request";
};

export function useCreateFoddermanMutation(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: FoddermanSchemaType) => foddermanApi.createFodderman(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["foddermen"] });
      queryClient.invalidateQueries({ queryKey: ["foddermen-infinite"] });
      toast.success("Fodderman created successfully");
      options?.onSuccess?.();
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useUpdateFoddermanMutation(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<FoddermanSchemaType> }) =>
      foddermanApi.updateFodderman(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["foddermen"] });
      queryClient.invalidateQueries({ queryKey: ["foddermen-infinite"] });
      queryClient.invalidateQueries({ queryKey: ["fodderman", variables.id] });
      toast.success("Fodderman updated successfully");
      options?.onSuccess?.();
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useDeleteFoddermanMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => foddermanApi.deleteFodderman(id),
    onSuccess: (_, deletedFoddermanId) => {
      queryClient.setQueriesData(
        { queryKey: ["foddermen-infinite"] },
        (
          previous:
            | {
                pages: IFoddermanListResponse[];
                pageParams: unknown[];
              }
            | undefined,
        ) => {
          if (!previous) return previous;

          return {
            ...previous,
            pages: previous.pages.map((page) => ({
              ...page,
              data: page.data.filter((item) => item.id !== deletedFoddermanId),
            })),
          };
        },
      );
      queryClient.setQueriesData(
        { queryKey: ["foddermen"] },
        (previous: IFoddermanListResponse | undefined) => {
          if (!previous) return previous;
          return {
            ...previous,
            data: previous.data.filter((item) => item.id !== deletedFoddermanId),
          };
        },
      );
      queryClient.invalidateQueries({ queryKey: ["foddermen"] });
      queryClient.invalidateQueries({ queryKey: ["foddermen-infinite"] });
      queryClient.removeQueries({ queryKey: ["fodderman", deletedFoddermanId] });
      toast.success("Fodderman deleted successfully");
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useUpdateFoddermanStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: boolean }) =>
      foddermanApi.toggleStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["foddermen"] });
      queryClient.invalidateQueries({ queryKey: ["foddermen-infinite"] });
      toast.success("Status updated successfully");
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });
}
