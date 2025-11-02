# Logging & Monitoring Guide

[← Back to Index](../copilot-instructions.md)

---

## 🔍 Purpose

Complete guide to extracting logs, monitoring system health, and debugging production issues across all stack components.

**When to Use**: Troubleshooting, performance analysis, security audits, compliance reporting

---

## 1. Convex Logs (Backend)

### Accessing Convex Logs

**Dashboard Method** (Recommended):

```
1. Visit https://dashboard.convex.dev
2. Select your deployment
3. Click "Logs" in left sidebar
4. Filter by:
   - Time range (last hour, day, week, custom)
   - Function name (e.g., "classes:book")
   - Log level (info, warn, error)
   - Search text
```

**Common Log Queries**:

```typescript
// In your Convex functions, use console.log/warn/error
export const book = mutation({
  handler: async (ctx, args) => {
    console.log("📝 Booking class", { 
      teacherId: args.teacherId, 
      studentId: args.studentId,
      timestamp: new Date().toISOString()
    });
    
    try {
      // ... business logic
      console.log("✅ Class booked successfully", { classId });
    } catch (error) {
      console.error("❌ Booking failed", { 
        error: error.message,
        stack: error.stack,
        args 
      });
      throw error;
    }
  }
});
```

### Structured Logging Best Practices

```typescript
// ✅ GOOD - Structured logs with context
console.log("User login", {
  userId,
  username,
  deviceType,
  timestamp: Date.now(),
  success: true
});

// ❌ BAD - Unstructured string
console.log("User logged in");
```

### Convex Log Retention

- **Free Tier**: 7 days
- **Professional**: 30 days
- **Enterprise**: Custom retention

**Export logs before expiration**:

```powershell
# No direct API - use dashboard export
# Dashboard → Logs → Export → Download CSV
```

### Performance Monitoring in Convex

```typescript
// Track slow queries
export const slowQueryExample = query({
  handler: async (ctx, args) => {
    const start = Date.now();
    
    const result = await ctx.db.query("classes").collect();
    
    const duration = Date.now() - start;
    if (duration > 1000) {
      console.warn("🐌 Slow query detected", {
        function: "slowQueryExample",
        duration: `${duration}ms`,
        resultCount: result.length
      });
    }
    
    return result;
  }
});
```

### Convex Error Tracking

```typescript
// Custom error logging with context
export const errorLoggingExample = mutation({
  handler: async (ctx, args) => {
    try {
      // ... operation
    } catch (error) {
      // Log to database for admin review
      await ctx.db.insert("errorReports", {
        errorMessage: error.message,
        errorStack: error.stack,
        functionName: "errorLoggingExample",
        userId: args.userId,
        timestamp: Date.now(),
        severity: "high",
        context: JSON.stringify(args)
      });
      
      // Also console.error for Convex logs
      console.error("Error in errorLoggingExample", {
        error: error.message,
        userId: args.userId
      });
      
      throw error;
    }
  }
});
```

---

## 2. Vercel Logs (Frontend & Edge)

### Accessing Vercel Logs

**CLI Method** (Real-time):

```powershell
# Install Vercel CLI if not installed
npm i -g vercel

# Login
vercel login

# View real-time logs (all deployments)
vercel logs

# Logs for specific deployment
vercel logs https://your-deployment-url.vercel.app

# Filter by time
vercel logs --since 1h    # Last hour
vercel logs --since 24h   # Last 24 hours
vercel logs --until 2h    # Until 2 hours ago

# Follow logs (like tail -f)
vercel logs --follow

# Filter by source
vercel logs --output    # Build output
vercel logs --build     # Build logs only
```

**Dashboard Method**:

```
1. Visit https://vercel.com/dashboard
2. Select your project
3. Click "Deployments" tab
4. Click specific deployment
5. View tabs:
   - Build Logs (compilation)
   - Functions Logs (API routes, edge functions)
   - Edge Network Logs (CDN, routing)
```

### Vercel Log Types

**Build Logs** - Deployment compilation:

```
- npm install output
- TypeScript compilation
- Next.js build
- Static generation
- Bundle sizes
```

**Runtime Logs** - Production execution:

```
- API route requests
- Edge function invocations
- Errors and exceptions
- console.log from server components
```

**Edge Network Logs** - CDN and routing:

```
- Request/response times
- Cache hits/misses
- Geographic distribution
- Error rates by region
```

### Adding Custom Logs to Next.js

