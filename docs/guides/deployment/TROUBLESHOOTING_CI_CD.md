# CI/CD Troubleshooting Guide

## Issue: Convex Deployment Fails with "Developing Anonymously" Error

### Symptoms

```
Error: You are currently developing anonymously with a locally running project.
To deploy your Convex app to the cloud, log in by running 'npx convex login'.
Process completed with exit code 1.
```

### Root Cause

The GitHub Actions workflow cannot authenticate with Convex because the `CONVEX_DEPLOY_KEY` secret is either:

- Not configured in GitHub repository settings
- Configured incorrectly
- Expired or invalid

### Solution

#### Step 1: Generate Convex Deploy Key

1. **Login to Convex Dashboard**
   - Go to <https://dashboard.convex.dev/>
   - Login with your account

2. **Select Your Project**
   - Find "Evan's Class Tracker 4.5" (or your production project)
   - Click to open it

3. **Generate Deploy Key**
   - Navigate to **Settings** tab
   - Find **Deploy Keys** section
   - Click **Generate Deploy Key** button
   - **Copy the key immediately** (you won't be able to see it again!)

#### Step 2: Add Secret to GitHub

1. **Go to Repository Settings**
   - Navigate to <https://github.com/TeacherEvan/Evan-sClassTracker4.5>
   - Click **Settings** tab
   - Click **Secrets and variables** → **Actions**

2. **Add/Update Secret**
   - Click **New repository secret** (or edit existing)
   - Name: `CONVEX_DEPLOY_KEY`
   - Value: Paste the deploy key from Step 1
   - Click **Add secret**

#### Step 3: Verify Environment Configuration

If using GitHub Environments (production/staging):

1. Go to **Settings** → **Environments**
2. Click **production** environment
3. Ensure `CONVEX_DEPLOY_KEY` is listed under **Environment secrets**
4. If not, add it there instead of repository secrets

#### Step 4: Re-run Failed Workflow

1. Go to **Actions** tab
2. Find the failed workflow run
3. Click **Re-run failed jobs**
4. Monitor the "Deploy Convex backend" step

### Expected Success Output

```
✓ Deployment complete
✓ Functions deployed: 42
✓ Convex URL: https://your-project.convex.cloud
```

---

## Issue: Build Warnings (ESLint)

### Symptoms

```
Warning: 'error' is defined but never used. @typescript-eslint/no-unused-vars
```

### Solution

This is non-blocking but should be fixed for clean builds:

**Option 1: Remove unused variable**

```typescript
// Before
} catch (error) {
    return 0;
}

// After
} catch {
    return 0;
}
```

**Option 2: Prefix with underscore (if you might use it later)**

```typescript
} catch (_error) {
    // Could add logging here later
    return 0;
}
```

---

## Issue: Missing NEXT_PUBLIC_CONVEX_URL in CI

### Symptoms

Build fails during CI with errors about Convex client initialization.

### Solution

Add the Convex URL as a GitHub secret (optional for CI, required for build):

1. Get your Convex URL:

   ```powershell
   npx convex url
   ```

2. Add to GitHub:
   - Name: `NEXT_PUBLIC_CONVEX_URL`
   - Value: `https://your-project.convex.cloud`

3. Update `.github/workflows/ci.yml` to use it:

   ```yaml
   env:
     NEXT_PUBLIC_CONVEX_URL: ${{ secrets.NEXT_PUBLIC_CONVEX_URL }}
   ```

---

## Issue: Vercel Deployment Fails

### Symptoms

Vercel step fails with authentication or project not found errors.

### Required Secrets

Verify all Vercel secrets are configured:

1. **VERCEL_TOKEN**
   - Get from: <https://vercel.com/account/tokens>
   - Click "Create Token"
   - Copy and add to GitHub

2. **VERCEL_ORG_ID**
   - Get from: Vercel Dashboard → Settings → General
   - Look for "Organization ID" or "Team ID"

3. **VERCEL_PROJECT_ID**
   - Get from: Your project → Settings → General
   - Copy "Project ID"

### Verify Secrets are Set

Run this locally to check what's missing:

```powershell
# Check if secrets are referenced in workflow
Select-String -Path .github/workflows/*.yml -Pattern "secrets\."
```

---

## Issue: TypeScript Type Errors in CI

### Symptoms

```
error TS2322: Type 'X' is not assignable to type 'Y'
```

### Solution

1. **Run locally first:**

   ```powershell
   npx tsc --noEmit
   ```

2. **Fix all errors before pushing**

3. **Verify with build:**

   ```powershell
   npm run build
   ```

---

## Common CI/CD Workflow Checklist

Before pushing to `main` or `develop`:

- [ ] All tests pass locally
- [ ] TypeScript compiles without errors (`npx tsc --noEmit`)
- [ ] ESLint passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Convex functions validated (`npx convex dev` runs without errors)
- [ ] All required GitHub secrets are configured
- [ ] Branch protection rules are set up (if applicable)

---

## Quick Fix Command Reference

### Local Development

```powershell
# Install dependencies
npm install

# Start Convex (required first!)
npx convex dev

# Start Next.js (in new terminal)
npm run dev

# Type check
npx tsc --noEmit

# Lint
npm run lint

# Build
npm run build
```

### Convex Deployment

```powershell
# Login to Convex
npx convex login

# Deploy to production
npx convex deploy --prod

# Get production URL
npx convex url --prod
```

### Vercel Deployment

```powershell
# Install Vercel CLI (if not installed)
npm i -g vercel

# Login
vercel login

# Deploy to production
vercel --prod

# Link project (first time)
vercel link
```

---

## Getting Help

If issues persist:

1. **Check workflow logs:**
   - GitHub → Actions → Click failed run → Expand failing step

2. **Review documentation:**
   - `docs/CI_CD_SETUP_GUIDE.md`
   - `docs/CONVEX_TEST_DEPLOYMENT_GUIDE.md`

3. **Verify environment variables:**
   - Check `.env.local` exists locally
   - Check GitHub secrets are spelled correctly
   - Verify environment names match (production/staging)

4. **Test deployment manually:**

   ```powershell
   # Deploy Convex
   npx convex deploy --cmd 'npm run build' --cmd-url-env-var-name NEXT_PUBLIC_CONVEX_URL

   # Deploy Vercel
   vercel --prod
   ```

---

## Prevention Tips

1. **Always test locally before pushing:**
   - Run `npm run build` to catch build errors
   - Run `npx tsc --noEmit` to catch type errors

2. **Use branch protection:**
   - Require CI checks to pass before merging
   - Set up in GitHub Settings → Branches → Add rule

3. **Monitor deployments:**
   - Enable GitHub Actions notifications
   - Set up Vercel deployment notifications

4. **Keep dependencies updated:**

   ```powershell
   npm outdated
   npm update
   ```

5. **Rotate deploy keys periodically:**
   - Generate new Convex deploy key every 6 months
   - Update GitHub secret immediately after generation
