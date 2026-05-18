import { messaging } from "./firebase";
import { toast } from "sonner";
import { onMessage, MessagePayload } from "firebase/messaging";
import React from "react";

/**
 * Legacy function - kept for backward compatibility
 * The enterprise notification system is now handled by NotificationManager
 */
export const handleForegroundNotifications = (): void => {
  if (!messaging) {
    console.warn(
      "[Notification] Firebase Messaging not initialized. Check Firebase config and ensure browser supports it."
    );
    return;
  }

  try {
    onMessage(messaging, (payload: MessagePayload) => {
      console.log("[Notification] 📬 Foreground message received:", payload);

      const title = payload.notification?.title || "Notification";
      const body = payload.notification?.body || "";

      // Show toast notification
      toast.success(
        React.createElement(
          "div",
          { className: "flex flex-col gap-2" },
          React.createElement(
            "h4",
            { style: { fontWeight: "bold", marginBottom: "0.5rem" } },
            title
          ),
          React.createElement("p", { style: { margin: 0, fontSize: "0.875rem" } }, body),
          payload.data &&
            Object.keys(payload.data).length > 0 &&
            React.createElement(
              "details",
              { style: { fontSize: "0.75rem", marginTop: "0.5rem", cursor: "pointer" } },
              React.createElement("summary", { style: { fontWeight: 500 } }, "Details"),
              React.createElement(
                "pre",
                {
                  style: {
                    marginTop: "0.25rem",
                    fontSize: "0.75rem",
                    padding: "0.25rem",
                    borderRadius: "0.375rem",
                    maxHeight: "128px",
                    overflow: "auto",
                  },
                },
                JSON.stringify(payload.data, null, 2)
              )
            )
        ),
        {
          position: "top-right",
          dismissible: true,
          duration: 8000,
          closeButton: true,
        }
      );
    });

    console.log("[Notification] ✅ Foreground notification listener registered successfully");
  } catch (error) {
    console.error("[Notification] ❌ Error setting up foreground notifications:", error);
  }
};

