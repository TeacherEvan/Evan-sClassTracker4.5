import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Run daily at 2:00 AM UTC to delete messages older than 14 days
crons.daily(
  "delete-old-messages",
  { hourUTC: 2, minuteUTC: 0 },
  internal.messages.deleteOldMessages,
);

export default crons;
