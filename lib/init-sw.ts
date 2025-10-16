/**
 * Service Worker Initialization
 * Registers the service worker for push notifications
 */

export async function initServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (typeof window === "undefined") {
        return null;
    }

    if (!("serviceWorker" in navigator)) {
        console.warn("Service Worker not supported in this browser");
        return null;
    }

    try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
            scope: "/",
        });

        console.log("Service Worker registered successfully:", registration.scope);

        // Wait for the service worker to be ready
        await navigator.serviceWorker.ready;

        return registration;
    } catch (error) {
        console.error("Service Worker registration failed:", error);
        return null;
    }
}

/**
 * Unregister all service workers (for testing/cleanup)
 */
export async function unregisterServiceWorkers(): Promise<void> {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
        return;
    }

    try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((reg) => reg.unregister()));
        console.log("All service workers unregistered");
    } catch (error) {
        console.error("Failed to unregister service workers:", error);
    }
}

/**
 * Check if service worker is registered and active
 */
export function isServiceWorkerActive(): boolean {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
        return false;
    }

    return navigator.serviceWorker.controller !== null;
}
