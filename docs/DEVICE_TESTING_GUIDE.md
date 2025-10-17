# Device Testing Guide - Items 1-6

**Project:** Evan's Class Tracker 4.5  
**Testing Dashboard:** `/admin/testing`  
**Date:** October 17, 2025

---

## 🎯 Overview

This guide helps you manually test items 1-6 from `docs/IMPLEMENTATION_REVIEW_AND_STATUS.md`:

1. Mobile device detection (iPhone, Android)
2. Tablet detection (iPad)
3. Desktop detection (laptop, desktop)
4. Window resize re-detection
5. Database sync verification
6. Service worker registration

---

## 🚀 Quick Start

### Access Testing Dashboard

1. Start the development server:

   ```powershell
   npm run dev
   ```

2. Open browser: `http://localhost:3000`

3. Login with admin credentials:
   - Username: `admin`
   - Password: `TeacherAdmin` (or your changed password)

4. Click the **"Testing"** tab in the navigation bar

5. View real-time test results

---

## 📱 Test 1: Mobile Device Detection

**Goal:** Verify the app correctly detects mobile devices

### Testing Steps

1. **Using Real Mobile Device:**
   - Open `http://[your-local-ip]:3000` on iPhone or Android phone
   - Login as admin
   - Navigate to Testing tab
   - Verify "Mobile Device Detection" shows ✅ green checkmark
   - Check device type shows "mobile"
   - Verify window width is ≤768px

2. **Using Browser DevTools:**
   - Open Chrome DevTools (F12)
   - Click "Toggle device toolbar" (Ctrl+Shift+M)
   - Select iPhone or Android device
   - Refresh page
   - Check device type shows "mobile"

### Expected Results

- ✅ Device type: `mobile`
- ✅ Window width: `< 768px`
- ✅ Test status: Green checkmark
- ✅ Database synced with "mobile"

### Troubleshooting

- **Issue:** Shows "desktop" on mobile
  - **Solution:** Clear browser cache and refresh
  - **Solution:** Check window.innerWidth in console

- **Issue:** Database not syncing
  - **Solution:** Wait 2-3 seconds for mutation to complete
  - **Solution:** Check Convex dashboard for errors

---

## 📲 Test 2: Tablet Detection

**Goal:** Verify the app correctly detects tablet devices

### Testing Steps

1. **Using Real Tablet Device:**
   - Open `http://[your-local-ip]:3000` on iPad or Android tablet
   - Login as admin
   - Navigate to Testing tab
   - Verify "Tablet Detection" shows ✅ green checkmark
   - Check device type shows "tablet"
   - Verify window width is 768px-1024px

2. **Using Browser DevTools:**
   - Open Chrome DevTools (F12)
   - Toggle device toolbar
   - Select iPad or custom tablet (768px-1024px width)
   - Refresh page
   - Check device type shows "tablet"

### Expected Results

- ✅ Device type: `tablet`
- ✅ Window width: `768px - 1024px`
- ✅ Test status: Green checkmark
- ✅ Database synced with "tablet"

---

## 🖥️ Test 3: Desktop Detection

**Goal:** Verify the app correctly detects desktop devices

### Testing Steps

1. **Using Desktop Browser:**
   - Open `http://localhost:3000` in full-screen browser
   - Login as admin
   - Navigate to Testing tab
   - Verify "Desktop Detection" shows ✅ green checkmark
   - Check device type shows "desktop"
   - Verify window width is >1024px

2. **Multiple Desktop Tests:**
   - Test on Windows desktop
   - Test on Mac desktop (if available)
   - Test on Linux desktop (if available)
   - Verify all show "desktop"

### Expected Results

- ✅ Device type: `desktop`
- ✅ Window width: `> 1024px`
- ✅ Test status: Green checkmark
- ✅ Database synced with "desktop"

---

## 🔄 Test 4: Window Resize Re-detection

**Goal:** Verify device type updates when window is resized

### Testing Steps

1. **Start with Desktop:**
   - Open browser in full screen (>1024px width)
   - Navigate to Testing tab
   - Verify "Resize events: 1"

