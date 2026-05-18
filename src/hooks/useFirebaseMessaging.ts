/**
 * useFirebaseMessaging.ts
 * 
 * React hook for Firebase Cloud Messaging integration
 * 
 * Features:
 * - Automatic initialization on mount
 * - State subscription with automatic cleanup
 * - Token generation callback
 * - Permission request helper
 * - Type-safe state
 * 
 * Usage:
 * ```tsx
 * const { token, isLoading, requestPermissionAndToken } = useFirebaseMessaging();
 * 
 * // In login handler:
 * const fcmToken = await requestPermissionAndToken();
 * loginApi({ email, password, fcmToken });
 * ```
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { 
  getNotificationService, 
  type NotificationServiceState,
  type FCMConfig 
} from "@/services/NotificationService";

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Get FCM configuration from environment variables
 */
const getFCMConfig = (): FCMConfig => ({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "",
  vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY || "",
});

// ============================================================================
// HOOK TYPES
// ============================================================================

export interface UseFirebaseMessagingOptions {
  /**
   * Auto-initialize on mount (default: true)
   */
  autoInit?: boolean;
  
  /**
   * Auto-request permission on mount (default: false)
   * Only takes effect if autoInit is true
   */
  autoRequestPermission?: boolean;
  
  /**
   * Auto-generate token on mount if permission already granted (default: true)
   */
  autoGenerateToken?: boolean;
}

export interface UseFirebaseMessagingReturn {
  // State
  state: NotificationServiceState;
  token: string | null;
  isLoading: boolean;
  isInitialized: boolean;
  isSupported: boolean;
  permissionState: NotificationServiceState["permissionState"];
  error: string | null;
  
  // Actions
  initialize: () => Promise<boolean>;
  requestPermission: () => Promise<boolean>;
  generateToken: () => Promise<string | null>;
  requestPermissionAndToken: () => Promise<string | null>;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useFirebaseMessaging(
  options: UseFirebaseMessagingOptions = {}
): UseFirebaseMessagingReturn {
  const {
    autoInit = true,
    autoRequestPermission = false,
    autoGenerateToken = true,
  } = options;

  // Get service instance
  const service = getNotificationService();
  
  // Local state synced with service
  const [state, setState] = useState<NotificationServiceState>(service.getState());
  
  // Track if initial setup is complete
  const initializedRef = useRef(false);

  // Subscribe to service state changes
  useEffect(() => {
    const unsubscribe = service.subscribe((newState) => {
      setState(newState);
    });

    return unsubscribe;
  }, [service]);

  // Auto-initialization effect
  useEffect(() => {
    if (!autoInit || initializedRef.current) {
      return;
    }

    const initFlow = async () => {
      initializedRef.current = true;
      
      const config = getFCMConfig();
      const initialized = await service.initialize(config);
      
      if (!initialized) {
        return;
      }

      // Auto-request permission if enabled
      if (autoRequestPermission) {
        await service.requestPermission();
      }

      // Auto-generate token if permission already granted
      if (autoGenerateToken && service.hasPermission()) {
        await service.generateToken();
      }
    };

    initFlow();
  }, [autoInit, autoRequestPermission, autoGenerateToken, service]);

  // Action: Initialize
  const initialize = useCallback(async (): Promise<boolean> => {
    const config = getFCMConfig();
    return service.initialize(config);
  }, [service]);

  // Action: Request permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    return service.requestPermission();
  }, [service]);

  // Action: Generate token
  const generateToken = useCallback(async (): Promise<string | null> => {
    return service.generateToken();
  }, [service]);

  // Action: Combined permission + token flow (for login)
  const requestPermissionAndToken = useCallback(async (): Promise<string | null> => {
    // Ensure initialized
    if (!state.isInitialized) {
      const initialized = await initialize();
      if (!initialized) {
        return null;
      }
    }

    // Check if already have token
    const existingToken = service.getToken();
    if (existingToken) {
      return existingToken;
    }

    // Request permission
    const hasPermission = await service.requestPermission();
    if (!hasPermission) {
      return null;
    }

    // Generate token
    const token = await service.generateToken();
    return token;
  }, [state.isInitialized, initialize, service]);

  return {
    // State
    state,
    token: state.token,
    isLoading: state.isLoading,
    isInitialized: state.isInitialized,
    isSupported: state.isSupported,
    permissionState: state.permissionState,
    error: state.error,
    
    // Actions
    initialize,
    requestPermission,
    generateToken,
    requestPermissionAndToken,
  };
}

// Default export
export default useFirebaseMessaging;