```typescript
// app/api/example/route.ts
export async function POST(request: Request) {
  const start = Date.now();
  
  console.log("📨 API Request", {
    path: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers),
    timestamp: new Date().toISOString()
  });
  
  try {
    const body = await request.json();
    const result = await processRequest(body);
    
    console.log("✅ API Success", {
      path: request.url,
      duration: `${Date.now() - start}ms`,
      statusCode: 200
    });
    
    return Response.json(result);
  } catch (error) {
    console.error("❌ API Error", {
      path: request.url,
      error: error.message,
      stack: error.stack,
      duration: `${Date.now() - start}ms`
    });
    
    return Response.json({ error: error.message }, { status: 500 });
  }
}
```

### Vercel Analytics Integration

```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}

// Automatically tracks:
// - Page views
// - Navigation
// - Web vitals (LCP, FID, CLS)
```

### Vercel Speed Insights

```powershell
# Install
npm i @vercel/speed-insights

# Add to layout
import { SpeedInsights } from "@vercel/speed-insights/next"

<SpeedInsights />
```

---

## 3. Browser Console Logs (Client-Side)

### Accessing Browser Logs

**Chrome DevTools**:

```
1. Press F12 or Ctrl+Shift+I (Cmd+Option+I on Mac)
2. Click "Console" tab
3. Filter by:
   - Errors (red X icon)
   - Warnings (yellow ⚠ icon)
   - Info (blue ℹ icon)
   - Logs (default)
4. Search logs: Ctrl+F
5. Clear console: Click 🚫 icon or Ctrl+L
```

**Firefox DevTools**:

```
1. Press F12 or Ctrl+Shift+I
2. Click "Console" tab
3. Right-click → Show Timestamps
4. Filter by log level in dropdown
```

**Safari DevTools**:

```
1. Safari → Preferences → Advanced → Show Develop menu
2. Develop → Show JavaScript Console (Cmd+Option+C)
3. Filter logs using search box
```

### Capturing Client-Side Errors

```typescript
// app/layout.tsx - Global error boundary
'use client';

import { useEffect } from 'react';

export function ErrorBoundaryLogger({ children }) {
  useEffect(() => {
    // Catch unhandled errors
    window.addEventListener('error', (event) => {
      console.error('🚨 Unhandled Error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error?.stack,
        timestamp: new Date().toISOString()
      });
      
      // Send to backend for logging
      fetch('/api/log-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: event.message,
          stack: event.error?.stack,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: Date.now()
        })
      });
    });
    
    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      console.error('🚨 Unhandled Promise Rejection', {
        reason: event.reason,
        promise: event.promise,
        timestamp: new Date().toISOString()
      });
    });
  }, []);
  
  return children;
}
```

### Performance Monitoring (Client-Side)

```typescript
// Track page load performance
useEffect(() => {
  if (typeof window !== 'undefined' && window.performance) {
    const perfData = window.performance.timing;
    const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
    
    console.log('📊 Page Performance', {
      pageLoadTime: `${pageLoadTime}ms`,
      domContentLoaded: `${perfData.domContentLoadedEventEnd - perfData.navigationStart}ms`,
      firstPaint: window.performance.getEntriesByType('paint')[0]?.startTime
    });
  }
}, []);
```

### Network Request Monitoring

```
Chrome DevTools → Network Tab:
1. See all HTTP requests
2. Filter by type (XHR, JS, CSS, Img)
3. Click request → Headers/Preview/Response tabs
4. Right-click request → Copy → Copy as cURL
5. Throttle network: Slow 3G, Fast 3G, Offline
```

---

## 4. GitHub Actions Logs (CI/CD)

### Accessing GitHub Actions Logs

```
1. Visit your repository on GitHub
2. Click "Actions" tab
3. Select workflow run
4. Click job name (e.g., "Build and Test")
5. Expand steps to see detailed logs
6. Download logs: Click gear icon → Download log archive
```

### GitHub Actions Workflow with Logging

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: |
          echo "📦 Installing dependencies..."
          npm ci
          echo "✅ Dependencies installed"
      
      - name: TypeScript Check
        run: |
          echo "🔍 Running TypeScript check..."
          npx tsc --noEmit
          echo "✅ TypeScript check passed"
      
      - name: Build
        run: |
          echo "🏗️ Building application..."
          npm run build
          echo "✅ Build successful"
        env:
          NEXT_PUBLIC_CONVEX_URL: ${{ secrets.NEXT_PUBLIC_CONVEX_URL }}
      
      - name: Run Tests
        run: |
          echo "🧪 Running tests..."
          npm run test:e2e
          echo "✅ All tests passed"
      
      # Upload logs on failure
      - name: Upload logs on failure
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: build-logs
          path: |
            npm-debug.log
            .next/build.log
            playwright-report/
```

### Debugging Failed GitHub Actions

```powershell
# Run workflow locally using act (requires Docker)
# Install act: https://github.com/nektos/act

# Run entire workflow
act

# Run specific job
act -j build

