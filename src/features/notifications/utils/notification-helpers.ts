import type { NotificationItem } from "../types";

export const getNotificationCreatedAt = (notification: NotificationItem): string =>
  notification.createdAt || notification.created_at || "";

export const isNotificationUnread = (notification: NotificationItem): boolean => {
  if (notification.receiver?.status) {
    return notification.receiver.status === "unread";
  }
  if (typeof notification.isRead === "boolean") {
    return !notification.isRead;
  }
  return false;
};
