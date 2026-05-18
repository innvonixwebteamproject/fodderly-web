import { Badge } from "@/components/ui/badge";
import type { OrderStatus } from "../types/order.types";
import { formatApiPipelineLabel, getOrderStatusLabel } from "../utils/order-labels";

type BadgeVariant = "success" | "destructive" | "warning" | "info" | "secondary";

/** Admin list API pipeline labels → badge variant (semantic, not internal enum). */
function variantForOrderApiLabel(raw: string): BadgeVariant {
  const s = raw.trim().toLowerCase();
  if (
    s === "rejected" ||
    s === "reject" ||
    s === "cancelled" ||
    s === "cancel" ||
    s === "canceled" ||
    s.startsWith("cancel_")
  ) {
    return "destructive";
  }
  if (s === "approved" || s === "approve" || s === "delivered" || s === "order_delivered") {
    return "success";
  }
  if (s === "dispatch" || s === "dispatched" || s.includes("dispatch")) {
    return "info";
  }
  if (s === "delayed" || s === "delay") {
    return "warning";
  }
  if (s === "unpaid" || s === "pending" || s === "pending_order") {
    return "warning";
  }
  return "secondary";
}

export function OrderStatusBadge({
  status,
  labelFromApi,
}: {
  status: OrderStatus;
  /** When set (e.g. admin All Orders), show title-cased API pipeline value with semantic colors. */
  labelFromApi?: string | null;
}) {
  const trimmed = labelFromApi?.trim();
  const label = trimmed ? formatApiPipelineLabel(trimmed) : getOrderStatusLabel(status);

  if (trimmed) {
    const variant = variantForOrderApiLabel(trimmed);
    return (
      <Badge variant={variant} appearance="light" size="sm" shape="circle">
        {label}
      </Badge>
    );
  }

  switch (status) {
    case "CANCELLED":
    case "CANCELLED_BY_ADMIN":
      return (
        <Badge variant="destructive" appearance="light" size="sm" shape="circle">
          {label}
        </Badge>
      );
    case "AWAITING_VERIFICATION":
      return (
        <Badge variant="warning" appearance="light" size="sm" shape="circle">
          {label}
        </Badge>
      );
    case "ORDER_DISPATCH":
      return (
        <Badge variant="info" appearance="light" size="sm" shape="circle">
          {label}
        </Badge>
      );
    case "DELAYED":
      return (
        <Badge variant="warning" appearance="light" size="sm" shape="circle">
          {label}
        </Badge>
      );
    case "ORDER_DELIVERED":
      return (
        <Badge variant="success" appearance="light" size="sm" shape="circle">
          {label}
        </Badge>
      );
    case "PENDING_ORDER":
    case "ORDER_RECEIVED":
      return (
        <Badge variant="warning" appearance="light" size="sm" shape="circle">
          {label}
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary" appearance="light" size="sm" shape="circle">
          {label}
        </Badge>
      );
  }
}
