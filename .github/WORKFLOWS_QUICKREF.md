# GitHub Actions Workflows - Quick Reference

## 📋 Workflows Summary

| Workflow | Trigger | Purpose | Duration |
|----------|---------|---------|----------|
| **CI - Type Check & Lint** | PR + Push | Validate code quality | ~2-3 min |
| **Deploy to Staging** | Push to `develop` | Preview deployment | ~4-6 min |
| **Deploy to Production** | Push to `main` | Production deployment | ~4-6 min |

## 🚀 Common Commands

### Local Development (No CI/CD)

```powershell
npm install
npx convex dev
npm run dev
```

### Create Feature Branch

```powershell
git checkout -b feature/my-feature
# Make changes
git add .
git commit -m "feat: add new feature"
git push -u origin feature/my-feature
# Create PR on GitHub
```

### Deploy to Staging

```powershell
git checkout develop
git merge feature/my-feature
git push  # Triggers staging deployment
```

### Deploy to Production

```powershell
git checkout main
git merge develop
git push  # Triggers production deployment
```

## ✅ CI Checks

The CI pipeline runs these checks:

1. **TypeScript Type Checking**
   - Command: `npx tsc --noEmit`
   - Validates all TypeScript files
   - Fails on type errors

2. **ESLint Linting**
   - Command: `npm run lint`
   - Checks code style and quality
   - Fails on lint errors

3. **Build Verification**
   - Command: `npm run build`
   - Ensures Next.js builds successfully
   - Catches build-time errors

4. **Convex Schema Validation**
   - Validates `convex/schema.ts`
   - Checks all Convex function files
   - Ensures backend code compiles

## 🔧 Manual Deployment

### Via GitHub Actions UI

1. Go to repository **Actions** tab
2. Select workflow (e.g., "Deploy to Production")
3. Click **Run workflow** button
4. Select branch
5. Click green **Run workflow** button

### Via Git Tags (Alternative)

```powershell
# Create version tag
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

## 📊 Monitoring

### Check Workflow Status

**GitHub UI:**

- Repository → **Actions** tab
- Click on workflow run for details
- View logs for each step

**Commit Status:**

- Green ✅ = All checks passed
- Red ❌ = Some checks failed
- Yellow 🟡 = In progress

### Deployment URLs

**Staging:**

- Convex: Check Convex dashboard (staging project)
- Vercel: Preview URL in Vercel dashboard

**Production:**

- Convex: `https://your-project.convex.cloud`
- Vercel: Your production domain

## 🐛 Troubleshooting

### CI Fails: "Type error in file X"

```powershell
# Run locally to see error
npx tsc --noEmit
```

### CI Fails: "ESLint errors"

```powershell
# Run locally
npm run lint

# Auto-fix if possible
npm run lint -- --fix
```

### Deployment Fails: "Convex deploy key invalid"

1. Go to Convex Dashboard → Settings → Deploy Keys
2. Regenerate key
3. Update GitHub Secret: `CONVEX_DEPLOY_KEY`
4. Re-run workflow

### Deployment Fails: "Vercel authentication failed"

1. Check Vercel token hasn't expired
2. Verify `VERCEL_TOKEN` secret is correct
3. Ensure token has deployment permissions

## 🔒 Required Secrets

**Repository Secrets (Settings → Secrets and variables → Actions):**

| Secret Name | Where to Get | Used By |
|-------------|--------------|---------|
| `CONVEX_DEPLOY_KEY` | Convex Dashboard → Deploy Keys | Production |
| `CONVEX_DEPLOY_KEY_STAGING` | Convex Staging → Deploy Keys | Staging |
| `VERCEL_TOKEN` | Vercel → Account Settings → Tokens | All |
| `VERCEL_ORG_ID` | Vercel → Settings → General | All |
| `VERCEL_PROJECT_ID` | Vercel → Project Settings → General | All |

## 📝 Best Practices

1. **Always create feature branches** - Never push directly to `main`
2. **Open PRs for review** - Let CI validate before merging
3. **Test in staging first** - Merge to `develop` before `main`
4. **Watch CI results** - Don't merge if checks fail
5. **Review deployment logs** - Verify successful deployment

## 🎯 Quick Checklist

Before pushing to production:

- [ ] All CI checks passing on `develop`
- [ ] Tested in staging environment
- [ ] No breaking changes detected
- [ ] Database migrations applied (if any)
- [ ] Environment variables updated (if changed)
- [ ] Team notified of upcoming deployment
- [ ] Rollback plan prepared

## 📚 Related Documentation

- Full setup guide: `docs/CI_CD_SETUP_GUIDE.md`
- Deployment procedures: `docs/DEPLOYMENT.md`
- Troubleshooting: `docs/CI_CD_SETUP_GUIDE.md` (Troubleshooting section)

---

**Last Updated**: October 23, 2025
