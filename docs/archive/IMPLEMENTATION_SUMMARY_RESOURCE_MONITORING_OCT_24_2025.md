# Resource Usage Monitoring Implementation - October 24, 2025

## Overview

Implemented automatic resource monitoring system that warns admins when Convex free tier limits are approaching, helping prevent service interruption.

---

## Features Implemented

### 1. Resource Monitoring Backend (`convex/resourceMonitoring.ts`)

**Tracks Usage:**

- Database size (1 GB limit)
- Bandwidth usage (5 GB/month limit)
- Record counts per table
- Estimated growth rates

**Warning Thresholds:**

- **80% = Warning** (yellow notification)
- **90% = Critical** (orange notification)
- **95% = Urgent** (red notification)

**Key Functions:**

```typescript
// Check current usage (admin query)
api.resourceMonitoring.getCurrentUsage({ userId })

// Get upgrade recommendation (admin query)
api.resourceMonitoring.getUpgradeRecommendation({ userId })

// Internal cron job (runs daily at 3 AM UTC)
internal.resourceMonitoring.checkAndNotify()
```

---

### 2. Automatic Daily Monitoring (`convex/crons.ts`)

Added daily cron job:

```typescript
crons.daily(
    "check-resource-usage",
    { hourUTC: 3, minuteUTC: 0 },
    internal.resourceMonitoring.checkAndNotify
);
```

**Behavior:**

- Runs at 3:00 AM UTC daily
- Checks database and bandwidth usage
- Creates notification window for admins if usage >= 80%
- Prevents duplicate notifications (max 1 per 7 days)

---

### 3. Admin Dashboard UI (`components/resource-usage-monitor.tsx`)

**Features:**

- Real-time usage display with progress bars
- Color-coded status indicators (green/yellow/orange/red)
- Upgrade recommendation banner
- Detailed breakdown by table
- Estimated months until limits reached
- Direct link to Convex dashboard
- Bilingual support (English/Thai)

**UI Components:**

- Database usage card with record counts
- Bandwidth usage card with monthly estimate
- Upgrade warning banner (when needed)
- Expandable details section

---

### 4. Integration into Admin Section (`app/page.tsx`)

**New Tab:**

- Added "Resource Usage" tab to admin navigation
- Icon: BarChart3
- Position: Between "App Updates" and "Data Import"
- Access: Admin-only

---

## Usage Estimation Logic

### Database Size

```typescript
// Conservative estimates per record type:
users: 500 bytes
classes: 800 bytes
students: 600 bytes
messages: 700 bytes (includes attachment refs)
auditLogs: 1200 bytes
// ... etc

totalSize = Σ(recordCount × avgRecordSize)
```

### Bandwidth

```typescript
// Based on cost analysis (COST_ANALYSIS_CONVEX_VS_VERCEL.md):
// ~700 KB per active user per month
estimatedBandwidth = (activeUsers × 0.7 MB) 
                   + (classCount × 0.01 MB) 
                   + (messageCount × 0.02 MB)
```

---

## Notification Behavior

### When Triggered

Admin sees notification window when:

1. Database usage >= 80%, OR
2. Bandwidth usage >= 80%

### Notification Content

- Icon based on severity (⚠️ for urgent)
- Resource type (Database/Bandwidth/Both)
- Current usage percentages
- Convex Pro upgrade details ($25/mo)
- Benefits: 8 GB DB, 50 GB bandwidth, priority support

### Frequency Control

- Max 1 notification per 7 days
- Prevents notification spam
- Resets if usage drops below 80%

---

## Testing Checklist

- [ ] Verify cron job registered (`npx convex dev` → check crons)
- [ ] Test admin query: `api.resourceMonitoring.getCurrentUsage`
- [ ] Test recommendation: `api.resourceMonitoring.getUpgradeRecommendation`
- [ ] Verify UI renders on "Resource Usage" tab
- [ ] Test bilingual text (English/Thai toggle)
- [ ] Check notification creation when usage >= 80%
- [ ] Verify no duplicate notifications within 7 days
- [ ] Test expandable record count details
- [ ] Verify color coding (green/yellow/orange/red)
- [ ] Test Convex dashboard link opens correctly

---

## Files Modified

### New Files

1. `convex/resourceMonitoring.ts` - Backend monitoring logic (320 lines)
2. `components/resource-usage-monitor.tsx` - Admin UI component (270 lines)

### Modified Files

1. `convex/crons.ts` - Added daily monitoring cron
2. `app/page.tsx` - Added resource usage tab + lazy loading

---

## Cost Analysis Integration

Based on `docs/COST_ANALYSIS_CONVEX_VS_VERCEL.md`:

**Free Tier Headroom (Current):**

- Database: 900 MB remaining (~9x current usage)
- Bandwidth: ~4.8 GB remaining (~20x current usage)

**Realistic Timeline:**

- Year 1: Safe ✅
- Year 2: Safe ✅  
- Year 3: Database may hit limit ⚠️
- Bandwidth: Safe for 50-75 daily active users

**When to Upgrade:**

- Database: ~2.5 years (estimated)
- Bandwidth: When DAU exceeds 50-75
- Recommendation: **Convex Pro** before Vercel upgrade needed

---

## Future Enhancements

### Short Term

- [ ] Add historical usage charts (track trends)
- [ ] Export usage reports as CSV
- [ ] Email notifications to admins
- [ ] Adjustable warning thresholds

### Long Term

- [ ] Automatic scaling recommendations
- [ ] Cost projections based on growth rate
- [ ] Integration with external monitoring (Datadog, etc.)
- [ ] Slack/Discord webhook notifications

---

## Related Documentation

- `docs/COST_ANALYSIS_CONVEX_VS_VERCEL.md` - Detailed cost analysis
- `convex/resourceMonitoring.ts` - Backend implementation
- `components/resource-usage-monitor.tsx` - UI implementation
- `convex/crons.ts` - Cron job configuration

---

**Status:** ✅ Complete and ready for testing  
**Date:** October 24, 2025  
**Next Step:** Deploy and monitor for 7 days to verify cron behavior
