#!/usr/bin/env python3
"""
Scrape all podcasts from YouTube channels and store in local JSON file
NO YouTube API KEY REQUIRED - uses yt-dlp for extraction

Usage: python3 scrape_all_podcasts.py
"""

import os
import json
import time
from datetime import datetime
import yt_dlp
import requests
import feedparser

# Local JSON file for storing podcasts
PODCASTS_FILE = "podcasts.json"

# Watchlist channel usernames (without @)
WATCHLIST = [
    "dejaftv", "Meripodcast", "Gugutpodcast", "WECHEWGOOD",
    "marakiweg2023", "yonasmoh", "manyazewaleshetu",
    "alive_podcast_Abrham", "AGI.podcast", "Talakpodcast", 
    "networkpodcastet", "TechTalkWithSolomon", "dawitdreams",
    "EgregnawPodcast"
]

# Known channel ID mappings
CHANNEL_ID_MAP = {
    "dejaftv": "UCdQ-5b2xJiCWgxinWo4NX7w",
    "Meripodcast": "UCzKNuQ80qNSpt2x-7dsazJg",
    "Gugutpodcast": "UCkOxp2i-ltA9jj0uSamcFWQ",
    "WECHEWGOOD": "UCJD-UtyBgYWqvmp_lknn7Lg",
    "marakiweg2023": "UCjtJegUYRb_xMVJMzfa7Cxg",
    "yonasmoh": "UCC8tUGeAhc4pd6WfdTtYCog",
    "manyazewaleshetu": "UCkJ7RzEWXZsiM2dL0aQVifw",
    "alive_podcast_Abrham": "UCBGFX2wURc0TPxsZiuV0clg",
    "AGI.podcast": "UCbCvbQn8AdhKWfaD2V0cVng",
    "Talakpodcast": "UC1ZplDiQSri9Lk3TBszYzIg",
    "networkpodcastet": "UC8K2hKLp4E88XnAS2-NjK5Q",
    "TechTalkWithSolomon": "UCGWHSWkreIyk1CASExhmsSQ",
    "dawitdreams": "UCb3euYUGSY7REtF8NDsMLsA",
    "EgregnawPodcast": "UCsJdVrgHO2OfeRusEGWTKwQ",
}


def get_thumbnail(video_id):
    return f"https://img.youtube.com/vi/{video_id}/mqdefault.jpg"


def get_streaming_url(video_id):
    return f"https://www.youtube.com/embed/{video_id}?autoplay=1&modestbranding=1"


def load_podcasts():
    """Load podcasts from local JSON file"""
    if os.path.exists(PODCASTS_FILE):
        with open(PODCASTS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}


def save_podcasts(podcasts):
    """Save podcasts to local JSON file"""
    with open(PODCASTS_FILE, 'w', encoding='utf-8') as f:
        json.dump(podcasts, f, ensure_ascii=False, indent=2)


def fetch_channel_videos(channel_name, channel_id, max_videos=50):
    """
    Fetch videos from a YouTube channel using yt-dlp and RSS feed
    """
    videos = []
    
    # Try yt-dlp first
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'extract_flat': True,
        'playlistend': max_videos,
    }
    
    try:
        channel_url = f"https://www.youtube.com/channel/{channel_id}/videos"
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            result = ydl.extract_info(channel_url, download=False)
            
            if result and 'entries' in result:
                for entry in result['entries']:
                    if entry:
                        videos.append({
                            'id': entry.get('id', ''),
                            'title': entry.get('title', ''),
                            'description': entry.get('description', ''),
                            'thumbnail': entry.get('thumbnail', ''),
                            'duration': entry.get('duration', 0),
                            'view_count': entry.get('view_count', 0),
                            'uploader': f"@{channel_name}",
                        })
                        
    except Exception as e:
        print(f"  ⚠ yt-dlp error: {e}")
    
    # Fetch actual upload dates from RSS feed
    if videos:
        rss_url = f"https://www.youtube.com/feeds/videos.xml?channel_id={channel_id}"
        try:
            import feedparser
            response = requests.get(rss_url, timeout=15)
            if response.status_code == 200:
                feed = feedparser.parse(response.content)
                for entry in feed.entries:
                    video_id = getattr(entry, 'yt_videoid', None)
                    published = getattr(entry, 'published', '')
                    if video_id and published:
                        for v in videos:
                            if v['id'] == video_id:
                                v['published_at'] = published
                                break
        except Exception as e:
            print(f"  ⚠ RSS error: {e}")
    
    return videos


def fetch_via_rss(channel_id):
    """
    Fallback: Fetch videos via YouTube RSS feed
    NO API KEY NEEDED!
    """
    import feedparser
    import requests
    from bs4 import BeautifulSoup
    
    videos = []
    try:
        rss_url = f"https://www.youtube.com/feeds/videos.xml?channel_id={channel_id}"
        response = requests.get(rss_url, timeout=15)
        
        if response.status_code == 200:
            feed = feedparser.parse(response.content)
            
            for entry in feed.entries:
                # Extract video ID from yt:videoId
                video_id = ''
                if 'yt_videoId' in entry:
                    video_id = entry.yt_videoId
                elif 'link' in entry:
                    # Parse from link like https://www.youtube.com/watch?v=VIDEO_ID
                    link = entry.link
                    if 'v=' in link:
                        video_id = link.split('v=')[1].split('&')[0]
                
                if video_id:
                    videos.append({
                        'id': video_id,
                        'title': entry.get('title', ''),
                        'description': entry.get('summary', ''),
                        'thumbnail': f"https://img.youtube.com/vi/{video_id}/mqdefault.jpg",
                        'published_at': entry.get('published', ''),
                        'duration': 0,
                        'view_count': 0,
                        'url': entry.get('link', ''),
                    })
                    
    except Exception as e:
        print(f"  ⚠ RSS fallback error: {e}")
    
    return videos


