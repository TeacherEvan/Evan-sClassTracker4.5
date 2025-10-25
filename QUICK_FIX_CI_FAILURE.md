# Quick Fix: CI/CD Deployment Failure

## Problem

Your GitHub Actions deployment is failing with this error:

```
Error: You are currently developing anonymously with a locally running project.
To deploy your Convex app to the cloud, log in by running 'npx convex login'.
```

## Root Cause

Missing or invalid `CONVEX_DEPLOY_KEY` in GitHub Secrets.

## Quick Fix (5 Minutes)

### Step 1: Get Convex Deploy Key

1. Open <https://dashboard.convex.dev/>
2. Select your production project
3. Go to **Settings** → **Deploy Keys**
4. Click **Generate Deploy Key**
5. **Copy the key** (you can't view it again!)

### Step 2: Add to GitHub

1. Open <https://github.com/TeacherEvan/Evan-sClassTracker4.5/settings/secrets/actions>
2. Click **New repository secret**
3. Name: `CONVEX_DEPLOY_KEY`
4. Paste the key from Step 1
5. Click **Add secret**

### Step 3: Re-run Deployment

1. Go to <https://github.com/TeacherEvan/Evan-sClassTracker4.5/actions>
2. Click the failed workflow
3. Click **Re-run failed jobs**

## Verification

The deployment should now succeed. You'll see:

```
✓ Deployment complete
✓ Functions deployed: 42
✓ Convex URL: https://your-project.convex.cloud
```

## Additional Fixes Applied

✅ Fixed ESLint warning in `lib/session-utils.ts` (unused `error` variable)

## Need More Help?

See detailed troubleshooting: `docs/TROUBLESHOOTING_CI_CD.md`
