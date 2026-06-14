# Deployment Guide

**Environment**: Production deployment for Evan's Class Tracker 4.5  
**Platforms**: Vercel (Frontend) + Convex (Backend)  
**Last Updated**: October 24, 2025

---

## Quick Start

### Prerequisites

- GitHub account
- Vercel account (free tier)
- Convex account (free tier)
- Node.js 20+ installed locally

### Deploy in 5 Steps

1. **Setup Convex**  
   px convex dev
2. **Deploy Functions**  
   px convex deploy --prod
3. **Connect Vercel** Import GitHub repo
4. **Set Environment** Add NEXT_PUBLIC_CONVEX_URL
5. **Deploy** Vercel auto-deploys on push

---

## Detailed Deployment

### 1. Convex Backend Setup

**Initial Setup**:

```powershell
# Install Convex CLI (optional)
npm install -g convex

# Start development
npx convex dev
```

**First-time prompts**:

- Log in to Convex account
- Create new project or link existing
- Creates .env.local with NEXT_PUBLIC_CONVEX_URL
- Opens Convex dashboard automatically

**Production Deployment**:

```powershell
npx convex deploy --prod
```

**Convex Dashboard Features**:

- View database tables and data
- Monitor function calls and performance
- Test queries and mutations
- View logs and errors

### 2. Vercel Frontend Deployment

**Option A: Vercel CLI**

