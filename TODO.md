# TODO List - Evan's Class Tracker 4.5

**Last Updated:** October 17, 2025

---

## 🚀 New Features

### 1. YouTube Video Downloader (HIGH PRIORITY)

**Description:** Add a YouTube video downloader feature using yt-dlp syntax to the Teacher Helper tab.

**Requirements:**

- Integrate yt-dlp functionality for downloading YouTube videos
- Add UI components in Teacher Helper tab
- Support various video quality options (720p, 1080p, etc.)
- Support audio-only extraction (MP3)
- Bilingual interface (EN/TH)
- Progress tracking for downloads
- Download history/management

**Technical Approach:**

- Backend: Create new Convex API endpoint or use external service
- Option 1: Server-side download via API (requires backend service)
- Option 2: Client-side with youtube-dl alternative library
- Option 3: Integration with third-party YouTube download API

**Files to Create/Modify:**

- `components/youtube-downloader.tsx` - New component
- `components/teacher-helper.tsx` - Add downloader tab
- `components/teacher-helper-admin.tsx` - Add downloader management
- `convex/youtubeDownloads.ts` - Backend API (if needed)
- `convex/schema.ts` - Add downloads table (if tracking history)

**Bilingual Labels:**

- "YouTube Downloader" / "ดาวน์โหลด YouTube"
- "Video URL" / "URL วิดีโอ"
- "Download Quality" / "คุณภาพการดาวน์โหลด"
- "Audio Only" / "เสียงเท่านั้น"
- "Download" / "ดาวน์โหลด"
- "Download History" / "ประวัติการดาวน์โหลด"

**Priority:** HIGH  
**Estimated Effort:** 4-6 hours  
**Status:** ⏳ Not Started

---

## ✅ Recently Completed

### Device Testing Dashboard (COMPLETED)

- ✅ Created comprehensive device testing dashboard
- ✅ Integrated into admin tab
- ✅ Tests items 1-6 from IMPLEMENTATION_REVIEW_AND_STATUS.md
- ✅ Real-time device detection verification
- ✅ Database sync monitoring
- ✅ Service worker status checking

---

## 🧪 Testing & QA

### Manual Testing Checklist (Items 1-6)

**Status:** Ready for Testing ✅

#### 1. Mobile Device Detection

- [ ] Test on iPhone (iOS Safari)
- [ ] Test on Android phone (Chrome)
- [ ] Verify device type shows as "mobile"
- [ ] Check window width detection (<768px)

#### 2. Tablet Detection

- [ ] Test on iPad (Safari)
- [ ] Test on Android tablet
- [ ] Verify device type shows as "tablet"
- [ ] Check window width detection (768px-1024px)

#### 3. Desktop Detection

- [ ] Test on Windows desktop
- [ ] Test on Mac desktop
- [ ] Test on Linux desktop
- [ ] Verify device type shows as "desktop"
- [ ] Check window width detection (>1024px)

#### 4. Window Resize Re-detection

- [ ] Start with desktop browser (>1024px)
- [ ] Resize to tablet width (768px-1024px)
- [ ] Verify device type updates to "tablet"
- [ ] Resize to mobile width (<768px)
- [ ] Verify device type updates to "mobile"
- [ ] Check resize counter increments

#### 5. Database Sync Verification

- [ ] Login as admin
- [ ] Navigate to Testing tab
- [ ] Verify "DB" and "Local" device types match
- [ ] Resize window to trigger change
- [ ] Wait 2-3 seconds for sync
- [ ] Verify database updated (green checkmark)

#### 6. Service Worker Registration

- [ ] Open DevTools → Application → Service Workers
- [ ] Verify service worker is registered
- [ ] Check status shows "activated"
- [ ] Verify notification permission status
- [ ] Test notification permission request (if needed)

**Testing Dashboard Access:**

- Login as `admin` user
- Navigate to "Testing" tab (admin only)
- View real-time test results

---

## 🔄 In Progress

_No items currently in progress_

---

## 📋 Backlog

### Performance Optimizations

- [ ] Implement code splitting for large components (see CODE_SPLITTING_RECOMMENDATIONS.md)
- [ ] Add lazy loading for admin-only components
- [ ] Optimize bundle size for mobile devices
- [ ] Add image optimization for user uploads (if applicable)

