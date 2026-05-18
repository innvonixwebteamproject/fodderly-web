import { format, parse } from "date-fns";
import { CalendarClock, History, Truck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AdminOrderDetail } from "../types/order.types";

function formatEtaDate(value: string | null | undefined): string {
  if (!value) return "-";
  const d = new Date(value);
  if (!Number.isNaN(d.getTime())) return format(d, "dd MMM yyyy");
  const parsed = parse(value, "yyyy-MM-dd", new Date());
  if (!Number.isNaN(parsed.getTime())) return format(parsed, "dd MMM yyyy");
  return value;
}

interface OrderDeliverySummaryCardProps {
  order: AdminOrderDetail;
  hideHistory?: boolean;
}

export function OrderDeliverySummaryCard({
  order,
  hideHistory = false,
}: OrderDeliverySummaryCardProps) {
  const delayed = order.orderStatus === "DELAYED" || Boolean(order.isDelayed);
  const history = order.deliveryEtaHistory ?? [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Truck className="h-4 w-4 text-primary" />
          Delivery & tracking
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-[13px]">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Expected delivery</p>
            <p className="mt-0.5 font-medium">{formatEtaDate(order.expectedDeliveryDate)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Dispatched at</p>
            <p className="mt-0.5">
              {order.dispatchedAt ? format(new Date(order.dispatchedAt), "dd MMM yyyy, HH:mm") : "-"}
            </p>
          </div>
          <div className="sm:col-span-2 flex flex-wrap items-center gap-2">
            <p className="text-xs font-medium text-muted-foreground">Delay status</p>
            {delayed ? (
              <Badge variant="warning" appearance="light" size="sm" shape="circle">
                Delayed
              </Badge>
            ) : (
              <Badge variant="secondary" appearance="light" size="sm" shape="circle">
                On track
              </Badge>
            )}
          </div>
        </div>

        {!hideHistory && delayed && order.expectedDeliveryDate ? (
          <div className="rounded-md border border-amber-200 bg-amber-50/80 px-3 py-2 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
            <span className="flex items-start gap-2">
              <CalendarClock className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Delayed – New ETA: <strong>{formatEtaDate(order.expectedDeliveryDate)}</strong>
              </span>
            </span>
          </div>
        ) : null}

        {!hideHistory && history.length > 0 ? (
          <div>
            <p className="mb-2 flex items-center gap-2 text-sm font-medium">
              <History className="h-4 w-4 text-muted-foreground" />
              ETA revision history
            </p>
            <ul className="max-h-48 space-y-2 overflow-y-auto rounded-md border bg-muted/20 p-2">
              {history.map((h) => (
                <li key={h.id} className="rounded border bg-background px-2 py-1.5 text-xs">
                  <span className="font-medium">{formatEtaDate(h.expectedDeliveryDate)}</span>
                  <span className="text-muted-foreground">
                    {" "}
                    · from {format(new Date(h.recordedAt), "dd MMM yyyy, HH:mm")}
                    {h.recordedByName ? ` · ${h.recordedByName}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
