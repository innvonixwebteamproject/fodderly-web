export type NotificationStatus = "read" | "unread";

export interface NotificationReceiver {
  status?: NotificationStatus;
  [key: string]: unknown;
}

export interface NotificationData {
  order_id?: string;
  user_order_id?: string;
  farmer_name?: string;
  template_code?: string;
  redirection_link?: string;
  [key: string]: unknown;
}

export interface NotificationItem {
  id: string;
  title: string;
  message?: string;
  body?: string;
  createdAt?: string;
  created_at?: string;
  isRead?: boolean;
  is_read?: boolean;
  event_type?: string;
  data?: NotificationData | null;
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
  unread?: number;
  read?: number;
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
