# DapsiGames Performance Optimization Guide

## Current Performance Status

### Implemented Optimizations
✅ Code splitting with React.lazy()
✅ Progressive Web App (PWA) with offline support
✅ Service Worker caching strategy
✅ Response caching middleware
✅ Database connection pooling
✅ WebSocket for real-time updates (reduces polling)
✅ Lazy loading for heavy components
✅ Image optimization ready (WebP support)

## Frontend Performance

### Bundle Size Optimization

**Current Setup:**
- Build tool: Vite (optimized for modern browsers)
- Code splitting: Dynamic imports for all major pages
- Tree shaking: Enabled by default

**Measure Bundle Size:**
```bash
npm run build
npm run build -- --report  # If configured
```

**Optimization Strategies:**

1. **Lazy Load Heavy Libraries**
```typescript
// Instead of:
import Chart from 'chart.js';

// Use:
const Chart = lazy(() => import('chart.js'));
```

2. **Analyze Bundle**
```bash
npm install --save-dev vite-plugin-visualizer
```

Add to vite.config.ts:
```typescript
import { visualizer } from 'vite-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({ open: true })
  ]
});
```

### Component Performance

**Implemented:**
- Skeleton loaders during data fetching
- TanStack Query for automatic caching
- Optimistic UI updates

**Additional Optimizations:**

1. **Memoization**
```typescript
import { memo, useMemo, useCallback } from 'react';

// Expensive component
export const LeaderboardRow = memo(({ user }) => {
  return <div>{user.name}</div>;
});

// Expensive calculations
const sortedData = useMemo(() => 
  data.sort((a, b) => b.points - a.points), 
  [data]
);

// Stable callbacks
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);
```

2. **Virtual Scrolling** (for long lists)
```typescript
// For leaderboards with 1000+ users
import { useVirtualizer } from '@tanstack/react-virtual';
```

### Image Optimization

**Current Setup:**
- Images served from `/client/public`
- PWA manifest icon optimized

**Recommendations:**

1. **Use Modern Formats**
```bash
# Convert to WebP
cwebp input.png -q 80 -o output.webp
```

2. **Responsive Images**
```typescript
<img
  src="/images/hero.webp"
  srcSet="/images/hero-320w.webp 320w,
          /images/hero-640w.webp 640w,
          /images/hero-1280w.webp 1280w"
  sizes="(max-width: 320px) 280px,
         (max-width: 640px) 600px,
         1200px"
  alt="Hero"
/>
```

3. **Lazy Load Images**
```typescript
<img src="/image.jpg" loading="lazy" alt="Description" />
```

### Font Optimization

**Current Setup:**
- Google Fonts (Inter, JetBrains Mono)
- Preconnect to font servers

**Optimization:**
```html
<!-- In client/index.html -->
<link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin>

<!-- Self-host fonts for better performance -->
<style>
  @font-face {
    font-family: 'Inter';
    font-style: normal;
    font-weight: 400;
    font-display: swap;
    src: url('/fonts/inter.woff2') format('woff2');
  }
</style>
```

## Backend Performance

### Database Optimization

**Current Setup:**
- Neon serverless PostgreSQL
- Connection pooling enabled
- Drizzle ORM for type-safe queries

**Query Optimization:**

1. **Add Indexes**
```typescript
// In shared/schema.ts
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  points: integer('points').default(0),
}, (table) => ({
  pointsIdx: index('points_idx').on(table.points),
  emailIdx: index('email_idx').on(table.email),
}));
```

2. **Analyze Slow Queries**
```sql
-- Enable query logging in PostgreSQL
SET log_min_duration_statement = 1000; -- Log queries > 1s

-- Analyze query plan
EXPLAIN ANALYZE
SELECT * FROM users 
WHERE points > 1000 
ORDER BY points DESC 
LIMIT 10;
```

3. **Avoid N+1 Queries**
```typescript
// Bad: N+1 problem
const users = await db.select().from(users);
for (const user of users) {
  const badges = await db.select().from(userBadges).where(eq(userBadges.userId, user.id));
}

// Good: Join or batch query
const usersWithBadges = await db
  .select()
  .from(users)
  .leftJoin(userBadges, eq(users.id, userBadges.userId));
```

### API Response Caching

**Current Setup:**
- Cache middleware for GET requests
- TTL: 5 minutes for leaderboard
- Cache invalidation on updates

**Optimization:**
```typescript
// In server/middleware/cache.ts
const cacheConfig = {
  '/api/leaderboard': 5 * 60 * 1000,      // 5 minutes
  '/api/achievements': 30 * 60 * 1000,    // 30 minutes
  '/api/study-materials': 60 * 60 * 1000, // 1 hour
};
```

### Rate Limiting

**Current Setup:**
- General API: 100 requests / 15 min
- Auth endpoints: 10 requests / 15 min

