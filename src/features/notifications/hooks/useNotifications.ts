import { useQuery } from "@tanstack/react-query";
import { getNotifications } from "../services";

export const notificationsQueryKey = ["notifications"] as const;

export const useNotifications = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: [...notificationsQueryKey, "list"],
    queryFn: getNotifications,
    staleTime: 60 * 1000,
    enabled: options?.enabled !== false,
  });
};
