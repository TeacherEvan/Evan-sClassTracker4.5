/**
 * Rate Limiting Utilities for Convex Mutations
 * 
 * Prevents abuse by limiting the number of requests per time period.
 * Uses Convex database to track rate limits per user/action.
 */

import type { GenericMutationCtx } from "convex/server";
import type { DataModel } from "./_generated/dataModel";

type MutationCtx = GenericMutationCtx<DataModel>;

interface RateLimitConfig {
    key: string; // Unique key (e.g., userId + action)
    limit: number; // Max requests allowed
    windowMs: number; // Time window in milliseconds
}

/**
 * Simple in-memory rate limiter (resets on server restart)
 * For production, consider using a database-backed solution
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export async function checkRateLimit(
    ctx: MutationCtx,
    config: RateLimitConfig
): Promise<void> {
    const now = Date.now();
    const limiter = rateLimitMap.get(config.key);

    if (!limiter || now > limiter.resetAt) {
        // Create new window
        rateLimitMap.set(config.key, {
            count: 1,
            resetAt: now + config.windowMs,
        });
        return;
    }

    if (limiter.count >= config.limit) {
        const waitTime = Math.ceil((limiter.resetAt - now) / 1000);
        throw new Error(
            `Rate limit exceeded. Please wait ${waitTime} seconds before trying again.`
        );
    }

    // Increment counter
    limiter.count++;
}

/**
 * Validate input string length
 */
export function validateLength(
    value: string,
    fieldName: string,
    maxLength: number,
    minLength = 0
): void {
    if (value.length < minLength) {
        throw new Error(`${fieldName} must be at least ${minLength} characters`);
    }
    if (value.length > maxLength) {
        throw new Error(`${fieldName} must not exceed ${maxLength} characters`);
    }
}

/**
 * Sanitize input by removing dangerous characters
 * Note: For HTML content, use DOMPurify on the client side
 */
export function sanitizeInput(value: string): string {
    return value
        .trim()
        .replace(/[<>]/g, "") // Remove angle brackets
        .substring(0, 10000); // Hard limit to prevent massive strings
}
