# DapsiGames API Documentation

## Base URL
- Development: `http://localhost:5000/api`
- Production: `https://yourdomain.com/api`

## Authentication
All protected endpoints require authentication. Include the `x-user-id` header with the user's ID in your requests.

## Rate Limiting
- General API: 100 requests per 15 minutes
- Authentication endpoints: 10 requests per 15 minutes

## Endpoints

### Authentication

#### POST /api/auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123",
  "fullName": "John Doe"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "fullName": "John Doe",
  "points": 0,
  "avatarUrl": null,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

**Validation:**
- Email: Must be valid email format
- Password: Minimum 8 characters, must contain uppercase, lowercase, and number
- Full Name: 2-100 characters

#### POST /api/auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "fullName": "John Doe",
  "points": 150,
  "avatarUrl": "https://example.com/avatar.jpg"
}
```

### User Management

#### GET /api/user/:userId
Get user profile information.

**Protected:** Yes

**Response (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "fullName": "John Doe",
  "points": 150,
  "avatarUrl": "https://example.com/avatar.jpg"
}
```

#### PATCH /api/user/:userId
Update user profile.

**Protected:** Yes

**Request Body:**
```json
{
  "fullName": "Jane Doe",
  "avatarUrl": "https://example.com/new-avatar.jpg"
}
```

### Leaderboard

#### GET /api/leaderboard
Get ranked list of users by points.

**Query Parameters:**
- `limit` (optional): Number of results (default: 100, max: 100)

**Response (200):**
```json
[
  {
    "userId": "uuid",
    "fullName": "Top Player",
    "totalPoints": 5000,
    "currentRank": 1,
    "gamesPlayed": 50,
    "studySessions": 30,
    "avatarUrl": "https://example.com/avatar.jpg"
  }
]
```

### Games

#### GET /api/games
Get list of all available games.

**Response (200):**
```json
[
  {
    "id": "uuid",
    "name": "Math Challenge",
    "description": "Test your math skills",
    "difficulty": "medium",
    "maxPoints": 100,
    "category": "mathematics"
  }
]
```

#### GET /api/games/:gameId
Get specific game details.

**Protected:** Yes

**Response (200):**
```json
{
  "id": "uuid",
  "name": "Math Challenge",
  "description": "Test your math skills",
  "difficulty": "medium",
  "maxPoints": 100,
  "category": "mathematics",
  "gameData": {}
}
```

#### POST /api/games/:gameId/complete
Mark game as completed and award points.

**Protected:** Yes

**Request Body:**
```json
{
  "score": 85,
  "timeSpent": 120
}
```

**Response (200):**
```json
{
  "pointsEarned": 85,
  "totalPoints": 235,
  "newRank": 15,
  "achievementsUnlocked": []
}
```

### Study Materials

#### GET /api/study
Get all study materials.

**Response (200):**
```json
[
  {
    "id": "uuid",
    "title": "Introduction to Algebra",
    "description": "Learn basic algebra concepts",
    "subject": "mathematics",
    "difficultyLevel": "beginner",
    "pointsValue": 50
  }
]
```

#### GET /api/study/:materialId
Get specific study material.

**Protected:** Yes

**Response (200):**
```json
{
  "id": "uuid",
  "title": "Introduction to Algebra",
  "description": "Learn basic algebra concepts",
  "subject": "mathematics",
  "difficultyLevel": "beginner",
  "contentUrl": "https://example.com/content.pdf",
  "pointsValue": 50
}
```

#### POST /api/study/:materialId/complete
Mark study material as completed.

**Protected:** Yes

**Request Body:**
```json
{
  "timeSpent": 300
}
```

### Achievements

#### GET /api/achievements/definitions
Get all achievement definitions.

**Response (200):**
```json
[
  {
    "id": "uuid",
    "name": "First Steps",
    "description": "Complete your first activity",
    "badgeIcon": "trophy",
    "pointsRequired": 10,
    "category": "general"
  }
]
```

#### GET /api/achievements/user/:userId
Get user's unlocked achievements.

**Protected:** Yes

**Response (200):**
```json
[
  {
    "id": "uuid",
    "name": "First Steps",
    "description": "Complete your first activity",
    "badgeIcon": "trophy",
    "earnedAt": "2024-01-01T12:00:00.000Z"
  }
]
```

### Bookmarks

#### GET /api/bookmarks/:userId
Get user's bookmarked content.

**Protected:** Yes

**Response (200):**
```json
[
  {
    "id": "uuid",
    "itemType": "study_material",
    "itemId": "uuid",
    "createdAt": "2024-01-01T12:00:00.000Z"
  }
]
```

#### POST /api/bookmarks
Create a new bookmark.

**Protected:** Yes

**Request Body:**
```json
{
  "userId": "uuid",
  "itemType": "study_material",
  "itemId": "uuid"
}
```

#### DELETE /api/bookmarks/:bookmarkId
Delete a bookmark.

**Protected:** Yes

### Activities

#### GET /api/activities/:userId
Get user's recent activities.

**Protected:** Yes

**Query Parameters:**
- `limit` (optional): Number of results (default: 20)

**Response (200):**
```json
[
  {
    "id": "uuid",
    "activityType": "game_completed",
    "pointsEarned": 85,
    "description": "Completed Math Challenge",
    "createdAt": "2024-01-01T12:00:00.000Z"
  }
]
```

### Progress Tracking

#### GET /api/progress/:userId
Get user's progress.

**Protected:** Yes

**Query Parameters:**
- `itemType` (optional): Filter by type ('game' or 'study_material')

**Response (200):**
```json
[
  {
    "id": "uuid",
    "itemType": "game",
    "itemId": "uuid",
    "completed": true,
    "progress": 100,
    "lastAccessedAt": "2024-01-01T12:00:00.000Z"
  }
]
```

### Health Check

#### GET /api/health
Check API health status.

**Response (200):**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "uptime": 86400,
  "database": "connected"
}
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Valid email is required"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "error": "Authentication required"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 429 Too Many Requests
```json
{
  "error": "Too many requests from this IP, please try again later."
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

## WebSocket Events

### Connection
Connect to `ws://localhost:5000` for real-time updates.

### Events

#### leaderboard-update
Sent when the leaderboard changes.

```json
{
  "type": "leaderboard-update",
  "data": {
    "userId": "uuid",
    "newRank": 15,
    "points": 235
  }
}
```

#### achievement-unlocked
Sent when a user unlocks an achievement.

```json
{
  "type": "achievement-unlocked",
  "data": {
    "userId": "uuid",
    "achievementId": "uuid",
    "achievementName": "First Steps"
  }
}
```

#### points-earned
Sent when a user earns points.

```json
{
  "type": "points-earned",
  "data": {
    "userId": "uuid",
    "points": 50,
    "activity": "study_completed"
  }
}
```
