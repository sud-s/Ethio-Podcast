# Ethiopodcasts Backend API v2.0 (JSON)

A professional podcast platform backend focused on Ethiopian audio content. Designed for background listening with lock screen support.

## ✅ What's New

- **No YouTube API Required** - Uses yt-dlp for scraping
- **Local JSON Storage** - No Firestore quota issues
- **644 podcasts** from **14 Ethiopian channels**

## 🚀 Quick Start

```bash
# Install Node.js dependencies
npm install

# Install Python dependencies (for scraper)
pip install yt-dlp requests

# Start the server
npm start

# Server runs on http://localhost:3000
```

### Running the Scraper

```bash
# Scrape podcasts from YouTube channels
python3 scrape_all_podcasts.py

# Podcasts saved to: podcasts.json
# Restart server to see changes
```

---

## 📚 API Endpoints Reference

### Base URL
```
http://localhost:3000/api
```

All responses follow this format:
```json
{
  "status": "success",
  "message": "Success",
  "data": { ... },
  "timestamp": "2026-02-09T17:00:00.000Z"
}
```

---

### 1. Health Check
**GET** `/api/health`

Check if the API is running.

**Response:**
```json
{
  "status": "success",
  "data": {
    "server": "Ethiopodcasts API v2 (JSON)",
    "status": "healthy"
  }
}
```

---

### 2. Home Screen
**GET** `/api/home`

Get home screen content with trending and new releases.

**Response:**
```json
{
  "data": {
    "trending": [...10 podcasts...],
    "recent_today": [...podcasts uploaded today...],
    "recent_yesterday": [...podcasts uploaded yesterday...]
  }
}
```

---

### 3. Discover/Browse
**GET** `/api/discover`

Browse all podcasts with pagination & filters.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `q` | string | No | Search query (min 2 chars) |
| `category` | string | No | Filter by category |
| `page` | number | No | Page number (default: 1) |
| `limit` | number | No | Items per page (default: 20) |

**Examples:**
```bash
# Get all podcasts
GET /api/discover

# Search podcasts
GET /api/discover?q=technology

# Filter by category
GET /api/discover?category=Tech

# Paginate
GET /api/discover?page=2&limit=10
```

