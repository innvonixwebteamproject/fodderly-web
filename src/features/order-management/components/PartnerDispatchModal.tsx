import { zodResolver } from "@hookform/resolvers/zod";
import { addDays, format, isBefore, startOfDay } from "date-fns";
import { Calendar as CalendarIcon, Zap } from "lucide-react";
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
import { CancelButtonContent } from "@/components/common/cancel-button-content";
import { ConfirmButtonContent } from "@/components/common/confirm-button-content";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger, PopoverPortal } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { AdminOrderListItem } from "../types/order.types";
import { partnerDispatchDateSchema, type PartnerDispatchDateFormValues } from "../validation/order.validation";
import { usePartnerExpectedDeliveryMutation } from "../hooks/useOrderDetailMutations";

interface PartnerDispatchModalProps {
  order: AdminOrderListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: "schedule" | "dispatch";
}

export function PartnerDispatchModal({ order, open, onOpenChange, mode = "dispatch" }: PartnerDispatchModalProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const mutation = usePartnerExpectedDeliveryMutation(order?.id ?? "");

  const form = useForm<PartnerDispatchDateFormValues>({
    resolver: zodResolver(partnerDispatchDateSchema),
    defaultValues: { expectedDeliveryDate: "" },
  });

  useEffect(() => {
    if (open && order) {
      form.reset({ expectedDeliveryDate: "" });
      setConfirmOpen(false);
    }
  }, [open, order, form]);

  if (!order) return null;

  const onSubmit = (_values: PartnerDispatchDateFormValues) => {
    form.clearErrors();
    setConfirmOpen(true);
  };

  const confirmDispatch = () => {
    const values = form.getValues();
    const ok = partnerDispatchDateSchema.safeParse(values);
    if (!ok.success) {
      ok.error.issues.forEach((issue) => {
        const path = issue.path[0];
        if (typeof path === "string") {
          form.setError(path as "expectedDeliveryDate", { message: issue.message });
        }
      });
      setConfirmOpen(false);
      return;
    }
    mutation.mutate(
      {
        expectedDelivery: ok.data.expectedDeliveryDate.trim(),
        ...(mode === "dispatch" ? { dispatched: true } : {}),
      },
      {
        onSuccess: () => {
          setConfirmOpen(false);
          onOpenChange(false);
        },
      },
    );
  };

  const displayDate = () => {
    const v = form.watch("expectedDeliveryDate");
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
            <DialogTitle>
              {mode === "dispatch" ? "Dispatch order" : "Reschedule Delivery"} — {order.orderNumber}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="expectedDeliveryDate"
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
                        <div className="space-y-3">
                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 gap-1.5 px-3 text-[12px] font-medium border-primary/20 hover:bg-primary/5 hover:text-primary"
                              onClick={() => {
                                const d = addDays(new Date(), 1);
                                field.onChange(format(d, "yyyy-MM-dd"));
                              }}
                            >
                              <Zap className="h-3.5 w-3.5 text-amber-500" />
                              1 Day
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 gap-1.5 px-3 text-[12px] font-medium border-primary/20 hover:bg-primary/5 hover:text-primary"
                              onClick={() => {
                                const d = addDays(new Date(), 2);
                                field.onChange(format(d, "yyyy-MM-dd"));
                              }}
                            >
                              <Zap className="h-3.5 w-3.5 text-amber-500" />
                              2 Days
                            </Button>
                          </div>
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
                        </div>
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
            <AlertDialogTitle>
              {mode === "dispatch" ? "Dispatch order" : "Reschedule Delivery"} — {order.orderNumber}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-left text-sm">
              {mode === "dispatch" ? (
                <>
                  Are you sure you want to dispatch this order with an Expected Delivery Date of{" "}
                  <strong>{displayDate() || "—"}</strong>? This will notify the farmer that their order is on the way.
                </>
              ) : (
                <>
                  Are you sure you want to reschedule delivery for this order with an Expected Delivery Date of{" "}
                  <strong>{displayDate() || "—"}</strong>?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmOpen(false)}>
              <CancelButtonContent />
            </AlertDialogCancel>
            <Button type="button" onClick={confirmDispatch} disabled={mutation.isPending}>
              <ConfirmButtonContent />
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
