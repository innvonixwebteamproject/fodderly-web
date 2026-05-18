import { Badge } from "@/components/ui/badge";
import type { RefundStatus } from "../types/refund.types";

const LABELS: Record<RefundStatus, string> = {
  REFUND_INITIATED: "Pending refund",
  REFUND_PROCESSING: "Processing",
  REFUND_PROCESSED: "Refunded",
  REFUND_FAILED: "Refund failed",
  REFUND_NOT_APPLICABLE: "Not applicable",
};

function RefundStatusBadge({ status }: { status: RefundStatus }) {
  const label = LABELS[status] ?? status;

  if (status === "REFUND_PROCESSED") {
    return (
      <Badge variant="success" appearance="light" size="sm" shape="circle">
        {label}
      </Badge>
    );
  }

  if (status === "REFUND_PROCESSING") {
    return (
      <Badge variant="info" appearance="light" size="sm" shape="circle">
        {label}
      </Badge>
    );
  }

  if (status === "REFUND_FAILED") {
    return (
      <Badge variant="destructive" appearance="light" size="sm" shape="circle">
        {label}
      </Badge>
    );
  }

  if (status === "REFUND_NOT_APPLICABLE") {
    return (
      <Badge variant="secondary" appearance="light" size="sm" shape="circle">
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

export { RefundStatusBadge };
export default RefundStatusBadge;
