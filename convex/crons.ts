/**
 * Convex Cron Jobs Configuration
 * 
 * Scheduled functions that run automatically at specified intervals
 */

import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

/**
 * Clean up old messages (2 weeks+)
 * Runs daily at 2:00 AM UTC (low-traffic time)
 * 
 * This ensures compliance with the message retention policy:
 * "Messages will be cleared from the server automatically every 2 weeks"
 */
crons.daily(
    "clean-old-messages",
    {
        hourUTC: 2,
        minuteUTC: 0,
    },
    internal.messages.cleanupOldMessages
);

/**
 * Clean up expired push subscriptions
 * Runs weekly on Sunday at 3:00 AM UTC
 * 
 * Removes subscriptions that haven't been used in 30 days
 */
crons.weekly(
    "clean-expired-push-subscriptions",
    {
        hourUTC: 3,
        minuteUTC: 0,
        dayOfWeek: "sunday",
    },
    internal.pushNotifications.cleanupExpiredSubscriptions
);

export default crons;
