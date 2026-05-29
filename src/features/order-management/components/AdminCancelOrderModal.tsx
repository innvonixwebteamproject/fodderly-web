import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { FormModal } from "@/shared/components/forms/FormModal";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { adminCancelOrderSchema, type AdminCancelOrderFormValues } from "../validation/order.validation";
import { useAdminCancelOrderMutation } from "../hooks/useOrderDetailMutations";

interface AdminCancelOrderModalProps {
  orderId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminCancelOrderModal({ orderId, open, onOpenChange }: AdminCancelOrderModalProps) {
  const mutation = useAdminCancelOrderMutation(orderId);

  const form = useForm<AdminCancelOrderFormValues>({
    resolver: zodResolver(adminCancelOrderSchema),
    defaultValues: { reason: "" },
  });

  useEffect(() => {
    if (open) {
      form.reset({ reason: "" });
    }
  }, [open, form]);

  const onSubmit = (values: AdminCancelOrderFormValues) => {
    mutation.mutate(
      { reason: values.reason.trim() },
      {
        onSuccess: () => onOpenChange(false),
      },
    );
  };

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title="Cancel order"
      description="This cancels the order for the farmer. This action cannot be undone."
      form={form}
      onSubmit={onSubmit}
      isPending={mutation.isPending}
      submitLabel="Confirm cancellation"
      submitVariant="destructive"
    >
      <FormField
        control={form.control}
        name="reason"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Reason <span className="text-destructive">*</span></FormLabel>
            <FormControl>
              <Textarea {...field} value={field.value ?? ""} rows={3} className="resize-none text-[13px] custom-scrollbar overflow-y-auto" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </FormModal>
  );
}

export default AdminCancelOrderModal;
