# 📱 Frontend Developer Documentation - Ethio Podcasts API

## 🚀 Quick Start

### Base URL
```
http://localhost:3000/api
```

### Authentication Header
For protected endpoints, include the Firebase ID token:
```javascript
headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('authToken')
}
```

---

## 📻 Public Endpoints (No Auth Required)

### 1. Health Check
```http
GET /api/health
```
**Response:**
```json
{
    "status": "success",
    "message": "Success",
    "data": {
        "server": "Ethiopodcasts API v2 (JSON)",
        "status": "healthy"
    },
    "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

### 2. Home Screen (Trending & Recent)
```http
GET /api/home
```
**Response:**
```json
{
    "status": "success",
    "data": {
        "trending": [
            {
                "id": "video_id",
                "title": "Podcast Title",
                "display_title": "Podcast Title - Episode 1",
                "uploader": "@channel_name",
                "category": "Tech",
                "duration": "45:30",
                "thumbnail": "https://img.youtube.com/vi/video_id/mqdefault.jpg",
                "streaming_url": "https://www.youtube.com/embed/video_id?autoplay=1",
                "created_at": "2024-01-10T12:00:00.000Z",
                "is_new": true
            }
        ],
        "recent_today": [...],
        "recent_yesterday": [...]
    }
}
```

---

### 3. Discover Podcasts (Browse)
```http
GET /api/discover?page=1&limit=20
GET /api/discover?category=Tech&page=1
GET /api/discover?q=search_term
```
**Response:**
```json
{
    "status": "success",
    "data": {
        "podcasts": [
            {
                "id": "video_id",
                "title": "Podcast Title",
                "display_title": "Podcast Title",
                "uploader": "@channel_name",
                "category": "Tech",
                "duration": "32:15",
                "thumbnail": "https://img.youtube.com/vi/video_id/mqdefault.jpg",
                "streaming_url": "https://www.youtube.com/embed/video_id?autoplay=1",
                "created_at": "2024-01-10T12:00:00.000Z"
            }
        ],
        "pagination": {
            "page": 1,
            "limit": 20,
            "total": 644,
            "has_more": true
        }
    }
}
```

---

### 4. Search Podcasts
```http
GET /api/search?q=ethiopia&limit=50
```
**Response:**
```json
{
    "status": "success",
    "data": {
        "query": "ethiopia",
        "results": [
            {
                "id": "video_id",
                "title": "Title",
                "display_title": "Title",
                "uploader": "@channel",
                "category": "News",
                "duration": "25:00",
                "thumbnail": "https://img.youtube.com/vi/video_id/mqdefault.jpg",
                "streaming_url": "https://www.youtube.com/embed/video_id?autoplay=1"
            }
        ],
        "total": 25
    }
}
```

---

### 5. Get Podcast Details
```http
GET /api/podcasts/:id
```
**Example:** `GET /api/podcasts/dQw4w9WgXcQ`

**Response:**
```json
{
    "status": "success",
    "data": {
        "id": "dQw4w9WgXcQ",
        "title": "Podcast Title",
        "display_title": "Podcast Title - Full Episode",
        "description": "Long description of the podcast...",
        "uploader": "@channel_name",
        "category": "Education",
        "duration": "45:30",
        "duration_seconds": 2730,
        "thumbnail": "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
        "streaming_url": "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1",
        "youtube_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "created_at": "2024-01-10T12:00:00.000Z"
    }
}
```

---

### 6. Get Player Data
```http
GET /api/player/:id
```
**Example:** `GET /api/player/dQw4w9WgXcQ`

**Response:**
```json
{
    "status": "success",
    "data": {
        "id": "dQw4w9WgXcQ",
        "title": "Podcast Title",
        "uploader": "@channel_name",
        "category": "Education",
        "duration": "45:30",
        "duration_seconds": 2730,
        "thumbnail": "https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
        "streaming_url": "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1",
        "audio_only_url": "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
    }
}
```

---

### 7. Get Channels List
```http
GET /api/watchlist
```
**Response:**
```json
{
    "status": "success",
    "data": {
        "channels": [
            "@dejaftv",
            "@Meripodcast",
            "@Gugutpodcast",
            "@WECHEWGOOD"
        ],
        "total": 14
    }
}
```

---

### 8. Get Channel Podcasts
```http
GET /api/channels/:channel?page=1&limit=20
```
**Example:** `GET /api/channels/@dejaftv`

**Response:**
```json
{
    "status": "success",
    "data": {
        "channel": "@dejaftv",
        "podcasts": [
            {
                "id": "video_id",
                "title": "Episode Title",
                "display_title": "Episode Title",
                "category": "Comedy",
                "duration": "32:15",
                "thumbnail": "https://img.youtube.com/vi/video_id/mqdefault.jpg",
                "streaming_url": "https://www.youtube.com/embed/video_id?autoplay=1",
                "created_at": "2024-01-14T12:00:00.000Z"
            }
        ],
        "pagination": {
            "page": 1,
            "limit": 20,
            "total": 45,
            "has_more": true
        }
    }
}
```

---

### 9. Get Categories
```http
GET /api/categories
```
**Response:**
```json
{
    "status": "success",
    "data": {
        "categories": [
            "Tech",
            "Comedy",
            "Education",
            "News",
            "Religious"
        ],
        "total": 5
    }
}
```

---

### 10. Get Stats
```http
GET /api/stats
```
**Response:**
```json
{
    "status": "success",
    "data": {
        "total_podcasts": 644,
        "total_channels": 14
    }
}
```

---

## 🔐 Protected Endpoints (Require Auth Token)

### Authentication Flow

**Frontend (auth.html) - Login with Google:**
```javascript
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

