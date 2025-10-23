# DapsiGames Deployment Guide

## Pre-Deployment Checklist

### 1. Environment Setup
Ensure all required environment variables are configured:

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/dapsigames

# Supabase (for future auth enhancement)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# Node Environment
NODE_ENV=production
```

### 2. Database Setup

**Option A: Using Neon PostgreSQL (Recommended)**
1. Create a Neon project at https://neon.tech
2. Copy the connection string to `DATABASE_URL`
3. Run database migrations:
```bash
npm run db:push
```

**Option B: Local PostgreSQL**
1. Install PostgreSQL
2. Create database:
```bash
createdb dapsigames
```
3. Set `DATABASE_URL` to local connection string
4. Run migrations

### 3. Initialize Game Data
The application will automatically initialize:
- Badge definitions
- Level requirements
- XP thresholds

If tables exist, this happens on first API call.

### 4. Build Process

**Production Build:**
```bash
npm run build
```

This command:
- Compiles TypeScript
- Bundles frontend with Vite
- Optimizes assets
- Generates production build in `dist/`

**Verify Build:**
```bash
npm run preview
```

## Deployment Platforms

### Replit Deployments
1. Click "Deploy" button in Replit
2. Choose deployment type: **Autoscale** (recommended)
3. Configure:
   - Build command: `npm run build`
   - Run command: `npm run start`
   - Port: 5000
4. Add environment variables in Secrets tab
5. Deploy!

### Alternative Platforms

#### Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**vercel.json:**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server/index.ts",
      "use": "@vercel/node"
    },
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist/public"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "server/index.ts"
    },
    {
      "src": "/(.*)",
      "dest": "dist/public/$1"
    }
  ]
}
```

#### Railway
1. Connect GitHub repository
2. Add PostgreSQL database service
3. Set environment variables
4. Deploy automatically on push

#### Render
1. Create new Web Service
2. Connect repository
3. Build command: `npm run build`
4. Start command: `npm run start`
5. Add environment variables
6. Deploy

## Post-Deployment

### 1. Verify Core Features
- [ ] Homepage loads correctly
- [ ] User registration works
- [ ] Login successful
- [ ] Dashboard displays
- [ ] Leaderboard updates
- [ ] Games function properly
- [ ] WebSocket connection established

### 2. Monitor Performance
Use these tools:
- Google PageSpeed Insights
- Lighthouse (Chrome DevTools)
- Web Vitals
- Application logs

### 3. Database Monitoring
- Connection pool status
- Query performance
- Index usage
- Storage capacity

### 4. Error Monitoring
Consider integrating:
- Sentry (error tracking)
- LogRocket (session replay)
- Google Analytics (user behavior)

## Scaling Considerations

### Database Optimization
- Enable connection pooling (already configured)
- Add read replicas for high traffic
- Optimize queries with EXPLAIN ANALYZE
- Regular VACUUM and ANALYZE

### CDN Integration
- CloudFlare for static assets
- Image optimization (WebP, AVIF)
- Edge caching for API responses

### Load Balancing
For high traffic:
- Multiple server instances
- Redis for session storage
- Database read replicas
- WebSocket server scaling

## Security Hardening

### Production Checklist
- [ ] HTTPS enforced
- [ ] Security headers configured (Helmet.js)
- [ ] Rate limiting active
- [ ] Input validation on all endpoints
- [ ] CORS properly configured
- [ ] Secrets in environment variables
- [ ] SQL injection prevention (Drizzle ORM)
- [ ] XSS protection enabled
- [ ] CSRF tokens implemented

### SSL/TLS
Most platforms (Replit, Vercel, Railway) provide automatic SSL.

For custom domains:
- Let's Encrypt (free)
- Cloudflare (free tier)

## Backup Strategy

### Database Backups
- Automated daily backups (Neon provides this)
- Point-in-time recovery
- Export schema regularly

### Code Backups
- Git version control
- GitHub/GitLab repository
- Tagged releases

## Maintenance

### Regular Tasks
- Weekly: Review error logs
- Monthly: Update dependencies
- Quarterly: Security audit
- Annually: Performance review

### Update Process
```bash
# Check for outdated packages
npm outdated

# Update dependencies
npm update

# Test thoroughly
npm test

# Deploy
npm run build
```

## Rollback Plan

### Quick Rollback
1. Revert to previous Git commit
2. Redeploy previous version
3. Monitor for stability

### Database Rollback
- Use Neon's point-in-time recovery
- Restore from backup if needed

## Monitoring & Alerts

### Key Metrics
- Server uptime
- Response times
- Error rates
- Database connections
- WebSocket connections
- User activity

### Alerting
Set up alerts for:
- Server downtime
- High error rate (>5%)
- Slow response times (>2s)
- Database connection failures

## Domain Configuration

### Custom Domain Setup
1. Purchase domain (Namecheap, Google Domains)
2. Add DNS records:
   ```
   A     @     [server-ip]
   CNAME www   [platform-url]
   ```
3. Configure in deployment platform
4. Enable SSL certificate

## Cost Optimization

### Free Tier Options
- **Neon**: 3GB storage, 10 branches
- **Vercel**: 100GB bandwidth
- **Railway**: $5 free credits monthly
- **Replit**: Autoscale deployments

### Scaling Costs
Monitor usage to avoid unexpected costs:
- Database storage growth
- Bandwidth consumption
- API request volume
- WebSocket connections

## Troubleshooting

### Common Issues

**Database Connection Fails**
```bash
# Check DATABASE_URL format
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL
```

**Build Fails**
```bash
# Clear cache
rm -rf node_modules dist
npm install
npm run build
```

**WebSocket Not Connecting**
- Verify WSS protocol in production
- Check CORS configuration
- Ensure port is open

**High Memory Usage**
- Check for memory leaks
- Optimize database queries
- Reduce cached data

## Support & Documentation

- **Technical Issues**: GitHub Issues
- **Community**: Discord server (if available)
- **Email**: support@dapsigames.com

---

**Deployment Status**: Production-Ready
**Last Updated**: October 23, 2025
**Version**: 1.0.0
