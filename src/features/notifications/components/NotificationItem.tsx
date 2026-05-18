import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/helpers";
import type { NotificationItem as TNotificationItem } from "../types";
import {
  getNotificationCreatedAt,
  isNotificationUnread,
} from "../utils/notification-helpers";
import { formatNotificationTime } from "../utils/formatNotificationTime";

interface NotificationItemProps {
  notification: TNotificationItem;
  onMarkRead?: (id: string) => void;
  interactive?: boolean;
  variant?: "compact" | "card";
  className?: string;
}

export function NotificationItem({
  notification,
  onMarkRead,
  interactive = true,
  variant = "compact",
  className,
}: NotificationItemProps) {
  const unread = isNotificationUnread(notification);
  const createdAt = getNotificationCreatedAt(notification);

  const handleClick = () => {
    if (!interactive) return;
    if (unread && onMarkRead) {
      onMarkRead(notification.id);
    }
  };

  const content = (
    <div className="flex items-start gap-3">
      {unread && (
        <span
          className="mt-1.5 size-2.5 shrink-0 rounded-full bg-primary"
          aria-hidden
        />
      )}
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            variant === "card" ? "text-base" : "text-sm",
            "truncate",
            unread && "font-semibold",
          )}
        >
          {notification.title || "Notification"}
        </p>
        <p
          className={cn(
            "text-muted-foreground mt-0.5",
            variant === "card" ? "text-sm line-clamp-3" : "text-xs line-clamp-2",
          )}
        >
          {notification.message || "-"}
        </p>
        <p className="text-muted-foreground mt-1 text-xs">
          {formatNotificationTime(createdAt)}
          {" • "}
          {createdAt ? formatDateTime(createdAt) : "-"}
        </p>
      </div>
    </div>
  );

  const baseClasses = cn(
    "w-full text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg",
    unread && "bg-primary/5 font-medium",
    interactive ? "hover:bg-accent cursor-pointer" : "cursor-default",
    className,
  );

  if (variant === "card") {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={!interactive}
        className={cn(
          baseClasses,
          "px-4 py-4 border border-border/80 rounded-xl text-left shadow-sm",
          unread && "border-primary/20 bg-primary/[0.03]",
        )}
      >
        {content}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!interactive}
      className={cn(baseClasses, "px-3 py-2.5")}
    >
      {content}
    </button>
  );
}
