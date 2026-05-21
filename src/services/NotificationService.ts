/**
 * NotificationService.ts
 *
 * Enterprise-grade Firebase Cloud Messaging (FCM) Service
 *
 * Features:
 * - Singleton pattern for consistent state
 * - Modular Firebase SDK (v9+)
 * - Proper permission flow with all states handled
 * - Token lifecycle management with refresh handling
 * - Detailed debug logging
 * - Graceful degradation when notifications unavailable
 * - Clean error handling for all FCM error codes
 * - Memory-leak free with proper cleanup
 *
 * @author Senior React + Firebase FCM Architect
 * @version 2.0.0
 */

import { initializeApp, type FirebaseApp, getApps } from "firebase/app";
import {
  getMessaging,
  getToken,
  onMessage,
  type Messaging,
  isSupported,
  type MessagePayload,
} from "firebase/messaging";
import { toast } from "sonner";
import React from "react";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type PermissionState = "granted" | "denied" | "default" | "unsupported";

export interface NotificationServiceState {
  isInitialized: boolean;
  isSupported: boolean;
  permissionState: PermissionState;
  token: string | null;
  error: string | null;
  isLoading: boolean;
}

export interface FCMConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
  vapidKey: string;
}

type StateListener = (state: NotificationServiceState) => void;

// ============================================================================
// CONSTANTS
// ============================================================================

const STORAGE_KEY = "fcm_token";
const SERVICE_WORKER_PATH = "/firebase-messaging-sw.js";
const LOG_PREFIX = "[NotificationService]";

/** Custom event name: dispatch when a new FCM message is received so UI can refetch notification list */
export const FCM_NOTIFICATION_RECEIVED_EVENT = "fcm-notification-received";

// Error codes reference: https://firebase.google.com/docs/cloud-messaging/js/receive
const FCM_ERROR_MESSAGES: Record<string, string> = {
  "messaging/permission-blocked":
    "Notification permission is blocked in browser settings",
  "messaging/unsupported-browser":
    "This browser does not support push notifications",
  "messaging/failed-service-worker-registration":
    "Service Worker registration failed",
  "messaging/token-subscribe-failed":
    "Failed to subscribe to push notifications",
  "messaging/token-unsubscribe-failed":
    "Failed to unsubscribe from push notifications",
  "messaging/invalid-vapid-key": "Invalid VAPID key configuration",
  "messaging/permission-default": "Notification permission not yet requested",
};

// ============================================================================
// NOTIFICATION SERVICE CLASS
// ============================================================================

class NotificationService {
  private static instance: NotificationService | null = null;

  // Firebase instances
  private app: FirebaseApp | null = null;
  private messaging: Messaging | null = null;

  // State
  private state: NotificationServiceState = {
    isInitialized: false,
    isSupported: false,
    permissionState: "default",
    token: null,
    error: null,
    isLoading: false,
  };

  // Listeners for state changes
  private listeners: Set<StateListener> = new Set();

  // Foreground message unsubscribe function
  private unsubscribeFromMessages: (() => void) | null = null;

  // Configuration
  private config: FCMConfig | null = null;

  // Initialization promise to prevent duplicate init
  private initPromise: Promise<boolean> | null = null;

  // Cached service worker registration (set during initialization)
  private swRegistration: ServiceWorkerRegistration | null = null;

  // -------------------------------------------------------------------------
  // SINGLETON PATTERN
  // -------------------------------------------------------------------------

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Reset the singleton instance (useful for testing)
   */
  static resetInstance(): void {
    if (NotificationService.instance) {
      NotificationService.instance.cleanup();
      NotificationService.instance = null;
    }
  }

  // -------------------------------------------------------------------------
  // LOGGING
  // -------------------------------------------------------------------------

  private log(message: string, data?: unknown): void {
    // Always log in development; in production only errors/warnings are logged
    if (import.meta.env.DEV) {
      if (data !== undefined) {
        console.log(`${LOG_PREFIX} ${message}`, data);
      } else {
        console.log(`${LOG_PREFIX} ${message}`);
      }
    }
  }

  private logError(message: string, error?: unknown): void {
    console.error(`${LOG_PREFIX} ❌ ${message}`, error);
  }

