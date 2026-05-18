/* eslint-disable no-undef */

// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/9.6.11/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.6.11/firebase-messaging-compat.js');

console.log('[Service Worker] Script loaded and starting initialization...');

// Firebase configuration - MUST MATCH your main app config
// DO NOT change these values without updating VITE_FIREBASE_* env vars
const firebaseConfig = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
  measurementId: '',
};

// Initialize Firebase in Service Worker context
// try {
//   firebase.initializeApp(firebaseConfig);
//   console.log('[Service Worker] Firebase initialized successfully');
// } catch (error) {
//   console.error('[Service Worker] Firebase initialization error:', error);
// }

// const messaging = firebase.messaging();
// console.log('[Service Worker] Firebase Messaging instance created');

// /**
//  * Handle background push notifications (when app is closed or in background)
//  * This is the primary handler for push notifications outside the app
//  */
// messaging.onBackgroundMessage((payload) => {
//   console.log('[Service Worker] 📬 Background message received:', {
//     title: payload.notification?.title,
//     body: payload.notification?.body,
//     data: payload.data,
//   });

//   const notificationTitle = payload.notification?.title || 'New Notification';
//   const notificationOptions = {
//     body: payload.notification?.body || 'You have a new message',
//     icon: '/media/app/favicon.ico',
//     badge: '/media/app/favicon.ico',
//     tag: 'notification', // Group notifications with same tag
//     requireInteraction: false, // Auto-dismiss after browser timeout
//     data: {
//       dateOfArrival: Date.now(),
//       primaryKey: 1,
//       ...payload.data,
//     },
//   };

//   // Show the notification
//   console.log('[Service Worker] 🔔 Showing notification:', notificationTitle);
//   self.registration.showNotification(notificationTitle, notificationOptions);
// });

/**
 * Handle notification clicks (when user clicks on notification in system tray)
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] 👆 Notification clicked:', event.notification.tag);
  
  // Close the notification
  event.notification.close();

  // Send message to open window or open new window
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Try to focus existing window
        for (const client of clientList) {
          if (client.url && 'focus' in client) {
            console.log('[Service Worker] ✅ Focusing existing window:', client.url);
            
            // Send notification click event to the window
            client.postMessage({
              type: 'NOTIFICATION_CLICK',
              payload: event.notification,
            });
            
            return client.focus();
          }
        }
        
        // No existing window found, open new one
        if (self.clients.openWindow) {
          console.log('[Service Worker] 📱 Opening new window');
          return self.clients.openWindow('/');
        }
      })
      .catch((error) => {
        console.error('[Service Worker] Error in notification click handler:', error);
      })
  );
});

/**
 * Handle notification close events
 */
self.addEventListener('notificationclose', (event) => {
  console.log('[Service Worker] ❌ Notification dismissed:', event.notification.tag);
});

/**
 * Handle messages from the main app
 */
self.addEventListener('message', (event) => {
  console.log('[Service Worker] 📨 Message received from client:', event.data.type);
  
  if (event.data.type === 'INIT_FCM') {
    console.log('[Service Worker] FCM initialization signal received');
  }
});

/**
 * Install event - cache essential files
 */
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  self.skipWaiting();
});

/**
 * Activate event - cleanup old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(self.clients.claim());
});

/**
 * Periodic background sync (optional - for syncing notifications)
 */
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Sync event:', event.tag);
});

console.log('[Service Worker] ✅ Service Worker setup complete - ready to handle push notifications');
