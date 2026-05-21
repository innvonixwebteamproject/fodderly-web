import { History, Check, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { OrderAuditLogEntry } from "../types/order.types";
import { formatApiPipelineLabel } from "../utils/order-labels";
import {
  isDeliveredPipelineStatus,
  isFailedPipelineStatus,
  pipelineStepDotClass,
  pipelineStepMarkerClass,
  variantForOrderPipelineStatus,
} from "../utils/order-pipeline-badge";

interface OrderAuditTrailProps {
  entries: OrderAuditLogEntry[];
  /** Anchor for in-page navigation (e.g. partner order history → timeline). */
  id?: string;
}

export function OrderAuditTrail({ entries, id }: OrderAuditTrailProps) {
  return (
    <Card id={id} className="overflow-hidden border-border/80 shadow-sm">
      <CardHeader className="border-b border-border/60 bg-muted/20 py-4">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold tracking-tight">
          <History className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
          Audit trail
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0 pb-0 pt-2">
        {entries.length === 0 ? (
          <p className="px-6 py-6 text-sm text-muted-foreground">No audit events recorded.</p>
        ) : (
          <div className="max-h-[500px] overflow-y-auto custom-scrollbar pb-6">
            <ol className="m-0 list-none px-4 sm:px-6" aria-label="Order progress timeline">
              {entries.map((entry, index) => {
                const hasActor = Boolean(entry.actorName?.trim() || entry.actorRole?.trim());
                const statusVariant = variantForOrderPipelineStatus(entry.auditStatus);
                const statusLabel = formatApiPipelineLabel(entry.auditStatus);
                const isLastStep = index === entries.length - 1;
                const isDeliveredStep = isDeliveredPipelineStatus(entry.auditStatus);
                const isFailedStep = isFailedPipelineStatus(entry.auditStatus);

                return (
                  <li
                    key={entry.id}
                    className={cn("relative flex gap-3 sm:gap-4", !isLastStep && "pb-0")}
                  >
                    <div className="flex w-7 shrink-0 flex-col items-center sm:w-8" aria-hidden>
                      <div
                        className={cn(
                          "relative z-[1] flex h-6 w-6 shrink-0 items-center justify-center rounded-full border sm:h-7 sm:w-7",
                          pipelineStepMarkerClass(statusVariant),
                        )}
                      >
                        {isDeliveredStep ? (
                          <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2.5} />
                        ) : isFailedStep ? (
                          <XCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2.5} />
                        ) : (
                          <span
                            className={cn("h-1.5 w-1.5 rounded-full", pipelineStepDotClass(statusVariant))}
                          />
                        )}
                      </div>
                      {!isLastStep ? (
                        <span className="mt-0.5 min-h-[2.25rem] w-px flex-1 bg-gradient-to-b from-border via-border to-border/40" />
                      ) : null}
                    </div>

                    <div
                      className={cn(
                        "min-w-0 flex-1 border-b border-border/50 pb-6",
                        isLastStep && "border-b-0 pb-1",
                      )}
                    >
                      <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-1">
                        {entry.auditStatus ? (
                          <Badge
                            variant={statusVariant}
                            appearance="light"
                            size="sm"
                            shape="circle"
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
