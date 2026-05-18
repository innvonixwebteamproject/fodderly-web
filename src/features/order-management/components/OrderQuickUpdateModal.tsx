import { zodResolver } from "@hookform/resolvers/zod";
import { format, isBefore, parse, startOfDay } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CancelButtonContent } from "@/components/common/cancel-button-content";
import { ConfirmButtonContent } from "@/components/common/confirm-button-content";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger, PopoverPortal } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { orderQuickUpdateSchema, type OrderQuickUpdateFormValues } from "../validation/order.validation";
import type { AdminOrderListItem } from "../types/order.types";
import { useOrderQuickUpdateMutation } from "../hooks/useOrderDetailMutations";

interface OrderQuickUpdateModalProps {
  order: AdminOrderListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function initialExpectedDeliveryFromOrder(order: AdminOrderListItem): string {
  const iso = order.expectedDeliveryDate?.trim();
  if (!iso) return "";
  const day = iso.slice(0, 10);
  const parsed = parse(day, "yyyy-MM-dd", new Date());
  if (Number.isNaN(parsed.getTime())) return "";
  if (isBefore(startOfDay(parsed), startOfDay(new Date()))) return "";
  return day;
}

export function OrderQuickUpdateModal({ order, open, onOpenChange }: OrderQuickUpdateModalProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const mutation = useOrderQuickUpdateMutation(order?.id ?? "");

  const form = useForm<OrderQuickUpdateFormValues>({
    resolver: zodResolver(orderQuickUpdateSchema),
    defaultValues: { expectedDelivery: "" },
  });

  useEffect(() => {
    if (order && open) {
      form.reset({
        expectedDelivery: initialExpectedDeliveryFromOrder(order),
      });
      setConfirmOpen(false);
    }
  }, [order, open, form]);

  if (!order) return null;

  const onSubmit = (_values: OrderQuickUpdateFormValues) => {
    form.clearErrors();
    setConfirmOpen(true);
  };

  const confirmSchedule = () => {
    const values = form.getValues();
    const ok = orderQuickUpdateSchema.safeParse(values);
    if (!ok.success) {
      ok.error.issues.forEach((issue) => {
        const path = issue.path[0];
        if (typeof path === "string") {
          form.setError(path as "expectedDelivery", { message: issue.message });
        }
      });
      setConfirmOpen(false);
      return;
    }
    mutation.mutate(
      { expectedDelivery: ok.data.expectedDelivery.trim() },
      {
        onSuccess: () => {
          setConfirmOpen(false);
          onOpenChange(false);
        },
      },
    );
  };

  const displayDate = () => {
    const v = form.watch("expectedDelivery");
    if (!v) return "";
    const d = new Date(`${v}T12:00:00`);
    if (!Number.isNaN(d.getTime())) return format(d, "dd MMM yyyy");
    return v;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule delivery — {order.orderNumber}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <p className="text-[13px] text-muted-foreground">
                Updating the expected delivery date logs this revision and notifies the farmer by SMS/push about the updated delivery schedule.
              </p>
              <FormField
                control={form.control}
                name="expectedDelivery"
                render={({ field }) => {
                  const selected =
                    field.value && field.value.length >= 10
                      ? new Date(`${field.value.slice(0, 10)}T12:00:00`)
                      : undefined;
                  const validSelected =
                    selected && !Number.isNaN(selected.getTime()) ? selected : undefined;

                  return (
                    <FormItem>
                      <FormLabel>Expected delivery date</FormLabel>
                      <FormControl>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              className={cn(
                                "h-9 w-full justify-start text-left font-normal text-[13px]",
                                !validSelected && "text-muted-foreground",
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {validSelected ? format(validSelected, "PPP") : "Pick a date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverPortal>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={validSelected}
                                onSelect={(d) => {
                                  if (!d) {
                                    field.onChange("");
                                    return;
                                  }
                                  field.onChange(format(d, "yyyy-MM-dd"));
                                }}
                                disabled={(d) => isBefore(startOfDay(d), startOfDay(new Date()))}
                                initialFocus
                              />
                            </PopoverContent>
                          </PopoverPortal>
                        </Popover>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  <CancelButtonContent />
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                  <ConfirmButtonContent />
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Schedule delivery — {order.orderNumber}</AlertDialogTitle>
            <AlertDialogDescription className="text-left text-sm">
              Are you sure you want to schedule delivery for this order with an Expected Delivery Date of{" "}
              <strong>{displayDate() || "—"}</strong>? The farmer will be notified.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmOpen(false)}>
              <CancelButtonContent />
            </AlertDialogCancel>
            <Button type="button" onClick={confirmSchedule} disabled={mutation.isPending}>
              <ConfirmButtonContent />
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default OrderQuickUpdateModal;
