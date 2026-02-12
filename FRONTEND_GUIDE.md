# 🎧 Ethio Podcasts - Frontend Guide

## Base URL
```
http://localhost:3000/api
```

---

## 🔐 Firebase Auth (Google Sign-In)

```html
<!-- Add to auth.html -->
<script type="module">
    import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
    import { getAuth, signInWithPopup, GoogleAuthProvider } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

    const app = initializeApp({
        apiKey: "AIzaSyDBQosoOgqEa0LONZhEZUSVJjV1diFMdCk",
        authDomain: "ethio-podcast-8a2f0.firebaseapp.com",
        projectId: "ethio-podcast-8a2f0"
    });

    const auth = getAuth(app);
    const provider = new GoogleAuthProvider();

    // Login
    signInWithPopup(auth, provider).then(async (result) => {
        const token = await result.user.getIdToken();
        localStorage.setItem('authToken', token);
        window.location.href = 'audio-player.html';
    });
</script>
```

---

## 📡 API Requests

### Auth Header (Protected Routes)
```javascript
headers: { 'Authorization': 'Bearer ' + localStorage.getItem('authToken') }
```

### 401 Error? → Redirect to `auth.html`

---

## 📻 Public Endpoints

| GET | Endpoint | Returns |
|-----|----------|---------|
| | `/api/home` | Trending podcasts |
| | `/api/discover` | All podcasts |
| | `/api/discover?q=search` | Search |
| | `/api/discover?category=Tech` | Filter |
| | `/api/podcasts/:id` | Podcast details |
| | `/api/player/:id` | Player data |
| | `/api/categories` | All categories |
| | `/api/stats` | Total count |

---

## 🔐 Protected Endpoints (Auth Required)

| Method | Endpoint | Action |
|--------|----------|--------|
| GET | `/api/auth/login` | Verify user |
| GET | `/api/user/watchlist` | Get saved |
| POST | `/api/user/watchlist` | Add podcast |
| DELETE | `/api/user/watchlist/:id` | Remove |
| GET | `/api/user/history` | Get history |
| POST | `/api/user/history` | Add to history |
| GET | `/api/user/position/:id` | Get position |
| POST | `/api/user/position/:id` | Save position |

---

## 💡 Examples

### Add to Watchlist
```javascript
fetch('/api/user/watchlist', {
    method: 'POST',
    headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('authToken'),
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        podcastId: "abc123",
        podcastData: { title: "Podcast", uploader: "@channel" }
    })
});
```

### Save Position (on pause)
```javascript
player.addEventListener('pause', () => {
    const pos = player.getCurrentTime();
    fetch('/api/user/position/video123', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('authToken') },
        body: JSON.stringify({ position: pos })
    });
});
```

---

## ✅ Frontend Todo
- [ ] Add Firebase SDK
- [ ] Create auth.html with Google Login
- [ ] Build discover page (GET /api/discover)
- [ ] Add search (GET /api/discover?q=...)
- [ ] Add watchlist button on podcasts
- [ ] Save playback position on pause/close
- [ ] Redirect to auth.html on 401

---

## 📁 Reference
- `backend/auth.html` - Full login example
- `backend/audio-player.html` - Player with auth
