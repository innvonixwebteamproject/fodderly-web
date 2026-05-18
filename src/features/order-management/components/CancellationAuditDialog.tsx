import { format } from "date-fns";
import { History } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollContainer } from "@/components/common/scroll-container";
import { useCancellationRefundAuditQuery } from "../hooks/useCancelledRefundsQuery";

interface CancellationAuditDialogProps {
  orderId: string | null;
  orderNumber: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CancellationAuditDialog({
  orderId,
  orderNumber,
  open,
  onOpenChange,
}: CancellationAuditDialogProps) {
  const { data, isLoading, isError } = useCancellationRefundAuditQuery(orderId ?? undefined, open);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg gap-0 p-0 overflow-hidden">
        <DialogHeader className="border-b px-5 py-3">
          <DialogTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4 text-primary" />
            Cancellation & refund audit — {orderNumber ?? "—"}
          </DialogTitle>
        </DialogHeader>
        <ScrollContainer className="max-h-[70vh] px-5 py-4" overflowX="hidden" overflowY="auto">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading audit…</p>
          ) : isError ? (
            <p className="text-sm text-destructive">Could not load audit log.</p>
          ) : !data?.entries.length ? (
            <p className="text-sm text-muted-foreground">No audit entries.</p>
          ) : (
            <ol className="relative ms-1 space-y-4 border-s border-border ps-5">
              {data.entries.map((entry) => {
                const ts = new Date(entry.performedAt);
                const label = Number.isNaN(ts.getTime())
                  ? entry.performedAt
                  : format(ts, "dd MMM yyyy, HH:mm:ss");
                return (
                  <li key={entry.id} className="relative">
                    <span className="absolute -start-[21px] mt-1.5 size-2.5 rounded-full border border-primary bg-background ring-2 ring-background" />
                    <div className="rounded-md border bg-muted/20 p-3 text-[13px]">
                      <p className="text-xs font-medium text-muted-foreground">{label}</p>
                      <p className="mt-1 font-medium text-foreground">{entry.action}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {entry.actorName} · {entry.actorRole}
                      </p>
                      {(entry.refundAmount != null || entry.refundMode || entry.transactionReference || entry.bankUtr) && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {entry.refundAmount != null ? `₹${entry.refundAmount.toFixed(2)}` : ""}
                          {entry.refundMode ? ` · ${entry.refundMode}` : ""}
                          {entry.transactionReference ? ` · Ref: ${entry.transactionReference}` : ""}
                          {entry.bankUtr ? ` · UTR: ${entry.bankUtr}` : ""}
                        </p>
                      )}
                      {(entry.deviceInfo || entry.ipAddress) && (
                        <p className="mt-1 text-[11px] text-muted-foreground/90">
                          {[entry.deviceInfo, entry.ipAddress].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </ScrollContainer>
      </DialogContent>
    </Dialog>
  );
}
