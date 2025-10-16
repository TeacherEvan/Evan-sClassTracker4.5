/**
 * Device detection utilities for mobile and desktop
 * Used for determining notification strategies and UI adaptations
 */

export type DeviceType = "mobile" | "tablet" | "desktop";

/**
 * Detects the device type based on user agent and screen width
 */
export function getDeviceType(): DeviceType {
  if (typeof window === "undefined") {
    return "desktop"; // Default for SSR
  }

  const width = window.innerWidth;

  // Responsive breakpoints
  if (width < 768) {
    return "mobile";
  } else if (width < 1024) {
    return "tablet";
  } else {
    return "desktop";
  }
}

/**
 * Check if device is mobile (phone or tablet)
 */
export function isMobileDevice(): boolean {
  const deviceType = getDeviceType();
  return deviceType === "mobile" || deviceType === "tablet";
}

/**
 * Check if device is desktop
 */
export function isDesktopDevice(): boolean {
  return getDeviceType() === "desktop";
}

/**
 * Check if browser supports push notifications
 */
export function supportsPushNotifications(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return "Notification" in window && "serviceWorker" in navigator;
}

/**
 * Get notification permission status
 */
export function getNotificationPermission(): NotificationPermission | null {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return null;
  }

  return Notification.permission;
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission | null> {
  if (!supportsPushNotifications()) {
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error("Error requesting notification permission:", error);
    return null;
  }
}

/**
 * Check if device supports touch
 */
export function supportsTouchScreen(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (navigator as any).msMaxTouchPoints > 0
  );
}
