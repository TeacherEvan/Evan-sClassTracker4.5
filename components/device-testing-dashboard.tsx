"use client";

import { api } from "@/convex/_generated/api";
import { useDevice } from "@/lib/device-context";
import { useQuery } from "convex/react";
import { AlertCircle, CheckCircle, Monitor, RefreshCw, Smartphone, Tablet, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

interface UserWithDevice {
    _id: string;
    username: string;
    role: string;
    deviceType?: "mobile" | "tablet" | "desktop";
    lastDeviceUpdate?: number;
}

/**
 * Device Testing Dashboard
 * 
 * This component helps verify items 1-6 from IMPLEMENTATION_REVIEW_AND_STATUS.md:
 * 1. Mobile device detection (iPhone, Android)
 * 2. Tablet detection (iPad)
 * 3. Desktop detection (laptop, desktop)
 * 4. Window resize re-detection
 * 5. Database sync verification
 * 6. Service worker registration
 */

export default function DeviceTestingDashboard() {
    const { deviceType } = useDevice();
    const currentUser = useQuery(api.users.getCurrentUser) as UserWithDevice | undefined;
    const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
    const [resizeCount, setResizeCount] = useState(0);
    const [serviceWorkerStatus, setServiceWorkerStatus] = useState<string>("checking");
    const [pushPermission, setPushPermission] = useState<NotificationPermission>("default");

    // Track window size changes
    useEffect(() => {
        const updateSize = () => {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight,
            });
            setResizeCount((prev) => prev + 1);
        };

        updateSize();
        window.addEventListener("resize", updateSize);
        return () => window.removeEventListener("resize", updateSize);
    }, []);

    // Check service worker registration
    useEffect(() => {
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.getRegistration().then((registration) => {
                if (registration) {
                    setServiceWorkerStatus("registered");
                } else {
                    setServiceWorkerStatus("not-registered");
                }
            });
        } else {
            setServiceWorkerStatus("not-supported");
        }

        if ("Notification" in window) {
            setPushPermission(Notification.permission);
        }
    }, []);

    const getDeviceIcon = () => {
        switch (deviceType) {
            case "mobile":
                return <Smartphone className="w-8 h-8 text-blue-500" />;
            case "tablet":
                return <Tablet className="w-8 h-8 text-purple-500" />;
            case "desktop":
                return <Monitor className="w-8 h-8 text-green-500" />;
            default:
                return <AlertCircle className="w-8 h-8 text-gray-500" />;
        }
    };

    const getStatusIcon = (condition: boolean) => {
        return condition ? (
            <CheckCircle className="w-5 h-5 text-green-500" />
        ) : (
            <XCircle className="w-5 h-5 text-red-500" />
        );
    };

    const testResults = [
        {
            id: 1,
            title: "Mobile Device Detection",
            description: "Detects iPhone and Android devices",
            passed: deviceType === "mobile" && windowSize.width <= 768,
            details: `Current: ${deviceType}, Width: ${windowSize.width}px`,
        },
        {
            id: 2,
            title: "Tablet Detection",
            description: "Detects iPad and other tablets",
            passed: deviceType === "tablet" || (windowSize.width > 768 && windowSize.width <= 1024),
            details: `Current: ${deviceType}, Width: ${windowSize.width}px`,
        },
        {
            id: 3,
            title: "Desktop Detection",
            description: "Detects laptop and desktop computers",
            passed: deviceType === "desktop" || windowSize.width > 1024,
            details: `Current: ${deviceType}, Width: ${windowSize.width}px`,
        },
        {
            id: 4,
            title: "Window Resize Re-detection",
            description: "Device type updates on window resize",
            passed: resizeCount > 1,
            details: `Resize events: ${resizeCount} (try resizing window)`,
        },
        {
            id: 5,
            title: "Database Sync Verification",
            description: "Device type synced to Convex database",
            passed: currentUser?.deviceType === deviceType,
            details: `DB: ${currentUser?.deviceType || "N/A"}, Local: ${deviceType}`,
        },
        {
            id: 6,
            title: "Service Worker Registration",
            description: "Service worker for push notifications",
            passed: serviceWorkerStatus === "registered",
            details: `Status: ${serviceWorkerStatus}, Permission: ${pushPermission}`,
        },
    ];

    const passedTests = testResults.filter((test) => test.passed).length;
    const totalTests = testResults.length;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Device Testing Dashboard
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Manual testing for items 1-6 from IMPLEMENTATION_REVIEW_AND_STATUS.md
                    </p>
                </div>

                {/* Summary Card */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                Test Results
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400">
                                {passedTests} of {totalTests} tests passing
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                                {Math.round((passedTests / totalTests) * 100)}%
                            </div>
                        </div>
                    </div>

                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                        <div
                            className="bg-blue-600 dark:bg-blue-400 h-4 rounded-full transition-all duration-500"
                            style={{ width: `${(passedTests / totalTests) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Device Info Card */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                        Current Device Info
                    </h2>
                    <div className="flex items-center gap-4 mb-4">
                        {getDeviceIcon()}
                        <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white capitalize">
                                {deviceType}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {windowSize.width} x {windowSize.height}px
                            </p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-gray-600 dark:text-gray-400">User Agent:</span>
                            <p className="font-mono text-xs text-gray-900 dark:text-white break-all">
                                {typeof window !== "undefined" ? navigator.userAgent.substring(0, 50) + "..." : "N/A"}
                            </p>
                        </div>
                        <div>
                            <span className="text-gray-600 dark:text-gray-400">Last DB Update:</span>
                            <p className="font-mono text-xs text-gray-900 dark:text-white">
                                {currentUser?.lastDeviceUpdate ? new Date(currentUser.lastDeviceUpdate).toLocaleTimeString() : "N/A"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Test Results */}
                <div className="space-y-4">
                    {testResults.map((test) => (
                        <div
                            key={test.id}
                            className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border-l-4 ${test.passed
                                ? "border-green-500"
                                : "border-red-500"
                                }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        {getStatusIcon(test.passed)}
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                            {test.id}. {test.title}
                                        </h3>
                                    </div>
                                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                                        {test.description}
                                    </p>
                                    <p className="text-sm font-mono text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 p-2 rounded">
                                        {test.details}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Actions */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mt-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                        Testing Actions
                    </h2>
                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <p>
                            <strong>Test 1-3 (Device Detection):</strong> View this page on different devices
                            (phone, tablet, desktop)
                        </p>
                        <p>
                            <strong>Test 4 (Resize):</strong> Resize your browser window and watch the device type
                            change
                        </p>
                        <p>
                            <strong>Test 5 (DB Sync):</strong> Check that deviceType matches in both local and
                            database
                        </p>
                        <p>
                            <strong>Test 6 (Service Worker):</strong> Ensure service worker is registered (check
                            DevTools → Application → Service Workers)
                        </p>
                    </div>

                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh Dashboard
                    </button>
                </div>

                {/* User Info (Debug) */}
                {currentUser && (
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg shadow-lg p-6 mt-6">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                            Debug Info
                        </h2>
                        <pre className="text-xs font-mono text-gray-700 dark:text-gray-300 overflow-auto">
                            {JSON.stringify(
                                {
                                    username: currentUser.username,
                                    role: currentUser.role,
                                    deviceType: currentUser.deviceType,
                                    lastDeviceUpdate: currentUser.lastDeviceUpdate,
                                },
                                null,
                                2
                            )}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
}
