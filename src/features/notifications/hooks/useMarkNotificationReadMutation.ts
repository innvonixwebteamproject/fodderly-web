import { useMutation, useQueryClient } from "@tanstack/react-query";
import { markNotificationAsRead } from "../services";
import { notificationsQueryKey } from "./useNotifications";
import type { NotificationsApiResponse } from "../types";
import { isNotificationUnread } from "../utils/notification-helpers";

const patchNotificationReadState = (data: unknown, id: string) => {
  if (!data || typeof data !== "object") return data;
  const response = data as NotificationsApiResponse;
  if (!Array.isArray(response.data)) return data;

  const wasUnread = response.data.find((item) => item.id === id);
  const unreadDelta = wasUnread && isNotificationUnread(wasUnread) ? 1 : 0;

  return {
    ...response,
    data: response.data.map((item) =>
      item.id === id
        ? {
            ...item,
            isRead: true,
            receiver: { ...item.receiver, status: "read" as const },
          }
        : item,
    ),
    meta:
      response.meta && unreadDelta > 0
        ? { ...response.meta, total: Math.max(0, response.meta.total - unreadDelta) }
        : response.meta,
  };
};

export const useMarkNotificationReadMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => markNotificationAsRead(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: notificationsQueryKey });
      queryClient.setQueriesData(
        { queryKey: notificationsQueryKey },
        (old) => patchNotificationReadState(old, id),
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: notificationsQueryKey });
    },
  });
};
