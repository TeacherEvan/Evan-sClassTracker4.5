# CI/CD Pipeline Setup Guide

This guide walks you through setting up automated CI/CD for Evan's Class Tracker 4.5 using GitHub Actions.

## Overview

Three workflows are configured:

1. **CI Pipeline** (`ci.yml`) - Runs on all PRs and pushes
   - TypeScript type checking
   - ESLint linting
   - Build verification
   - Convex schema validation

2. **Staging Deployment** (`deploy-staging.yml`) - Auto-deploys `develop` branch
   - Deploys Convex backend to staging
   - Deploys Next.js to Vercel preview

3. **Production Deployment** (`deploy-production.yml`) - Auto-deploys `main` branch
   - Deploys Convex backend to production
   - Deploys Next.js to Vercel production

## Prerequisites

### 1. GitHub Repository Setup

Ensure your code is pushed to GitHub:

```powershell
git remote add origin https://github.com/TeacherEvan/Evan-sClassTracker4.5.git
git branch -M main
git push -u origin main
```

### 2. Create Staging Branch (Optional but Recommended)

```powershell
git checkout -b develop
git push -u origin develop
```

## Required GitHub Secrets

Navigate to your GitHub repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

### Convex Secrets

#### Production Convex Deploy Key

1. Login to [Convex Dashboard](https://dashboard.convex.dev/)
2. Select your **production** project
3. Go to **Settings** → **Deploy Keys**
4. Click **Generate Deploy Key**
5. Copy the key
6. Add to GitHub as: `CONVEX_DEPLOY_KEY`

#### Staging Convex Deploy Key (if using staging)

1. Create a separate Convex project for staging (or use the same with different deployment)
2. Generate deploy key from staging project
3. Add to GitHub as: `CONVEX_DEPLOY_KEY_STAGING`

### Vercel Secrets

#### Get Vercel Token

1. Go to [Vercel Account Settings](https://vercel.com/account/tokens)
2. Click **Create Token**
3. Name it: `GitHub Actions CI/CD`
4. Copy the token
5. Add to GitHub as: `VERCEL_TOKEN`

#### Get Vercel Organization ID

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click your team/organization name
3. Go to **Settings** → **General**
4. Copy **Organization ID** (or **Team ID**)
5. Add to GitHub as: `VERCEL_ORG_ID`

#### Get Vercel Project ID

1. Go to your project in Vercel Dashboard
2. Go to **Settings** → **General**
3. Copy **Project ID**
4. Add to GitHub as: `VERCEL_PROJECT_ID`

#### Optional: Convex URL (for build validation)

If CI builds fail without Convex running, add:

- Secret name: `NEXT_PUBLIC_CONVEX_URL`
- Value: Your production Convex URL (e.g., `https://your-project.convex.cloud`)

## GitHub Environments Setup (Recommended)

For better control and protection, set up environments:

### 1. Create Production Environment

1. Go to repository **Settings** → **Environments**
2. Click **New environment**
3. Name: `production`
4. Add protection rules:
   - ☑️ Required reviewers (optional)
   - ☑️ Wait timer: 0 minutes (or add delay for safety)
   - ☑️ Deployment branches: `main` only

### 2. Create Staging Environment

1. Click **New environment**
2. Name: `staging`
3. Add protection rules:
   - Deployment branches: `develop` only

### 3. Add Environment-Specific Secrets

Move secrets to environments for better isolation:

**Production environment:**

- `CONVEX_DEPLOY_KEY`
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

**Staging environment:**

- `CONVEX_DEPLOY_KEY_STAGING`
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

## Testing the CI/CD Pipeline

### Test CI Checks

1. Create a feature branch:

   ```powershell
   git checkout -b feature/test-ci
   ```

2. Make a small change (e.g., add a comment)

3. Push and create PR:

   ```powershell
   git add .
   git commit -m "test: CI pipeline"
   git push -u origin feature/test-ci
   ```

4. Go to GitHub → **Pull Requests** → **Create Pull Request**

5. Watch the **Checks** tab - should see:
   - ✅ CI - Type Check & Lint / type-check-and-lint
   - ✅ CI - Type Check & Lint / convex-check

### Test Staging Deployment

1. Merge feature to `develop` branch:

   ```powershell
   git checkout develop
   git merge feature/test-ci
   git push
   ```

2. Go to **Actions** tab in GitHub
3. Watch **Deploy to Staging** workflow
4. Check Vercel dashboard for preview deployment

### Test Production Deployment

1. Merge `develop` to `main`:

   ```powershell
   git checkout main
   git merge develop
   git push
   ```

2. Go to **Actions** tab in GitHub
3. Watch **Deploy to Production** workflow
4. Verify production site updates

## Workflow Triggers

### Automatic Triggers

- **CI checks**: Run on every PR and push to `main`/`develop`
- **Staging deployment**: Auto-deploys on push to `develop`
- **Production deployment**: Auto-deploys on push to `main`

### Manual Triggers

You can manually trigger deployments:

1. Go to **Actions** tab
2. Select workflow (e.g., "Deploy to Production")
3. Click **Run workflow** dropdown
4. Select branch
5. Click **Run workflow** button

## Troubleshooting

### Build Fails: "Cannot find module 'convex'"

**Solution**: Ensure `npm ci` runs before build steps. Already configured in workflows.

### Deployment Fails: "Invalid Convex deploy key"

**Solution**:

1. Regenerate deploy key in Convex dashboard
2. Update GitHub secret
3. Retry workflow

### Vercel Deployment Fails: "Project not found"

**Solution**:

1. Verify `VERCEL_PROJECT_ID` matches your project
2. Check `VERCEL_ORG_ID` is correct
3. Ensure Vercel token has correct permissions

### TypeScript Errors in CI but Not Locally

**Solution**:

```powershell
# Clean install dependencies
rm -rf node_modules package-lock.json
npm install

# Run type check locally
npx tsc --noEmit
```

### Convex Schema Validation Fails

**Solution**: Check `convex/schema.ts` for syntax errors:

```powershell
npx tsc convex/schema.ts --noEmit --skipLibCheck
```

## Best Practices

### Branch Strategy

```
main (production)
  ↑
develop (staging)
  ↑
feature/* (local development)
```

1. Create feature branches from `develop`
2. Open PRs to `develop` (CI runs)
3. Merge to `develop` (staging deployment)
4. Test in staging
5. Merge `develop` → `main` (production deployment)

### Environment Variables

- **Never commit** `.env.local` or secrets
- Use GitHub Secrets for sensitive data
- Use GitHub Environments for separation

### Deployment Safety

1. **Always deploy to staging first**
2. Test thoroughly in staging
3. Only merge to `main` after verification
4. Use Vercel preview URLs for quick checks

## Monitoring Deployments

### GitHub Actions

- **Actions tab**: View all workflow runs
- **Email notifications**: Enabled by default for failures
- **Status badges**: Add to README (optional)

### Convex Dashboard

- Monitor backend deployments
- Check function logs
- View database state

### Vercel Dashboard

- Monitor frontend deployments
- Check build logs
- View production/preview URLs

## Disabling Auto-Deployments (If Needed)

To temporarily disable auto-deployments without deleting workflows:

### Option 1: Disable Workflow

1. Go to **Actions** → Select workflow
2. Click **⋯** (three dots) → **Disable workflow**

### Option 2: Edit Workflow Trigger

Comment out the `push` trigger in the workflow file:

```yaml
on:
  # push:
  #   branches: [main]
  workflow_dispatch: # Keep manual trigger
```

## Next Steps

1. ✅ Set up all GitHub secrets
2. ✅ Create GitHub environments (optional)
3. ✅ Test CI pipeline with a feature branch
4. ✅ Verify staging deployment works
5. ✅ Verify production deployment works
6. 📝 Update team documentation with workflow
7. 🔔 Configure notification preferences

## Support

If you encounter issues:

1. Check **Actions** tab for detailed error logs
2. Review this guide's troubleshooting section
3. Verify all secrets are correctly configured
4. Check Convex/Vercel dashboards for backend issues

---

**Last Updated**: October 23, 2025  
**Workflows Version**: 1.0
