# How to Create a Convex Test Deployment - Step by Step

## Quick Answer: No New Project Needed

You can have **multiple deployments** in the same Convex project. Think of deployments as separate environments (like dev/staging/production) - they share the same code but have separate databases.

---

## Method 1: Via Convex Dashboard (Easiest)

### Step-by-Step

1. **Go to Convex Dashboard**
   - URL: <https://dashboard.convex.dev/>
   - Login with your existing account

2. **You should see your current project:**
   - `evan-sclasstracker` (your production deployment)

3. **Click the Deployment Dropdown** (top-left corner)
   - Next to your current deployment name
   - You'll see: "resolute-basilisk-801" (production)

4. **Click "+ New Deployment"**
   - A dialog will appear

5. **Fill in the form:**
   - **Deployment Name:** `evan-sclasstracker-test`
   - **Project:** Select your existing project (should auto-select)
   - **Team:** Your team name
   - Click **"Create Deployment"**

6. **You now have TWO deployments:**
   - `resolute-basilisk-801` (production) ← your current one
   - `[new-animal-name]-xxx` (test) ← your new one

---

## Method 2: Via Command Line

You can also create it from your terminal:

```bash
# Navigate to your project directory
cd "C:\Users\User\OneDrive\Documents\Vs2\Evan'sClassTracker4.5\Evan-sClassTracker4.5"

# Create new deployment (will prompt for name)
npx convex dev --once --configure new

# When prompted:
# - Deployment name: evan-sclasstracker-test
# - Select existing project: evan-sclasstracker
```

---

## After Creating the Deployment

### 1. Get the Deployment URL

After creation, you'll see:

- **Deployment URL:** `https://[animal-name]-[number].convex.cloud`
- Example: `https://happy-mongoose-456.convex.cloud`

**Copy this!** You'll need it for `.env.test.local`

### 2. Get the Deploy Key

**In the Dashboard:**

1. Make sure you're on the TEST deployment (check dropdown)
2. Go to **Settings** (left sidebar)
3. Click **Deploy Keys**
4. Click **"Create Deploy Key"** or copy existing key
5. Copy the key - format: `prod:deployment-name|long-key-string`

**Copy this!** You'll need it for GitHub Secrets

### 3. Deploy Your Schema to Test Environment

```bash
# Set the test deployment as active
$env:CONVEX_DEPLOYMENT="prod:happy-mongoose-456"  # Use YOUR test deployment

# Deploy schema and functions
npx convex deploy

# This copies your schema.ts and all functions to the test deployment
```

### 4. Update Your `.env.test.local`

Open the file and fill in:

```bash
# Replace these with YOUR test deployment values
NEXT_PUBLIC_CONVEX_URL=https://happy-mongoose-456.convex.cloud
CONVEX_DEPLOYMENT=prod:happy-mongoose-456
CONVEX_DEPLOY_KEY=prod:happy-mongoose-456|eyJ2MiI6ImFiY2RlZjEyMzQ1Njc4OTAifQ==
```

---

## Understanding Deployments

### You Now Have

**Production Deployment:**

- Name: `resolute-basilisk-801`
- URL: `https://resolute-basilisk-801.convex.cloud`
- Used by: Live app (in .env.local)
- Data: Real user data

**Test Deployment:**

- Name: `happy-mongoose-456` (example)
- URL: `https://happy-mongoose-456.convex.cloud`
- Used by: Automated tests (in .env.test.local)
- Data: Test data only (safe to delete)

### Both Deployments

- ✅ Share the same code (schema, functions)
- ✅ Have separate databases
- ✅ Can be deployed to independently
- ✅ Are in the same Convex project

---

## Switching Between Deployments

### In Dashboard

Click the deployment dropdown (top-left) and select the one you want to view

### In Terminal

```bash
# Use production
$env:CONVEX_DEPLOYMENT="prod:resolute-basilisk-801"
npx convex dev

# Use test
$env:CONVEX_DEPLOYMENT="prod:happy-mongoose-456"  # your test deployment
npx convex dev
```

### In Your App

Different `.env` files point to different deployments:

- `.env.local` → Production
- `.env.test.local` → Test

---

## Visual Guide

```
Your Convex Account
└── evan-sclasstracker (Project)
    ├── resolute-basilisk-801 (Production Deployment)
    │   ├── Database: Real users, classes, students
    │   └── Functions: Your current code
    │
    └── happy-mongoose-456 (Test Deployment)  ← NEW!
        ├── Database: Test users only
        └── Functions: Same code as production
```

---

## Quick Checklist

After creating test deployment:

- [ ] Test deployment created in dashboard
- [ ] Test deployment URL copied
- [ ] Deploy key created and copied
- [ ] Schema deployed to test environment (`npx convex deploy`)
- [ ] `.env.test.local` updated with test deployment values
- [ ] GitHub Secret `CONVEX_TEST_DEPLOY_KEY` added

---

## Cost

**FREE!** Convex free tier includes:

- Multiple deployments ✅
- 1 GB database per deployment
- Unlimited function executions (with rate limits)

Test deployment won't affect your production limits.

---

## Troubleshooting

### "I don't see '+ New Deployment' button"

**Solution:** Make sure you're viewing the **Projects** page, not the Functions page. Click on your project name first.

### "It's asking me to create a new project"

**Solution:** When creating, make sure to **select your existing project** from the dropdown, don't create a new one.

### "Deploy key not showing"

**Solution:**

1. Make sure you switched to the TEST deployment (check dropdown)
2. Go to Settings → Deploy Keys
3. Click "Create Deploy Key" if none exists

### "Schema not deploying"

**Solution:**

```bash
# Make sure you're pointing to the right deployment
$env:CONVEX_DEPLOYMENT="prod:your-test-deployment-name"

# Then deploy
npx convex deploy
```

---

## Next Steps

1. **Create the test deployment** (takes 2 minutes)
2. **Get URL and deploy key** (from dashboard)
3. **Deploy schema** (`npx convex deploy`)
4. **Update `.env.test.local`**
5. **Add deploy key to GitHub Secrets**
6. **You're done!**

---

## Need Help?

If you get stuck, let me know and I can walk you through it step-by-step with your actual deployment names!
