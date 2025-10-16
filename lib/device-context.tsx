/**
 * Device Detection Context
 * 
 * Provides device type information throughout the app
 * Automatically detects and updates device type on mount and window resize
 */

"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { detectDevice, saveDeviceType, type DeviceInfo } from "./device-detection";
import type { DeviceType } from "./types";

interface DeviceContextValue {
    deviceType: DeviceType;
    deviceInfo: DeviceInfo | null;
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
    hasTouch: boolean;
    isLoading: boolean;
    refreshDeviceInfo: () => void;
}

const DeviceContext = createContext<DeviceContextValue | undefined>(undefined);

interface DeviceProviderProps {
    children: ReactNode;
    userId?: Id<"users">; // Optional user ID to update database
}

export function DeviceProvider({ children, userId }: DeviceProviderProps) {
    const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const updateDeviceType = useMutation(api.users.updateDeviceType);

    // Detect device on mount and window resize
    useEffect(() => {
        if (typeof window === "undefined") return;

        const detectAndUpdate = () => {
            const info = detectDevice();
            setDeviceInfo(info);
            saveDeviceType(info.type);
            setIsLoading(false);

            // Update database if user is logged in
            if (userId) {
                updateDeviceType({
                    userId,
                    deviceType: info.type,
                }).catch((error) => {
                    console.error("[Device] Failed to update device type:", error);
                });
            }
        };

        // Initial detection
        detectAndUpdate();

        // Re-detect on window resize (debounced)
        let resizeTimer: NodeJS.Timeout;
        const handleResize = () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(detectAndUpdate, 500);
        };

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
            clearTimeout(resizeTimer);
        };
    }, [userId, updateDeviceType]);

    // Manual refresh function
    const refreshDeviceInfo = () => {
        const info = detectDevice();
        setDeviceInfo(info);
        saveDeviceType(info.type);

        if (userId) {
            updateDeviceType({
                userId,
                deviceType: info.type,
            }).catch((error) => {
                console.error("[Device] Failed to update device type:", error);
            });
        }
    };

    // Provide default values while loading
    const defaultInfo: DeviceInfo = {
        type: "desktop",
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        hasTouch: false,
        screenWidth: 1920,
        screenHeight: 1080,
        userAgent: "",
    };

    const currentInfo = deviceInfo || defaultInfo;

    const value: DeviceContextValue = {
        deviceType: currentInfo.type,
        deviceInfo: currentInfo,
        isMobile: currentInfo.isMobile,
        isTablet: currentInfo.isTablet,
        isDesktop: currentInfo.isDesktop,
        hasTouch: currentInfo.hasTouch,
        isLoading,
        refreshDeviceInfo,
    };

    return <DeviceContext.Provider value={value}>{children}</DeviceContext.Provider>;
}

/**
 * Hook to access device information
 */
export function useDevice(): DeviceContextValue {
    const context = useContext(DeviceContext);

    if (context === undefined) {
        throw new Error("useDevice must be used within a DeviceProvider");
    }

    return context;
}

/**
 * Hook to get just the device type (convenience)
 */
export function useDeviceType(): DeviceType {
    const { deviceType } = useDevice();
    return deviceType;
}

/**
 * Hook to check if on mobile device (convenience)
 */
export function useIsMobile(): boolean {
    const { isMobile } = useDevice();
    return isMobile;
}

/**
 * Hook to check if on desktop device (convenience)
 */
export function useIsDesktop(): boolean {
    const { isDesktop } = useDevice();
    return isDesktop;
}
