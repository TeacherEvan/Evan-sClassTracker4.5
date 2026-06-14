# Staging Environment Setup Guide

Complete guide to setting up and using the staging environment for Evan's Class Tracker.

## Overview

**Staging** is a separate deployment that mirrors production, used for testing changes before they go live to real users.

## Architecture

```
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

## Step-by-Step Setup

### 1. Create GitHub Environment

1. Go to: <https://github.com/TeacherEvan/Evan-sClassTracker4.5/settings/environments>
2. Click **"New environment"**
3. Name: `staging`
4. Click **"Configure environment"**
5. (Optional) Add protection rules:
   - ✅ **Required reviewers** - Require manual approval before deploying
   - ✅ **Wait timer** - Add a delay before deployment
   - ✅ **Deployment branches** - Only allow `develop` branch

### 2. Create Convex Staging Deployment

You already have `CONVEX_DEPLOY_KEY_STAGING` secret configured! ✅

To create a separate Convex staging deployment:

```bash
# In your Convex dashboard:
1. Go to https://dashboard.convex.dev
2. Create a new deployment (or use existing "evan-sclasstracker-test")
3. Get the deploy key
4. Update CONVEX_DEPLOY_KEY_STAGING secret in GitHub
```

### 3. Create Vercel Staging Project (Optional)

You have two options:

#### Option A: Use Vercel Preview Deployments (Recommended - Already Working!)

- Vercel automatically creates preview deployments for non-main branches
- Your staging workflow will deploy to a preview URL
- No extra setup needed! ✅

#### Option B: Separate Vercel Project (Advanced)

1. Create new project in Vercel dashboard
2. Link to same GitHub repo
3. Set to deploy only `develop` branch
4. Get new `VERCEL_PROJECT_ID` for staging
5. Add as GitHub secret: `VERCEL_PROJECT_ID_STAGING`
6. Update workflow to use staging-specific project ID

### 4. Create `develop` Branch

```bash
# Create develop branch from main
git checkout -b develop
git push -u origin develop

# Set develop as default branch for staging (optional)
# Go to: Settings → Branches → Default branch
```

### 5. Update Workflow (If Using Separate Vercel Project)

Only needed if you chose Option B above:

```yaml
# .github/workflows/deploy-staging.yml
- name: Deploy to Vercel (staging)
  uses: amondnet/vercel-action@v25
  with:
    vercel-token: ${{ secrets.VERCEL_TOKEN }}
    vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
    vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID_STAGING }} # ← Different project
```

## Workflow Usage

### Normal Development Flow

```bash
# 1. Create feature branch from develop
git checkout develop
git pull origin develop
git checkout -b feature/new-awesome-feature

# 2. Make changes and commit
git add .
git commit -m "feat: add awesome new feature"

# 3. Push to develop (triggers staging deployment)
git checkout develop
git merge feature/new-awesome-feature
git push origin develop

# 4. GitHub Actions automatically:
#    - Deploys Convex to staging
#    - Deploys Next.js to Vercel staging
#    - Runs tests

# 5. Test on staging URL (check Actions output for URL)

# 6. If everything works, merge to main
git checkout main
git merge develop
git push origin main

# 7. Production deployment happens automatically!
```

### Quick Deploy to Staging

```bash
# Already on develop branch
git push origin develop
# ✅ Staging deployment triggered!
```

### Manual Deployment

Go to: <https://github.com/TeacherEvan/Evan-sClassTracker4.5/actions/workflows/deploy-staging.yml>

- Click **"Run workflow"**
- Select `develop` branch
- Click **"Run workflow"**

## Environment Variables

### Staging-Specific Secrets (Already Configured ✅)

- `CONVEX_DEPLOY_KEY_STAGING` - Convex staging deployment key
- `VERCEL_TOKEN` - Same for both environments
- `VERCEL_ORG_ID` - Same for both environments
- `VERCEL_PROJECT_ID` - Can be same (preview) or different (separate project)

### Production-Specific Secrets

- `CONVEX_DEPLOY_KEY` - Convex production deployment key

## Testing Checklist

Before merging `develop` → `main`, test on staging:

- [ ] All features work as expected
- [ ] Bilingual content displays correctly
- [ ] Class booking workflow completes
- [ ] Real-time updates work
- [ ] Dark mode works
- [ ] Mobile responsive
- [ ] No console errors
- [ ] Database migrations successful (if any)
- [ ] Authentication works
- [ ] Notifications work

## Troubleshooting

### "Environment 'staging' not found" Error

**Fix:** Create the environment in GitHub Settings → Environments

### Deployment Fails with "CONVEX_DEPLOY_KEY_STAGING not found"

**Fix:** Verify secret exists at: <https://github.com/TeacherEvan/Evan-sClassTracker4.5/settings/secrets/actions>

### Staging Uses Production Database

**Fix:** Ensure `CONVEX_DEPLOY_KEY_STAGING` points to a different Convex deployment

### Vercel Deployment Shows Wrong URL

**Expected:** Staging should show a preview URL like `https://evans-classtracker45-git-develop-teacherevans-projects.vercel.app`

If showing production URL, check:

1. Workflow is using correct branch (`develop`)
2. Vercel project settings

## Best Practices

### 1. **Always Test on Staging First**

Never merge directly to `main` without staging verification.

### 2. **Keep Staging Updated**

Regularly sync `develop` with `main`:

```bash
git checkout develop
git merge main
git push origin develop
```

### 3. **Use Staging for Demos**

Show clients/stakeholders new features on staging URL.

### 4. **Database Separation**

Use different Convex deployments for staging/production to avoid data conflicts.

### 5. **Monitor Staging Deploys**

Watch GitHub Actions to catch deployment issues early.

## Next Steps

1. ✅ Create `staging` environment in GitHub
2. ✅ Create `develop` branch
3. ✅ Test workflow by pushing to `develop`
4. ✅ Verify staging deployment works
5. ✅ Document your staging URL for team/future reference

## Resources

- [GitHub Environments Documentation](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)
- [Vercel Preview Deployments](https://vercel.com/docs/concepts/deployments/preview-deployments)
- [Convex Multiple Deployments](https://docs.convex.dev/production/hosting/deploy-keys)

---

**Remember:** Staging is your safety net - use it liberally, break things freely, learn continuously! 🚀
