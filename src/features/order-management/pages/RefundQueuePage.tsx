import { Navigate } from "react-router-dom";

/** @deprecated Use `/admin/orders/cancelled-refunds` — kept for bookmark compatibility. */
export function RefundQueuePage() {
  return <Navigate to="/admin/orders/cancelled-refunds" replace />;
}
