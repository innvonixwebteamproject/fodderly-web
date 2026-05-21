/** Semantic badge variant for order pipeline / audit status slugs (matches order list badges). */
export type OrderPipelineBadgeVariant = "success" | "destructive" | "warning" | "info" | "secondary";

/** Maps API pipeline status (e.g. `orderAudits[].status`) → theme badge variant. */
export function variantForOrderPipelineStatus(
  status: string | null | undefined,
): OrderPipelineBadgeVariant {
  const s = (status ?? "").trim().toLowerCase();
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
  if (s === "delayed" || s === "delay" || s === "unpaid" || s === "pending" || s === "pending_order") {
    return "warning";
  }
  return "secondary";
}

export function isFailedPipelineStatus(status: string | null | undefined): boolean {
  return variantForOrderPipelineStatus(status) === "destructive";
}

export function isDeliveredPipelineStatus(status: string | null | undefined): boolean {
  const s = (status ?? "").trim().toLowerCase();
  return s === "delivered" || s === "order_delivered";
}

/** Timeline step marker — theme semantic tokens (not default primary/blue). */
export function pipelineStepMarkerClass(variant: OrderPipelineBadgeVariant): string {
  switch (variant) {
    case "success":
      return "border-[var(--color-success-accent,var(--color-green-600))] bg-[var(--color-success-accent,var(--color-green-600))] text-[var(--color-success-foreground,var(--color-white))] shadow-sm dark:border-[var(--color-success-accent,var(--color-green-500))] dark:bg-[var(--color-success-accent,var(--color-green-600))]";
    case "destructive":
      return "border-destructive bg-destructive text-destructive-foreground shadow-sm";
    case "warning":
      return "border-[var(--color-warning-accent,var(--color-yellow-600))] bg-[var(--color-warning-accent,var(--color-yellow-500))] text-[var(--color-warning-foreground,var(--color-white))] shadow-sm";
    case "info":
      return "border-[var(--color-info-accent,var(--color-violet-600))] bg-[var(--color-info-accent,var(--color-violet-500))] text-[var(--color-info-foreground,var(--color-white))] shadow-sm";
    case "secondary":
    default:
      return "border-border bg-muted text-muted-foreground shadow-sm";
  }
}

/** Inner dot for non-terminal timeline steps. */
export function pipelineStepDotClass(variant: OrderPipelineBadgeVariant): string {
  switch (variant) {
    case "success":
      return "bg-[var(--color-success-accent,var(--color-green-600))]";
    case "destructive":
      return "bg-destructive";
    case "warning":
      return "bg-[var(--color-warning-accent,var(--color-yellow-600))]";
    case "info":
      return "bg-[var(--color-info-accent,var(--color-violet-600))]";
    case "secondary":
    default:
      return "bg-muted-foreground/70";
  }
}
