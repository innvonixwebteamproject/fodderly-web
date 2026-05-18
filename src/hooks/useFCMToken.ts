import { useCallback, useEffect, useRef, useState } from "react";
import { getToken, isSupported } from "firebase/messaging";
import { messaging, VAPID_KEY } from "@/firebase";

interface UseFCMTokenReturn {
  fcmToken: string | null;
  permissionStatus: NotificationPermission | null;
  error: string | null;
  isLoading: boolean;
}

/**
 * Reusable hook for Firebase Cloud Messaging token generation.
 *
 * On mount:
 *  1. Checks if browser supports notifications & FCM.
 *  2. If permission is 'default', requests permission via browser popup.
 *  3. If permission is 'granted', registers the service worker and generates an FCM token.
 *  4. Stores the token in state (also persisted to localStorage as fallback).
 *
 * Returns { fcmToken, permissionStatus, error, isLoading }
 */
export function useFCMToken(): UseFCMTokenReturn {
  const [fcmToken, setFcmToken] = useState<string | null>(() => {
    // Hydrate from localStorage if a token was previously generated
    try {
      return localStorage.getItem("fcm_token");
    } catch {
      return null;
    }
  });
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Guard against duplicate generation
  const isGenerating = useRef(false);

  const generateToken = useCallback(async () => {
    if (isGenerating.current) return;
    isGenerating.current = true;
    setIsLoading(true);
    setError(null);

    try {
      // 1. Check browser support
      if (typeof window === "undefined" || !("Notification" in window)) {
        setError("Browser does not support notifications.");
        return;
      }

      // 2. Check Firebase Messaging support
      const supported = await isSupported();
      if (!supported) {
        setError("Firebase Messaging is not supported in this browser.");
        return;
      }

      // 3. Check / request permission
      let permission = Notification.permission;
      setPermissionStatus(permission);

      if (permission === "default") {
        permission = await Notification.requestPermission();
        setPermissionStatus(permission);
      }

      if (permission === "denied") {
        setError("Notification permission denied by user.");
        return;
      }

      if (permission !== "granted") {
        return;
      }

      // 4. Ensure messaging instance is ready
      if (!messaging) {
        // messaging may not be initialized yet if isSupported() resolved late
        // wait a tick and retry once
        await new Promise((resolve) => setTimeout(resolve, 500));
        if (!messaging) {
          setError("Firebase Messaging failed to initialize. Check console for details.");
          console.error(
            "useFCMToken: Firebase Messaging not available. This may be due to:"
          );
          console.error(
            "1. Firebase config not properly loaded from environment variables"
          );
          console.error("2. Browser does not support Messaging API");
          console.error("3. Service Worker registration failed");
          return;
        }
      }

      // 5. Register service worker for push
      const swRegistration = await navigator.serviceWorker.register(
        "/firebase-messaging-sw.js"
      );
      console.log("Service Worker registered:", swRegistration);

      // 6. Generate FCM token
      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: swRegistration,
      });
      console.log("FCM Token generated:", token ? "✓ Success" : "✗ Failed");

      if (token) {
        setFcmToken(token);
        try {
          localStorage.setItem("fcm_token", token);
          console.log("FCM Token saved to localStorage");
        } catch {
          // localStorage may be unavailable in some contexts
          console.warn("Could not save FCM token to localStorage");
        }
      } else {
        setError("Failed to generate FCM token. No token returned.");
        console.error(
          "useFCMToken: No token returned. This may be due to:"
        );
        console.error("1. VAPID key is invalid or missing");
        console.error("2. Service Worker failed to register properly");
        console.error("3. Browser privacy settings blocking notifications");
      }
    } catch (err) {
      console.error("useFCMToken: Error generating FCM token:", err);
      setError(err instanceof Error ? err.message : "Unknown error generating FCM token.");
    } finally {
      setIsLoading(false);
      isGenerating.current = false;
    }
  }, []);

  useEffect(() => {
    generateToken();
  }, [generateToken]);

  return { fcmToken, permissionStatus, error, isLoading };
}
