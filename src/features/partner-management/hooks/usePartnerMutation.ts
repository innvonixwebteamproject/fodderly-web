import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createPartner,
  deletePartner,
  resendPartnerEmail,
  updatePartner,
  updatePartnerStatus,
} from "../services";
import { PartnerSchemaType } from "../types";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface ErrorResponse {
  response?: { data?: { message?: string } };
  message?: string;
}

const getPartnerErrorMessage = (
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

export const usePartnerMutation = (id?: string) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: PartnerSchemaType) => {
      if (id) {
        return updatePartner(id, data);
      }

      return createPartner(data);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["partners"] });
      queryClient.invalidateQueries({ queryKey: ["partner-districts"] });
      queryClient.invalidateQueries({ queryKey: ["partner-states"] });
      toast.success(
        res.message ||
          (id
            ? "Partner profile updated successfully."
            : "Partner profile created successfully and email sent."),
      );
      navigate("/admin/partners");
    },
    onError: (error: unknown) => {
      const errorMessage = getPartnerErrorMessage(
        error,
        "Failed to save partner. Please try again.",
      );
      toast.error(errorMessage);
    },
  });
};

export const useUpdatePartnerStatusMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: string }) => updatePartnerStatus(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["partners"] });
      toast.success(res.message || "Partner status updated successfully");
    },
    onError: (error: unknown) => {
      const errorMessage = getPartnerErrorMessage(
        error,
        "Unable to update status at the moment. Please try again.",
        "Cannot inactive a Partner with an ongoing order.",
      );
      toast.error(errorMessage);
    },
  });
};

export const useDeletePartnerMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deletePartner(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["partners"] });
      toast.success(res.message || "Partner deleted successfully");
    },
    onError: (error: unknown) => {
      const errorMessage = getPartnerErrorMessage(
        error,
        "Unable to delete Partner at the moment. Please try again later.",
        "This Partner cannot be deleted as they are associated with an active ongoing order.",
      );
      toast.error(errorMessage);
    },
  });
};

export const useResendPartnerEmailMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => resendPartnerEmail(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["partners"] });
      toast.success(res.message || "Activation email resent successfully.");
    },
    onError: (error: unknown) => {
      const errorMessage = getPartnerErrorMessage(
        error,
        "Failed to resend email. Please try again.",
      );
      toast.error(errorMessage);
    },
  });
};

