import { useMemo, useState } from "react";
import { AlertCircle, Bell, CheckCheck, Inbox, ListTodo } from "lucide-react";
import { Container } from "@/components/common/container";
import { InfiniteScrollContainer } from "@/components/common/infinite-scroll-container";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Switch, SwitchWrapper } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
} from "@/components/ui/alert";
import { NotificationList } from "../components/NotificationList";
import {
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useNotifications,
} from "../hooks";
import { isNotificationUnread } from "../utils/notification-helpers";

type TabValue = "unread" | "read" | "all";

function NotificationListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((item) => (
        <div key={item} className="rounded-xl border border-border/80 p-4 shadow-sm">
          <Skeleton className="h-4 w-3/4 rounded" />
          <Skeleton className="mt-2 h-3 w-full rounded" />
          <Skeleton className="mt-1 h-3 w-2/3 rounded" />
        </div>
      ))}
    </div>
  );
}

export function NotificationsPage() {
  const [tab, setTab] = useState<TabValue>("unread");
  const [notificationPreference, setNotificationPreference] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("notification.preference") !== "false";
  });
  const { data, isLoading, isError } = useNotifications();
  const markRead = useMarkNotificationReadMutation();
  const markAllRead = useMarkAllNotificationsReadMutation();

  const notifications = useMemo(() => data?.data ?? [], [data?.data]);
  const unreadCount = notifications.filter((item) => isNotificationUnread(item)).length;
  const unreadNotifications = useMemo(
    () => notifications.filter((item) => isNotificationUnread(item)),
    [notifications],
  );
  const readNotifications = useMemo(
    () => notifications.filter((item) => !isNotificationUnread(item)),
    [notifications],
  );
  const handlePreferenceChange = (enabled: boolean) => {
    setNotificationPreference(enabled);
    localStorage.setItem("notification.preference", String(enabled));
  };

  return (
    <Container className="py-6">
      <div className="mb-6 rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-semibold text-foreground">
              Notification Preference
            </h3>
            <p className="text-xs text-muted-foreground">
              {notificationPreference
                ? "You will receive new notifications"
                : "You will not receive any new notifications"}
            </p>
          </div>
          <SwitchWrapper>
            <Switch
              size="lg"
              checked={notificationPreference}
              onCheckedChange={handlePreferenceChange}
              className="border border-border"
            />
          </SwitchWrapper>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Notifications</h2>
          {unreadCount > 0 && (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-medium text-primary-foreground">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => markAllRead.mutate()}
          disabled={unreadCount === 0 || markAllRead.isPending}
          className="gap-2"
        >
          <CheckCheck className="h-4 w-4" />
          {markAllRead.isPending ? "Marking..." : "Mark all as read"}
        </Button>
      </div>

      {isError ? (
        <Alert variant="destructive" className="rounded-xl">
          <AlertIcon>
            <AlertCircle className="h-4 w-4" />
          </AlertIcon>
          <AlertTitle>Could not load notifications</AlertTitle>
          <AlertDescription>
            Something went wrong. Please refresh and try again.
          </AlertDescription>
        </Alert>
      ) : (
        <Tabs value={tab} onValueChange={(value) => setTab(value as TabValue)}>
          <TabsList
            variant="default"
            className="mb-6 h-11 w-full max-w-md bg-muted/60 p-1 rounded-lg"
          >
            <TabsTrigger
              value="unread"
              className="flex-1 gap-2 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Inbox className="h-4 w-4" />
              Unread
              {unreadCount > 0 && (
                <span className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-medium text-primary-foreground">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="read"
              className="flex-1 gap-2 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <CheckCheck className="h-4 w-4" />
              Read
            </TabsTrigger>
            <TabsTrigger
              value="all"
              className="flex-1 gap-2 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <ListTodo className="h-4 w-4" />
              All
            </TabsTrigger>
          </TabsList>

          <TabsContent value="unread" className="mt-0">
            <InfiniteScrollContainer
              className="max-h-[74vh]"
              isLoading={isLoading}
              isFetchingNextPage={false}
              hasNextPage={false}
              onLoadMore={() => undefined}
              overflowX="hidden"
              overflowY="auto"
            >
              {isLoading ? (
                <NotificationListSkeleton />
              ) : (
                <NotificationList
                  notifications={unreadNotifications}
                  onMarkRead={(id) => markRead.mutate(id)}
                  interactive
                  variant="card"
                  emptyMessage="No unread notifications"
                />
              )}
            </InfiniteScrollContainer>
          </TabsContent>

          <TabsContent value="read" className="mt-0">
            <InfiniteScrollContainer
              className="max-h-[74vh]"
              isLoading={isLoading}
              isFetchingNextPage={false}
              hasNextPage={false}
              onLoadMore={() => undefined}
              overflowX="hidden"
              overflowY="auto"
            >
              {isLoading ? (
                <NotificationListSkeleton />
              ) : (
                <NotificationList
                  notifications={readNotifications}
                  interactive={false}
                  variant="card"
                  emptyMessage="No read notifications"
                />
              )}
            </InfiniteScrollContainer>
          </TabsContent>

          <TabsContent value="all" className="mt-0">
            <InfiniteScrollContainer
              className="max-h-[74vh]"
              isLoading={isLoading}
              isFetchingNextPage={false}
              hasNextPage={false}
              onLoadMore={() => undefined}
              overflowX="hidden"
              overflowY="auto"
            >
              {isLoading ? (
                <NotificationListSkeleton />
              ) : (
                <NotificationList
                  notifications={notifications}
                  onMarkRead={(id) => markRead.mutate(id)}
                  interactive
                  variant="card"
                  emptyMessage="No notifications yet"
                />
              )}
            </InfiniteScrollContainer>
          </TabsContent>
        </Tabs>
      )}
    </Container>
  );
}

export default NotificationsPage;
