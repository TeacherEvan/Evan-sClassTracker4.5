/**
 * Device Detection Utility
 * 
 * Detects whether the user is on mobile, tablet, or desktop
 * Uses multiple signals for accurate detection
 */

import type { DeviceType } from "./types";

export interface DeviceInfo {
    type: DeviceType;
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
    hasTouch: boolean;
    screenWidth: number;
    screenHeight: number;
    userAgent: string;
}

/**
 * Detect the device type using multiple signals
 * 
 * Combines:
 * 1. User Agent detection
 * 2. Touch capability
 * 3. Screen size (Tailwind breakpoints)
 * 4. Device orientation API
 * 
 * @returns DeviceInfo object with detection results
 */
export function detectDevice(): DeviceInfo {
    // Default fallback for SSR
    if (typeof window === "undefined") {
        return {
            type: "desktop",
            isMobile: false,
            isTablet: false,
            isDesktop: true,
            hasTouch: false,
            screenWidth: 1920,
            screenHeight: 1080,
            userAgent: "SSR",
        };
    }

    const userAgent = navigator.userAgent.toLowerCase();
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    // User Agent detection
    const mobileUA = /android|webos|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    const tabletUA = /ipad|android(?!.*mobile)|tablet/i.test(userAgent);

    // Touch capability
    const hasTouch =
        "ontouchstart" in window ||
        navigator.maxTouchPoints > 0 ||
        // @ts-expect-error - for older browsers that may have msMaxTouchPoints
        (navigator.msMaxTouchPoints && navigator.msMaxTouchPoints > 0);

    // Screen size detection (Tailwind breakpoints)
    // sm: 640px, md: 768px, lg: 1024px, xl: 1280px
    const isSmallScreen = screenWidth < 768; // below md
    const isMediumScreen = screenWidth >= 768 && screenWidth < 1024; // md to lg

    // Device orientation API
    const hasOrientation = "orientation" in window || "onorientationchange" in window;

    // Decision logic: prioritize multiple signals
    let deviceType: DeviceType;
    let isMobile = false;
    let isTablet = false;
    let isDesktop = false;

    if (mobileUA && hasTouch && isSmallScreen) {
        // Clear mobile signal
        deviceType = "mobile";
        isMobile = true;
    } else if (tabletUA || (hasTouch && isMediumScreen && hasOrientation)) {
        // Tablet: explicit UA or touch + medium screen + orientation
        deviceType = "tablet";
        isTablet = true;
    } else if (isSmallScreen && hasTouch && !hasOrientation) {
        // Small screen with touch but no orientation = likely mobile
        deviceType = "mobile";
        isMobile = true;
    } else {
        // Default to desktop
        deviceType = "desktop";
        isDesktop = true;
    }

    return {
        type: deviceType,
        isMobile,
        isTablet,
        isDesktop,
        hasTouch,
        screenWidth,
        screenHeight,
        userAgent,
    };
}

/**
 * Get a simplified device type string
 */
export function getDeviceType(): DeviceType {
    return detectDevice().type;
}

/**
 * Check if current device is mobile
 */
export function isMobileDevice(): boolean {
    return detectDevice().isMobile;
}

/**
 * Check if current device is desktop
 */
export function isDesktopDevice(): boolean {
    return detectDevice().isDesktop;
}

/**
 * Check if current device has touch capability
 */
export function hasTouchCapability(): boolean {
    return detectDevice().hasTouch;
}

/**
 * Get device info as a string for logging/debugging
 */
export function getDeviceInfoString(): string {
    const info = detectDevice();
    return `${info.type} (${info.screenWidth}x${info.screenHeight}, touch: ${info.hasTouch})`;
}

/**
 * Store device type in localStorage
 */
export function saveDeviceType(deviceType: DeviceType): void {
    if (typeof window !== "undefined") {
        localStorage.setItem("deviceType", deviceType);
        localStorage.setItem("lastDeviceCheck", Date.now().toString());
    }
}

/**
 * Get stored device type from localStorage
 * Returns null if not found or expired (24 hours)
 */
export function getStoredDeviceType(): DeviceType | null {
    if (typeof window === "undefined") return null;

    const stored = localStorage.getItem("deviceType");
    const lastCheck = localStorage.getItem("lastDeviceCheck");

    if (!stored || !lastCheck) return null;

    // Check if stored value is stale (24 hours)
    const age = Date.now() - parseInt(lastCheck);
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    if (age > maxAge) {
        localStorage.removeItem("deviceType");
        localStorage.removeItem("lastDeviceCheck");
        return null;
    }

    return stored as DeviceType;
}

/**
 * Get device type with caching
 * Uses localStorage to avoid re-detecting on every page load
 */
export function getCachedDeviceType(): DeviceType {
    const stored = getStoredDeviceType();
    if (stored) return stored;

    const detected = getDeviceType();
    saveDeviceType(detected);
    return detected;
}
