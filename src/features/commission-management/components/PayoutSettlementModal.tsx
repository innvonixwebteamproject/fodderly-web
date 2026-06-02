import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IndianRupee, Wallet } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { settlePayout } from "../services/commission.api";
import { payoutSettlementSchema, type PayoutSettlementFormValues, type CommissionLedgerItem } from "../types";

interface PayoutSettlementModalProps {
  isOpen: boolean;
  onClose: () => void;
  fodderman: CommissionLedgerItem | null;
}

export function PayoutSettlementModal({ isOpen, onClose, fodderman }: PayoutSettlementModalProps) {
  const queryClient = useQueryClient();

  const form = useForm<PayoutSettlementFormValues>({
    resolver: zodResolver(payoutSettlementSchema),
    defaultValues: {
      transactionReferenceId: "",
      notes: "",
    },
  });

  const settlementMutation = useMutation({
    mutationFn: (values: PayoutSettlementFormValues) =>
      settlePayout({
        foddermanId: fodderman?.foddermanId || "",
        transactionReferenceId: values.transactionReferenceId,
        notes: values.notes,
      }),
    onSuccess: (data) => {
      toast.success(data.message);
      form.reset();
      onClose();
      queryClient.invalidateQueries({ queryKey: ["commission-ledger"] });
      queryClient.invalidateQueries({ queryKey: ["payout-history"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to settle payout");
    },
  });

  const onSubmit = (values: PayoutSettlementFormValues) => {
    settlementMutation.mutate(values);
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  if (!fodderman) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-4.5 w-4.5 text-primary" />
            Settle Account
          </DialogTitle>
          <DialogDescription>
            Process payout settlement for <span className="font-semibold text-foreground">{fodderman.foddermanName}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Earnable Amount</p>
              <p className="text-lg font-semibold text-green-600 dark:text-green-400 flex items-center gap-1">
                <IndianRupee className="h-4 w-4" />
                {fodderman.earnableCommission.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Pending Amount</p>
              <p className="text-lg font-semibold text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                <IndianRupee className="h-4 w-4" />
                {fodderman.pendingCommission.toLocaleString()}
              </p>
            </div>
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="transactionReferenceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Transaction Reference ID</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter transaction reference ID"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any additional notes..."
                        className="resize-none h-20"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={settlementMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={settlementMutation.isPending}
                >
                  {settlementMutation.isPending ? "Processing..." : "Mark as Paid"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
