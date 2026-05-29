import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { FormModal } from "@/shared/components/forms/FormModal";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  manualRefundCompleteSchema,
  type ManualRefundCompleteFormValues,
} from "../validation/order.validation";
import { useManualRefundMutation } from "../hooks/useRefundsQuery";

interface RefundManualModalProps {
  orderId: string;
  orderNumber: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RefundManualModal({ orderId, orderNumber, open, onOpenChange }: RefundManualModalProps) {
  const mutation = useManualRefundMutation();
  const form = useForm<ManualRefundCompleteFormValues>({
    resolver: zodResolver(manualRefundCompleteSchema),
    defaultValues: { transactionReference: "", bankUtr: "" },
  });

  useEffect(() => {
    if (open) {
      form.reset({ transactionReference: "", bankUtr: "" });
    }
  }, [open, form]);

  const onSubmit = (values: ManualRefundCompleteFormValues) => {
    const transactionReference = values.transactionReference?.trim() || undefined;
    const bankUtr = values.bankUtr?.trim() || undefined;
    mutation.mutate(
      { orderId, payload: { transactionReference: transactionReference ?? null, bankUtr: bankUtr ?? null } },
      {
        onSuccess: () => onOpenChange(false),
      },
    );
  };

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title={`Mark manually refunded — ${orderNumber}`}
      form={form}
      onSubmit={onSubmit}
      isPending={mutation.isPending}
      submitLabel="Mark processed"
    >
      <FormField
        control={form.control}
        name="bankUtr"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Bank UTR (optional if reference provided)</FormLabel>
            <FormControl>
              <Input {...field} value={field.value ?? ""} className="h-9 text-[13px]" autoComplete="off" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="transactionReference"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Transaction reference (optional if UTR provided)</FormLabel>
            <FormControl>
              <Input {...field} value={field.value ?? ""} className="h-9 text-[13px]" autoComplete="off" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <p className="text-xs text-muted-foreground">At least one of UTR or transaction reference is required.</p>
    </FormModal>
  );
}

export default RefundManualModal;
