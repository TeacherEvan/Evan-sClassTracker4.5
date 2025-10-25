# Environment Configuration Guide for Automated Testing Pipeline

## Overview

This guide explains how to set up credentials for:
1. **GitHub Actions** (CI/CD pipeline)
2. **Docker Hub** (Container registry)
3. **Convex Test Environment** (Separate from production)
4. **Playwright Tests** (Test user credentials)

---

## 1. GitHub Repository Secrets Setup

Navigate to: `https://github.com/TeacherEvan/Evan-sClassTracker4.5/settings/secrets/actions`

### Required Secrets

Click **"New repository secret"** and add each of these:

#### A. Convex Test Deployment

**Name:** `CONVEX_TEST_DEPLOY_KEY`

**How to get it:**
1. Go to https://dashboard.convex.dev/
2. Create a new deployment called "evan-sclasstracker-test" (separate from production)
3. Go to Settings → Deploy Keys
4. Copy the deploy key
5. Paste it here

**Value:** `prod:your-test-deployment|your-test-key-here`

---

#### B. Docker Hub Credentials (for GitHub Actions to push images)

**Name:** `DOCKER_USERNAME`
**Value:** `evilevan91`

**Name:** `DOCKER_PASSWORD`
**Value:** `[Your Docker Hub password - you'll insert this]`

**How to get Docker Hub token (recommended over password):**
1. Go to https://hub.docker.com/settings/security
2. Click "New Access Token"
3. Name it "GitHub Actions - Evan Class Tracker"
4. Copy the token
5. Use this as DOCKER_PASSWORD instead of your actual password

---

#### C. Test User Credentials (Optional - can use defaults)

**Name:** `TEST_ADMIN_PASSWORD`
**Value:** `AdminTest123!` (or choose your own)

**Name:** `TEST_TEACHER_PASSWORD`
**Value:** `TeacherTest123!` (or choose your own)

**Name:** `TEST_MODERATOR_PASSWORD`
**Value:** `ModeratorTest123!` (or choose your own)

---

#### D. Slack Notifications (OPTIONAL)

**Name:** `SLACK_WEBHOOK_URL`
**Value:** `https://hooks.slack.com/services/YOUR/WEBHOOK/URL`

