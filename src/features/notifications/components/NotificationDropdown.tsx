import { useState } from "react";
import { Link } from "react-router-dom";
import { Bell } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useMarkNotificationReadMutation, useNotifications } from "../hooks";
import { isNotificationUnread } from "../utils/notification-helpers";
import { NotificationList } from "./NotificationList";

const getNotificationRoute = (role: "admin" | "partner" | null) =>
  role === "partner" ? "/partner/notifications" : "/admin/notifications";

export function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const role = useAuthStore((state) => state.role);
  const { data, isLoading, isError } = useNotifications();
  const markRead = useMarkNotificationReadMutation();

  const notifications = data?.data ?? [];
  const unreadCount =
    data?.meta?.unread ?? notifications.filter((item) => isNotificationUnread(item)).length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : "Notifications"}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span
            className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground"
            aria-hidden
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </PopoverTrigger>

      <PopoverContent align="end" side="bottom" sideOffset={8} className="w-[360px] p-0">
        <div className="border-b border-border px-3 py-2">
          <h3 className="text-sm font-semibold">Notifications</h3>
        </div>

        <ScrollArea className="h-[280px]">
          <div className="p-2">
            {isLoading ? (
              <div className="space-y-2 py-2">
                {[1, 2, 3].map((item) => (
                  <Skeleton key={item} className="h-16 w-full" />
                ))}
              </div>
            ) : isError ? (
              <div className="py-6 text-center text-sm text-destructive">
                Failed to load notifications.
              </div>
            ) : (
              <NotificationList
                notifications={notifications}
                onMarkRead={(id) => markRead.mutate(id)}
                onAfterNavigate={() => setOpen(false)}
                onlyUnread
                interactive
                emptyMessage="No unread notifications"
              />
            )}
          </div>
        </ScrollArea>

        <div className="border-t border-border p-2">
          <Link
            to={getNotificationRoute(role)}
            className="block w-full rounded-md py-2 text-center text-sm font-medium text-primary hover:bg-accent"
          >
            Show All Notifications
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
