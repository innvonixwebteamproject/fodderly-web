import { api } from "@/lib/axios.interceptors";
import type {
  NotificationItem,
  NotificationMeta,
  NotificationsApiResponse,
  NotificationMutationResponse,
} from "../types";

type WrappedResponse<T> = {
  success?: boolean;
  statusCode?: number;
  message?: string;
  data?: T | { data?: T; meta?: NotificationMeta };
  meta?: NotificationMeta;
  timestamp?: string;
};

const getFallbackMeta = (total: number): NotificationMeta => ({
  page: 1,
  limit: total || 10,
  total,
  totalPages: total > 0 ? 1 : 0,
  hasNextPage: false,
  hasPreviousPage: false,
});

const unwrapCollection = (
  response: WrappedResponse<NotificationItem[]>,
): { items: NotificationItem[]; meta: NotificationMeta } => {
  if (Array.isArray(response.data)) {
    return {
      items: response.data,
      meta: response.meta || getFallbackMeta(response.data.length),
    };
  }

  if (
    response.data &&
    typeof response.data === "object" &&
    "notifications" in response.data
  ) {
    const dataObj = response.data as Record<string, unknown>;
    if (Array.isArray(dataObj.notifications)) {
      const notificationsArray = dataObj.notifications as NotificationItem[];
      const total = typeof dataObj.total === "number" ? dataObj.total : notificationsArray.length;
      return {
        items: notificationsArray,
        meta: {
          page: 1,
          limit: total || 10,
          total,
          totalPages: total > 0 ? 1 : 0,
          hasNextPage: false,
          hasPreviousPage: false,
          unread: typeof dataObj.unread === "number" ? dataObj.unread : 0,
          read: typeof dataObj.read === "number" ? dataObj.read : 0,
        },
      };
    }
  }

  if (
    response.data &&
    typeof response.data === "object" &&
    "data" in response.data &&
    Array.isArray(response.data.data)
  ) {
    return {
      items: response.data.data,
      meta:
        response.data.meta ||
        response.meta ||
        getFallbackMeta(response.data.data.length),
    };
  }

  return {
    items: [],
    meta: response.meta || getFallbackMeta(0),
  };
};

const unwrapItem = (
  response: WrappedResponse<NotificationItem | null>,
): NotificationItem | null => {
  if (!response.data) return null;
  const dataObj = response.data as Record<string, unknown>;
  if (typeof dataObj === "object" && dataObj !== null && "data" in dataObj) {
    return (dataObj.data as NotificationItem) || null;
  }
  return (response.data as NotificationItem) || null;
};

export const getNotifications = async (): Promise<NotificationsApiResponse> => {
  const response = await api.get<WrappedResponse<NotificationItem[]>>("/notifications");
  const responseData = response.data;
  const { items, meta } = unwrapCollection(responseData);

  return {
    success: responseData.success ?? true,
    statusCode: responseData.statusCode ?? 200,
    message: responseData.message ?? "Success",
    data: items,
    meta,
    timestamp: responseData.timestamp ?? new Date().toISOString(),
  };
};

export const markAllNotificationsAsRead =
  async (): Promise<NotificationMutationResponse> => {
    const response = await api.patch<WrappedResponse<NotificationItem | null>>(
      "/notifications/read-all",
    );
    const responseData = response.data;
    return {
      success: responseData.success ?? true,
      statusCode: responseData.statusCode ?? 200,
      message: responseData.message ?? "All notifications marked as read.",
      data: unwrapItem(responseData),
      timestamp: responseData.timestamp ?? new Date().toISOString(),
    };
  };

export const markNotificationAsRead = async (
  id: string,
): Promise<NotificationMutationResponse> => {
  const response = await api.patch<WrappedResponse<NotificationItem | null>>(
    `/notifications/${id}/read`,
  );
  const responseData = response.data;
  return {
    success: responseData.success ?? true,
    statusCode: responseData.statusCode ?? 200,
    message: responseData.message ?? "Notification marked as read.",
    data: unwrapItem(responseData),
    timestamp: responseData.timestamp ?? new Date().toISOString(),
  };
};