# Run with secrets
act -s NEXT_PUBLIC_CONVEX_URL=https://your-url.convex.cloud

# Debug mode (step-by-step)
act --verbose
```

### GitHub Actions Notifications

```yaml
# Send notifications on failure
- name: Notify on failure
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    text: 'Build failed! Check logs at ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}'
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

---

## 5. MongoDB Atlas Logs (Backup Database)

### Accessing MongoDB Logs

**Atlas Dashboard**:

```
1. Visit https://cloud.mongodb.com
2. Select your cluster
3. Click "... (More)" → "View Monitoring"
4. Tabs:
   - Operations (slow queries)
   - Performance (metrics)
   - Real-time (live queries)
   - Logs (error logs)
```

### MongoDB Slow Query Logs

```javascript
// Enable profiling (temporarily, for debugging)
db.setProfilingLevel(1, { slowms: 100 }); // Log queries >100ms

// View slow queries
db.system.profile.find().limit(5).sort({ ts: -1 }).pretty();

// Disable profiling
db.setProfilingLevel(0);
```

### MongoDB Connection Logs

```powershell
# Test connection and log details
node -e "
const { MongoClient } = require('mongodb');
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, { 
  serverApi: { version: '1', strict: true, deprecationErrors: true }
});

async function run() {
  try {
    await client.connect();
    console.log('✅ MongoDB Connected');
    const db = client.db('admin');
    const result = await db.command({ ping: 1 });
    console.log('📊 Ping result:', result);
    
    // Get database stats
    const stats = await db.stats();
    console.log('📦 Database stats:', {
      collections: stats.collections,
      dataSize: (stats.dataSize / 1024 / 1024).toFixed(2) + ' MB',
      indexSize: (stats.indexSize / 1024 / 1024).toFixed(2) + ' MB'
    });
  } catch (error) {
    console.error('❌ MongoDB Error:', error.message);
  } finally {
    await client.close();
  }
}
run();
"
```

---

## 6. Application Error Logging (Custom)

### Error Reporting to Admin

**Your current implementation**:

```typescript
// convex/adminErrorReports.ts
export const create = mutation({
  args: {
    errorMessage: v.string(),
    errorStack: v.optional(v.string()),
    componentName: v.optional(v.string()),
    userId: v.optional(v.id("users")),
    userAction: v.optional(v.string()),
    browserInfo: v.optional(v.string()),
    url: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const reportId = await ctx.db.insert("adminErrorReports", {
      ...args,
      status: "new",
      severity: "medium",
      reportedAt: Date.now(),
    });
    
    console.log("📝 Error report created", { reportId, ...args });
    return reportId;
  },
});
```

### Client-Side Error Reporting

```typescript
// lib/error-reporter.ts
export async function reportError(error: Error, context?: {
  componentName?: string;
  userAction?: string;
  additionalInfo?: any;
}) {
  const user = loadUserSession();
  
  const errorReport = {
    errorMessage: error.message,
    errorStack: error.stack,
    componentName: context?.componentName,
    userId: user?._id,
    userAction: context?.userAction,
    browserInfo: navigator.userAgent,
    url: window.location.href,
    timestamp: new Date().toISOString(),
    additionalInfo: JSON.stringify(context?.additionalInfo)
  };
  
  console.error("🚨 Reporting error to admin", errorReport);
  
  try {
    await fetch('/api/log-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(errorReport)
    });
  } catch (reportingError) {
    console.error("❌ Failed to report error", reportingError);
  }
}

// Usage
try {
  await bookClass(classData);
} catch (error) {
  reportError(error, {
    componentName: 'ClassBooking',
    userAction: 'Attempted to book class',
    additionalInfo: { classData }
  });
  toast.error("Booking failed", "การจองล้มเหลว");
}
```

---

## 7. Performance Monitoring

### Real User Monitoring (RUM)

```typescript
// Track real user performance metrics
export function trackPerformance(metricName: string, duration: number) {
  console.log(`⏱️ Performance: ${metricName}`, {
    duration: `${duration}ms`,
    timestamp: new Date().toISOString()
  });
  
  // Send to analytics (optional)
  if (window.gtag) {
    window.gtag('event', 'timing_complete', {
      name: metricName,
      value: duration,
      event_category: 'Performance'
    });
  }
}

// Usage
const start = Date.now();
await loadStudents();
trackPerformance('Load Students', Date.now() - start);
```

### Convex Query Performance

