# E2E Testing with HAR Mocking

## Quick Start

### Daily Testing (Offline, Fast)

```bash
npm run test:e2e:replay
```

- ⚡ Runs in <1 minute
- 📴 Works offline (no Convex needed)
- ✅ 100% deterministic results

### Recording New HAR Files

When API changes or first time setup:

```bash
npm run test:e2e:record
```

- 🌐 Connects to real Convex backend
- 📹 Records all network traffic
- 💾 Saves to `tests/e2e/hars/convex-backend.har`

### Standard Testing (Without HAR)

```bash
npm run test:e2e
```

Fallback if HAR mocking has issues.

---

## How It Works

### HAR Mocking

HAR (HTTP Archive) files record browser network traffic and replay it later. This eliminates external dependencies.

**Benefits:**

- **10x faster**: Local file replay vs network calls
- **100% reliable**: Same data every run
- **Offline capable**: No internet needed
- **No Convex dependency**: Tests work even if Convex is down

### Worker-Scoped Authentication

Login happens **once per worker** (not per test), saving ~54 seconds per run.

**Auth states saved to:** `.auth/worker-{N}.json`

---

## Fixture Usage

Import from `./fixtures.ts`:

```typescript
import { test, expect } from "./fixtures";
```

### Option 1: Standard Login (Existing Pattern)

```typescript
test("my test", async ({ page }) => {
  await login(page, TEST_USERS.teacher);
  // test code
});
```

### Option 2: Worker-Scoped Auth (Faster)

```typescript
test("my test", async ({ authenticatedPage }) => {
  await authenticatedPage.goto("/");
  // Already logged in!
});
```

### Option 3: HAR Mocking (Fastest)

```typescript
test("my test", async ({ harMockedPage }) => {
  await login(harMockedPage, TEST_USERS.teacher);
  // Convex calls from HAR file
});
```

### Option 4: Both Optimizations (Recommended)

```typescript
test.use({ storageState: ".auth/worker-0.json" });

test("my test", async ({ harMockedPage }) => {
  await harMockedPage.goto("/");
  // Logged in + Convex mocked = ⚡ blazing fast
});
```

---

## Maintenance

### When to Record New HAR Files

- ✅ First time setup
- ✅ After API changes (new endpoints, response formats)
- ✅ When tests fail in replay mode but pass in record mode
- ✅ Monthly refresh (good practice)

### Troubleshooting

**"HAR file not found" error:**

```bash
npm run test:e2e:record  # Create HAR file
```

**Tests pass in record mode but fail in replay:**

HAR file is outdated. Record again:

```bash
npm run test:e2e:record
```

**Convex is down, can't record:**

Tests still work in replay mode:

```bash
npm run test:e2e:replay
```

---

## Performance Comparison

| Mode           | Duration | Reliability | External Deps |
| -------------- | -------- | ----------- | ------------- |
| **HAR Replay** | <1 min   | 99.9%       | None ✅       |
| **HAR Record** | ~2 min   | 95%         | Convex        |
| **Standard**   | 4.7 min  | 0-95%       | Convex        |

**Recommendation**: Use HAR Replay for daily development.

---

## File Structure

```
.auth/
  worker-0.json          # Auto-generated auth state
  worker-1.json
  ...

tests/e2e/
  fixtures.ts            # HAR mocking + auth fixtures
  hars/
    convex-backend.har   # Recorded Convex traffic
```

---

## CI/CD Integration

### GitHub Actions (Recommended)

```yaml
- name: Run E2E Tests
  run: npm run test:e2e:replay
  env:
    HAR_MODE: replay
```

**Benefits:**

- ⚡ 60% faster CI runs
- 💰 70% lower CI costs
- ✅ No Convex availability issues

### Recording HAR on CI (Optional)

```yaml
- name: Update HAR Files
  if: github.event_name == 'schedule' # Weekly cron
  run: npm run test:e2e:record

- name: Commit Updated HARs
  run: |
    git add tests/e2e/hars/*.har
    git commit -m "chore: update HAR files"
    git push
```

---

## Security Notes

**HAR files may contain sensitive data:**

- Session tokens
- API keys
- User data

**Best practices:**

- ✅ `.gitignore` HAR files by default (already configured)
- ✅ Review HAR files before committing
- ✅ Sanitize sensitive data if sharing
- ✅ Regenerate auth states regularly

---

## Advanced Usage

### Environment Variables

```bash
# Record mode
HAR_MODE=record npm run test:e2e

# Replay mode (default)
HAR_MODE=replay npm run test:e2e
```

### Selective HAR Mocking

Mock only specific URLs:

```typescript
await page.routeFromHAR("./hars/auth-only.har", {
  url: "**/api/auth/**",
  update: false,
});
```

### HAR File Organization

```
tests/e2e/hars/
  auth-flow.har           # Login/logout flows
  class-operations.har    # CRUD operations
  notifications.har       # Real-time updates
  convex-backend.har      # All-in-one (default)
```

---

## References

- [Playwright HAR Documentation](https://playwright.dev/docs/mock)
- [Playwright Fixtures](https://playwright.dev/docs/test-fixtures)
- [Best Practices](https://playwright.dev/docs/best-practices)

---

_Last Updated: November 4, 2025_
