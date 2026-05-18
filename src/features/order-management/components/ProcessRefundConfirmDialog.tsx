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
import { Button } from "@/components/ui/button";
import type { RefundQueueItem } from "../types/refund.types";
import { useInitiateRefundMutation } from "../hooks/useRefundsQuery";
import { isFullOnlineRefundAmount } from "../utils/cancellation-rules";
import { toast } from "sonner";

interface ProcessRefundConfirmDialogProps {
  row: RefundQueueItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProcessRefundConfirmDialog({ row, open, onOpenChange }: ProcessRefundConfirmDialogProps) {
  const mutation = useInitiateRefundMutation();

  if (!row) return null;

  const confirm = () => {
    if (!isFullOnlineRefundAmount(row)) {
      toast.error("Refund amount must be 100% of the order total. Please resolve with backend before processing.");
      return;
    }
    mutation.mutate(
      {
        orderId: row.orderId,
        payload: { reason: "Admin initiated full online refund (gateway)." },
      },
      {
        onSuccess: () => onOpenChange(false),
      },
    );
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Process full refund?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2 text-left">
            <span className="block">
              The payment gateway will refund <strong>₹{row.refundAmount.toFixed(2)}</strong> (100% of the paid amount,
              no deductions) for order <strong>{row.orderNumber}</strong>.
            </span>
            <span className="block text-xs text-muted-foreground">
              This retries refund initiation for the cancelled online order. Status updates follow your backend rules.
              The farmer will be notified by SMS/push with the amount and typical settlement time (often 3–5 business
              days).
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>
            <CancelButtonContent />
          </AlertDialogCancel>
          <Button type="button" onClick={confirm} disabled={mutation.isPending}>
            Process refund
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default ProcessRefundConfirmDialog;
