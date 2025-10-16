/**
 * Service Worker for Push Notifications
 * Handles incoming push notifications and user interactions
 */

// Service Worker version - increment when updating
const CACHE_VERSION = 'v1';

// Listen for push events
self.addEventListener('push', (event) => {
    console.log('[Service Worker] Push received');

    let notificationData = {
        title: 'New Notification',
        body: 'You have a new notification',
        icon: '/icon-192.png',
        badge: '/badge-72.png',
        data: {
            url: '/',
        },
    };

    // Parse notification data if available
    if (event.data) {
        try {
            const data = event.data.json();
            notificationData = {
                title: data.title || notificationData.title,
                body: data.body || notificationData.body,
                icon: data.icon || notificationData.icon,
                badge: data.badge || notificationData.badge,
                tag: data.tag || 'notification',
                requireInteraction: data.requireInteraction || false,
                data: {
                    url: data.url || '/',
                    conversationId: data.conversationId,
                    ...data.data,
                },
            };
        } catch (error) {
            console.error('[Service Worker] Error parsing push data:', error);
        }
    }

    // Show the notification
    event.waitUntil(
        self.registration.showNotification(notificationData.title, {
            body: notificationData.body,
            icon: notificationData.icon,
            badge: notificationData.badge,
            tag: notificationData.tag,
            requireInteraction: notificationData.requireInteraction,
            data: notificationData.data,
            vibrate: [200, 100, 200], // Vibration pattern
            actions: [
                {
                    action: 'open',
                    title: 'Open',
                },
                {
                    action: 'close',
                    title: 'Close',
                },
            ],
        })
    );
});

// Listen for notification click events
self.addEventListener('notificationclick', (event) => {
    console.log('[Service Worker] Notification clicked');

    event.notification.close();

    if (event.action === 'close') {
        // User clicked close, do nothing
        return;
    }

    // Get the URL to open
    const urlToOpen = event.notification.data?.url || '/';

    // Open or focus the app
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // Check if there's already a window open
            for (const client of clientList) {
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }

            // No window open, open a new one
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});

// Listen for push subscription change
self.addEventListener('pushsubscriptionchange', (event) => {
    console.log('[Service Worker] Push subscription changed');

    event.waitUntil(
        self.registration.pushManager
            .subscribe({
                userVisibleOnly: true,
                applicationServerKey: self.registration.pushManager.applicationServerKey,
            })
            .then((subscription) => {
                console.log('[Service Worker] Subscription renewed');
                // TODO: Send new subscription to server
                return fetch('/api/push/subscribe', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        subscription: subscription.toJSON(),
                    }),
                });
            })
    );
});

// Service worker activation
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activated');
    event.waitUntil(clients.claim());
});

// Service worker installation
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installed');
    self.skipWaiting();
});

// Background sync for offline messages (future enhancement)
self.addEventListener('sync', (event) => {
    console.log('[Service Worker] Background sync:', event.tag);

    if (event.tag === 'sync-messages') {
        event.waitUntil(
            // TODO: Implement message sync
            Promise.resolve()
        );
    }
});