```typescript
// Monitor query performance
export const monitoredQuery = query({
  handler: async (ctx, args) => {
    const start = Date.now();
    
    const result = await ctx.db
      .query("classes")
      .withIndex("by_school_and_date", q => 
        q.eq("schoolId", args.schoolId)
         .gte("scheduledDate", args.startDate)
      )
      .collect();
    
    const duration = Date.now() - start;
    
    console.log("📊 Query Performance", {
      queryName: "classes.bySchoolAndDate",
      duration: `${duration}ms`,
      resultCount: result.length,
      schoolId: args.schoolId,
      indexed: true // Using .withIndex()
    });
    
    if (duration > 1000) {
      console.warn("🐌 Slow Query Alert", {
        queryName: "classes.bySchoolAndDate",
        duration: `${duration}ms`,
        threshold: "1000ms"
      });
    }
    
    return result;
  }
});
```

---

## 8. Log Aggregation & Analysis

### Exporting Logs for Analysis

```powershell
# Export Convex logs (manual from dashboard)
# Dashboard → Logs → Export → Download CSV

# Export Vercel logs
vercel logs --since 24h > vercel-logs-$(Get-Date -Format yyyy-MM-dd).txt

# Export GitHub Actions logs
# GitHub → Actions → Workflow → Download logs

# Combine for analysis
$convexLogs = Import-Csv "convex-logs.csv"
$vercelLogs = Get-Content "vercel-logs.txt"

# Search for errors
$errors = $convexLogs | Where-Object { $_.level -eq "error" }
$errors | Format-Table -AutoSize
```

### Common Log Analysis Queries

```powershell
# Find all errors in last 24 hours
$convexLogs | Where-Object { 
  $_.level -eq "error" -and 
  $_.timestamp -gt (Get-Date).AddDays(-1) 
} | Group-Object functionName | Sort-Object Count -Descending

# Find slow queries
$convexLogs | Where-Object { 
  $_.message -like "*duration*" -and 
  [int]$_.duration -gt 1000 
} | Sort-Object duration -Descending

# Find most active users
$convexLogs | Where-Object { 
  $_.userId 
} | Group-Object userId | Sort-Object Count -Descending | Select-Object -First 10
```

### Third-Party Log Management (Optional)

**Sentry** (Error Tracking):

```powershell
npm install @sentry/nextjs

# Configure in sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV
});
```

**LogRocket** (Session Replay):

```typescript
import LogRocket from 'logrocket';

LogRocket.init('your-app-id');

// Identify users
LogRocket.identify(userId, {
  name: username,
  role: userRole
});
```

**Datadog** (Full Stack Monitoring):

```typescript
import { datadogRum } from '@datadog/browser-rum';

datadogRum.init({
  applicationId: 'your-app-id',
  clientToken: 'your-client-token',
  site: 'datadoghq.com',
  service: 'class-tracker',
  env: 'production',
  version: '4.5.17',
  sessionSampleRate: 100,
  premiumSampleRate: 100,
  trackInteractions: true,
  defaultPrivacyLevel: 'mask-user-input'
});
```

---

## 9. Monitoring Checklist

### Daily Monitoring (5 minutes)

- [ ] Check Convex dashboard for errors (last 24 hours)
- [ ] Check Vercel deployment status (green/red)
- [ ] Review error reports in admin dashboard
- [ ] Check system health: `npm run dev` starts cleanly

### Weekly Monitoring (15 minutes)

- [ ] Review Convex usage (Database, Functions, Bandwidth)
- [ ] Check slow query logs (>1 second)
- [ ] Review error trends (increasing/decreasing)
- [ ] Test backup: `npm run backup`
- [ ] Check MongoDB Atlas cluster health

### Monthly Monitoring (30 minutes)

- [ ] Export and archive logs (Convex, Vercel, GitHub Actions)
- [ ] Review performance metrics (page load times)
- [ ] Audit user activity logs
- [ ] Check for unused indexes or tables
- [ ] Review and clean old error reports
- [ ] Security audit: Check login failures, locked accounts

---

## 10. Quick Reference: Where to Find What

| Need | Location | Access Method |
|------|----------|---------------|
| **Backend errors** | Convex Dashboard | <https://dashboard.convex.dev> → Logs |
| **Frontend errors** | Vercel Dashboard | `vercel logs` or dashboard |
| **Client errors** | Browser Console | F12 → Console |
| **Build errors** | GitHub Actions | Repository → Actions tab |
| **Database errors** | MongoDB Atlas | <https://cloud.mongodb.com> → Monitoring |
| **User errors** | Admin Dashboard | Login → Error Reports tab |
| **Performance metrics** | Convex Dashboard | Dashboard → Usage tab |
| **Slow queries** | Convex Logs | Filter logs → Search "duration" |
| **Failed deploys** | Vercel Dashboard | Deployments → Failed |
| **CI/CD logs** | GitHub Actions | Actions → Workflow run |

---

[← Back to Index](../copilot-instructions.md)
