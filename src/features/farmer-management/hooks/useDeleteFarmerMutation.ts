import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { deleteFarmer } from "../services";

interface ErrorResponse {
  response?: { data?: { message?: string } };
  message?: string;
}

const getDeleteErrorMessage = (error: unknown, fallbackMessage: string) => {
  const err = error as ErrorResponse;
  return err?.response?.data?.message || err?.message || fallbackMessage;
};

export const useDeleteFarmerMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteFarmer(id),
    onSuccess: (res, deletedFarmerId) => {
      queryClient.invalidateQueries({ queryKey: ["farmers"] });
      queryClient.invalidateQueries({ queryKey: ["farmers-infinite"] });
      queryClient.removeQueries({ queryKey: ["farmers", deletedFarmerId] });
      toast.success(res.message || "Farmer deleted successfully.");
    },
    onError: (error: unknown) => {
      toast.error(
        getDeleteErrorMessage(error, "Unable to delete farmer at the moment. Please try again."),
      );
    },
  });
};
