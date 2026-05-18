import { timeAgo } from "@/lib/helpers";

export const formatNotificationTime = (value: string) => {
  if (!value) return "Just now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";
  return timeAgo(date);
};
