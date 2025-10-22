# DapsiGames Deployment Guide

## Prerequisites

- Node.js 18 or higher
- PostgreSQL database
- Supabase account (for authentication)
- Domain name (for production)

## Environment Variables

Create a `.env` file in the root directory:

```bash
# Server Configuration
NODE_ENV=production
PORT=5000

# Database (provided by Replit)
DATABASE_URL=postgresql://user:password@host:port/database

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Session Secret (generate a random string)
SESSION_SECRET=your-very-secure-random-string-here

# CORS Origins (comma-separated for multiple origins)
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

## Production Build

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Database Migrations
```bash
npm run db:push
```

### 3. Build the Application
```bash
npm run build
```

### 4. Start the Production Server
```bash
npm start
```

## Deployment on Replit

### Using Replit Deployments

1. Click the **Deploy** button in the Replit interface
2. Configure deployment settings:
   - **Deployment Type**: Choose "Autoscale" for stateless web apps
   - **Environment Variables**: Add all required variables from `.env`
3. Click **Deploy**

### Manual Deployment Steps

1. **Set Environment Variables**
   - Go to Replit Secrets (lock icon)
   - Add all required environment variables

2. **Configure Run Command**
   ```bash
   npm start
   ```

3. **Test Deployment**
   - Access your app at the provided Replit URL
   - Verify all features work correctly

## Health Monitoring

### Health Check Endpoint
```
GET /api/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "uptime": 86400,
  "database": "connected"
}
```

### Monitoring Checklist
- [ ] API health endpoint responds with 200 status
- [ ] Database connections are working
- [ ] WebSocket connections establish successfully
- [ ] Authentication flow works end-to-end
- [ ] Real-time features update correctly

## Performance Optimization

### Caching Strategy
- Static assets cached for 1 year
- API responses cached where appropriate
- Database query results cached in memory

### CDN Configuration
For production, configure CDN for:
- Static images and assets
- CSS and JavaScript bundles
- Font files

## Security Checklist

- [ ] All environment variables set correctly
- [ ] HTTPS enabled (automatic on Replit)
- [ ] Rate limiting configured
- [ ] Helmet.js security headers active
- [ ] Input validation on all endpoints
- [ ] Password hashing with bcrypt
- [ ] SQL injection protection (using Drizzle ORM)
- [ ] XSS protection enabled
- [ ] CORS configured for allowed origins

## Database Backup

### Automatic Backups (Replit)
Replit automatically backs up your database. Access backups from the Database pane.

### Manual Backup
```bash
# Export database
pg_dump $DATABASE_URL > backup.sql

# Restore database
psql $DATABASE_URL < backup.sql
```

## Troubleshooting

### Common Issues

**Issue:** Application won't start
- Check all environment variables are set
- Verify DATABASE_URL is correct
- Check server logs for errors

**Issue:** Database connection fails
- Verify DATABASE_URL format
- Check database server is running
- Ensure firewall allows connections

**Issue:** Authentication not working
- Verify Supabase credentials
- Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
- Ensure email verification is configured

**Issue:** WebSocket connections fail
- Check firewall settings
- Verify WebSocket port is open
- Check CORS configuration

## Rollback Procedure

If deployment fails:

1. Click "View Checkpoints" in Replit
2. Select previous working checkpoint
3. Click "Rollback to this checkpoint"
4. Verify application is working

## Post-Deployment Verification

1. **Authentication Test**
   - Register a new user
   - Login with credentials
   - Reset password flow

2. **Core Features Test**
   - Complete a game
   - View leaderboard
   - Earn points
   - Unlock achievements

3. **Performance Test**
   - Check page load times
   - Verify real-time updates
   - Test under load

4. **Security Test**
   - Attempt SQL injection
   - Try XSS attacks
   - Test rate limiting

## Maintenance

### Regular Tasks
- Monitor error logs daily
- Check database performance weekly
- Review security logs weekly
- Update dependencies monthly
- Backup database daily (automatic)

### Updates
```bash
# Update dependencies
npm update

# Check for security vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix
```

## Support

For issues:
1. Check application logs
2. Review error messages
3. Consult API documentation
4. Contact support team

## Scaling

### Horizontal Scaling
On Replit Autoscale:
- Automatically scales based on traffic
- Configure min/max instances
- Monitor scaling metrics

### Database Scaling
- Use connection pooling
- Optimize queries with indexes
- Consider read replicas for high traffic