### Feature Enhancements

- [ ] Add bulk student import from CSV
- [ ] Add class schedule export to iCal format
- [ ] Add email notifications (in addition to push)
- [ ] Add file attachments to messages
- [ ] Add class attendance tracking
- [ ] Add teacher performance reports
- [ ] Add parent portal access

### UI/UX Improvements

- [ ] Add loading skeletons instead of spinners
- [ ] Add animations for state transitions
- [ ] Improve mobile keyboard handling
- [ ] Add swipe gestures for navigation
- [ ] Add dark mode manual toggle (in addition to auto)
- [ ] Add customizable themes per school

### Security Enhancements

- [ ] Upgrade to bcrypt password hashing
- [ ] Add 2FA authentication
- [ ] Add session timeout
- [ ] Add login attempt rate limiting
- [ ] Add audit log for admin actions
- [ ] Add GDPR compliance features

### Testing

- [ ] Add unit tests for Convex functions
- [ ] Add integration tests for workflows
- [ ] Add E2E tests with Playwright
- [ ] Add accessibility testing
- [ ] Add performance testing
- [ ] Add security testing

### Documentation

- [ ] Add API documentation for Convex endpoints
- [ ] Add component documentation with Storybook
- [ ] Add deployment troubleshooting guide
- [ ] Add user manual (EN/TH)
- [ ] Add video tutorials

---

## 🐛 Known Issues

_No known issues at this time_

---

## 💡 Future Ideas

### Advanced Features

- AI-powered class scheduling suggestions
- Automatic translation for notifications
- Voice recording for class notes
- Video conferencing integration
- Student progress tracking with charts
- Automated report generation
- Integration with Google Calendar
- Integration with Microsoft Teams
- WhatsApp notification integration
- LINE notification integration (for Thailand)

### Analytics & Insights

- Teacher workload analysis
- School performance metrics
- Student attendance patterns
- Class booking trends
- Peak usage time analysis
- Predictive analytics for scheduling

---

## 📝 Notes

### YouTube Downloader Implementation Notes

**Legal Considerations:**

- Ensure compliance with YouTube Terms of Service
- Only allow downloads for educational fair use
- Add disclaimer about copyright
- Consider requiring teacher accounts only

**Technical Considerations:**

- yt-dlp requires Python installation on server
- Alternative: Use web-based API services
- Storage: Consider file size limits
- Security: Validate URLs, prevent abuse
- Rate limiting: Prevent excessive downloads

**Recommended Libraries/Services:**

- `yt-dlp` - Python command-line tool (most powerful)
- `youtube-dl-exec` - Node.js wrapper for yt-dlp
- `ytdl-core` - Pure JavaScript alternative (limited features)
- RapidAPI YouTube Download services
- Consider building as separate microservice

**Example Implementation:**

```typescript
// Backend API endpoint
export const downloadVideo = internalMutation({
  args: {
    url: v.string(),
    quality: v.union(v.literal("720p"), v.literal("1080p"), v.literal("audio")),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // 1. Validate user is teacher/admin
    // 2. Validate YouTube URL
    // 3. Call yt-dlp service
    // 4. Store download record
    // 5. Return download link or file
  },
});
```

### Testing Dashboard Usage

**How to Access:**

1. Start development server: `npm run dev`
2. Login with admin credentials
3. Click "Testing" tab in navigation
4. View real-time test results
5. Resize browser to test responsive detection

**What to Check:**

- All 6 tests should show green checkmarks
- Device type should match your actual device
- Database sync should update within 2-3 seconds
- Service worker should be "registered"

---

## 🎯 Priority Matrix

| Priority | Items | Timeline |
|----------|-------|----------|
| **HIGH** | YouTube Downloader | Next sprint |
| **MEDIUM** | Manual Testing 1-6 | This week |
| **LOW** | Code Splitting | When needed |
| **FUTURE** | Advanced Features | Q1 2026 |

---

## 📞 Need Help?

For questions or support:

- Check `.github/copilot-instructions.md` for coding guidelines
- Review `docs/IMPLEMENTATION_REVIEW_AND_STATUS.md` for recent changes
- Consult `FEATURES_DOCUMENTATION.md` for feature details

---

**End of TODO List**