2. **Resize to Tablet:**
   - Drag browser window to 900px width (between 768-1024px)
   - Watch device type change to "tablet"
   - Verify "Resize events" counter increments

3. **Resize to Mobile:**
   - Drag browser window to 600px width (<768px)
   - Watch device type change to "mobile"
   - Verify "Resize events" counter increments again

4. **Resize Back to Desktop:**
   - Drag browser window back to full screen
   - Watch device type change to "desktop"
   - Verify final "Resize events" count is 4+

### Expected Results

- ✅ Device type updates in real-time
- ✅ Resize counter increments with each size change
- ✅ Test status: Green checkmark (after 2+ resizes)
- ✅ No page refresh required

### Visual Cues

- Device icon changes (Smartphone → Tablet → Monitor)
- Device type label updates
- Window dimensions update in real-time

---

## 💾 Test 5: Database Sync Verification

**Goal:** Verify device type syncs to Convex database

### Testing Steps

1. **Check Initial Sync:**
   - Login as admin
   - Navigate to Testing tab
   - Check "Database Sync Verification" section
   - Verify "DB" and "Local" values match

2. **Test Sync on Device Change:**
   - Resize window to change device type
   - Wait 2-3 seconds
   - Verify "DB" value updates to match "Local"
   - Check green checkmark appears

3. **Verify in Convex Dashboard:**
   - Open Convex dashboard: `https://dashboard.convex.dev`
   - Navigate to "Data" → "users" table
   - Find admin user record
   - Check `deviceType` field matches current device
   - Check `lastDeviceUpdate` timestamp is recent

### Expected Results

- ✅ DB device type matches local device type
- ✅ Test status: Green checkmark
- ✅ Convex dashboard shows correct deviceType
- ✅ lastDeviceUpdate timestamp is current

### Troubleshooting

- **Issue:** DB shows different type than Local
  - **Solution:** Wait 3-5 seconds for sync
  - **Solution:** Check browser console for errors
  - **Solution:** Verify Convex dev server is running

- **Issue:** Sync never completes
  - **Solution:** Restart `npx convex dev`
  - **Solution:** Check network tab for failed requests
  - **Solution:** Verify `NEXT_PUBLIC_CONVEX_URL` in .env.local

---

## 🔔 Test 6: Service Worker Registration

**Goal:** Verify service worker is registered for push notifications

### Testing Steps

1. **Check Service Worker Status:**
   - Navigate to Testing tab
   - Check "Service Worker Registration" section
   - Verify status shows "registered"
   - Check push permission status

2. **Verify in DevTools:**
   - Open browser DevTools (F12)
   - Go to "Application" tab
   - Click "Service Workers" in left sidebar
   - Verify service worker is listed
   - Check status is "activated"
   - Verify scope is `/`

3. **Test Push Permissions:**
   - Check notification permission in testing dashboard
   - If "default", click to request permission
   - Grant permission when prompted
   - Verify permission changes to "granted"

4. **Test Service Worker Functionality:**
   - Check "Push" option in Service Workers panel
   - Click "Push" to send test notification
   - Verify notification appears on desktop

### Expected Results

- ✅ Service worker status: "registered"
- ✅ Service worker state: "activated"
- ✅ Push permission: "granted" (after user grants)
- ✅ Test notifications display correctly

### Service Worker Files

- **Main file:** `public/sw.js`
- **Initialization:** `lib/init-sw.ts`
- **Registration:** Runs automatically on app load

### Troubleshooting

- **Issue:** Service worker "not-supported"
  - **Solution:** Use HTTPS or localhost (service workers require secure context)
  - **Solution:** Update to modern browser (Chrome 40+, Firefox 44+, Safari 11.1+)

- **Issue:** Service worker "not-registered"
  - **Solution:** Check browser console for registration errors
  - **Solution:** Verify `public/sw.js` file exists
  - **Solution:** Clear browser cache and hard refresh (Ctrl+Shift+R)

- **Issue:** Push permission "denied"
  - **Solution:** Reset permission in browser settings
  - **Solution:** Chrome: Settings → Privacy → Site Settings → Notifications
  - **Solution:** Firefox: Address bar lock icon → Permissions → Notifications

---

