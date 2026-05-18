import { Badge } from "@/components/ui/badge";
import type { PaymentStatus } from "../types/order.types";
import { formatApiPipelineLabel, getPaymentStatusLabel } from "../utils/order-labels";

function badgeForApiPaymentLabel(labelLower: string): "success" | "info" | "warning" | "secondary" {
  if (labelLower === "done" || labelLower === "paid" || labelLower === "captured" || labelLower.includes("received")) {
    return "success";
  }
  if (labelLower.includes("refund")) {
    return "info";
  }
  if (labelLower === "unpaid" || labelLower.includes("pending") || labelLower.includes("created")) {
    return "warning";
  }
  return "secondary";
}

export function PaymentStatusBadge({
  status,
  labelFromApi,
}: {
  status: PaymentStatus;
  /** Admin list `paymentStatusLabel` (e.g. `done`, `unpaid`) — title-cased for display. */
  labelFromApi?: string | null;
}) {
  const trimmed = labelFromApi?.trim();
  const label = trimmed ? formatApiPipelineLabel(trimmed) : getPaymentStatusLabel(status);

  if (trimmed) {
    const variant = badgeForApiPaymentLabel(trimmed.toLowerCase());
    if (variant === "success") {
      return (
        <Badge variant="success" appearance="light" size="sm" shape="circle">
          {label}
        </Badge>
      );
    }
    if (variant === "info") {
      return (
        <Badge variant="info" appearance="light" size="sm" shape="circle">
          {label}
        </Badge>
      );
    }
    if (variant === "warning") {
      return (
        <Badge variant="warning" appearance="light" size="sm" shape="circle">
          {label}
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" appearance="light" size="sm" shape="circle">
        {label}
      </Badge>
    );
  }

  if (status === "REFUNDED") {
    return (
      <Badge variant="info" appearance="light" size="sm" shape="circle">
        {label}
      </Badge>
    );
  }

  if (status === "PAID") {
    return (
      <Badge variant="success" appearance="light" size="sm" shape="circle">
        {label}
      </Badge>
    );
  }

  if (status === "RECEIVED_BY_FODDERMAN") {
    return (
      <Badge variant="info" appearance="outline" size="sm" shape="circle">
        {label}
      </Badge>
    );
  }

  return (
    <Badge variant="warning" appearance="light" size="sm" shape="circle">
      {label}
    </Badge>
  );
}
