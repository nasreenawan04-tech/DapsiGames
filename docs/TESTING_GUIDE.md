# DapsiGames Testing Guide

## Overview

Comprehensive testing guide for DapsiGames covering manual testing, automated testing strategies, and quality assurance procedures.

## Manual Testing Checklist

### 1. Authentication Flow ✓

**Registration:**
- [ ] New user can register with valid email/password
- [ ] Email verification email is sent
- [ ] Invalid email format shows error
- [ ] Weak password rejected (< 8 chars, no uppercase/lowercase/number)
- [ ] Duplicate email shows appropriate error
- [ ] Form validation messages are clear

**Login:**
- [ ] User can login with correct credentials
- [ ] Incorrect password shows error
- [ ] Non-existent email shows error
- [ ] Session persists after page refresh
- [ ] Remember me functionality works

**Password Reset:**
- [ ] Reset email is sent to valid address
- [ ] Reset link works and allows password change
- [ ] Expired reset links show error
- [ ] New password requirements enforced

### 2. User Dashboard ✓

- [ ] Dashboard loads without errors
- [ ] User stats display correctly (points, rank, games played)
- [ ] Recent activities show latest actions
- [ ] Quick access links work
- [ ] Progress charts render correctly
- [ ] Responsive on mobile devices

### 3. Leaderboard ✓

- [ ] Leaderboard displays top users by points
- [ ] Current user's position is highlighted
- [ ] Real-time updates when points change
- [ ] Search functionality works
- [ ] Filter by time period works (daily, weekly, monthly)
- [ ] Pagination works for large datasets
- [ ] Guest users see limited data

### 4. Games System ✓

**Game List:**
- [ ] All games display correctly
- [ ] Difficulty levels shown
- [ ] Point values displayed
- [ ] Game categories filter works
- [ ] Search finds games by name

**Game Play:**
- [ ] Game loads and is playable
- [ ] Score tracking works
- [ ] Timer functions correctly (if applicable)
- [ ] Pause/resume works
- [ ] Points awarded on completion
- [ ] High scores saved
- [ ] Achievements unlock when earned

**Game Completion:**
- [ ] Points added to user total
- [ ] Leaderboard updates in real-time
- [ ] Activity log updated
- [ ] Achievements checked and unlocked
- [ ] WebSocket notification sent

### 5. Study Materials ✓

- [ ] Study materials list displays
- [ ] Filter by subject works
- [ ] Filter by difficulty works
- [ ] Search functionality works
- [ ] Bookmark function works
- [ ] Content loads correctly
- [ ] Progress tracking updates
- [ ] Points awarded on completion

### 6. Achievements ✓

- [ ] All achievement definitions load
- [ ] User's unlocked achievements display
- [ ] Progress toward achievements shown
- [ ] Notifications when achievement unlocked
- [ ] Achievement badges render correctly
- [ ] Categories filter works

### 7. Profile Management ✓

- [ ] Profile information displays
- [ ] User can edit full name
- [ ] Avatar URL can be updated
- [ ] Invalid avatar URL rejected
- [ ] Changes save successfully
- [ ] Achievement badges display
- [ ] Point history shows

### 8. Guest Mode ✓

- [ ] Guest can access home page
- [ ] Limited games available
- [ ] Sample leaderboard visible
- [ ] Upgrade prompts display
- [ ] No point tracking for guests
- [ ] Conversion to registered user works

### 9. Real-Time Features ✓

- [ ] WebSocket connection establishes
- [ ] Leaderboard updates in real-time
- [ ] Achievement notifications appear
- [ ] Points earned notifications show
- [ ] Connection recovery after disconnect

### 10. Responsive Design ✓

**Desktop (1920x1080):**
- [ ] All pages render correctly
- [ ] Navigation works
- [ ] Forms are usable

**Tablet (768x1024):**
- [ ] Layout adapts appropriately
- [ ] Touch interactions work
- [ ] No horizontal scrolling

**Mobile (375x667):**
- [ ] Hamburger menu works
- [ ] Cards stack vertically
- [ ] Forms are usable
- [ ] Text is readable

### 11. Accessibility ✓

- [ ] Tab navigation works
- [ ] Screen reader compatible
- [ ] Proper ARIA labels
- [ ] Keyboard shortcuts work
- [ ] Focus indicators visible
- [ ] Color contrast sufficient
- [ ] Alt text on images

### 12. Performance ✓

- [ ] Page load < 3 seconds
- [ ] API responses < 500ms
- [ ] No memory leaks during extended use
- [ ] Smooth animations
- [ ] Lazy loading works
- [ ] Images optimized

### 13. Error Handling ✓

- [ ] 404 page displays for invalid routes
- [ ] Network errors show friendly messages
- [ ] Form validation errors clear
- [ ] Error boundary catches React errors
- [ ] API errors handled gracefully

### 14. Security ✓

- [ ] SQL injection attempts blocked
- [ ] XSS attempts sanitized
- [ ] Rate limiting prevents abuse
- [ ] HTTPS enforced
- [ ] Security headers present
- [ ] Passwords never exposed in responses
- [ ] Session timeout works

## Automated Testing Strategy

### Unit Tests

