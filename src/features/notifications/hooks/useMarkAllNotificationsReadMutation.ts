import { useMutation, useQueryClient } from "@tanstack/react-query";
import { markAllNotificationsAsRead } from "../services";
import { notificationsQueryKey } from "./useNotifications";
import type { NotificationsApiResponse } from "../types";

const patchAllNotificationsRead = (data: unknown) => {
  if (!data || typeof data !== "object") return data;
  const response = data as NotificationsApiResponse;
  if (!Array.isArray(response.data)) return data;

  return {
    ...response,
    data: response.data.map((item) => ({
      ...item,
      isRead: true,
      receiver: { ...item.receiver, status: "read" as const },
    })),
    meta: response.meta ? { ...response.meta, total: 0 } : response.meta,
  };
};

export const useMarkAllNotificationsReadMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllNotificationsAsRead,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: notificationsQueryKey });
      queryClient.setQueriesData(
        { queryKey: notificationsQueryKey },
        (old) => patchAllNotificationsRead(old),
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: notificationsQueryKey });
    },
  });
};
