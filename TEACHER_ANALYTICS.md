# Teacher Analytics Feature Documentation

## Overview

The Teacher Analytics feature provides comprehensive performance metrics and insights for moderators to track teacher performance, class booking trends, and approval rates at their school.

## Architecture

### Backend (`convex/analytics.ts`)

Contains 5 main queries:

#### 1. `getTeacherAnalytics`

**Purpose**: Get detailed statistics for each teacher at a school
**Parameters**:

- `schoolId`: School to analyze
- `startDate`: Optional filter start date
- `endDate`: Optional filter end date

**Returns**: Array of teacher statistics including:

- Total classes booked
- Pending, acknowledged, approved, rejected counts
- Approval rate percentage

#### 2. `getSchoolAnalytics`

**Purpose**: Get overall school-level statistics
**Parameters**: Same as above
**Returns**: Aggregated metrics:

- Total classes across all teachers
- Status breakdowns
- Number of unique active teachers
- Overall approval rate

#### 3. `getClassTrends`

**Purpose**: Time-series data for visualizing class booking trends
**Parameters**:

- `schoolId`, `startDate`, `endDate` (required)
- `interval`: "daily" | "weekly" | "monthly"

**Returns**: Array of time-period statistics showing approved/rejected/pending trends over time

#### 4. `getTeacherRanking`

**Purpose**: Ranked list of teachers by approval rate
**Parameters**: Same as `getTeacherAnalytics` plus optional `limit`
**Returns**: Top N teachers sorted by approval rate, then by total classes

#### 5. `getResponseTimeAnalytics`

**Purpose**: Placeholder for future response time tracking
**Note**: Currently returns a message indicating status change tracking needs implementation

### Frontend (`components/teacher-analytics.tsx`)

#### Key Features

1. **Date Range Filter**: 7 days, 30 days, 90 days, or all time
2. **Stat Cards**: Visual display of key metrics with color coding
3. **Top Teachers Ranking**: Medal-style display with gold/silver/bronze for top 3
4. **All Teachers Table**: Comprehensive table with approval rates color-coded:
   - Green: ≥80% approval
   - Yellow: 60-79% approval
   - Red: <60% approval
5. **Trend Chart**: Horizontal bar chart showing class status distribution over time
6. **Bilingual Support**: Full English/Thai translations

#### Component Props

```typescript
interface TeacherAnalyticsProps {
  schoolId: Id<"schools">;
}
```

## Integration

### Main App Integration (`app/page.tsx`)

- Analytics tab added to moderator navigation
- Only visible when: `user.role === "moderator" && user.schoolId`
- Tab icon: BarChart3 from lucide-react
- Conditionally rendered based on active tab

### Access Control

- **Moderators**: Can view analytics for their assigned school only
- **Teachers**: No access (tab not shown)
- **Admins**: Could be extended to view analytics for all schools

## Usage

### For Moderators

1. Login as a moderator user
2. Click the "Analytics" tab in the navigation
3. Use date range filters to focus on specific time periods
4. Review:
   - Overall school performance metrics
   - Individual teacher statistics
   - Top performing teachers
   - Booking trends over time

### For Developers

To extend the analytics:

1. **Add new metrics**: Extend queries in `convex/analytics.ts`
2. **Add visualizations**: Update `components/teacher-analytics.tsx`
3. **Add filters**: Extend the `dateRange` state or add new filter parameters

## Data Flow

```
User selects date range
    ↓
Component updates startDate/endDate
    ↓
Convex queries re-execute with new parameters
    ↓
Real-time data updates via Convex subscriptions
    ↓
UI re-renders with new statistics
```

## Performance Considerations

### Query Optimization

- Uses indexed queries (`by_school`, `by_school_and_date`)
- Date filtering done in-memory after index-based retrieval
- Compound indexes for efficient date range queries

### Caching

- Convex automatically caches query results
- Real-time updates when underlying data changes
- No manual cache management needed

## Future Enhancements

### Potential Features

1. **Response Time Tracking**
   - Add `statusChanges` array to classes schema
   - Track timestamp for each status transition
   - Calculate avg time: pending → acknowledged → approved/rejected

2. **Export to CSV/PDF**
   - Add export button
   - Generate downloadable reports

3. **Comparative Analytics**
   - Compare multiple schools (admin only)
   - School-to-school benchmarking

4. **Advanced Visualizations**
   - Line charts for trends
   - Pie charts for status distribution
   - Heatmaps for busiest booking times

5. **Predictive Analytics**
   - Forecast class booking volumes
   - Identify patterns in approval/rejection

6. **Teacher Notifications**
   - Alert teachers about low approval rates
   - Suggest improvements

## Bilingual Content

All UI text includes both English and Thai translations using the `t()` helper:

```tsx
{t("Analytics", "การวิเคราะห์")}
{t("Teacher Analytics", "การวิเคราะห์ข้อมูลครู")}
{t("Performance metrics and class booking statistics", 
   "ตัวชี้วัดประสิทธิภาพและสถิติการจองคลาส")}
```

## Testing

### Manual Testing Checklist

- [ ] Analytics tab appears for moderators
- [ ] Analytics tab hidden for teachers
- [ ] Date range filters work correctly
- [ ] Stat cards display accurate numbers
- [ ] Teacher ranking shows correct order
- [ ] All teachers table shows complete data
- [ ] Trend chart displays correctly
- [ ] Approval rate calculations are accurate
- [ ] Bilingual text displays properly
- [ ] Dark mode styling works
- [ ] Responsive layout on mobile/tablet/desktop

### Test Data Requirements

- At least one school with assigned moderator
- Multiple teachers with varied booking history
- Classes in different statuses (pending, approved, rejected)
- Classes across different date ranges

## Error Handling

The component handles:

- **Loading state**: Shows "Loading analytics..." message
- **No data**: Empty states handled gracefully
- **Missing school assignment**: Analytics tab not shown
- **Query failures**: Convex automatically retries failed queries

## Styling

### Tailwind Classes Used

- Stat cards: `rounded-lg shadow-lg` with color-coded backgrounds
- Table: Responsive with hover states
- Trend chart: Horizontal bars with percentage-based widths
- Dark mode: All components support `dark:` variants

### Color Scheme

- Blue: General analytics (total, trends)
- Green: Approved, success metrics
- Red: Rejected metrics
- Yellow: Pending items
- Purple: Rates and percentages
- Indigo: Acknowledged items
- Cyan: User counts

## Files Changed/Added

### New Files

1. `convex/analytics.ts` - Backend queries
2. `components/teacher-analytics.tsx` - Frontend component

### Modified Files

1. `app/page.tsx` - Added analytics tab and integration

## Dependencies

No new dependencies required - uses existing:

- Convex React hooks
- Lucide React icons
- Tailwind CSS
- Language context
