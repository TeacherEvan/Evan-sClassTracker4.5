# Convex Deployment Fix - October 23, 2025

## Problem Description

GitHub Actions workflows were failing when attempting to deploy the Convex backend with the error:

```
Error: Process completed with exit code 1.
You are currently developing anonymously with a locally running project.
To deploy your Convex app to the cloud, log in by running `npx convex login`.
```

This error occurred in both `deploy-production.yml` and `deploy-staging.yml` workflows when running:

```bash
npx convex deploy --cmd 'npm run build'
```

## Root Cause

The repository was missing the required `convex.json` configuration file that:

1. Tells the Convex CLI where to find the backend functions directory
2. Specifies the Node.js runtime version for Convex deployments
3. Provides project-specific configuration for deployments

Additionally, the deploy command wasn't configured to pass the Convex deployment URL to the Next.js build process.

## Solution Implemented

### 1. Created `convex.json` Configuration File

```json
{
  "functions": "convex/",
  "node": {
    "version": "20"
  }
}
```

**Purpose:**

- `functions`: Specifies the directory containing Convex backend functions
- `node.version`: Ensures Convex uses Node.js 20, matching the project requirements

### 2. Updated `.gitignore`

Added `.convex/` directory to the ignore list:

```gitignore
# convex
.convex/
```

**Purpose:** The `.convex/` directory contains local deployment metadata (generated during `npx convex dev` or `npx convex deploy`) that should not be committed to version control.

### 3. Updated GitHub Actions Workflows

Modified both `deploy-production.yml` and `deploy-staging.yml`:

**Before:**

```yaml
- name: Deploy Convex backend
  run: npx convex deploy --cmd 'npm run build'
  env:
    CONVEX_DEPLOY_KEY: ${{ secrets.CONVEX_DEPLOY_KEY }}
```

**After:**

```yaml
- name: Deploy Convex backend
  run: npx convex deploy --cmd 'npm run build' --cmd-url-env-var-name NEXT_PUBLIC_CONVEX_URL
  env:
    CONVEX_DEPLOY_KEY: ${{ secrets.CONVEX_DEPLOY_KEY }}
```

**Purpose:** The `--cmd-url-env-var-name NEXT_PUBLIC_CONVEX_URL` flag tells Convex to:

1. Deploy the backend functions first
2. Get the deployment URL
3. Set it as the `NEXT_PUBLIC_CONVEX_URL` environment variable
4. Then run `npm run build` with that environment variable available

This ensures the Next.js build knows which Convex deployment to connect to.

## How Convex Deployment Works

### Deployment Flow

1. **Convex Backend Deployment**
   - `npx convex deploy` is executed
   - The `CONVEX_DEPLOY_KEY` environment variable authenticates the deployment
   - Convex reads `convex.json` to understand the project structure
   - Backend functions from `convex/` directory are deployed
   - A deployment URL is generated (e.g., `https://your-project.convex.cloud`)

2. **Frontend Build**
   - Convex sets `NEXT_PUBLIC_CONVEX_URL` to the deployment URL
   - `npm run build` is executed with this environment variable
   - Next.js build includes the Convex URL in the frontend bundle
   - The frontend can now connect to the deployed Convex backend

3. **Vercel Deployment**
   - The built Next.js application is deployed to Vercel
   - The `NEXT_PUBLIC_CONVEX_URL` is passed to Vercel
   - The production app connects to the Convex backend

## Prerequisites for Successful Deployment

### Required GitHub Secrets

The following secrets must be configured in GitHub repository settings → Secrets and variables → Actions:

#### For Production Deployment

- `CONVEX_DEPLOY_KEY`: Deploy key from Convex production project
- `VERCEL_TOKEN`: Vercel authentication token
- `VERCEL_ORG_ID`: Vercel organization/team ID
- `VERCEL_PROJECT_ID`: Vercel project ID

#### For Staging Deployment (Optional)

- `CONVEX_DEPLOY_KEY_STAGING`: Deploy key from Convex staging project
- Same Vercel secrets as production

### How to Generate Convex Deploy Keys

1. **Login to Convex Dashboard**
   - Visit <https://dashboard.convex.dev/>
   - Sign in with your account

2. **Select Your Project**
   - Choose your production project from the dashboard

3. **Generate Deploy Key**
   - Go to **Settings** → **Deploy Keys**
   - Click **Generate Deploy Key**
   - Copy the generated key (it will only be shown once)

