import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useInitiateRefundMutation } from "../hooks/useRefundsQuery";

interface RefundInitiateModalProps {
  orderId: string;
  orderNumber: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RefundInitiateModal({ orderId, orderNumber, open, onOpenChange }: RefundInitiateModalProps) {
  const [reason, setReason] = useState("");
  const mutation = useInitiateRefundMutation();

  const confirm = () => {
    mutation.mutate(
      { orderId, payload: reason.trim() ? { reason: reason.trim() } : undefined },
      {
        onSuccess: () => {
          setReason("");
          onOpenChange(false);
        },
      },
    );
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Initiate online refund</AlertDialogTitle>
        <AlertDialogDescription>
          Starts the admin online refund for order <strong>{orderNumber}</strong> (full paid amount to the original
          method, no deductions). The farmer is notified after a successful initiation.
        </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2 py-2">
          <Label htmlFor="refund-reason" className="text-[13px]">
            Reason (optional)
          </Label>
          <Input
            id="refund-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Leave blank to use default (OTHER)"
            className="h-9 text-[13px]"
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setReason("")}>
            <CancelButtonContent />
          </AlertDialogCancel>
          <Button type="button" onClick={confirm} disabled={mutation.isPending}>
            Initiate refund
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
