/**
 * Session expiration utilities
 * Adds 24-hour timeout to localStorage authentication
 */

import type { User } from "@/lib/types";

export const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export interface UserSession extends User {
    expiresAt: number; // Timestamp when session expires
}

/**
 * Save user session with expiration timestamp
 */
export function saveUserSession(user: User): void {
    if (typeof window === "undefined") return;

    const session: UserSession = {
        ...user,
        expiresAt: Date.now() + SESSION_DURATION,
    };

    localStorage.setItem("currentUser", JSON.stringify(session));
}

/**
 * Load user session and check if it's expired
 * Returns null if session is expired or invalid
 */
export function loadUserSession(): User | null {
    if (typeof window === "undefined") return null;

    try {
        const saved = localStorage.getItem("currentUser");
        if (!saved) return null;

        const session: UserSession = JSON.parse(saved);

        // Check if session has expired
        if (session.expiresAt && Date.now() > session.expiresAt) {
            // Session expired - clear it
            localStorage.removeItem("currentUser");
            return null;
        }

        // Valid session - extend expiration on load
        saveUserSession(session);

        // Return user without expiresAt field
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { expiresAt, ...user } = session;
        return user as User;
    } catch (error) {
        console.error("Failed to parse user session:", error);
        localStorage.removeItem("currentUser");
        return null;
    }
}

/**
 * Clear user session from localStorage
 */
export function clearUserSession(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem("currentUser");
}

/**
 * Get time remaining until session expires (in milliseconds)
 * Returns 0 if session is expired or invalid
 */
export function getSessionTimeRemaining(): number {
    if (typeof window === "undefined") return 0;

    try {
        const saved = localStorage.getItem("currentUser");
        if (!saved) return 0;

        const session: UserSession = JSON.parse(saved);
        const remaining = session.expiresAt - Date.now();
        return Math.max(0, remaining);
    } catch (error) {
        return 0;
    }
}

/**
 * Check if session is about to expire (within 1 hour)
 */
export function isSessionExpiringSoon(): boolean {
    const remaining = getSessionTimeRemaining();
    const oneHour = 60 * 60 * 1000;
    return remaining > 0 && remaining < oneHour;
}