**Optimization:**
```typescript
// Adjust based on usage patterns
const premiumLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500, // Higher limit for premium users
  skip: (req) => req.user?.isPremium
});
```

## Real-Time Performance

### WebSocket Optimization

**Current Setup:**
- Single WebSocket server
- Broadcast updates to all connected clients

**Scaling WebSocket:**

1. **Connection Pooling**
```typescript
// Limit concurrent connections
const MAX_CONNECTIONS = 10000;

if (clients.size >= MAX_CONNECTIONS) {
  ws.close(1008, 'Server at capacity');
}
```

2. **Message Throttling**
```typescript
// Throttle broadcasts
const throttledBroadcast = _.throttle(broadcastLeaderboardUpdate, 1000);
```

3. **Room-Based Broadcasting**
```typescript
// Instead of broadcasting to all clients
const rooms = new Map<string, Set<WebSocket>>();

function joinRoom(ws: WebSocket, roomId: string) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Set());
  }
  rooms.get(roomId)!.add(ws);
}

function broadcastToRoom(roomId: string, message: any) {
  const room = rooms.get(roomId);
  if (room) {
    room.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }
}
```

## PWA Performance

### Service Worker Caching

**Current Setup:**
- Static cache: Essential assets
- Dynamic cache: Fetched resources
- Network-first strategy

**Optimization:**

1. **Precache Critical Assets**
```javascript
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.png',
  '/manifest.json',
  '/offline.html',
  // Add critical CSS/JS
];
```

2. **Stale-While-Revalidate**
```javascript
// For non-critical resources
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
        return cachedResponse || fetchPromise;
      });
    })
  );
});
```

## Monitoring & Metrics

### Core Web Vitals

**Target Metrics:**
- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1
- **FCP** (First Contentful Paint): < 1.8s
- **TTI** (Time to Interactive): < 3.8s

**Measure:**
```typescript
// In client/src/main.tsx
import { onLCP, onFID, onCLS } from 'web-vitals';

onLCP(console.log);
onFID(console.log);
onCLS(console.log);
```

### Performance API

```typescript
// Measure API response times
performance.mark('api-start');
await fetch('/api/leaderboard');
performance.mark('api-end');
performance.measure('api-duration', 'api-start', 'api-end');

const measure = performance.getEntriesByName('api-duration')[0];
console.log(`API took ${measure.duration}ms`);
```

### Lighthouse CI

**Setup:**
```bash
npm install -g @lhci/cli

# Run audit
lhci autorun --collect.url=http://localhost:5000
```

**.lighthouserc.json:**
```json
{
  "ci": {
    "collect": {
      "numberOfRuns": 3,
      "url": ["http://localhost:5000"]
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", {"minScore": 0.9}],
        "categories:accessibility": ["error", {"minScore": 0.9}],
        "categories:best-practices": ["error", {"minScore": 0.9}],
        "categories:seo": ["error", {"minScore": 0.9}]
      }
    }
  }
}
```

## Performance Testing

### Load Testing

**Using Artillery:**
```bash
npm install -g artillery

# Create test scenario
artillery quick --count 100 --num 10 http://localhost:5000/api/leaderboard
```

**artillery.yml:**
```yaml
config:
  target: "http://localhost:5000"
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Sustained load"

scenarios:
  - flow:
      - get:
          url: "/api/leaderboard"
      - get:
          url: "/api/games"
      - post:
          url: "/api/auth/login"
          json:
            email: "test@example.com"
            password: "password123"
```

### Stress Testing

```bash
# Test server limits
artillery quick --count 1000 --num 100 http://localhost:5000
```

## Optimization Checklist

### Frontend
- [ ] Code splitting implemented
- [ ] Lazy loading for routes
- [ ] Image optimization (WebP, lazy loading)
- [ ] Font optimization (preload, self-host)
- [ ] CSS purging (remove unused styles)
- [ ] JavaScript minification
- [ ] Component memoization for expensive renders
- [ ] Virtual scrolling for long lists

### Backend
- [ ] Database indexes on frequently queried columns
- [ ] Query optimization (no N+1)
- [ ] Response caching
- [ ] Compression middleware (gzip/brotli)
- [ ] Connection pooling
- [ ] Rate limiting
- [ ] Background jobs for heavy tasks

### Infrastructure
- [ ] CDN for static assets
- [ ] Load balancing (if needed)
- [ ] Database read replicas
- [ ] Redis for session storage
- [ ] Edge caching
- [ ] DDoS protection

## Continuous Improvement

### Regular Audits
- Weekly: Performance monitoring review
- Monthly: Lighthouse audit
- Quarterly: Database optimization
- Annually: Full performance review

### Tools
- Google PageSpeed Insights
- WebPageTest.org
- GTmetrix
- Chrome DevTools Performance tab
- React DevTools Profiler

---

**Performance Status**: Optimized for Production
**Last Updated**: October 23, 2025
**Target Audience**: Students (13-25 years)
**Expected Load**: 10,000+ concurrent users