const auth = getAuth();
const provider = new GoogleAuthProvider();

signInWithPopup(auth, provider)
    .then(async (result) => {
        const user = result.user;
        const idToken = await user.getIdToken();
        
        // Store token
        localStorage.setItem('authToken', idToken);
        
        // Verify with backend
        const response = await fetch('/api/auth/login', {
            headers: { 'Authorization': `Bearer ${idToken}` }
        });
    });
```

---

### 11. Verify User / Get User Info
```http
GET /api/auth/login
```
**Headers:** `Authorization: Bearer <firebase_id_token>`

**Response:**
```json
{
    "status": "success",
    "data": {
        "user": {
            "uid": "user123abc...",
            "email": "user@gmail.com",
            "displayName": "John Doe",
            "photoURL": "https://...",
            "createdAt": "2024-01-01T00:00:00.000Z",
            "lastLoginAt": "2024-01-15T10:30:00.000Z"
        },
        "isAuthenticated": true
    }
}
```

**Error (401 Unauthorized):**
```json
{
    "status": "error",
    "message": "Invalid or expired token",
    "code": "INVALID_TOKEN"
}
```

---

### 12. Get User Watchlist
```http
GET /api/user/watchlist
```
**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
    "status": "success",
    "data": {
        "watchlist": [
            {
                "id": "video_id",
                "addedAt": "2024-01-15T10:30:00.000Z",
                "data": {
                    "title": "Podcast Title",
                    "uploader": "@channel",
                    "thumbnail": "https://img.youtube.com/vi/video_id/mqdefault.jpg"
                }
            }
        ],
        "total": 5
    }
}
```

---

### 13. Add to Watchlist
```http
POST /api/user/watchlist
```
**Headers:** 
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
    "podcastId": "dQw4w9WgXcQ",
    "podcastData": {
        "title": "Podcast Title",
        "uploader": "@channel_name",
        "thumbnail": "https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg"
    }
}
```

**Response:**
```json
{
    "status": "success",
    "data": {
        "watchlist": [
            { "id": "video_id", "addedAt": "..." },
            { "id": "new_video_id", "addedAt": "..." }
        ]
    }
}
```

---

### 14. Remove from Watchlist
```http
DELETE /api/user/watchlist/:podcastId
```
**Example:** `DELETE /api/user/watchlist/dQw4w9WgXcQ`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
    "status": "success",
    "data": {
        "message": "Removed from watchlist",
        "watchlist": []
    }
}
```

---

### 15. Get Listening History
```http
GET /api/user/history?limit=50
```
**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
    "status": "success",
    "data": {
        "history": [
            {
                "id": "video_id",
                "playedAt": "2024-01-15T10:30:00.000Z",
                "data": {
                    "title": "Podcast Title",
                    "uploader": "@channel",
                    "thumbnail": "https://img.youtube.com/vi/video_id/mqdefault.jpg"
                },
                "position": 125
            }
        ],
        "total": 10
    }
}
```

---

### 16. Add to History
```http
POST /api/user/history
```
**Headers:** 
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
    "podcastId": "dQw4w9WgXcQ",
    "position": 125,
    "podcastData": {
        "title": "Podcast Title",
        "uploader": "@channel_name",
        "thumbnail": "https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg"
    }
}
```

**Response:**
```json
{
    "status": "success",
    "data": {
        "message": "Added to history"
    }
}
```

---

### 17. Clear History
```http
DELETE /api/user/history
```
**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
    "status": "success",
    "data": {
        "message": "History cleared"
    }
}
```

---

### 18. Get Playback Position
```http
GET /api/user/position/:podcastId
```
**Example:** `GET /api/user/position/dQw4w9WgXcQ`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
    "status": "success",
    "data": {
        "podcastId": "dQw4w9WgXcQ",
        "position": 125,
        "updatedAt": "2024-01-15T10:35:00.000Z"
    }
}
```

---

