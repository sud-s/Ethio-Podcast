import yt_dlp
import telebot
import os
import shutil
import scrapetube
import firebase_admin
import time
import re
from firebase_admin import credentials, firestore

TELEGRAM_BOT_TOKEN = "8509117528:AAGgnFh3YnyZiz0vIYbFnfuNCr2f2Bp2e90"
TELEGRAM_CHANNEL_ID = "@ethio_podcast"

cred = credentials.Certificate("serviceAccountKey.json")
if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)
db = firestore.client()

bot = telebot.TeleBot(TELEGRAM_BOT_TOKEN)

mapping = {

    "Tech": ["ai", "tech", "innovator", "software", "programming", "digital", "ኢንተርኔት", "coding", "developer", "startup", "computer", "data", "ቴከኖሎጂ", "አርቲፊሻል", "amazon", "google", "microsoft", "cyber", "automation", "ሮቦት", "መተግበሪያ", "ዌብሳይት", "ድረ ገጽ", "ሲስተም", "ሃኪንግ", "ስልክ", "ላፕቶፕ"],

    "Business": ["business", "ቢዝነስ", "ንግድ", "money", "ገንዘብ", "bank", "ባንክ", "market", "መርካቶ", "investment", "ኢንቨስትመንት", "profit", "ትርፍ", "entrepreneur", "ድርጅት", "ስራ ፈጣሪ", "economy", "ሪል ስቴት", "real estate", "ሸቀጥ", "trade", "ሚሊየነር", "ሀብት", "ካፒታል", "ሽያጭ", "ገበያ", "ቢሊየነር", "ኢኮኖሚ", "ንግድ ስራ"],

    "Success": ["ህይወቱን ለመቀየር", "ስኬት", "success", "wisdom", "ልምድ", "ትምህርት", "motivation", "ተነሳሽነት", "habit", "discipline", "ግቡ", "ህልም", "dreams", "hustle", "ጥንካሬ", "inspiration", "ምክር", "ትጋት", "leadership", "አመራር", "ለውጥ", "ውሳኔ", "ስብዕና", "ስነ-ልቦና", "ማሳካት", "ጥበብ", "ትግል", "መክፈል", "መስዋትነት"],

    "Entertainment": ["funny", "ቀልድ", "comedy", "ጨዋታ", "donkey", "ወቸው", "entertainment", "music", "ሙዚቃ", "artist", "ፊልም", "drama", "ድራማ", "habesha", "vlog", "የመሳቅ", "ትውውቅ", "celebrity", "ተዋናይ", "ዝግጅት", "ጥያቄ", "መልስ", "ጨዋታ", "ኮሜዲ", "ተሰጥኦ", "ድምጻዊ"],

    "Lifestyle": ["ሰርግ", "wedding", "marriage", "ቤተሰብ", "lifestyle", "ባለቤቴ", "ፍቅር", "family", "relationship", "ጤና", "health", "food", "ምግብ", "travel", "ጉዞ", "ልጆች", "fashion", "ፋሽን", "ውበት", "ትዳር", "ፍቅረኛ", "ባህል", "ልብስ", "ታሪክ", "ወግ", "የቤት", "ጤንነት"]

}



WATCHLIST = [
    "@alive_podcast_Abrham", "@dejaftv", "@Meripodcast", "@marakiweg2023",
    "@yonasmoh", "@manyazewaleshetu", "@Gugutpodcast", "@AGI.podcast",
    "@Talakpodcast", "@TechTalkWithSolomon", "@FegegitaReact", "@dawitdreams",
    "@YallenStudio", "@networkpodcastet", "@ibsadamiinaa", "@GizachewAshagrie",
    "@leyuandmahi", "@TalkDallas"
]

def clean_title(text):
    text = re.sub(r'#\w+', '', text)
    return text.strip()

def get_smart_category(title):
    title_lower = title.lower()
    for category, keywords in mapping.items():
        if any(word in title_lower for word in keywords):
            return category
    return "General"

def process_video(url):
    temp_dir = "temp_ingestion"
    os.makedirs(temp_dir, exist_ok=True)

    try:
        print(f"Downloading: {url}")
        ydl_opts = {
            'format': 'bestaudio/best',
            'outtmpl': f'{temp_dir}/%(id)s.%(ext)s',
            'retries': 20,
            'fragment_retries': 20,
            'socket_timeout': 60,
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'm4a',
                'preferredquality': '32',
            }],
        }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            video_id = info['id']
            raw_title = info['title']
            uploader = info.get('uploader', 'Ethio Podcasts')
            duration = info.get('duration')  # Get duration in seconds
            thumbnail = info.get('thumbnail')  # Get image URL
            audio_path = f"{temp_dir}/{video_id}.m4a"

        category = get_smart_category(raw_title)
        display_title = clean_title(raw_title)

        print(f"Uploading to Telegram (Slow Mode): {display_title[:40]}...")

        file_id = None
        for attempt in range(7):
            try:
                with open(audio_path, 'rb') as f:
                    msg = bot.send_audio(
                        TELEGRAM_CHANNEL_ID,
                        f,
                        caption=f"#{category} | {uploader}\n\n{display_title}",
                        title=display_title,
                        performer=uploader,
                        timeout=1200
                    )
                    file_id = msg.audio.file_id
                    break
            except Exception as e:
                # Wait longer on each failure (15s, 30s, 45s...)
                wait_time = (attempt + 1) * 15
                print(f"Network Error. Waiting {wait_time}s to retry... ({e})")
                time.sleep(wait_time)

        if file_id:
            # Extract message ID from the sent message
            message_id = msg.id  # This gets the message ID

            db.collection("podcasts").document(video_id).set({
                "title": display_title,
                "thumbnail_url": thumbnail,
                "duration": duration,
                "category": category,
                "uploader": uploader,
                "telegram_file_id": file_id,
                "telegram_message_id": str(message_id),  # Store the message ID
                "youtube_url": url,
                "created_at": firestore.SERVER_TIMESTAMP
            })
            print(f"Successfully Synced!")
            # Small cooldown between videos to prevent Telegram flood/ban
            time.sleep(5)

    except Exception as e:
        print(f"Final Error: {e}")
    finally:
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir, ignore_errors=True)

def sync_all():
    for handle in WATCHLIST:
        print(f"--- Scanning: {handle} ---")
        try:
            channel_url = f"https://www.youtube.com/{handle}"
            videos = scrapetube.get_channel(channel_url=channel_url, limit=10) 
            
            for video in videos:
                video_id = video['videoId']
                url = f"https://www.youtube.com/watch?v={video_id}"
                doc = db.collection("podcasts").document(video_id).get()
                if not doc.exists:
                    process_video(url)
                else:
                    print(f" Skipping {video_id} (Done)")
        except Exception as e:
            print(f"Error scanning {handle}: {e}")

if __name__ == "__main__":
    print(" EthioPodcasts Engine: High-Reliability Mode Active...")
    sync_all()
    print(" Sync finished.")