4. **Add to GitHub**
   - Go to your GitHub repository
   - Settings → Secrets and variables → Actions
   - Click **New repository secret**
   - Name: `CONVEX_DEPLOY_KEY`
   - Value: Paste the deploy key
   - Click **Add secret**

5. **Repeat for Staging (if needed)**
   - Create a separate Convex project for staging
   - Generate another deploy key
   - Add as `CONVEX_DEPLOY_KEY_STAGING`

## Testing the Fix

### Option 1: Test via Pull Request

1. Create a pull request with these changes
2. The CI workflow should run and pass
3. Merge to `develop` branch to trigger staging deployment
4. Merge to `main` branch to trigger production deployment

### Option 2: Manual Workflow Trigger

1. Go to GitHub repository → **Actions** tab
2. Select **Deploy to Production** or **Deploy to Staging**
3. Click **Run workflow** dropdown
4. Select the branch with these changes
5. Click **Run workflow** button
6. Watch the workflow logs for successful deployment

### Expected Success Indicators

✅ **Successful deployment logs should show:**

```
Deploying Convex functions...
✓ Deployment complete
✓ Deployment URL: https://your-project.convex.cloud
Building Next.js application...
✓ Build complete
Deploying to Vercel...
✓ Deployment complete
```

❌ **If deployment still fails, check:**

1. Verify `CONVEX_DEPLOY_KEY` is correctly set in GitHub secrets
2. Check that the deploy key hasn't expired
3. Ensure the Convex project exists and is accessible
4. Review the Actions workflow logs for detailed error messages

## Verification Checklist

After deployment succeeds:

- [ ] Check Convex Dashboard for successful deployment
  - Visit <https://dashboard.convex.dev/>
  - Verify functions are deployed
  - Check deployment logs

- [ ] Check Vercel Dashboard for frontend deployment
  - Visit <https://vercel.com/dashboard>
  - Verify production deployment succeeded
  - Check build logs

- [ ] Test the deployed application
  - Visit the production URL
  - Verify the app loads correctly
  - Test core functionality (login, booking, etc.)
  - Check browser console for errors

- [ ] Verify environment variables
  - In Vercel dashboard → Settings → Environment Variables
  - Ensure `NEXT_PUBLIC_CONVEX_URL` is set correctly

## Related Documentation

- **CI/CD Setup Guide**: `docs/CI_CD_SETUP_GUIDE.md` - Comprehensive guide for setting up all deployment secrets and workflows
- **Deployment Guide**: `docs/DEPLOYMENT.md` - General deployment instructions
- **Convex Documentation**: <https://docs.convex.dev/> - Official Convex documentation

## Troubleshooting

### Issue: "Invalid deploy key"

**Solution:** Regenerate the deploy key in Convex dashboard and update the GitHub secret

### Issue: "Cannot find module 'convex'"

**Solution:** Ensure `npm ci` runs before deployment (already configured in workflows)

### Issue: "Build failed: NEXT_PUBLIC_CONVEX_URL not set"

**Solution:** Verify the `--cmd-url-env-var-name` flag is present in the deploy command

### Issue: "Permission denied"

**Solution:** Check that the deploy key has the correct permissions in Convex dashboard

### Issue: "Project not found"

**Solution:** Verify you're using the correct deploy key for the intended Convex project

## Security Considerations

✅ **Best Practices Followed:**

- Deploy keys are stored as GitHub secrets (not in code)
- `.convex/` directory is excluded from version control
- `.env.local` is already in `.gitignore`
- No sensitive data is committed to the repository

⚠️ **Important Reminders:**

- Never commit deploy keys or API tokens to the repository
- Regularly rotate deploy keys (every 6-12 months)
- Use separate deploy keys for production and staging
- Monitor deployment logs for unusual activity

## Summary

This fix enables automated Convex deployments in GitHub Actions by:

1. Providing the required `convex.json` configuration
2. Properly passing the Convex URL to the Next.js build process
3. Ensuring deployment metadata is not committed to version control

The changes are minimal, focused, and follow best practices for Convex and Next.js deployments.

---

**Implementation Date:** October 23, 2025  
**Issue Resolved:** Convex deployment failure in GitHub Actions  
**Files Modified:**

- `convex.json` (created)
- `.gitignore` (updated)
- `.github/workflows/deploy-production.yml` (updated)
- `.github/workflows/deploy-staging.yml` (updated)