```powershell
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

**Option B: Vercel Dashboard** (Recommended)

1. Visit [vercel.com](https://vercel.com)
2. Click **New Project**
3. Import GitHub repository
4. Add environment variable: NEXT_PUBLIC_CONVEX_URL
5. Click **Deploy**

**Auto-Deploy**: Pushes to main branch trigger automatic deployment

### 3. Environment Variables

**Local** (.env.local):

```env
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
```

**Production** (Vercel Dashboard):

- Navigate to Project Settings Environment Variables
- Add: NEXT_PUBLIC_CONVEX_URL
- Value: Production Convex URL from
  px convex deploy
- Important: Never commit .env.local (already in .gitignore)

---

## Post-Deployment Checklist

### Critical Testing

#### Test 1: Notification Privacy

1. Login as User A
2. User B sends message to User C
3. Verify User A sees NO notification from BC
4. Login as User C sees notification
5. Login as User B sees NO notification from self

**Expected**: Each user sees only their own notifications

#### Test 2: Class Workflow

1. Login as Teacher Book class
2. Login as Moderator Acknowledge class
3. Moderator Approve class
4. Verify status changes and notifications

**Expected**: Workflow completes without errors

#### Test 3: Bilingual Support

1. Switch language (/)
2. Create notification in both languages
3. Verify correct language displays
4. Check all UI elements translate

**Expected**: Full bilingual functionality

#### Test 4: Real-Time Updates

1. Open two browser windows (different users)
2. Teacher books class in Window 1
3. Moderator sees notification in Window 2 (real-time)
4. Moderator approves in Window 2
5. Teacher sees approval in Window 1 (real-time)

**Expected**: Real-time sync via Convex

### Performance Benchmarks

| Operation         | Target  | Acceptable |
| ----------------- | ------- | ---------- |
| Class list load   | < 200ms | < 500ms    |
| Notification load | < 100ms | < 300ms    |
| Message list load | < 150ms | < 400ms    |
| Student list load | < 200ms | < 500ms    |

**Check**: Open DevTools Network tab, verify timings

---

## Monitoring & Maintenance

### Convex Dashboard Monitoring

**Daily Checks**:

- Function execution times (should be < 100ms)
- Error logs (should be minimal)
- Database size (track growth)
- Bandwidth usage (free tier: 5 GB/month)

**Weekly Checks**:

- Storage usage (free tier: 1 GB)
- Function call count (free tier: 1M/month)
- Set alerts at 80% of limits

### Vercel Dashboard Monitoring

**Key Metrics**:

- Build status (should be green )
- Deployment frequency
- Bandwidth usage (free tier: 100 GB/month)
- Build minutes (free tier: 6,000/month)

**Alerts**: Set up email notifications for:

- Failed deployments
- High error rates
- Bandwidth approaching limit

### Application Health Checks

**Manual Testing** (weekly):

1. Login as each role (teacher, moderator, admin)
2. Book a class
3. Send a message
4. Create a student
5. View analytics

**Automated** (via CI/CD):

- TypeScript compilation:
  pm run build
- Linting:
  pm run lint
- Tests:
  pm test (when implemented)

---

## Troubleshooting

### Common Issues

#### \"Notifications not loading\"

**Symptoms**: Empty notification list, console errors  
**Causes**:

- Incorrect NEXT_PUBLIC_CONVEX_URL
- Convex deployment not active
- CORS errors

**Fixes**:

1. Verify environment variable in Vercel dashboard
2. Check Convex dashboard Functions are deployed
3. Clear browser cache, hard refresh
4. Check browser console for specific errors

#### \"Build failures\"

**Symptoms**: Red X in Vercel deployments  
**Causes**:

- Missing dependencies
- TypeScript errors
- Node.js version mismatch

**Fixes**:

1. Check Vercel build logs for specific errors
2. Run
   pm run build locally to reproduce
3. Ensure Node.js 20+ in Vercel project settings
4. Verify all deps in package.json

#### \"Database errors\"

**Symptoms**: 500 errors, data not saving  
**Causes**:

- Schema mismatch
- Missing indexes
- Rate limiting

**Fixes**:

1. Check Convex dashboard Logs for specific errors
2. Verify schema matches types in code
3. Run
   px convex dev to sync schema
4. Check rate limit settings in convex/rateLimit.ts

#### \"Real-time updates not working\"

**Symptoms**: Manual refresh needed to see changes  
**Causes**:

- WebSocket connection failed
- Old browser cache
- Network issues

**Fixes**:

1. Check browser console for WebSocket errors
2. Clear browser cache and reload
3. Verify Convex connection status (green in dashboard)
4. Test in incognito mode

---

## Updating the Application

### Standard Update Flow

1. **Make changes locally**

   ```powershell
   # Edit files
   # Test with: npm run dev
   ```

2. **Commit and push**

   ```powershell
   git add .
   git commit -m \"feat: description\"
   git push origin main
   ```

3. **Vercel auto-deploys** (no action needed)

4. **If schema changed**:

   ```powershell
   npx convex deploy --prod
   ```

### Schema Changes

**Procedure**:

1. Edit convex/schema.ts
2. Test locally:
   px convex dev
3. Verify in Convex dashboard Data
4. Deploy:
   px convex deploy --prod
5. Re-deploy frontend (Vercel will auto-deploy)

**Breaking Changes**:

- Add migrations in convex/migrations.ts
- Test migration locally first
- Deploy during low-usage hours
- Have rollback plan ready

---

## Cost Considerations

### Free Tier Limits

**Vercel** (Hobby Plan):

- 100 GB bandwidth/month
- 6,000 build minutes/month
- Unlimited deployments
- Unlimited personal projects

**Convex** (Free Tier):

- 1 GB storage
- 5 GB bandwidth/month
- 1M function calls/month
- Unlimited development

**When to Upgrade**:

- **Convex**: > 50 daily active users (~6 months)
- **Vercel**: > 1,000 daily active users (~2-3 years)
- See [COST_ANALYSIS_CONVEX_VS_VERCEL.md](COST_ANALYSIS_CONVEX_VS_VERCEL.md)

### Usage Monitoring

**Set alerts at**:

- 80% of storage (Convex)
- 80% of bandwidth (both platforms)
- 80% of function calls (Convex)

**Monthly review**:

- Check Convex dashboard Usage
- Check Vercel dashboard Usage
- Estimate time to upgrade

---

## Security Best Practices

### Essential Security Measures

1. **Environment Variables**
   - Never commit .env.local
   - Use Vercel dashboard for production vars
   - Rotate sensitive values regularly

2. **Dependency Management**

   ```powershell
   npm audit fix      # Fix vulnerabilities
   npm outdated       # Check for updates
   npm update         # Update dependencies
   ```

3. **Access Control**
   - Use GitHub branch protection (main branch)
   - Require PR reviews for merges
   - Enable Vercel deployment protection

4. **Monitoring**
   - Enable Vercel security headers
   - Monitor Convex access logs
   - Set up error tracking (Sentry recommended)

5. **Backups**
   - Convex auto-backs up data
   - Export data weekly: Use convex/exports.ts
   - Store exports in secure location

### Security Checklist

- [ ] .env.local in .gitignore
- [ ] Production env vars set in Vercel
- [ ] Dependencies up to date
- [ ] No console errors in production
- [ ] HTTPS enabled (automatic on Vercel)
- [ ] Rate limiting active
- [ ] Audit logging enabled
- [ ] Error tracking configured

---

## Rollback Procedures

### Quick Rollback (Vercel)

**Via Dashboard**:

1. Vercel Deployments
2. Find previous working deployment
3. Click **...** **Promote to Production**
4. Instant rollback

**Via Git**:

```powershell
# Revert to previous commit
git revert HEAD
git push origin main
# Vercel auto-deploys reverted code
```

### Convex Rollback

**Issue**: Bad schema deployment

**Fix**:

```powershell
# Redeploy previous working code
git checkout <previous-commit>
npx convex deploy --prod
git checkout main
```

**Note**: Convex retains data, only functions/schema roll back

---

## CI/CD Pipeline

### GitHub Actions (Recommended)

**Setup**: See [CI_CD_SETUP_GUIDE.md](CI_CD_SETUP_GUIDE.md)

**Workflows**:

- .github/workflows/ci.yml - Lint + TypeScript check on PR
- .github/workflows/deploy-staging.yml - Auto-deploy develop branch
- .github/workflows/deploy-production.yml - Auto-deploy main branch

**Benefits**:

- Catch errors before merge
- Automated testing
- Staging environment
- Production protection

---

## Support Resources

### Official Documentation

- **Convex**: <https://docs.convex.dev>
- **Next.js**: <https://nextjs.org/docs>
- **Vercel**: <https://vercel.com/docs>
- **Turbopack**: <https://turbo.build/pack/docs>

### Project Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture
- [TESTING_GUIDE.md](TESTING_GUIDE.md) - Testing procedures
- [PERFORMANCE_AUDIT_OCT_24_2025.md](PERFORMANCE_AUDIT_OCT_24_2025.md) - Performance analysis
- [SECURITY_REVIEWS.md](SECURITY_REVIEWS.md) - Security considerations

### Community

- GitHub Issues: Report bugs
- GitHub Discussions: Ask questions
- Convex Discord: Real-time help
- Next.js Discord: Framework support

---

---

## Staging Environment

### Overview

Staging is a separate deployment that mirrors production, used for testing changes before they go live.

**Architecture:**

```text
Development (localhost:3001)
    ↓ Test locally
    ↓ git push origin develop
    ↓
