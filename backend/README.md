# Ethio Podcast

A professional podcast platform backend focused on Ethiopian audio content from YouTube.

## Features

- 🎧 **644 podcasts** from **14 Ethiopian YouTube channels**
- 🔧 **No YouTube API Required** - Uses yt-dlp for scraping
- 💾 **Local JSON Storage** - No database quota issues
- 🎲 **Smart Shuffling** - Randomize podcast playback
- 📂 **Category Filtering** - Tech, Comedy, Education, News, Religious
- 🔍 **Search & Discovery** - Full-text search across all podcasts

## Quick Start

```bash
# Install dependencies
cd backend
npm install
pip install -r requirements.txt

# Start the server
npm start

# API runs at http://localhost:3000
```

## Project Structure

```
├── backend/
│   ├── index.js              # Main API server
│   ├── scrape_all_podcasts.py # YouTube scraper
│   ├── podcasts.json         # 644 podcasts dataset
│   ├── view-podcasts.html    # Podcast browser UI
│   ├── audio-player.html     # Audio player UI
│   ├── package.json          # Node.js deps
│   ├── requirements.txt      # Python deps
│   └── README.md             # API documentation
└── push_to_github.sh         # Git setup script
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| GET /api/health | Health check |
| GET /api/home | Home screen with trending |
| GET /api/discover | Browse all podcasts |
| GET /api/search?q=term | Search podcasts |
| GET /api/stats | Platform statistics |

## Tech Stack

- **Backend**: Node.js + Express
- **Scraper**: Python + yt-dlp
- **Storage**: Local JSON
- **Frontend**: HTML + YouTube IFrame API

## License

MIT
