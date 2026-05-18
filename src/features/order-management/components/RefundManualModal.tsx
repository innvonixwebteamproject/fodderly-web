import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CancelButtonContent } from "@/components/common/cancel-button-content";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mark manually refunded — {orderNumber}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                <CancelButtonContent />
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                Mark processed
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default RefundManualModal;
