# Stack Alternatives & Migration Guide

[← Back to Index](../copilot-instructions.md)

---

## 🔄 Purpose

Document alternative providers for each stack component with migration paths, ensuring business continuity and avoiding vendor lock-in.

**When to Use**: Evaluating alternatives, planning migration, comparing costs, disaster recovery planning

---

## Current Stack Overview

| Component | Current | Purpose | Lock-in Risk |
|-----------|---------|---------|--------------|
| **Hosting** | Vercel | Next.js deployment, CDN, edge functions | Medium |
| **Backend** | Convex | Real-time database, serverless functions | High |
| **Database Backup** | MongoDB Atlas | Secondary backup storage | Low |
| **Repository** | GitHub | Version control, CI/CD | Low |
| **Auth** | Custom (localStorage) | Session management | Low |
| **Styling** | Tailwind CSS v4 | UI framework | None |

---

## 1. Vercel Alternatives (Frontend Hosting)

### Option A: Netlify ⭐ **Recommended**

**Pros**:

- ✅ Excellent Next.js support (official)
- ✅ Similar DX to Vercel
- ✅ Built-in edge functions
- ✅ Free tier: 100GB bandwidth/month
- ✅ Automatic HTTPS and CDN
- ✅ Git integration (GitHub, GitLab, Bitbucket)

**Cons**:

- ⚠️ Slightly slower build times than Vercel
- ⚠️ Less optimized for Next.js than Vercel

**Pricing**:

- Free: 100GB bandwidth, 300 build minutes
- Pro: $19/month - 1TB bandwidth, 25,000 build minutes
- Business: $99/month - Custom

**Migration Complexity**: 🟢 **Easy** (1-2 hours)

**Migration Steps**:

```powershell
# 1. Install Netlify CLI
npm install -g netlify-cli

# 2. Login to Netlify
netlify login

# 3. Initialize project
netlify init

# 4. Configure build settings
# netlify.toml
[build]
  command = "npm run build"
  publish = ".next"

[build.environment]
  NEXT_PUBLIC_CONVEX_URL = "https://your-deployment.convex.cloud"

# 5. Deploy
netlify deploy --prod

# 6. Configure custom domain (if needed)
netlify domains:add yourdomain.com
```

**Gotchas**:

