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
import { useForceDeliverOrderMutation } from "../hooks/useOrderDetailMutations";

interface ForceDeliverConfirmDialogProps {
  orderId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ForceDeliverConfirmDialog({ orderId, open, onOpenChange }: ForceDeliverConfirmDialogProps) {
  const mutation = useForceDeliverOrderMutation(orderId);

  const confirm = () => {
    mutation.mutate(
      { acknowledgeBypass: true },
      {
        onSuccess: () => onOpenChange(false),
      },
    );
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Force mark as delivered?</AlertDialogTitle>
          <AlertDialogDescription className="text-destructive font-medium">
            This bypasses Farmer OTP verification and releases Fodderman commission.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>
            <CancelButtonContent>Go back</CancelButtonContent>
          </AlertDialogCancel>
          <Button type="button" onClick={confirm} disabled={mutation.isPending}>
            Confirm override
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
