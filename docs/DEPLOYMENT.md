# EduSync Deployment Guide

## Quick Start: Deploy to Firebase Hosting

### Prerequisites
- Firebase CLI installed: npm install -g firebase-tools
- Firebase project configured: firebase projects:list
- Admin access to Firebase project

### 1-Minute Deployment

`ash
# Login to Firebase
firebase login

# Select your project
firebase use production

# Build and deploy
npm run deploy:production
`

Done! Your app is live at: https://edusync.ph

## Detailed Deployment Steps

### Step 1: Prepare Environment

`ash
# Install dependencies
npm install

# Create .env.local from .env.example
cp .env.example .env.local

# Add your Firebase credentials:
# - VITE_FIREBASE_API_KEY
# - VITE_FIREBASE_PROJECT_ID
# - VITE_SUPABASE_URL (optional, for PostgreSQL)
`

### Step 2: Test Locally

`ash
# Start dev server
npm run dev:prod

# Open http://localhost:5173 and verify everything works

# Run tests
npm run test:e2e:prod
`

### Step 3: Build Optimized Bundle

`ash
# Build for production
npm run build:prod

# Output: dist/ folder (7-8 MB, minified + gzipped)
`

### Step 4: Deploy

`ash
# Deploy to Firebase Hosting
firebase deploy --only hosting

# Monitor deployment in Firebase Console
`

### Step 5: Verify

`ash
# Check deployment status
firebase hosting:channel:list

# View deployment logs
firebase functions:log
`

## Deployment Environments

### Staging
`ash
npm run deploy:staging
# URL: https://edusync-sis-staging.web.app
`

### Production
`ash
npm run deploy:production
# URL: https://edusync.ph (custom domain)
`

## Continuous Integration/Deployment (CI/CD)

GitHub Actions automatically:
1. Runs tests on every PR
2. Deploys to staging on merge to main
3. Deploys to production on version tag (v*.*.*)

**To trigger production deployment:**
`ash
git tag v1.2.3
git push origin v1.2.3
# GitHub Actions automatically deploys to production
`

## Zero-Downtime Deployment

Firebase Hosting uses CDN with edge caching:
1. Build new bundle (no downtime)
2. Upload to Firebase (atomic swap)
3. CDN invalidates cache (instant)

Result: Deployment with zero user impact

## Rollback Strategy

If deployment has issues:

`ash
# Rollback to previous version
firebase hosting:channel:deploy previous

# Or manually select from deployment history
firebase hosting:versions:list
firebase hosting:versions:promote {version-id}
`

## Database Migrations

### Firestore Migrations
`ash
# Export data before migration
firebase firestore:export gs://your-bucket/backup

# Run migration script
node scripts/migrate-firestore.cjs

# Verify data
npm run test:firestore-rules
`

### PostgreSQL Migrations
`ash
# Connect to Supabase and run migrations
psql -U postgres -h api.supabase.co -d edusync

# Verify
SELECT version FROM schema_migrations;
`

## Monitoring Post-Deployment

### Key Metrics to Monitor
1. Page Load Time - Should be <2s (target 1.2s)
2. Error Rate - Should be <0.1%
3. Firestore Latency - Should be <50ms p95
4. Concurrent Users - Track against capacity

### Accessing Logs
`ash
# Firebase Hosting logs
firebase hosting:log --limit 100

# Cloud Functions logs
firebase functions:log
`

## Troubleshooting Deployments

### Deployment Fails
`ash
# Clear cache
npm run clean:cache

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Try again
npm run build:prod && firebase deploy
`

### Secrets Exposed
If you accidentally committed a secret:
1. Immediately revoke the key in Firebase Console
2. Regenerate the key
3. Use git filter-branch to remove from history

### High Latency After Deploy
- Check Firestore indexes are created
- Verify no N+1 queries in code
- Check browser cache (Ctrl+Shift+R to hard refresh)
- Monitor Firestore read/write counts

## Performance Tuning

### Reduce Bundle Size
`ash
npm run build:prod -- --analyze
npm prune --production
`

### Optimize Images
- Use WebP format with PNG fallback
- Optimize via sharp in CI/CD
- Set max-width: 1200px in CSS

### Firestore Query Optimization
- Add composite indexes for complex queries
- Use collection groups wisely
- Batch operations to reduce latency

## Cost Optimization

### Typical Monthly Costs
- Firestore: 20-50 USD (depends on usage)
- Firebase Hosting: 0-5 USD (generous free tier)
- Cloud Storage: 0.05-1 USD (minimal files)
- Cloud Functions: 1-10 USD (depends on invocations)
- Total: 25-65 USD/month for 1000+ users

### Cost Reduction Tips
- Use Firestore free tier (1GB storage, 50k reads/day)
- Optimize queries to reduce document reads
- Batch operations
- Use CDN aggressively

## Security Checklist Before Production

- [ ] Firebase Security Rules reviewed
- [ ] PostgreSQL RLS enabled
- [ ] HTTPS enforced
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] API keys restricted to domain
- [ ] Database backups enabled
- [ ] Monitoring/alerts configured
- [ ] DDoS protection enabled (GCP)
- [ ] Secrets NOT in version control

---

Last updated: September 2025
