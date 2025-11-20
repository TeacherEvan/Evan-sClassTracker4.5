# System Bottleneck Analysis

**Date:** November 20, 2025
**Status:** Active Monitoring

---

## 🚨 Critical Bottlenecks

### 1. MongoDB Backup Size Limit (16MB)

**Severity:** 🔴 **CRITICAL**
**Component:** `scripts/backup-to-mongodb.ts`

**Issue:**
The current backup script stores the entire backup (all tables, all records) as a **single MongoDB document**.
MongoDB has a strict **16MB document size limit**.

```typescript
// scripts/backup-to-mongodb.ts
const backupDocument: BackupDocument = {
    metadata,
    data, // <--- Contains ALL data
};
await backupsCollection.insertOne(backupDocument);
```

**Impact:**
Once the total database size exceeds ~16MB, **backups will fail completely** with a BSON size error.
Current size is likely small (~5MB based on logs), but this is a hard wall.

**Recommendation:**

- **Immediate:** Monitor backup size daily.
- **Fix:** Refactor script to store each table as a separate document or use GridFS for the backup payload.

### 2. Backup Memory Usage

**Severity:** 🟡 **HIGH**
**Component:** `scripts/backup-to-mongodb.ts`

**Issue:**
The script loads **all data from all tables into memory** before writing to MongoDB.

```typescript
// scripts/backup-to-mongodb.ts
const data = await exportConvexData(); // Loads everything into RAM
```

**Impact:**
As data grows, the Node.js process running the backup may run out of memory (OOM) and crash.

**Recommendation:**

- Stream data from Convex to MongoDB instead of buffering it all in memory.
- Process one table at a time.

### 3. MongoDB Atlas Free Tier Storage (512MB)

**Severity:** 🟡 **MEDIUM**
**Component:** MongoDB Atlas

**Issue:**
We are using the free M0 cluster which has a **512MB storage limit**.
With daily full backups (no incremental), this limit will be reached quickly.

**Impact:**
MongoDB will stop accepting writes. Backups will fail.

**Recommendation:**

- Reduce retention period (currently 30 days).
- Implement incremental backups.
- Upgrade to paid tier or use local storage.

---

## ⚠️ Potential Performance Bottlenecks

### 1. N+1 Query Patterns

**Severity:** 🟡 **MEDIUM**
**Component:** Frontend / Convex Queries

**Issue:**
While many N+1 issues were fixed (Oct 2025), new features must be monitored.
Watch for components that map over a list and call a separate query for each item.

**Recommendation:**

- Always use `Promise.all` with batch fetching.
- Use `.withIndex()` for all queries.

### 2. Large DOM Size

**Severity:** 🟢 **LOW** (Fixed)
**Component:** Class Lists / Student Lists

**Issue:**
Rendering thousands of rows caused UI lag.
**Status:** Fixed via `PaginatedList` component (Oct 2025).

**Recommendation:**

- Ensure `PaginatedList` is used for all new list views.

---

## 🔄 Monitoring Plan

1. **Daily:** Check backup logs for "Size" metric.
2. **Weekly:** Check MongoDB Atlas storage usage.
3. **Monthly:** Review query performance in Convex dashboard.
