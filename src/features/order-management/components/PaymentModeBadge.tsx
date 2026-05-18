import { Badge } from "@/components/ui/badge";
import type { PaymentMode } from "../types/order.types";
import { formatApiPipelineLabel, getPaymentModeLabel } from "../utils/order-labels";

export function PaymentModeBadge({
  mode,
  labelFromApi,
}: {
  mode: PaymentMode;
  /** When set (e.g. admin All Orders), show title-cased API value. */
  labelFromApi?: string | null;
}) {
  const trimmed = labelFromApi?.trim();
  const label = trimmed ? formatApiPipelineLabel(trimmed) : getPaymentModeLabel(mode);

  if (trimmed) {
    const slug = trimmed.toLowerCase();
    const isOnline = slug === "online" || slug.includes("online");
    return (
      <Badge variant={isOnline ? "info" : "secondary"} appearance="light" size="sm" shape="circle">
        {label}
      </Badge>
    );
  }

  if (mode === "ONLINE_PAYMENT") {
    return (
      <Badge variant="info" appearance="light" size="sm" shape="circle">
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
