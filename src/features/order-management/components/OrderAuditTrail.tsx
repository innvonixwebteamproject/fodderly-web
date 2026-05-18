import { useMemo } from "react";
import { History, Check, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { OrderAuditLogEntry } from "../types/order.types";

interface OrderAuditTrailProps {
  entries: OrderAuditLogEntry[];
  /** Anchor for in-page navigation (e.g. partner order history → timeline). */
  id?: string;
}

const PIPELINE_STATUS_LABEL: Record<string, string> = {
  unpaid: "Unpaid",
  pending: "Pending",
  approve: "Approved",
  approved: "Approved",
  reject: "Rejected",
  rejected: "Rejected",
  cancel: "Cancelled",
  cancelled: "Cancelled",
  dispatch: "Dispatched",
  dispatched: "Dispatched",
  delivered: "Delivered",
};

function pipelineStatusLabel(status: string | null | undefined): string {
  if (!status?.trim()) return "";
  const key = status.toLowerCase();
  return PIPELINE_STATUS_LABEL[key] ?? status;
}

function pipelineBadgeVariant(
  status: string | null | undefined,
): "primary" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" {
  const s = (status ?? "").toLowerCase();
  if (s === "reject" || s === "cancel" || s === "rejected" || s === "cancelled") return "destructive";
  if (s === "delivered") return "success";
  if (s === "dispatch" || s === "dispatched") return "info";
  if (s === "pending" || s === "unpaid") return "warning";
  if (s === "approve" || s === "approved") return "success";
  return "outline";
}

export function OrderAuditTrail({ entries, id }: OrderAuditTrailProps) {
  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [entries]);

  return (
    <Card id={id} className="overflow-hidden border-border/80 shadow-sm">
      <CardHeader className="border-b border-border/60 bg-muted/20 py-4">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold tracking-tight">
          <History className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
          Audit trail
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0 pb-0 pt-2">
        {entries.length === 0 ? (
          <p className="px-6 py-6 text-sm text-muted-foreground">No audit events recorded.</p>
        ) : (
          <div className="max-h-[500px] overflow-y-auto custom-scrollbar pb-6">
            <ol className="m-0 list-none px-4 sm:px-6" aria-label="Order progress timeline">
              {sortedEntries.map((entry, index) => {
                const hasActor = Boolean(entry.actorName?.trim() || entry.actorRole?.trim());
                const statusLabel = pipelineStatusLabel(entry.auditStatus);
                const isLastStep = index === sortedEntries.length - 1;
                const statusLower = entry.auditStatus?.toLowerCase() ?? "";
                const isDeliveredLast = index === 0 && statusLower === "delivered";
                const isFailedLast =
                  index === 0 &&
                  (statusLower === "reject" ||
                    statusLower === "cancel" ||
                    statusLower === "rejected" ||
                    statusLower === "cancelled");

                return (
                  <li
                    key={entry.id}
                    className={cn("relative flex gap-3 sm:gap-4", !isLastStep && "pb-0")}
                  >
                    {/* Rail + step marker */}
                    <div className="flex w-7 shrink-0 flex-col items-center sm:w-8" aria-hidden>
                      <div
                        className={cn(
                          "relative z-[1] flex h-6 w-6 shrink-0 items-center justify-center rounded-full border sm:h-7 sm:w-7",
                          isDeliveredLast &&
                            "border-green-600 bg-green-600 text-white shadow-sm dark:border-green-500 dark:bg-green-600",
                          isFailedLast &&
                            "border-destructive bg-destructive text-destructive-foreground shadow-sm",
                          !isDeliveredLast &&
                            !isFailedLast &&
                            "border-primary/70 bg-background text-primary shadow-sm text-primary",
                        )}
                      >
                        {isDeliveredLast ? (
                          <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2.5} />
                        ) : isFailedLast ? (
                          <XCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2.5} />
                        ) : (
                          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                        )}
                      </div>
                      {!isLastStep ? (
                        <span className="mt-0.5 min-h-[2.25rem] w-px flex-1 bg-gradient-to-b from-border via-border to-border/40" />
                      ) : null}
                    </div>

                    {/* Content */}
                    <div
                      className={cn(
                        "min-w-0 flex-1 border-b border-border/50 pb-6",
                        isLastStep && "border-b-0 pb-1",
                      )}
                    >
                      <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-1">
                        {entry.auditStatus ? (
                          <Badge
                            variant={pipelineBadgeVariant(entry.auditStatus)}
                            appearance="light"
                            size="sm"
                            className="w-fit text-[11px] font-semibold leading-none"
                          >
                            {statusLabel}
                          </Badge>
                        ) : (
                          <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                            Update
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-[13px] leading-relaxed text-foreground">{entry.description || "—"}</p>
                      {hasActor ? (
                        <p className="mt-1.5 text-[12px] text-muted-foreground">
                          {[entry.actorName, entry.actorRole].filter(Boolean).join(" · ")}
                        </p>
                      ) : null}
                      {(entry.deviceInfo || entry.ipAddress) && (
                        <p className="mt-2 rounded-md border border-border/60 bg-muted/30 px-2.5 py-1.5 text-[11px] leading-snug text-muted-foreground">
                          {[entry.deviceInfo, entry.ipAddress].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
