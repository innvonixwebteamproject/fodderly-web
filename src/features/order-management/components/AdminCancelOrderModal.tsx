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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cancel order</DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground text-sm">This cancels the order for the farmer. This action cannot be undone.</p>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value ?? ""} rows={3} className="resize-none text-[13px]" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                <CancelButtonContent />
              </Button>
              <Button type="submit" variant="destructive" disabled={mutation.isPending}>
                Confirm cancellation
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default AdminCancelOrderModal;
