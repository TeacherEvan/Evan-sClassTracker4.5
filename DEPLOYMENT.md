# Deployment Guide

This guide will help you deploy the Class Tracker notification system to production.

## Prerequisites

- A GitHub account
- A Vercel account (free tier is fine)
- A Convex account (free tier is fine)

## Step 1: Set up Convex

1. Visit [convex.dev](https://convex.dev) and sign up for a free account
2. Install the Convex CLI globally (optional):
   ```bash
   npm install -g convex
   ```

3. In your project directory, run:
   ```bash
   npx convex dev
   ```

4. Follow the prompts to:
   - Log in to your Convex account
   - Create a new project or link to an existing one
   - This will create a `.env.local` file with your `NEXT_PUBLIC_CONVEX_URL`

5. The Convex dashboard will open automatically. Here you can:
   - View your database tables
   - Monitor function calls
   - Test queries and mutations

## Step 2: Deploy to Vercel

### Option A: Using Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

3. Follow the prompts to link to your GitHub repository

4. Add environment variables in the Vercel dashboard:
   - `NEXT_PUBLIC_CONVEX_URL` - Your Convex deployment URL

### Option B: Using Vercel Dashboard

1. Visit [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository
4. Configure environment variables:
   - `NEXT_PUBLIC_CONVEX_URL` - Your Convex deployment URL
5. Click "Deploy"

## Step 3: Configure Convex for Production

1. Create a production deployment:
   ```bash
   npx convex deploy
   ```

2. This will give you a production URL. Update your Vercel environment variables with this URL.

3. Redeploy on Vercel to use the production Convex deployment.

## Environment Variables

Create a `.env.local` file in your project root:

```env
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
```

**Important:** Never commit `.env.local` to your repository. It's already in `.gitignore`.

## Testing the Deployment

1. Visit your deployed URL
2. Try creating a notification in both English and Thai
3. Switch between languages using the language switcher
4. Verify notifications are saved and displayed correctly
5. Test marking notifications as read/unread
6. Test deleting notifications

## Monitoring

### Convex Dashboard
- Visit your Convex dashboard to monitor:
  - Database queries
  - Function execution times
  - Error logs

### Vercel Dashboard
- Monitor your deployment:
  - Build logs
  - Runtime logs
  - Performance metrics

## Troubleshooting

### Notifications not loading
- Check that `NEXT_PUBLIC_CONVEX_URL` is set correctly in Vercel
- Verify your Convex deployment is active in the Convex dashboard
- Check browser console for CORS or connection errors

### Build failures
- Ensure all dependencies are listed in `package.json`
- Check build logs in Vercel dashboard
- Verify Node.js version compatibility (requires Node 20+)

### Database errors
- Check Convex dashboard for schema errors
- Ensure your schema matches the types in your code
- Verify indexes are created properly

## Updating the Application

1. Make changes to your code locally
2. Test locally with `npm run dev`
3. Commit and push to GitHub
4. Vercel will automatically deploy the changes
5. If you changed the schema, run:
   ```bash
   npx convex deploy
   ```

## Cost Considerations

### Free Tiers
- **Vercel:** 100GB bandwidth/month, unlimited personal projects
- **Convex:** 1GB storage, 1M function calls/month

Both platforms offer generous free tiers suitable for small to medium-sized schools.

## Security Best Practices

1. Never commit sensitive data or API keys
2. Use environment variables for all configuration
3. Regularly update dependencies: `npm audit fix`
4. Enable Vercel's security headers
5. Monitor Convex access logs for unusual activity

## Support

- **Convex Documentation:** https://docs.convex.dev
- **Next.js Documentation:** https://nextjs.org/docs
- **Vercel Documentation:** https://vercel.com/docs