### 19. Save Playback Position
```http
POST /api/user/position/:podcastId
```
**Headers:** 
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
    "position": 125
}
```

**Response:**
```json
{
    "status": "success",
    "data": {
        "message": "Position saved"
    }
}
```

---

## 🔧 Error Codes

| Code | Meaning | Action |
|------|---------|--------|
| `NO_TOKEN` | No auth token provided | Redirect to login |
| `INVALID_TOKEN` | Token invalid/expired | Redirect to login |
| `404` | Resource not found | Show error message |
| `500` | Server error | Show error message |

---

## 📱 Frontend Integration Examples

### Complete Auth Flow
```javascript
// auth.html
const API_BASE = 'http://localhost:3000/api';

// Sign in with Google
async function signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const idToken = await result.user.getIdToken();
    
    // Save token
    localStorage.setItem('authToken', idToken);
    
    // Verify with backend
    const response = await fetch(`${API_BASE}/auth/login`, {
        headers: { 'Authorization': `Bearer ${idToken}` }
    });
    
    if (response.ok) {
        window.location.href = 'audio-player.html';
    }
}

// Check if logged in
function isLoggedIn() {
    return !!localStorage.getItem('authToken');
}

// Get auth headers
function getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
}
```

---

### Add to Watchlist
```javascript
async function addToWatchlist(podcast) {
    const response = await fetch(`${API_BASE}/user/watchlist`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
        },
        body: JSON.stringify({
            podcastId: podcast.id,
            podcastData: {
                title: podcast.display_title || podcast.title,
                uploader: podcast.uploader,
                thumbnail: podcast.thumbnail
            }
        })
    });
    
    if (response.status === 401) {
        window.location.href = 'auth.html';
        return;
    }
    
    const data = await response.json();
    console.log('Added to watchlist:', data);
}
```

---

### Save Playback Position (on pause/unload)
```javascript
// Save on pause
function onPause() {
    const position = player.getCurrentTime();
    
    if (currentPodcast && position > 5) {
        fetch(`${API_BASE}/user/position/${currentPodcast.id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            },
            body: JSON.stringify({ position })
        });
    }
}

// Save on page unload
window.addEventListener('beforeunload', () => {
    if (player && currentPodcast) {
        const position = player.getCurrentTime();
        navigator.sendBeacon(`${API_BASE}/user/position/${currentPodcast.id}`, 
            JSON.stringify({ position }));
    }
});
```

---

## 🎨 UI Components Reference

### Podcast Card Component
```html
<div class="podcast-card" onclick="openPodcast('video_id')">
    <img src="thumbnail_url" alt="Podcast">
    <div class="info">
        <h3>Title</h3>
        <p>@channel • 32:15</p>
    </div>
    <button class="watchlist-btn" onclick="event.stopPropagation(); toggleWatchlist()">
        ♡
    </button>
</div>
```

### Auth Status Indicator
```javascript
function renderAuthButton() {
    if (isLoggedIn()) {
        return `
            <div class="user-menu">
                <img src="${user.photoURL}" alt="User">
                <span>${user.displayName}</span>
                <button onclick="signOut()">Sign Out</button>
            </div>
        `;
    } else {
        return `
            <a href="auth.html" class="auth-btn">Sign In</a>
        `;
    }
}
```

---

## 📋 Frontend Todo List

- [ ] Set up Firebase SDK in project
- [ ] Create auth.html with login forms
- [ ] Implement Google Sign-In button
- [ ] Implement Email/Password login/register
- [ ] Add auth state listener (onAuthStateChanged)
- [ ] Create podcast card component
- [ ] Build discover/browse page
- [ ] Build search functionality
- [ ] Add watchlist button to podcast cards
- [ ] Create watchlist page
- [ ] Add history tracking on playback
- [ ] Implement playback position saving
- [ ] Add resume from saved position prompt
- [ ] Style with CSS (dark theme recommended)
- [ ] Add loading states
- [ ] Add error handling
- [ ] Test on mobile devices

---

## 🔗 Related Files

| File | Purpose |
|------|---------|
| `backend/auth.html` | Login page reference |
| `backend/audio-player.html` | Player with auth features |
| `backend/index.js` | API server |
| `backend/middleware/auth.js` | Auth middleware |
| `backend/config/firebase-config.js` | Firebase config |

---

## 🚀 Deployment Checklist

- [ ] Firebase Authentication enabled
- [ ] Google Sign-In configured
- [ ] Authorized domains added
- [ ] CORS configured for production
- [ ] HTTPS enabled
- [ ] Environment variables set
- [ ] Analytics integrated
- [ ] Error tracking enabled

---

## 📞 Support

- Firebase Docs: https://firebase.google.com/docs/auth
- API Issues: Check backend logs
- Auth Issues: Verify Firebase Console settings
