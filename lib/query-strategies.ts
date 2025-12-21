/**
 * Convex Query Update Strategy Configuration
 * 
 * This file defines which data sources should use:
 * - Real-time subscriptions (instant updates)
 * - Polling (periodic updates)
 * - Manual refresh (on-demand updates)
 * 
 * Last Updated: Dec 21, 2025
 */

export const UPDATE_STRATEGIES = {
  /**
   * Tier 1: STATIC DATA (Polling)
   * Data that changes infrequently and doesn't need instant updates
   */
  STATIC: {
    // Schools: Only change when admin adds/edits schools
    schools: {
      strategy: "polling" as const,
      interval: 60000, // 60 seconds
      reason: "Schools added/edited rarely, prevents root-level re-renders",
    },

    // Locations: Only change when moderators add locations
    locations: {
      strategy: "polling" as const,
      interval: 30000, // 30 seconds
      reason: "Locations change occasionally, not critical for instant updates",
    },

    // Users list (teachers/moderators): Only changes on admin actions
    users: {
      strategy: "polling" as const,
      interval: 60000, // 60 seconds
      reason: "User list changes rarely, polling sufficient",
    },

    // Providers: Only change when teachers create new providers
    providers: {
      strategy: "polling" as const,
      interval: 45000, // 45 seconds
      reason: "Provider creation is infrequent",
    },
  },

  /**
   * Tier 2: ACTIVE DATA (Scoped Real-Time)
   * Data that changes frequently but can be filtered to reduce scope
   */
  ACTIVE: {
    // Classes: High-traffic, but can be scoped by teacher/school/date
    classes: {
      strategy: "scoped-realtime" as const,
      scopeBy: ["teacherId", "schoolId", "dateRange"],
      reason: "Keep real-time for booking workflow, but filter to relevant data only",
    },

    // Students: Moderate changes, scope by school/provider
    students: {
      strategy: "scoped-realtime" as const,
      scopeBy: ["schoolId", "providerId", "teacherId"],
      reason: "Student data needs to be current for booking, scope to reduce updates",
    },

    // Notifications: User-specific, already scoped
    notifications: {
      strategy: "scoped-realtime" as const,
      scopeBy: ["userId", "userRole"],
      reason: "Notifications must be instant, already filtered per user",
    },
  },

  /**
   * Tier 3: ANALYTICS (Manual Refresh)
   * Data for dashboards/reports that don't need constant updates
   */
  ANALYTICS: {
    // Admin analytics: Large dataset, only needed on dashboard view
    adminAnalytics: {
      strategy: "manual" as const,
      autoRefreshInterval: 10000, // 10 seconds when visible
      reason: "Analytics expensive to calculate, refresh on demand or visibility",
    },

    // Teacher class count: Historical data, changes completed
    teacherClassCount: {
      strategy: "manual" as const,
      autoRefreshInterval: 15000, // 15 seconds
      reason: "Historical data, manual refresh sufficient",
    },

    // Moderator analytics: School-specific stats
    moderatorAnalytics: {
      strategy: "manual" as const,
      autoRefreshInterval: 10000, // 10 seconds
      reason: "Dashboard view, auto-refresh when visible",
    },
  },

  /**
   * Tier 4: CRITICAL (Always Real-Time)
   * Data that MUST be instant for security/UX
   */
  CRITICAL: {
    // Current user session
    currentUser: {
      strategy: "realtime" as const,
      reason: "Security-critical, must detect logout/permissions changes immediately",
    },

    // Active booking conflicts
    bookingConflicts: {
      strategy: "realtime" as const,
      reason: "Must prevent double-booking, real-time detection critical",
    },

    // Approval workflow: Moderators need instant updates
    pendingApprovals: {
      strategy: "realtime" as const,
      reason: "Workflow coordination, instant updates required",
    },
  },
} as const;

/**
 * Helper function to get update strategy for a data source
 */
export function getUpdateStrategy(dataSource: string) {
  for (const tier of Object.values(UPDATE_STRATEGIES)) {
    if (dataSource in tier) {
      return tier[dataSource as keyof typeof tier];
    }
  }
  
  // Default to scoped real-time if not specified
  return {
    strategy: "scoped-realtime" as const,
    reason: "Default strategy - consider adding to configuration",
  };
}

/**
 * Performance Monitoring Intervals
 */
export const MONITORING = {
  // Log re-render counts every 30 seconds in development
  rerenderLogging: 30000,
  
  // Track query response times
  performanceTracking: true,
  
  // Alert if polling interval missed by > 20%
  pollingDriftThreshold: 0.2,
} as const;