**Response:**
```json
{
  "data": {
    "podcasts": [...],
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

### 4. Categories
**GET** `/api/categories`

Get all available podcast categories.

**Response:**
```json
{
  "data": {
    "categories": ["Tech", "Business", "Lifestyle", "Success", "Education", "News", "General"],
    "total": 7
  }
}
```

---

### 5. Podcast Details
**GET** `/api/podcasts/:id`

Get full details for a specific podcast.

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | YouTube video ID |

**Example:**
```bash
GET /api/podcasts/NFm8VJb_qmA
```

**Response:**
```json
{
  "data": {
    "id": "NFm8VJb_qmA",
    "title": "Podcast Title",
    "display_title": "Podcast Title",
    "description": "Full description...",
    "uploader": "@channel_name",
    "category": "General",
    "duration": "40:18",
    "duration_seconds": 2418,
    "thumbnail": "https://img.youtube.com/vi/NFm8VJb_qmA/mqdefault.jpg",
    "streaming_url": "https://www.youtube.com/embed/NFm8VJb_qmA?autoplay=1&modestbranding=1",
    "youtube_url": "https://www.youtube.com/watch?v=NFm8VJb_qmA",
    "created_at": "2026-02-09T19:57:18.214008"
  }
}
```

---

### 6. Watchlist
**GET** `/api/watchlist`

Get all channels in the watchlist.

**Response:**
```json
{
  "data": {
    "channels": [
      "@dejaftv",
      "@Meripodcast",
      "@Gugutpodcast",
      "@WECHEWGOOD",
      "@marakiweg2023",
      "@yonasmoh",
      "@manyazewaleshetu",
      "@alive_podcast_Abrham",
      "@AGI.podcast",
      "@Talakpodcast",
      "@networkpodcastet",
      "@TechTalkWithSolomon",
      "@dawitdreams",
      "@EgregnawPodcast"
    ],
    "total": 14
  }
}
```

---

### 7. Player Data
**GET** `/api/player/:id`

Get streaming URL and player data for a podcast.

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | YouTube video ID |

**Example:**
```bash
GET /api/player/NFm8VJb_qmA
```

**Response:**
```json
{
  "data": {
    "id": "NFm8VJb_qmA",
    "title": "Podcast Title",
    "uploader": "@channel_name",
    "category": "General",
    "duration": "40:18",
    "duration_seconds": 2418,
    "thumbnail": "https://img.youtube.com/vi/NFm8VJb_qmA/mqdefault.jpg",
    "streaming_url": "https://www.youtube.com/embed/NFm8VJb_qmA?autoplay=1&modestbranding=1",
    "audio_only_url": "https://www.youtube.com/embed/NFm8VJb_qmA?autoplay=1&modestbranding=1"
  }
}
```

---

### 8. Search
**GET** `/api/search`

Search podcasts by title or uploader.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `q` | string | Yes | Search query (min 2 chars) |
| `limit` | number | No | Max results (default: 50) |

**Example:**
```bash
GET /api/search?q=tech
```

**Response:**
```json
{
  "data": {
    "query": "tech",
    "results": [...],
    "total": 2
  }
}
```

---

### 9. Channel Podcasts
**GET** `/api/channels/:channel`

Get all podcasts from a specific channel.

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `channel` | string | Yes | Channel name (with or without @) |

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | number | No | Page number (default: 1) |
| `limit` | number | No | Items per page (default: 20) |

**Example:**
```bash
GET /api/channels/@dejaftv?page=1&limit=20
```

**Response:**
```json
{
  "data": {
    "channel": "@dejaftv",
    "podcasts": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "has_more": true
    }
  }
}
```

---

### 10. Statistics
**GET** `/api/stats`

Get platform statistics.

**Response:**
```json
{
  "data": {
    "total_podcasts": 644,
    "total_channels": 14
  }
}
```

---

## 📁 Project Structure

```
backend/
├── index.js              # Main API server (Node.js)
├── scrape_all_podcasts.py  # YouTube scraper (Python/yt-dlp)
├── podcasts.json         # Local podcast database
├── view-podcasts.html    # Frontend - view all podcasts
├── audio-player.html     # Frontend - podcast player
├── package.json          # Node.js dependencies
├── requirements.txt      # Python dependencies
└── serviceAccountKey.json # Firebase config (unused in JSON mode)
```

---

## 🎯 Available Categories

- **Tech** - Technology, programming, AI
- **Business** - Entrepreneur, money, investment
- **Lifestyle** - Life, relationships, health
- **Success** - Motivation, inspiration
- **Education** - Learning, teaching
- **News** - Current events
- **General** - Uncategorized

---

## 🔧 Testing the API

```bash
# Health check
curl http://localhost:3000/api/health

# Get stats
curl http://localhost:3000/api/stats

# Discover podcasts
curl http://localhost:3000/api/discover?limit=5

# Search
curl "http://localhost:3000/api/search?q=tech"

# Get channel
curl http://localhost:3000/api/channels/@dejaftv?limit=3
```

---

## 📱 Frontend Pages

| Page | URL | Description |
|------|-----|-------------|
| View Podcasts | `http://localhost:3000/view-podcasts.html` | Browse all podcasts |
| Audio Player | `http://localhost:3000/audio-player.html?id=VIDEO_ID` | Play podcast |

---

## 🚀 Deployment for Production

### Option 1: Railway/Render (Easiest)
1. Push code to GitHub
2. Connect repository to Railway/Render
3. Set environment variables (if needed)
4. Deploy

### Option 2: VPS (DigitalOcean)
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone and deploy
git clone your-repo.git
cd backend
npm install
npm start
```

### Option 3: Vercel (Frontend + Serverless)
- Deploy `view-podcasts.html` and `audio-player.html` to Vercel
- Deploy API to Vercel Serverless Functions

---

## 📊 Current Stats

- **644 Total Podcasts**
- **14 Channels**
- **7 Categories**
- **No API Quota Issues** ✅

---

## 📝 License

MIT License
