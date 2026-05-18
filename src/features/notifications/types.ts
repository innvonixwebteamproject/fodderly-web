export type NotificationStatus = "read" | "unread";

export interface NotificationReceiver {
  status?: NotificationStatus;
  [key: string]: unknown;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  createdAt?: string;
  created_at?: string;
  isRead?: boolean;
  receiver?: NotificationReceiver;
  [key: string]: unknown;
}

export interface NotificationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface NotificationsApiResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: NotificationItem[];
  meta: NotificationMeta;
  timestamp: string;
}

export interface NotificationMutationResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: NotificationItem | null;
  timestamp: string;
}
