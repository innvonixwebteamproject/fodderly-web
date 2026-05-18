import { cn } from "@/lib/utils";
import type { NotificationItem as TNotificationItem } from "../types";
import { NotificationItem } from "./NotificationItem";
import { isNotificationUnread } from "../utils/notification-helpers";

interface NotificationListProps {
  notifications: TNotificationItem[];
  onMarkRead?: (id: string) => void;
  onlyUnread?: boolean;
  interactive?: boolean;
  variant?: "compact" | "card";
  emptyMessage?: string;
  className?: string;
}

export function NotificationList({
  notifications,
  onMarkRead,
  onlyUnread = false,
  interactive = true,
  variant = "compact",
  emptyMessage = "No notifications",
  className,
}: NotificationListProps) {
  const list = onlyUnread
    ? notifications.filter((item) => isNotificationUnread(item))
    : notifications;

  if (list.length === 0) {
    return (
      <div className={cn("py-6 text-center text-sm text-muted-foreground", className)}>
        {emptyMessage}
      </div>
    );
  }

  const gap = variant === "card" ? "space-y-3" : "space-y-0.5";

  return (
    <ul className={cn(gap, className)} role="list">
      {list.map((notification) => (
        <li key={notification.id}>
          <NotificationItem
            notification={notification}
            onMarkRead={onMarkRead}
            interactive={interactive}
            variant={variant}
          />
        </li>
      ))}
    </ul>
  );
}