**Backend:**
```typescript
// Example: Test point calculation
describe('Point System', () => {
  test('awards correct points for game completion', () => {
    const score = 85;
    const maxPoints = 100;
    const earnedPoints = calculatePoints(score, maxPoints);
    expect(earnedPoints).toBe(85);
  });
});
```

**Frontend:**
```typescript
// Example: Test component rendering
describe('GameCard', () => {
  test('renders game information correctly', () => {
    render(<GameCard game={mockGame} />);
    expect(screen.getByText(mockGame.name)).toBeInTheDocument();
  });
});
```

### Integration Tests

```typescript
// Example: Test authentication flow
describe('Authentication Flow', () => {
  test('user can register and login', async () => {
    // Register
    const { user } = await registerUser(testUserData);
    expect(user.email).toBe(testUserData.email);
    
    // Login
    const session = await loginUser(testUserData);
    expect(session).toBeDefined();
  });
});
```

### End-to-End Tests

```typescript
// Example: Using Playwright or Cypress
describe('Complete User Journey', () => {
  test('user can register, play game, and see updated leaderboard', async () => {
    // Navigate to signup
    await page.goto('/signup');
    
    // Fill form
    await page.fill('[data-testid="input-email"]', 'test@example.com');
    await page.fill('[data-testid="input-password"]', 'SecurePass123');
    await page.fill('[data-testid="input-fullname"]', 'Test User');
    
    // Submit
    await page.click('[data-testid="button-submit"]');
    
    // Verify dashboard
    await expect(page).toHaveURL('/dashboard');
    
    // Play game
    await page.goto('/games');
    await page.click('[data-testid="button-play-game-1"]');
    
    // Complete game
    // ... game interaction
    
    // Check leaderboard
    await page.goto('/leaderboard');
    await expect(page.locator('[data-testid="text-user-points"]')).toContainText('100');
  });
});
```

## API Testing

### Using curl

```bash
# Health check
curl http://localhost:5000/api/health

# Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123",
    "fullName": "Test User"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123"
  }'

# Get leaderboard
curl http://localhost:5000/api/leaderboard

# Complete game (requires authentication)
curl -X POST http://localhost:5000/api/games/{gameId}/complete \
  -H "Content-Type: application/json" \
  -H "x-user-id: {userId}" \
  -d '{
    "score": 85,
    "timeSpent": 120
  }'
```

### Using Postman

1. Import API collection from `/docs/API_DOCUMENTATION.md`
2. Set environment variables (BASE_URL, USER_ID)
3. Run collection tests
4. Review test results

## Load Testing

### Using Artillery

```bash
# Install Artillery
npm install -g artillery

# Run load test
artillery quick --count 100 --num 10 http://localhost:5000/api/games

# Custom scenario
artillery run load-test.yml
```

**load-test.yml:**
```yaml
config:
  target: "http://localhost:5000"
  phases:
    - duration: 60
      arrivalRate: 20
scenarios:
  - name: "User browsing"
    flow:
      - get:
          url: "/api/games"
      - get:
          url: "/api/leaderboard"
      - get:
          url: "/api/achievements/definitions"
```

## Browser Testing

### Browsers to Test

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

### Testing Tools

- **Chrome DevTools:** Performance profiling, network analysis
- **Lighthouse:** Performance, accessibility, SEO audits
- **React DevTools:** Component profiling
- **BrowserStack:** Cross-browser testing

## Database Testing

```sql
-- Test data integrity
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM user_stats;

-- Verify user stats match users
SELECT u.id, u.email, us.total_points 
FROM users u 
LEFT JOIN user_stats us ON u.id = us.user_id 
WHERE us.user_id IS NULL;

-- Check achievement unlocking logic
SELECT ua.user_id, COUNT(*) as achievements_count
FROM user_achievements ua
GROUP BY ua.user_id;

-- Verify leaderboard ranking
SELECT 
  us.user_id,
  us.total_points,
  us.current_rank,
  RANK() OVER (ORDER BY us.total_points DESC) as calculated_rank
FROM user_stats us
ORDER BY us.total_points DESC;
```

## Regression Testing

After each deployment or major change:

1. Run full test suite
2. Test critical user paths
3. Verify no existing features broken
4. Check performance metrics haven't degraded
5. Review error logs for new issues

## Bug Reporting Template

```markdown
**Title:** Brief description

**Severity:** Critical / High / Medium / Low

**Environment:**
- Browser: Chrome 120
- OS: Windows 11
- URL: /games

**Steps to Reproduce:**
1. Go to /games
2. Click on "Math Challenge"
3. Complete game
4. Observe error

**Expected Behavior:**
Points should be awarded

**Actual Behavior:**
Error message displayed

**Screenshots:**
[Attach screenshot]

**Console Errors:**
[Paste console output]

**Additional Context:**
Only happens for Math Challenge game
```

## Quality Assurance Sign-Off

Before production release:

- [ ] All critical bugs fixed
- [ ] All automated tests passing
- [ ] Manual testing complete
- [ ] Performance benchmarks met
- [ ] Security audit passed
- [ ] Accessibility compliance verified
- [ ] Cross-browser testing complete
- [ ] Load testing successful
- [ ] Documentation updated
- [ ] Deployment runbook ready

---

**Test Lead:** [Name]  
**Date:** October 22, 2025  
**Status:** Phase 8 Complete
