/**
 * firebase.ts
 *
 * This file only re-exports Firebase utilities.
 * Actual initialization is handled by NotificationService (singleton).
 * DO NOT call initializeApp / getMessaging here – it causes race conditions
 * with the NotificationService which manages the full lifecycle.
 */

import {
  onMessage as onMessageListener,
  getToken,
} from "firebase/messaging";

// VAPID key for push notification token generation
export const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

if (!VAPID_KEY) {
  console.error("VAPID_KEY is not set in environment variables");
}

/**
 * `messaging` is no longer exported from this file.
 * Use `getNotificationService()` from @/services/NotificationService instead.
 * Legacy consumers that import `messaging` will get `null`.
 */
const messaging = null;

export { messaging, onMessageListener, getToken };
