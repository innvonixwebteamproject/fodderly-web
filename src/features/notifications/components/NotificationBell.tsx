import { useInvalidateNotificationsOnFCM } from "../hooks";
import { NotificationDropdown } from "./NotificationDropdown";

export function NotificationBell() {
  useInvalidateNotificationsOnFCM();
  return <NotificationDropdown />;
}