def categorize_video(title, description):
    """Simple categorization based on keywords"""
    text = ((title or '') + " " + (description or '')).lower()
    
    categories = {
        "Tech": ["tech", "programming", "coding", "software", "computer", "ai", "app", "developer", "ቴክኖሎጂ", "ፕሮግራሚንግ"],
        "Business": ["business", "entrepreneur", "money", "investment", "startup", "company", "ቢዝነስ", "ንግድ"],
        "Lifestyle": ["lifestyle", "life", "relationship", "family", "health", "ሕይወት", "የቤት እናት"],
        "Success": ["success", "motivation", "inspiration", "success story", "ስኬት", "ተስፋ"],
        "Education": ["education", "learning", "teach", "school", "university", "ትምህርት"],
        "News": ["news", "ዜና", "current", "today"]
    }
    
    for category, keywords in categories.items():
        for keyword in keywords:
            if keyword in text:
                return category
    
    return "General"


def store_podcast(podcasts, podcast_data):
    """Store a single podcast in local JSON"""
    podcast_id = podcast_data["id"]
    
    # Use YouTube upload date if available
    upload_date = podcast_data.get('published_at', '')
    if upload_date:
        # RSS returns ISO format like 2026-02-04T10:29:10+00:00
        # Just use it directly
        created_at = upload_date
    else:
        created_at = datetime.now().isoformat()
    
    podcasts[podcast_id] = {
        "id": podcast_id,
        "title": podcast_data["title"],
        "display_title": podcast_data["title"],
        "description": podcast_data.get("description", ""),
        "uploader": podcast_data["uploader"],
        "category": podcast_data.get("category", "General"),
        "duration": podcast_data.get("duration", 0),
        "thumbnail": podcast_data.get("thumbnail", get_thumbnail(podcast_id)),
        "streaming_url": get_streaming_url(podcast_id),
        "youtube_url": f"https://www.youtube.com/watch?v={podcast_id}",
        "created_at": created_at,
        "updated_at": datetime.now().isoformat()
    }
    return podcasts


def main():
    print("🎧 Ethiopodcasts - YouTube Channel Scraper (NO API KEY NEEDED!)")
    print("=" * 60)
    print("✓ Using yt-dlp for extraction - no YouTube API required!")
    print("✓ Storing podcasts locally in JSON file\n")
    
    # Load existing podcasts
    podcasts = load_podcasts()
    print(f"📦 Loaded {len(podcasts)} existing podcasts\n")
    
    total_podcasts = 0
    new_podcasts = 0
    total_channels = 0
    
    for channel_name in WATCHLIST:
        display_name = f"@{channel_name}"
        print(f"📺 Processing: {display_name}")
        
        # Get channel ID from our map
        channel_id = CHANNEL_ID_MAP.get(channel_name)
        
        if not channel_id:
            print(f"  ⚠ Channel ID not found in mapping\n")
            continue
        
        # Fetch videos using yt-dlp (NO API KEY!)
        videos = fetch_channel_videos(channel_name, channel_id)
        
        if videos:
            print(f"  ✓ Found {len(videos)} videos")
            
            for video in videos:
                category = categorize_video(video["title"], video.get("description", ""))
                
                podcast = {
                    "id": video["id"],
                    "title": video["title"],
                    "description": video.get("description", ""),
                    "thumbnail": video.get("thumbnail", get_thumbnail(video["id"])),
                    "published_at": video.get("published_at"),
                    "uploader": display_name,
                    "category": category,
                    "duration": video.get("duration", 0),
                }
                
                # Only store if not exists
                if video["id"] not in podcasts:
                    try:
                        store_podcast(podcasts, podcast)
                        new_podcasts += 1
                        total_podcasts += 1
                    except Exception as e:
                        print(f"  ⚠ Error storing {video['id']}: {e}")
                else:
                    total_podcasts += 1
                    print(f"  ✓ Already exists: {video['title'][:30]}...")
            
            total_channels += 1
            print(f"  ✓ Processed {len(videos)} videos from {display_name}\n")
        else:
            print(f"  ⚠ No videos found for {display_name}\n")
        
        time.sleep(0.5)  # Be polite to YouTube servers
    
    # Save all podcasts
    save_podcasts(podcasts)
    
    print("=" * 60)
    print(f"✅ Complete!")
    print(f"   Channels processed: {total_channels}/{len(WATCHLIST)}")
    print(f"   Total podcasts: {len(podcasts)}")
    print(f"   New podcasts added: {new_podcasts}")
    print(f"\n📱 Podcasts saved to: {PODCASTS_FILE}")
    print("   Restart the backend server to see changes!")


if __name__ == "__main__":
    main()
