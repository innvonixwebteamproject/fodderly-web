import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { createFarmer, updateFarmer, patchFarmer, type FarmerPatchPayload } from "../services";
import type { FarmerFormSchemaType } from "../types/farmer.types";

interface ErrorResponse {
  response?: { data?: { message?: string } };
  message?: string;
}

const getFarmerErrorMessage = (error: unknown, fallbackMessage: string) => {
  const err = error as ErrorResponse;
  return err?.response?.data?.message || err?.message || fallbackMessage;
};

export const useFarmerMutation = (id?: string) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: FarmerFormSchemaType) =>
      id ? updateFarmer(id, data) : createFarmer(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["farmers"] });
      toast.success(
        res.message ||
          (id
            ? "Farmer profile updated successfully."
            : "Farmer profile successfully created and mapped."),
      );
      navigate("/admin/farmers");
    },
    onError: (error: unknown) => {
      toast.error(getFarmerErrorMessage(error, "Failed to save farmer. Please try again."));
    },
  });
};

export const usePatchFarmerMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: FarmerPatchPayload }) =>
      patchFarmer(id, payload),
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({ queryKey: ["farmers"] });
      queryClient.invalidateQueries({ queryKey: ["farmers-infinite"] });
      queryClient.invalidateQueries({ queryKey: ["farmers", variables.id] });
      toast.success(res.message || "Farmer updated successfully.");
    },
    onError: (error: unknown) => {
      toast.error(getFarmerErrorMessage(error, "Failed to update farmer. Please try again."));
    },
  });
};
