/**
 * Device Detection Context
 *
 * Provides device type information throughout the app
 * Auto-detects on mount and window resize
 * Syncs device type to database for all users
 */

"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  detectDevice,
  type DeviceInfo,
  type DeviceType,
} from "./device-detection";

interface DeviceContextType {
  deviceInfo: DeviceInfo | null;
  deviceType: DeviceType | null;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLoading: boolean;
  refreshDeviceInfo: () => void;
}

const DeviceContext = createContext<DeviceContextType | null>(null);

interface DeviceProviderProps {
  children: ReactNode;
  userId?: Id<"users">; // Optional user ID to sync device type
}

export function DeviceProvider({ children, userId }: DeviceProviderProps) {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const updateDeviceType = useMutation(api.users.updateDeviceType);

  const detectAndUpdate = useCallback(async () => {
    const info = detectDevice();
    setDeviceInfo(info);
    setIsLoading(false);

    // Update database if user is logged in
    if (userId && info.deviceType) {
      try {
        await updateDeviceType({
          userId: userId,
          deviceType: info.deviceType,
        });
      } catch (error) {
        console.error("Failed to update device type in database:", error);
      }
    }
  }, [userId, updateDeviceType]);

  // Detect device on mount
  useEffect(() => {
    detectAndUpdate();
  }, [detectAndUpdate]);

  // Re-detect on window resize (debounced)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        detectAndUpdate();
      }, 500); // 500ms debounce
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timeoutId);
    };
  }, [detectAndUpdate]);

  const value: DeviceContextType = {
    deviceInfo,
    deviceType: deviceInfo?.deviceType || null,
    isMobile: deviceInfo?.deviceType === "mobile",
    isTablet: deviceInfo?.deviceType === "tablet",
    isDesktop: deviceInfo?.deviceType === "desktop",
    isLoading,
    refreshDeviceInfo: detectAndUpdate,
  };

  return (
    <DeviceContext.Provider value={value}>{children}</DeviceContext.Provider>
  );
}

export function useDevice(): DeviceContextType {
  const context = useContext(DeviceContext);
  if (!context) {
    throw new Error("useDevice must be used within DeviceProvider");
  }
  return context;
}

export function useDeviceType(): DeviceType | null {
  const { deviceType } = useDevice();
  return deviceType;
}

export function useIsMobile(): boolean {
  const { isMobile } = useDevice();
  return isMobile;
}

export function useIsTablet(): boolean {
  const { isTablet } = useDevice();
  return isTablet;
}

export function useIsDesktop(): boolean {
  const { isDesktop } = useDevice();
  return isDesktop;
}