**How to get it:**
1. Go to your Slack workspace
2. Add "Incoming Webhooks" app
3. Create webhook for a channel (e.g., #test-alerts)
4. Copy the webhook URL

---

## 2. Local Environment Files

### A. Create `.env.test.local` (for local testing)

Create this file in project root:

```bash
# Test Environment (DO NOT commit this file)
NEXT_PUBLIC_CONVEX_URL=https://your-test-deployment.convex.cloud
CONVEX_DEPLOYMENT=prod:your-test-deployment-name
CONVEX_DEPLOY_KEY=prod:your-test-deployment|your-test-key

# Test User Credentials
TEST_ADMIN_USERNAME=test-admin
TEST_ADMIN_PASSWORD=AdminTest123!
TEST_TEACHER_USERNAME=test-teacher-1
TEST_TEACHER_PASSWORD=TeacherTest123!
TEST_MODERATOR_USERNAME=test-moderator-1
TEST_MODERATOR_PASSWORD=ModeratorTest123!

# Docker Configuration (for local testing)
DOCKER_USERNAME=evilevan91
# Don't put password here - use `docker login` instead
```

---

### B. Update `.gitignore` (ensure secrets aren't committed)

Already done - verify these are in `.gitignore`:
```
.env.local
.env.test.local
.env*.local
```

---

## 3. Convex Test Deployment Setup

### Create Separate Test Deployment

1. **Go to Convex Dashboard:** https://dashboard.convex.dev/

2. **Create New Deployment:**
   - Click "New Deployment"
   - Name: `evan-sclasstracker-test`
   - Team: Your team
   - Click Create

3. **Get Test Deployment URL:**
   - Copy the URL (e.g., `https://happy-mongoose-123.convex.cloud`)
   - This goes in `NEXT_PUBLIC_CONVEX_URL` for test environment

4. **Get Deploy Key:**
   - Go to Settings → Deploy Keys
   - Copy the deploy key
   - Format: `prod:deployment-name|key-string`
   - Add to GitHub Secrets as `CONVEX_TEST_DEPLOY_KEY`

5. **Copy Schema & Functions:**
   ```bash
   # Deploy your schema to test environment
   CONVEX_DEPLOYMENT=prod:your-test-deployment npx convex deploy
   ```

---

## 4. Docker Hub Setup

### A. Create Repository on Docker Hub

1. **Login:** https://hub.docker.com/
   - Username: `evilevan91`
   - Password: [Your password]

2. **Create Repository:**
   - Click "Create Repository"
   - Name: `evan-class-tracker-test`
   - Visibility: Private (recommended) or Public
   - Click Create

3. **Repository URL will be:** `docker.io/evilevan91/evan-class-tracker-test`

### B. Generate Access Token (Recommended)

Instead of using your password in GitHub Actions:

1. Go to: https://hub.docker.com/settings/security
2. Click "New Access Token"
3. Description: "GitHub Actions - Evan Class Tracker"
4. Access permissions: Read, Write, Delete
5. Generate Token
6. **COPY IT NOW** (you can't see it again)
7. Add to GitHub Secrets as `DOCKER_PASSWORD`

---

## 5. GitHub Actions Configuration

No additional setup needed - the workflow file will use the secrets automatically.

### Verify Workflow Permissions

1. Go to: `https://github.com/TeacherEvan/Evan-sClassTracker4.5/settings/actions`
2. Under "Workflow permissions", ensure:
   - ✅ "Read and write permissions" is selected
   - ✅ "Allow GitHub Actions to create and approve pull requests" is checked

---

## 6. Quick Setup Checklist

### Required (Must Do):

- [ ] Create Convex test deployment
- [ ] Add `CONVEX_TEST_DEPLOY_KEY` to GitHub Secrets
- [ ] Add `DOCKER_USERNAME` to GitHub Secrets (`evilevan91`)
- [ ] Add `DOCKER_PASSWORD` to GitHub Secrets (use access token)
- [ ] Create `.env.test.local` file locally (for local testing)
- [ ] Verify `.gitignore` includes `.env*.local`

### Optional (Nice to Have):

- [ ] Add `TEST_ADMIN_PASSWORD` to GitHub Secrets (defaults to `AdminTest123!`)
- [ ] Add `TEST_TEACHER_PASSWORD` to GitHub Secrets
- [ ] Add `TEST_MODERATOR_PASSWORD` to GitHub Secrets
- [ ] Set up Slack webhook for notifications
- [ ] Create Docker Hub repository for test images

---

## 7. Testing Your Setup

### A. Test Locally First

```bash
# 1. Create test environment file
cp .env.local .env.test.local

# 2. Update .env.test.local with test deployment URL

# 3. Install Playwright
npm install -D @playwright/test
npx playwright install

# 4. Run a simple test
npx playwright test --headed

# 5. Test Docker build
docker build -f Dockerfile.test -t evan-class-tracker-test .
```

### B. Test GitHub Actions

1. Create a small test workflow first:
   ```yaml
   # .github/workflows/test-setup.yml
   name: Test Setup
   on: workflow_dispatch
   
   jobs:
     test-secrets:
       runs-on: ubuntu-latest
       steps:
         - name: Check Secrets
           run: |
             echo "Convex key exists: ${{ secrets.CONVEX_TEST_DEPLOY_KEY != '' }}"
             echo "Docker username: ${{ secrets.DOCKER_USERNAME }}"
             echo "Docker password exists: ${{ secrets.DOCKER_PASSWORD != '' }}"
   ```

2. Commit and push
3. Go to Actions tab
4. Run workflow manually
5. Verify secrets are accessible

---

## 8. Security Best Practices

✅ **DO:**
- Use access tokens instead of passwords
- Keep `.env*.local` files out of git
- Rotate credentials every 90 days
- Use separate test and production deployments
- Review GitHub Actions logs for exposed secrets

❌ **DON'T:**
- Commit `.env.local` or `.env.test.local` to git
- Share deploy keys in public channels
- Use production credentials for testing
- Print secret values in logs
- Use weak test passwords

---

## 9. Troubleshooting

### "Secrets not found" in GitHub Actions

**Solution:** Verify secrets exist in repository settings (not organization settings)

### "Convex deployment failed"

**Solution:** 
1. Check `CONVEX_TEST_DEPLOY_KEY` format is correct
2. Verify deployment exists in dashboard
3. Ensure team permissions are correct

### "Docker login failed"

**Solution:**
1. Verify `DOCKER_USERNAME` is exactly `evilevan91`
2. Regenerate Docker Hub access token
3. Update `DOCKER_PASSWORD` secret

### "Test users not found"

**Solution:** Run seed script first:
```bash
node scripts/seed-test-data.js
```

---

## 10. What You DON'T Need

You **DO NOT** need to create:
- ❌ GitHub personal access token (workflow uses built-in `GITHUB_TOKEN`)
- ❌ Additional API keys (unless using third-party services)
- ❌ AWS/Azure credentials (not using cloud storage)
- ❌ Payment method setup (everything is free tier)

---

## Next Steps

1. **Set up Convex test deployment** (15 minutes)
2. **Add GitHub Secrets** (5 minutes)
3. **Create `.env.test.local`** (2 minutes)
4. **Test locally** (10 minutes)
5. **Run first GitHub Action** (automated testing pipeline)

---

## Summary

**Required APIs/Credentials:**
1. ✅ Convex Test Deployment + Deploy Key
2. ✅ Docker Hub Username + Access Token
3. ✅ Test user passwords (can use defaults)

**NO additional APIs needed** - GitHub Actions uses built-in authentication.

**Total Setup Time:** ~30 minutes

Ready to proceed? Let me know if you need help with any specific step!
