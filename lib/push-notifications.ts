/**
 * Push Notification Client Utility
 * 
 * Handles push notification registration, permission requests,
 * and subscription management on the client side
 */

import type { Id } from "@/convex/_generated/dataModel";

// VAPID public key - this will be set from environment variable
// Generate with: npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

/**
 * Convert VAPID public key from base64 to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
}

/**
 * Check if push notifications are supported
 */
export function isPushNotificationSupported(): boolean {
    if (typeof window === 'undefined') return false;

    return (
        'serviceWorker' in navigator &&
        'PushManager' in window &&
        'Notification' in window
    );
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
    if (!isPushNotificationSupported()) return 'denied';
    return Notification.permission;
}

/**
 * Request notification permission from user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
    if (!isPushNotificationSupported()) {
        throw new Error('Push notifications are not supported');
    }

    const permission = await Notification.requestPermission();
    console.log('[Push] Permission:', permission);

    return permission;
}

/**
 * Register service worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
    if (!('serviceWorker' in navigator)) {
        throw new Error('Service Worker is not supported');
    }

    try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
        });

        console.log('[Push] Service Worker registered');

        // Wait for service worker to be ready
        await navigator.serviceWorker.ready;

        return registration;
    } catch (error) {
        console.error('[Push] Service Worker registration failed:', error);
        throw error;
    }
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPushNotifications(): Promise<PushSubscription> {
    if (!isPushNotificationSupported()) {
        throw new Error('Push notifications are not supported');
    }

    if (!VAPID_PUBLIC_KEY) {
        throw new Error('VAPID public key is not configured');
    }

    // Request permission first
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
        throw new Error('Notification permission denied');
    }

    // Register service worker
    const registration = await registerServiceWorker();

    // Check for existing subscription
    let subscription = await registration.pushManager.getSubscription();

    if (subscription) {
        console.log('[Push] Using existing subscription');
        return subscription;
    }

    // Create new subscription
    try {
        subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
        });

        console.log('[Push] New subscription created');
        return subscription;
    } catch (error) {
        console.error('[Push] Subscription failed:', error);
        throw error;
    }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPushNotifications(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
        return;
    }

    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (subscription) {
            await subscription.unsubscribe();
            console.log('[Push] Unsubscribed');
        }
    } catch (error) {
        console.error('[Push] Unsubscribe failed:', error);
        throw error;
    }
}

/**
 * Get current push subscription
 */
export async function getCurrentSubscription(): Promise<PushSubscription | null> {
    if (!('serviceWorker' in navigator)) {
        return null;
    }

    try {
        const registration = await navigator.serviceWorker.ready;
        return await registration.pushManager.getSubscription();
    } catch (error) {
        console.error('[Push] Get subscription failed:', error);
        return null;
    }
}

/**
 * Show a test notification (for testing)
 */
export async function showTestNotification(): Promise<void> {
    if (!isPushNotificationSupported()) {
        throw new Error('Notifications are not supported');
    }

    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
        throw new Error('Notification permission denied');
    }

    const registration = await registerServiceWorker();

    await registration.showNotification('Test Notification', {
        body: 'This is a test notification from Class Tracker',
        icon: '/icon-192.png',
        badge: '/badge-72.png',
        tag: 'test',
    });
}

/**
 * Get device info for subscription tracking
 */
export function getDeviceInfo(): string {
    if (typeof window === 'undefined') return 'Unknown';

    const ua = navigator.userAgent;
    const browser = ua.match(/(chrome|safari|firefox|edge|opera)/i)?.[0] || 'Unknown';
    const version = ua.match(/version\/(\d+)/i)?.[1] ||
        ua.match(/(chrome|firefox|edge)\/(\d+)/i)?.[2] ||
        'Unknown';

    return `${browser} ${version}`;
}

/**
 * Save subscription to database (to be called after subscribing)
 */
export interface SaveSubscriptionParams {
    userId: Id<"users">;
    subscription: PushSubscription;
    saveMutation: (args: unknown) => Promise<unknown>;
}

export async function saveSubscriptionToDatabase(params: SaveSubscriptionParams): Promise<void> {
    const { userId, subscription, saveMutation } = params;

    const subscriptionJSON = subscription.toJSON();

    if (!subscriptionJSON.endpoint || !subscriptionJSON.keys) {
        throw new Error('Invalid subscription format');
    }

    try {
        await saveMutation({
            userId,
            subscription: {
                endpoint: subscriptionJSON.endpoint,
                keys: {
                    p256dh: subscriptionJSON.keys.p256dh,
                    auth: subscriptionJSON.keys.auth,
                },
            },
            deviceInfo: getDeviceInfo(),
        });

        console.log('[Push] Subscription saved to database');
    } catch (error) {
        console.error('[Push] Failed to save subscription:', error);
        throw error;
    }
}

/**
 * Remove subscription from database (to be called after unsubscribing)
 */
export interface RemoveSubscriptionParams {
    userId: Id<"users">;
    endpoint: string;
    removeMutation: (args: unknown) => Promise<unknown>;
}

export async function removeSubscriptionFromDatabase(params: RemoveSubscriptionParams): Promise<void> {
    const { userId, endpoint, removeMutation } = params;

    try {
        await removeMutation({
            userId,
            endpoint,
        });

        console.log('[Push] Subscription removed from database');
    } catch (error) {
        console.error('[Push] Failed to remove subscription:', error);
        throw error;
    }
}