Staging (Vercel Preview + Convex Staging)
    ↓ Test in production-like environment
    ↓ Verify everything works
    ↓ git merge develop → main
    ↓
Production (Vercel Production + Convex Production)
    ↓ Real users
```

### Setting Up Staging

**1. Create Convex Staging Deployment:**

```powershell
# Via Convex Dashboard (recommended):
# 1. Go to https://dashboard.convex.dev/
# 2. Click deployment dropdown (top-left)
# 3. Click "+ New Deployment"
# 4. Name: "evan-sclasstracker-staging"
# 5. Copy the staging deploy key

# Via CLI:
npx convex dev --once --configure new
```

**2. Configure GitHub Environment:**

1. Go to: `https://github.com/[owner]/[repo]/settings/environments`
2. Click "New environment"
3. Name: `staging`
4. Add secrets:
   - `CONVEX_DEPLOY_KEY_STAGING` (from step 1)
   - `VERCEL_TOKEN` (from Vercel dashboard)

**3. Test Staging Deployment:**

```powershell
# Push to develop branch
git checkout develop
git push origin develop

# GitHub Actions will auto-deploy to staging
```

### Staging Test Plan

Before promoting to production, verify:

**Authentication:**

- [ ] Login works for all roles
- [ ] Logout functionality
- [ ] Password reset works
- [ ] Account lockout after failed attempts

**Core Workflows:**

- [ ] Class booking (teacher → moderator → approval)
- [ ] Message sending and receiving
- [ ] Student creation and management
- [ ] Location proposals and approval

**Real-Time Features:**

- [ ] Notifications appear instantly
- [ ] Class list updates live
- [ ] Unread message badges update

**Bilingual Support:**

- [ ] Language switcher works
- [ ] All UI elements in both languages
- [ ] Toast notifications bilingual

**See also:** `STAGING_TEST_PLAN.md` for comprehensive testing checklist

---

## Deployment Success Criteria

### Pre-Deployment

- [ ] All tests passing locally
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] No ESLint warnings (`npm run lint`)
- [ ] Environment variables configured
- [ ] Schema changes tested
- [ ] CI/CD pipeline green

### Post-Deployment

- [ ] Build successful (green checkmark)
- [ ] All pages load without errors
- [ ] Real-time updates working
- [ ] Bilingual support verified
- [ ] Authentication working
- [ ] No console errors in production
- [ ] Performance meets benchmarks
- [ ] E2E tests passing (if automated)

### Go-Live

- [ ] Monitoring alerts configured
- [ ] Backup strategy in place
- [ ] Rollback plan documented
- [ ] Team notified of deployment
- [ ] User documentation updated
- [ ] App update notification created (see `npm run create-update`)

---

**Last Updated**: October 26, 2025  
**Maintained by**: TeacherEvan  
**Status**: Production-ready with staging environment
