import type { NotificationItem } from "../types";

export type NotificationAppRole = "admin" | "partner";

export interface NotificationPayloadData {
  order_id?: string;
  user_order_id?: string;
  farmer_name?: string;
  template_code?: string;
  redirection_link?: string;
  [key: string]: unknown;
}

export function getNotificationData(
  notification: NotificationItem,
): NotificationPayloadData | null {
  const data = notification.data;
  if (!data || typeof data !== "object") {
    return null;
  }
  return data as NotificationPayloadData;
}

/**
 * Resolves API `data.redirection_link` (e.g. `/orders/{id}`) to an in-app route for the current role.
 */
export function getNotificationRedirectionPath(
  notification: NotificationItem,
  role: NotificationAppRole | null,
): string | null {
  const data = getNotificationData(notification);
  const rawLink = data?.redirection_link;
  if (typeof rawLink !== "string") {
    return null;
  }

  const trimmed = rawLink.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith("/admin/") || trimmed.startsWith("/partner/")) {
    return trimmed;
  }

  const base = role === "partner" ? "/partner" : "/admin";
  const normalized = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;

  if (normalized.startsWith("/orders/")) {
    return `${base}${normalized}`;
  }

  return `${base}${normalized}`;
}

export function getNotificationRedirectionLabel(notification: NotificationItem): string {
  const path = getNotificationData(notification)?.redirection_link ?? "";
  if (path.includes("/orders/")) {
    return "View order";
  }
  return "View details";
}

export function notificationHasRedirection(
  notification: NotificationItem,
  role: NotificationAppRole | null,
): boolean {
  return getNotificationRedirectionPath(notification, role) != null;
}