## 📊 Testing Dashboard Features

### Real-time Monitoring

The testing dashboard provides:

- **Live device detection** - Updates without refresh
- **Resize counter** - Tracks window size changes
- **Sync status** - Shows DB vs Local comparison
- **Service worker status** - Real-time registration check
- **Progress indicator** - Shows % of tests passing
- **Debug info** - JSON output of user data

### Test Result Indicators

- ✅ **Green checkmark** - Test passing
- ❌ **Red X** - Test failing
- **Percentage badge** - Overall pass rate

### Device Info Card

Shows current device details:

- Device type with icon
- Window dimensions
- User agent (truncated)
- Last database update time

---

## 🎯 Success Criteria

All 6 tests should show ✅ when:

1. **Mobile Detection** - Correctly identifies phones (<768px)
2. **Tablet Detection** - Correctly identifies tablets (768-1024px)
3. **Desktop Detection** - Correctly identifies desktops (>1024px)
4. **Resize Detection** - Updates on window resize (2+ resize events)
5. **Database Sync** - DB and Local device types match
6. **Service Worker** - Status shows "registered" and activated

**Target:** 100% pass rate (6/6 tests passing)

---

## 🐛 Common Issues & Solutions

### Issue: All tests failing

**Possible Causes:**

- Not logged in as admin
- Convex dev server not running
- Network connectivity issues

**Solutions:**

1. Verify admin login credentials
2. Start Convex: `npx convex dev`
3. Start Next.js: `npm run dev`
4. Check browser console for errors

### Issue: Device type stuck on "desktop"

**Possible Causes:**

- Browser cache issue
- DevTools device emulation not working
- Window size detection broken

**Solutions:**

1. Hard refresh: Ctrl+Shift+R
2. Clear site data in DevTools
3. Restart browser
4. Check window.innerWidth in console

### Issue: Database sync always failing

**Possible Causes:**

- Convex mutation error
- User not authenticated
- Database schema mismatch

**Solutions:**

1. Check Convex dashboard logs
2. Verify user is logged in
3. Check convex/users.ts for updateDeviceType mutation
4. Restart Convex dev server

---

## 📝 Testing Checklist

Use this checklist to track your testing progress:

```markdown
## Device Testing Checklist

- [ ] 1. Mobile Detection - iPhone tested
- [ ] 1. Mobile Detection - Android tested
- [ ] 2. Tablet Detection - iPad tested
- [ ] 2. Tablet Detection - Android tablet tested
- [ ] 3. Desktop Detection - Windows tested
- [ ] 3. Desktop Detection - Mac tested
- [ ] 4. Resize Detection - Desktop → Tablet
- [ ] 4. Resize Detection - Tablet → Mobile
- [ ] 4. Resize Detection - Mobile → Desktop
- [ ] 5. Database Sync - Initial sync verified
- [ ] 5. Database Sync - Convex dashboard checked
- [ ] 6. Service Worker - Registration verified
- [ ] 6. Service Worker - DevTools checked
- [ ] 6. Service Worker - Test notification sent
- [ ] All tests passing (100%)
- [ ] Screenshots taken
- [ ] Issues documented
```

---

## 📸 Documentation

After testing, document your results:

1. **Take screenshots** of testing dashboard showing 100% pass rate
2. **Note any issues** encountered and solutions
3. **Record device specs** (OS, browser, screen size)
4. **Update TODO.md** to mark items 1-6 as complete

---

## 🚀 Next Steps

After completing tests 1-6:

1. Mark tests as complete in `TODO.md`
2. Update `docs/IMPLEMENTATION_REVIEW_AND_STATUS.md`
3. Move to next testing phase (messaging, notifications, etc.)
4. Begin YouTube downloader feature implementation

---

## 📞 Support

Need help? Check these resources:

- **Copilot Instructions:** `.github/copilot-instructions.md`
- **Implementation Status:** `docs/IMPLEMENTATION_REVIEW_AND_STATUS.md`
- **Feature Docs:** `FEATURES_DOCUMENTATION.md`
- **Convex Dashboard:** `https://dashboard.convex.dev`

---

**Happy Testing! 🎉**
