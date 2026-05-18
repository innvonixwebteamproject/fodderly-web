import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { notificationsQueryKey } from "./useNotifications";
import { FCM_NOTIFICATION_RECEIVED_EVENT } from "@/services/NotificationService";

export const useInvalidateNotificationsOnFCM = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: notificationsQueryKey });
    };

    const handleForegroundNotification = () => invalidate();
    window.addEventListener(
      FCM_NOTIFICATION_RECEIVED_EVENT,
      handleForegroundNotification,
    );

    const sw = navigator.serviceWorker;
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data?.type === "NOTIFICATION_CLICK") {
        invalidate();
      }
    };
    sw?.addEventListener("message", handleServiceWorkerMessage);

    return () => {
      window.removeEventListener(
        FCM_NOTIFICATION_RECEIVED_EVENT,
        handleForegroundNotification,
      );
      sw?.removeEventListener("message", handleServiceWorkerMessage);
    };
  }, [queryClient]);
};
