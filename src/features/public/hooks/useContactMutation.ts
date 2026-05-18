import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/lib/api-error";
import { publicApi } from "../services/public.api";
import { ContactUsRequest } from "../types/contact.types";

export const useContactMutation = (onSuccess?: () => void) => {
  return useMutation({
    mutationFn: (payload: ContactUsRequest) =>
      publicApi.submitContactInquiry(payload),
    onSuccess: (res) => {
      toast.success(
        res.message || "Your inquiry has been submitted successfully.",
      );
      onSuccess?.();
    },
    onError: (error: unknown) => {
      const errorMessage = ApiError.getErrorMessage(
        error,
        "Failed to submit inquiry.",
      );
      toast.error(errorMessage);
    },
  });
};