  private logWarn(message: string, data?: unknown): void {
    if (data !== undefined) {
      console.warn(`${LOG_PREFIX} ⚠️ ${message}`, data);
    } else {
      console.warn(`${LOG_PREFIX} ⚠️ ${message}`);
    }
  }

  // -------------------------------------------------------------------------
  // STATE MANAGEMENT
  // -------------------------------------------------------------------------

  private setState(partial: Partial<NotificationServiceState>): void {
    this.state = { ...this.state, ...partial };
    this.notifyListeners();
  }

  getState(): NotificationServiceState {
    return { ...this.state };
  }

  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    // Immediately call with current state
    listener(this.getState());

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    const currentState = this.getState();
    this.listeners.forEach((listener) => {
      try {
        listener(currentState);
      } catch {
        // Silently ignore listener errors
      }
    });
  }

  // -------------------------------------------------------------------------
  // INITIALIZATION
  // -------------------------------------------------------------------------

  /**
   * Initialize the notification service
   * Should be called once on app startup
   */
  async initialize(config: FCMConfig): Promise<boolean> {
    // Return existing promise if already initializing
    if (this.initPromise) {
      this.log("Initialization already in progress, waiting...");
      return this.initPromise;
    }

    // Return immediately if already initialized
    if (this.state.isInitialized) {
      this.log("Already initialized");
      return true;
    }

    this.initPromise = this._initialize(config);
    return this.initPromise;
  }

  private async _initialize(config: FCMConfig): Promise<boolean> {
    this.setState({ isLoading: true, error: null });
    this.config = config;

    try {
      console.log(`${LOG_PREFIX} Starting initialization...`);

      // Step 1: Check browser support
      if (!this.checkBrowserSupport()) {
        console.warn(`${LOG_PREFIX} Browser support check failed`);
        return false;
      }
      console.log(`${LOG_PREFIX} ✅ Browser supports notifications`);

      // Step 2: Check Firebase Messaging support
      const fcmSupported = await this.checkFCMSupport();
      if (!fcmSupported) {
        console.warn(`${LOG_PREFIX} FCM support check failed`);
        return false;
      }
      console.log(`${LOG_PREFIX} ✅ FCM is supported`);

      // Step 3: Initialize Firebase app
      if (!this.initializeFirebaseApp(config)) {
        console.error(`${LOG_PREFIX} Firebase app initialization failed`);
        return false;
      }
      console.log(`${LOG_PREFIX} ✅ Firebase app initialized`);

      // Step 4: Initialize Firebase Messaging
      if (!this.initializeMessaging()) {
        console.error(`${LOG_PREFIX} Firebase Messaging initialization failed`);
        return false;
      }
      console.log(`${LOG_PREFIX} ✅ Firebase Messaging initialized`);

      // Step 5: Check current permission state
      this.checkPermissionState();
      console.log(
        `${LOG_PREFIX} Current permission state: ${Notification.permission}`,
      );

      // Step 6: Register service worker
      await this.registerServiceWorker();

      this.setState({ isInitialized: true, isLoading: false });
      console.log(`${LOG_PREFIX} ✅ Initialization complete`);
      return true;
    } catch (error) {
      const errorMessage = this.parseError(error);
      this.setState({ error: errorMessage, isLoading: false });
      this.logError("Initialization failed", error);
      return false;
    } finally {
      this.initPromise = null;
    }
  }

  private checkBrowserSupport(): boolean {
    // Check for server-side rendering
    if (typeof window === "undefined") {
      this.logWarn("Server-side environment detected");
      this.setState({
        isSupported: false,
        permissionState: "unsupported",
        error: "Server-side environment",
      });
      return false;
    }

    // Check Secure Context (HTTPS or localhost)
    if (!window.isSecureContext && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
      this.logWarn("Insecure context detected! Browser blocks Push Notifications on HTTP IP addresses.");
      this.setState({
        isSupported: false,
        permissionState: "unsupported",
        error: "Push notifications require a secure context (HTTPS) or localhost. Modern browsers block notifications on HTTP IP addresses.",
      });
      return false;
    }

    // Check Notification API
    if (!("Notification" in window)) {
      this.logWarn("Notification API not supported");
      this.setState({
        isSupported: false,
        permissionState: "unsupported",
        error: "Browser does not support notifications",
      });
      return false;
    }

    // Check Service Worker API
    if (!("serviceWorker" in navigator)) {
      this.logWarn("Service Worker not supported");
      this.setState({
        isSupported: false,
        permissionState: "unsupported",
        error: "Browser does not support service workers",
      });
      return false;
    }

    // Check Push API
    if (!("PushManager" in window)) {
      this.logWarn("Push API not supported");
      this.setState({
        isSupported: false,
        permissionState: "unsupported",
        error: "Browser does not support push notifications",
      });
      return false;
    }

    return true;
  }

  private async checkFCMSupport(): Promise<boolean> {
    try {
      const supported = await isSupported();
      this.setState({ isSupported: supported });

      if (!supported) {
        this.logWarn("Firebase Messaging not supported in this browser");
        this.setState({
          permissionState: "unsupported",
          error: "Firebase Messaging not supported",
        });
        return false;
      }

      return true;
    } catch (error) {
      this.logError("Error checking FCM support", error);
      this.setState({ isSupported: false });
      return false;
    }
  }

  private initializeFirebaseApp(config: FCMConfig): boolean {
    try {
      // Check if Firebase app already exists
      const existingApps = getApps();
      if (existingApps.length > 0) {
        this.app = existingApps[0];
      } else {
        // Initialize new Firebase app
        this.app = initializeApp({
          apiKey: config.apiKey,
          authDomain: config.authDomain,
          projectId: config.projectId,
          storageBucket: config.storageBucket,
          messagingSenderId: config.messagingSenderId,
          appId: config.appId,
          measurementId: config.measurementId,
        });
      }

      this.log("Firebase config status", {
        hasApiKey: !!config.apiKey,
        hasProjectId: !!config.projectId,
        hasMessagingSenderId: !!config.messagingSenderId,
        hasAppId: !!config.appId,
        hasVapidKey: !!config.vapidKey,
      });

      return true;
    } catch (error) {
      this.logError("Firebase app initialization failed", error);
      this.setState({ error: "Firebase initialization failed" });
      return false;
    }
  }

  private initializeMessaging(): boolean {
    if (!this.app) {
      this.logError(
        "Cannot initialize messaging: Firebase app not initialized",
      );
      return false;
    }

    try {
      this.messaging = getMessaging(this.app);
      return true;
    } catch (error) {
      this.logError("Firebase Messaging initialization failed", error);
      this.setState({ error: "Messaging initialization failed" });
      return false;
    }
  }

  private checkPermissionState(): void {
    const permission = Notification.permission;
    this.setState({ permissionState: permission as PermissionState });
    // Clear cached SW registration when permission is not granted so we don't pass
    // a stale/invalid registration to Firebase after user resets permission and re-allows
    if (permission !== "granted") {
      this.swRegistration = null;
    }
  }

  private async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    try {
      console.log(`${LOG_PREFIX} Registering service worker...`);
      const registration = await navigator.serviceWorker.register(
        SERVICE_WORKER_PATH,
        { scope: "/" },
      );

      // Always wait for navigator.serviceWorker.ready first
      // This ensures registration.active is populated
      console.log(`${LOG_PREFIX} Waiting for service worker to be ready...`);
      await navigator.serviceWorker.ready;

      // Verify .active is now available
      let attempts = 0;
      while (!registration.active && attempts < 10) {
        console.log(
          `${LOG_PREFIX} Waiting for registration.active (attempt ${attempts + 1}/10)...`,
        );
        await new Promise((resolve) => setTimeout(resolve, 100));
        attempts++;
      }

      if (registration.active) {
        console.log(`${LOG_PREFIX} ✅ Service worker registered and active`);
        this.swRegistration = registration;
        return registration;
      } else {
        console.warn(
          `${LOG_PREFIX} ⚠️ Service worker registered but .active is still undefined after waiting`,
        );
        this.swRegistration = registration;
        return registration; // Return anyway; it might become active soon
      }
    } catch (error) {
      this.logError("Service worker registration failed", error);
      // Don't fail initialization, just log the error
      return null;
    }
  }

  // -------------------------------------------------------------------------
  // PERMISSION HANDLING
  // -------------------------------------------------------------------------

  /**
   * Request notification permission from the user
   * Returns true if permission was granted
   */
  async requestPermission(): Promise<boolean> {
    // Check current state first
    if (this.state.permissionState === "unsupported") {
      this.logWarn("Notifications not supported");
      return false;
    }

    if (this.state.permissionState === "granted") {
      return true;
    }

    if (this.state.permissionState === "denied") {
      this.logWarn("Permission denied by user");
      this.setState({
        error:
          "Notifications are blocked. Please enable them in browser settings.",
      });
      return false;
    }

    // Request permission (only for "default" state)
    try {
      console.log(
        `${LOG_PREFIX} 🔔 Requesting notification permission from browser...`,
      );
      this.setState({ isLoading: true });
      const permission = await Notification.requestPermission();
      console.log(`${LOG_PREFIX} Permission result: ${permission}`);
      this.setState({
        permissionState: permission as PermissionState,
        isLoading: false,
      });

      if (permission === "granted") {
        // Clear cached SW so generateToken() gets a fresh registration and avoids
        // Firebase "pushManager" undefined error after permission was reset and re-granted
        this.swRegistration = null;
        return true;
      } else if (permission === "denied") {
        this.logWarn("Notification permission denied by user");
        return false;
      } else {
        return false;
      }
    } catch (error) {
      this.logError("Error requesting permission", error);
      this.setState({ isLoading: false });
      return false;
    }
  }

  // -------------------------------------------------------------------------
  // TOKEN MANAGEMENT
  // -------------------------------------------------------------------------

  /**
   * Generate FCM token
   * Only works if permission is granted
   * Returns null if permission not granted or on error
   */
  async generateToken(): Promise<string | null> {
    // Validate prerequisites
    if (!this.state.isInitialized) {
      this.logWarn("Service not initialized");
      return null;
    }

    if (!this.messaging) {
      this.logError("Messaging instance not available");
      return null;
    }

    if (!this.config?.vapidKey) {
      this.logError("VAPID key not configured");
      this.setState({ error: "VAPID key not configured" });
      return null;
    }

    // Check permission
    if (this.state.permissionState !== "granted") {
      return null;
    }

    try {
      this.setState({ isLoading: true, error: null });

      // Always get a fresh registration for token generation. Do not use cached
      // swRegistration here: after permission reset the cached reference can be
      // invalid and Firebase will throw "Cannot read properties of undefined (reading 'pushManager')".
      let swRegistration = await this.getServiceWorkerRegistration();
      if (!swRegistration) {
        swRegistration = await this.registerServiceWorker();
      }

      if (!swRegistration) {
        throw new Error("Service worker not registered");
      }

      // Ensure .active is available before passing to Firebase
      // Firebase SDK needs registration.active and registration.pushManager to exist
      if (!swRegistration.active) {
        console.warn(
          `${LOG_PREFIX} ⚠️ registration.active is undefined, waiting...`,
        );
        for (let i = 0; i < 10; i++) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          if (swRegistration.active) {
            console.log(
              `${LOG_PREFIX} ✅ registration.active is now available`,
            );
            break;
          }
        }
      }

      if (!swRegistration.active) {
        throw new Error(
          "Service worker is not in active state. This may be due to browser cache or extension interference. Please hard-refresh the page (Ctrl+Shift+R)",
        );
      }

      // Guard: Firebase token-manager accesses registration.pushManager; ensure it exists
      if (!swRegistration.pushManager) {
        this.swRegistration = null;
        throw new Error(
          "Service worker registration has no pushManager. Try hard-refresh (Ctrl+Shift+R) or re-enable notifications.",
        );
      }

      console.log(
        `${LOG_PREFIX} Generating FCM token with active service worker...`,
      );
      const token = await getToken(this.messaging, {
        vapidKey: this.config.vapidKey,
        serviceWorkerRegistration: swRegistration,
      });

      if (token) {
        this.setState({ token, isLoading: false });
        this.saveTokenToStorage(token);

        this.log("Token generated successfully");

        // Setup foreground notifications after token is generated
        this.setupForegroundNotifications();

        return token;
      } else {
        this.logWarn("No token returned from Firebase");
        this.setState({ isLoading: false });
        return null;
      }
    } catch (error) {
      const errorMessage = this.parseError(error);
      this.logError("Token generation failed", error);
      this.setState({ error: errorMessage, isLoading: false });
      return null;
    }
  }

  /**
   * Get token from storage if available
   */
  getStoredToken(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  }

  private saveTokenToStorage(token: string): void {
    try {
      localStorage.setItem(STORAGE_KEY, token);
    } catch (error) {
      this.logWarn("Failed to save token to storage", error);
    }
  }

  /**
   * Clear token from storage (for logout scenarios)
   */
  clearTokenFromStorage(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
      this.setState({ token: null });
    } catch {
      // Ignore storage errors
    }
  }

  private async getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
    try {
      // First try to get the ready registration (most reliable)
      const readyReg = await navigator.serviceWorker.ready;
      if (readyReg?.active) {
        console.log(
          `${LOG_PREFIX} Got active SW from navigator.serviceWorker.ready`,
        );
        return readyReg;
      }

      // Fallback: find by script URL
      const registrations = await navigator.serviceWorker.getRegistrations();

      // Find the FCM service worker
      const swRegistration = registrations.find((reg) =>
        reg.active?.scriptURL.includes("firebase-messaging-sw.js"),
      );

      if (swRegistration && swRegistration.active) {
        console.log(`${LOG_PREFIX} Found FCM service worker registration`);
        return swRegistration;
      }

      // Last resort: return any registration with an active worker
      const anyRegistration = registrations.find((reg) => reg.active);
      if (anyRegistration) {
        console.log(`${LOG_PREFIX} Using any available active service worker`);
        return anyRegistration;
      }

      console.warn(`${LOG_PREFIX} ⚠️ No active service worker found`);
      return null;
    } catch (error) {
      this.logError("Error getting service worker registration", error);
      return null;
    }
  }

  // -------------------------------------------------------------------------
  // FOREGROUND NOTIFICATIONS
  // -------------------------------------------------------------------------

  private setupForegroundNotifications(): void {
    if (!this.messaging) {
      this.logWarn(
        "Cannot setup foreground notifications: messaging not available",
      );
      return;
    }

    // Cleanup existing listener
    if (this.unsubscribeFromMessages) {
      this.unsubscribeFromMessages();
    }

    this.unsubscribeFromMessages = onMessage(
      this.messaging,
      (payload: MessagePayload) => {
        this.handleForegroundMessage(payload);
      },
    );
  }

  private handleForegroundMessage(payload: MessagePayload): void {
    const title = payload.notification?.title || "New Notification";
    const body = payload.notification?.body || "";
    const image = payload.notification?.image;
    const link = payload.fcmOptions?.link;

    // Note: Native browser notifications are only shown by the service worker
    // when the app is in the background. In foreground, we show the in-app toast below.

    // Create a custom styled notification toast with gradient background
    toast.custom(
      (id) =>
        React.createElement(
          "div",
          {
            className: "flex items-start gap-3 w-full p-4 rounded-lg relative",
            style: {
              background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              color: "white",
              boxShadow: "0 20px 25px -5px rgba(59, 130, 246, 0.3)",
            },
          },
          // Close button
          React.createElement(
            "button",
            {
              className:
                "absolute top-2 right-2 w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors",
              onClick: (e: React.MouseEvent) => {
                e.stopPropagation();
                toast.dismiss(id);
              },
              "aria-label": "Close notification",
            },
            React.createElement(
              "svg",
              {
                xmlns: "http://www.w3.org/2000/svg",
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                strokeWidth: "2",
                strokeLinecap: "round" as const,
                strokeLinejoin: "round" as const,
                className: "w-4 h-4 text-white",
              },
              React.createElement("line", {
                x1: "18",
                y1: "6",
                x2: "6",
                y2: "18",
              }),
              React.createElement("line", {
                x1: "6",
                y1: "6",
                x2: "18",
                y2: "18",
              }),
            ),
          ),
          // Content wrapper (clickable area)
          React.createElement(
            "div",
            {
              className: "flex items-start gap-3 flex-1 cursor-pointer",
              onClick: () => {
                if (link) {
                  window.location.href = link;
                }
                toast.dismiss(id);
              },
            },
            // Icon / Image
            image
              ? React.createElement("img", {
                  src: image,
                  alt: "",
                  className:
                    "w-10 h-10 rounded-full object-cover flex-shrink-0 mt-0.5",
                })
              : React.createElement(
                  "div",
                  {
                    className:
                      "w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0",
                  },
                  React.createElement(
                    "svg",
                    {
                      xmlns: "http://www.w3.org/2000/svg",
                      viewBox: "0 0 24 24",
                      fill: "none",
                      stroke: "currentColor",
                      strokeWidth: "2",
                      strokeLinecap: "round" as const,
                      strokeLinejoin: "round" as const,
                      className: "w-5 h-5 text-white",
                    },
                    React.createElement("path", {
                      d: "M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9",
                    }),
                    React.createElement("path", {
                      d: "M10.3 21a1.94 1.94 0 0 0 3.4 0",
                    }),
                  ),
                ),
            // Content
            React.createElement(
              "div",
              { className: "flex-1 min-w-0" },
              React.createElement(
                "div",
                { className: "flex items-center justify-between gap-2 mb-1" },
                React.createElement(
                  "p",
                  {
                    className: "text-sm font-bold text-white truncate",
                  },
                  title,
                ),
              ),
              body &&
                React.createElement(
                  "p",
                  {
                    className: "text-sm text-white/90 line-clamp-2",
                  },
                  body,
                ),
            ),
          ),
        ),
      {
        duration: 6000,
        position: "top-right",
      },
    );

    // Notify app to refetch notification list from API so dropdown and list stay in sync
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent(FCM_NOTIFICATION_RECEIVED_EVENT, { detail: payload }),
      );
    }
  }

  // -------------------------------------------------------------------------
  // ERROR HANDLING
  // -------------------------------------------------------------------------

  private parseError(error: unknown): string {
    if (error instanceof Error) {
      // Check for known FCM error codes
      const errorCode = (error as { code?: string }).code;
      if (errorCode && FCM_ERROR_MESSAGES[errorCode]) {
        return FCM_ERROR_MESSAGES[errorCode];
      }
      return error.message;
    }
    return String(error);
  }

  // -------------------------------------------------------------------------
  // CLEANUP
  // -------------------------------------------------------------------------

  cleanup(): void {
    if (this.unsubscribeFromMessages) {
      this.unsubscribeFromMessages();
      this.unsubscribeFromMessages = null;
    }

    this.listeners.clear();
    this.swRegistration = null;
    this.setState({
      isInitialized: false,
      token: null,
      error: null,
      isLoading: false,
    });
  }

  // -------------------------------------------------------------------------
  // PUBLIC API HELPERS
  // -------------------------------------------------------------------------

  /**
   * Check if notifications are available and ready
   */
  isReady(): boolean {
    return this.state.isInitialized && this.state.isSupported;
  }

  /**
   * Check if user has granted permission
   */
  hasPermission(): boolean {
    return this.state.permissionState === "granted";
  }

  /**
   * Get current token (from state or storage)
   */
  getToken(): string | null {
    return this.state.token || this.getStoredToken();
  }

  /**
   * Full flow: Initialize, request permission, generate token
   * Convenience method for login flow
   */
  async initializeAndGetToken(config: FCMConfig): Promise<string | null> {
    // Step 1: Initialize
    const initialized = await this.initialize(config);
    if (!initialized) {
      this.logWarn("Initialization failed, cannot get token");
      return null;
    }

    // Step 2: Request permission
    const hasPermission = await this.requestPermission();
    if (!hasPermission) {
      this.log("Permission not granted, skipping token generation");
      return null;
    }

    // Step 3: Generate token
    const token = await this.generateToken();
    return token;
  }
}

// Export singleton instance getter
export const getNotificationService = (): NotificationService => {
  return NotificationService.getInstance();
};

// Export the class for type usage
export { NotificationService };

// Export default instance for convenience
export default NotificationService.getInstance();