- Must use `netlify.toml` for environment variables (not `.env`)
- Serverless functions have 10-second timeout (vs Vercel's 60s on Hobby)

---

### Option B: Cloudflare Pages

**Pros**:

- ✅ Unlimited bandwidth (all tiers!)
- ✅ Excellent global CDN (best performance)
- ✅ Free tier: Unlimited requests
- ✅ Built-in analytics
- ✅ R2 storage (cheap object storage)

**Cons**:

- ⚠️ Less polished Next.js support (improving)
- ⚠️ More manual configuration
- ⚠️ Limited serverless function execution time (10s)

**Pricing**:

- Free: Unlimited bandwidth, 500 builds/month
- Pro: $20/month - Unlimited everything

**Migration Complexity**: 🟡 **Medium** (3-4 hours)

**Migration Steps**:

```powershell
# 1. Install Wrangler CLI
npm install -g wrangler

# 2. Login
wrangler login

# 3. Create Pages project
wrangler pages project create class-tracker

# 4. Update next.config.ts for Cloudflare
export default {
  output: 'export', // Static export for Pages
  // Or use @cloudflare/next-on-pages for SSR
}

# 5. Deploy
npx @cloudflare/next-on-pages --experimental-minify
wrangler pages deploy .vercel/output/static
```

---

### Option C: AWS Amplify

**Pros**:

- ✅ AWS ecosystem integration
- ✅ Automatic scaling
- ✅ Good Next.js support
- ✅ Built-in CI/CD

**Cons**:

- ⚠️ More complex setup
- ⚠️ AWS learning curve
- ⚠️ More expensive at scale

**Pricing**:

- Build: $0.01/build minute
- Hosting: $0.15/GB served
- No free tier (but AWS free tier applies)

**Migration Complexity**: 🟠 **Hard** (4-6 hours)

---

### Option D: Self-Hosted (VPS)

**Providers**: DigitalOcean, Linode, Hetzner, AWS EC2

**Pros**:

- ✅ Full control
- ✅ Cheapest at scale ($5-20/month)
- ✅ No vendor lock-in
- ✅ Custom server configurations

**Cons**:

- ❌ Manual server management
- ❌ No automatic scaling
- ❌ Must handle SSL, CDN, backups yourself
- ❌ Security responsibility

**Migration Complexity**: 🔴 **Very Hard** (8-12 hours + ongoing maintenance)

**Basic Setup** (DigitalOcean example):

```bash
# 1. Create Ubuntu 22.04 droplet ($6/month)

# 2. SSH into server
ssh root@your-server-ip

# 3. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 4. Install PM2 (process manager)
npm install -g pm2

# 5. Clone repo
git clone https://github.com/yourusername/class-tracker.git
cd class-tracker

# 6. Install dependencies
npm install

# 7. Build
npm run build

# 8. Start with PM2
pm2 start npm --name "class-tracker" -- start
pm2 save
pm2 startup

# 9. Install Nginx (reverse proxy)
sudo apt install nginx

# 10. Configure Nginx
sudo nano /etc/nginx/sites-available/class-tracker
# Add configuration (see below)

# 11. Install SSL certificate (Let's Encrypt)
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com

# 12. Restart Nginx
sudo systemctl restart nginx
```

**Nginx Configuration**:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 2. Convex Alternatives (Backend/Database)

### ⚠️ **HIGH LOCK-IN RISK** - Convex uses proprietary patterns

**Migration Difficulty**: 🔴 **Very High** - Requires significant refactoring

### Option A: Firebase (Google) ⭐ **Closest Alternative**

**Pros**:

- ✅ Real-time database (similar to Convex)
- ✅ Serverless functions (Cloud Functions)
- ✅ Built-in auth (better than custom)
- ✅ Offline support
- ✅ Google ecosystem
- ✅ Generous free tier

**Cons**:

- ⚠️ Different API patterns (requires full rewrite)
- ⚠️ Less TypeScript-native than Convex
- ⚠️ Query syntax very different

**Pricing**:

- Free: 10GB storage, 50K reads/day, 20K writes/day
- Blaze (Pay-as-you-go): $0.06/GB storage, $0.036/100K reads

**Migration Complexity**: 🔴 **Very Hard** (2-4 weeks full-time)

**Code Comparison**:

```typescript
// CONVEX (current)
export const list = query({
  handler: async (ctx, args) => {
    return await ctx.db
      .query("classes")
      .withIndex("by_school", q => q.eq("schoolId", args.schoolId))
      .collect();
  }
});

// FIREBASE (alternative)
import { collection, query, where, getDocs } from 'firebase/firestore';

async function list(schoolId: string) {
  const q = query(
    collection(db, "classes"), 
    where("schoolId", "==", schoolId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
```

**Migration Steps**:

1. **Create Firebase project** (console.firebase.google.com)
2. **Export Convex data** (Dashboard → Settings → Export)
3. **Transform data schema** (Convex IDs → Firebase IDs)
4. **Rewrite all queries** (ctx.db → Firebase SDK)
5. **Rewrite all mutations** (mutations → Cloud Functions)
6. **Update frontend** (useQuery → useFirestore hooks)
7. **Test thoroughly** (real-time updates, permissions)
8. **Gradual migration** (feature by feature)

---

### Option B: Supabase (Open Source) ⭐ **Open Source Alternative**

**Pros**:

- ✅ PostgreSQL-based (standard SQL)
- ✅ Real-time subscriptions
- ✅ RESTful API + Realtime
- ✅ Built-in auth
- ✅ Open source (can self-host)
- ✅ Row-level security
- ✅ Free tier: 500MB database, 2GB bandwidth

**Cons**:

- ⚠️ Not as real-time optimized as Convex
- ⚠️ More complex setup than Convex
- ⚠️ Requires SQL knowledge

**Pricing**:

- Free: 500MB database, 2GB bandwidth
- Pro: $25/month - 8GB database, 250GB bandwidth
- Enterprise: Custom

**Migration Complexity**: 🔴 **Very Hard** (3-5 weeks)

**Code Comparison**:

```typescript
// CONVEX
const data = useQuery(api.classes.list, { schoolId });

// SUPABASE
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

const { data } = useQuery({
  queryKey: ['classes', schoolId],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .eq('schoolId', schoolId);
    if (error) throw error;
    return data;
  }
});

// Real-time subscription
useEffect(() => {
  const channel = supabase
    .channel('classes-changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'classes' },
      (payload) => {
        // Handle real-time update
        queryClient.invalidateQueries(['classes']);
      }
    )
    .subscribe();
  
  return () => {
    supabase.removeChannel(channel);
  };
}, []);
```

---

### Option C: PlanetScale + tRPC (Modern Stack)

**Pros**:

- ✅ MySQL (standard, portable)
- ✅ tRPC = type-safe APIs
- ✅ Branching database (like Git)
- ✅ Automatic scaling
- ✅ No connection limits

**Cons**:

- ❌ No built-in real-time (need separate solution)
- ⚠️ More boilerplate than Convex
- ⚠️ Requires manual index management

**Pricing**:

- Free: 5GB storage, 1 billion row reads/month
- Scaler Pro: $39/month

**Migration Complexity**: 🔴 **Very Hard** (4-6 weeks)

---

### Option D: AWS AppSync + DynamoDB

**Pros**:

- ✅ Real-time with GraphQL subscriptions
- ✅ AWS ecosystem
- ✅ Managed service
- ✅ Automatic scaling

**Cons**:

- ❌ Complex setup
- ❌ AWS learning curve
- ❌ GraphQL overhead
- ❌ More expensive

**Pricing**: Pay-as-you-go (complex pricing model)

**Migration Complexity**: 🔴 **Extremely Hard** (6-8 weeks)

---

## 3. MongoDB Atlas Alternatives (Backup Storage)

### Current Usage: Secondary backup only (low priority)

### Option A: PostgreSQL (Self-Hosted or Managed)

**Providers**: Supabase, Neon, Railway, Render

**Pros**:

- ✅ Standard SQL
- ✅ Better relational data support
- ✅ Free tiers available
- ✅ Wide tooling support

**Migration**: Medium complexity (schema conversion needed)

### Option B: SQLite (Local Backups)

**Pros**:

- ✅ No cost
- ✅ File-based (easy to archive)
- ✅ Fast for local development

**Cons**:

- ❌ Not suitable for production
- ❌ Single-file limitation

**Use Case**: Development backups only

### Option C: Convex Snapshots (Native)

```powershell
# Use Convex's built-in snapshot feature
npx convex export --path ./backup-$(Get-Date -Format yyyy-MM-dd).zip

# Restore
npx convex import --path ./backup-2025-11-02.zip
```

**Pros**:

- ✅ Native format (no conversion)
- ✅ Free (included with Convex)
- ✅ Fast restore

**Recommended**: Use this INSTEAD of MongoDB for backups!

---

## 4. GitHub Alternatives (Version Control)

### Option A: GitLab

**Pros**:

- ✅ Built-in CI/CD (better than GitHub Actions)
- ✅ Self-hosted option
- ✅ Unlimited private repos (free)
- ✅ Integrated DevOps tools

**Migration**:

```powershell
# 1. Create GitLab account and project

# 2. Add GitLab remote
git remote add gitlab https://gitlab.com/yourusername/class-tracker.git

# 3. Push all branches
git push gitlab --all
git push gitlab --tags

# 4. Update CI/CD pipelines
# .gitlab-ci.yml instead of .github/workflows/*.yml
```

### Option B: Bitbucket

**Pros**:

- ✅ Jira integration
- ✅ Free for small teams (5 users)
- ✅ Built-in CI/CD (Bitbucket Pipelines)

**Migration**: Similar to GitLab (add remote, push)

### Option C: Self-Hosted Git (Gitea/Gogs)

**Pros**:

- ✅ Full control
- ✅ No cost
- ✅ Lightweight

**Cons**:

- ❌ No cloud CI/CD
- ❌ Manual maintenance

---

## 5. Complete Stack Alternative Recommendations

### Scenario A: Stay Close to Current Stack 💚 **Least Disruption**

**Recommended Changes**:

- Hosting: Vercel → **Netlify** (Easy migration, similar DX)
- Backend: Keep Convex (no good alternative without major rewrite)
- Backup: MongoDB → **Convex Snapshots** (Native, simpler)
- Repository: Keep GitHub

**Migration Time**: 1-2 days  
**Cost Impact**: Similar or cheaper  
**Risk**: Low

---

### Scenario B: Modern Open-Source Stack 🔵 **More Control**

**Recommended Stack**:

- Hosting: **Cloudflare Pages** (Unlimited bandwidth)
- Backend: **Supabase** (Open source, PostgreSQL)
- Auth: **Supabase Auth** (Built-in, secure)
- Repository: Keep GitHub

**Migration Time**: 4-6 weeks  
**Cost Impact**: Cheaper long-term  
**Risk**: Medium-High

---

### Scenario C: AWS All-In 🟠 **Enterprise Scale**

**Recommended Stack**:

- Hosting: **AWS Amplify**
- Backend: **AppSync + DynamoDB**
- Auth: **AWS Cognito**
- Storage: **S3**
- Repository: Keep GitHub

**Migration Time**: 8-12 weeks  
**Cost Impact**: Higher initially, scales better  
**Risk**: High

---

### Scenario D: Maximum Portability 🟢 **Future-Proof**

**Recommended Stack**:

- Hosting: **Netlify** (easy to switch)
- Backend: **tRPC + PlanetScale** (standard APIs)
- Auth: **NextAuth.js** (open source)
- Repository: **GitLab** (self-hostable)

**Migration Time**: 6-8 weeks  
**Cost Impact**: Similar  
**Risk**: Medium

---

## 6. Migration Checklist (Any Provider)

### Pre-Migration (1 week before)

- [ ] **Full backup**: Export all data from Convex
- [ ] **Document current setup**: Environment variables, configurations
- [ ] **Test new provider**: Create test project, deploy hello-world
- [ ] **Cost estimation**: Calculate projected monthly costs
- [ ] **Rollback plan**: Document how to revert if migration fails

### Migration Week

- [ ] **Day 1-2**: Set up new infrastructure (accounts, projects, databases)
- [ ] **Day 3-4**: Migrate data (export/import/transform)
- [ ] **Day 5-6**: Deploy application to new provider (parallel to old)
- [ ] **Day 7**: Testing (functional, performance, load)

### Post-Migration (1 week after)

- [ ] **Monitor errors**: Check logs daily
- [ ] **Performance comparison**: Old vs new (page load, query times)
- [ ] **Cost tracking**: Actual vs estimated
- [ ] **Documentation update**: Update all docs with new provider details
- [ ] **Decommission old**: Cancel old provider after 30-day stability period

---

## 7. Emergency Migration (Provider Outage)

**If primary provider goes down and you need immediate migration**:

### Emergency Convex → Firebase Migration (24-48 hours)

```powershell
# 1. Export Convex data (JSON format)
# Dashboard → Settings → Export Data

# 2. Create Firebase project
# console.firebase.google.com

# 3. Quick data import script
node scripts/emergency-firebase-import.js

# 4. Deploy frontend with Firebase SDK
# Update all useQuery calls to Firebase equivalents

# 5. Go live on new stack
npm run build
vercel --prod
```

**Priority Order**:

1. Auth (users can login)
2. Critical reads (view classes, students)
3. Critical writes (book classes)
4. Everything else (reports, analytics)

---

## 8. Cost Comparison (100 Active Users)

| Provider Combo | Monthly Cost | Free Tier | Lock-in Risk |
|----------------|--------------|-----------|--------------|
| **Current** (Vercel + Convex + MongoDB) | $0-20 | Yes | Medium |
| **Netlify + Convex** | $0-20 | Yes | Medium |
| **Cloudflare + Supabase** | $0 | Yes | Low |
| **Vercel + Firebase** | $0-25 | Yes | Medium |
| **AWS (Amplify + AppSync)** | $30-50 | Limited | High |
| **Self-Hosted (VPS + Supabase)** | $15-25 | No | None |

*Assumes: 1M pageviews/month, 10M database operations/month, 100GB bandwidth*

---

## 9. Quick Decision Matrix

**Choose Netlify** if:

- ✅ You like Vercel but want cheaper/better DX
- ✅ You want easy migration (1-2 days)
- ✅ You don't need to change backend

**Choose Supabase** if:

- ✅ You want open source
- ✅ You need better auth than custom
- ✅ You're willing to rewrite backend (4-6 weeks)
- ✅ You want SQL database

**Choose Firebase** if:

- ✅ You want real-time like Convex
- ✅ You prefer Google ecosystem
- ✅ You need mobile apps eventually
- ✅ You're willing to rewrite backend (3-5 weeks)

**Stay with Current Stack** if:

- ✅ Everything works fine
- ✅ No budget pressure
- ✅ Team knows Convex well
- ✅ No plan to scale beyond 1000 users soon

---

## 10. Resources & Documentation

### Official Docs

- **Netlify**: <https://docs.netlify.com>
- **Firebase**: <https://firebase.google.com/docs>
- **Supabase**: <https://supabase.com/docs>
- **Cloudflare Pages**: <https://developers.cloudflare.com/pages>

### Migration Guides

- **Vercel → Netlify**: <https://docs.netlify.com/frameworks/next-js>
- **Convex → Firebase**: (No official guide - manual migration)
- **Convex → Supabase**: (No official guide - manual migration)

### Community Support

- **Convex Discord**: <https://convex.dev/community>
- **Supabase Discord**: <https://discord.supabase.com>
- **Firebase Community**: <https://firebase.google.com/community>

---

[← Back to Index](../copilot-instructions.md)
