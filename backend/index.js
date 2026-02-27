const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { exec, spawn } = require('child_process');
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static(__dirname));

const PODCASTS_FILE = path.join(__dirname, 'podcasts.json');

// ADD THIS AT TOP - Local cache directory
const CACHE_DIR = path.join(__dirname, 'audio_cache');
if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR);
    console.log(`✅ Created cache directory: ${CACHE_DIR}`);
}

const WATCHLIST = [
    "@dejaftv", "@Meripodcast", "@Gugutpodcast", "@WECHEWGOOD",
    "@marakiweg2023", "@yonasmoh", "@manyazewaleshetu",
    "@alive_podcast_Abrham", "@AGI.podcast", "@Talakpodcast", 
    "@networkpodcastet", "@TechTalkWithSolomon", "@dawitdreams",
    "@EgregnawPodcast"
];

function getThumbnail(id) { return `https://img.youtube.com/vi/${id}/mqdefault.jpg`; }
function getStreamingUrl(id) { return `https://www.youtube.com/embed/${id}?autoplay=1&modestbranding=1`; }
function formatDuration(s) { if(!s||isNaN(s))return'0:00'; const m=Math.floor(s/60); const sec=Math.floor(s%60); return`${m}:${sec.toString().padStart(2,'0')}`; }
function success(data, msg='Success') { return { status:'success', message:msg, data, timestamp:new Date().toISOString() }; }

// Load podcasts from JSON file
function loadPodcasts() {
    try {
        if (fs.existsSync(PODCASTS_FILE)) {
            const data = fs.readFileSync(PODCASTS_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (e) {
        console.error('Error loading podcasts:', e.message);
    }
    return {};
}

app.get('/api/health', (req,res) => res.json(success({ server:'Ethiopodcasts API v2 (JSON)', status:'healthy' })));

app.get('/api/watchlist', (req,res) => res.json(success({ channels:WATCHLIST, total:WATCHLIST.length })));

app.get('/api/home', (req,res) => {
    try {
        const podcasts = loadPodcasts();
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        const podcastList = Object.values(podcasts);
        // Shuffle to mix channels (user preference)
        for (let i = podcastList.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [podcastList[i], podcastList[j]] = [podcastList[j], podcastList[i]];
        }
        
        const recent = podcastList.slice(0, 20);
        const todayPodcasts = recent.filter(d => new Date(d.created_at || 0) >= today);
        const yesterdayPodcasts = recent.filter(d => new Date(d.created_at || 0) < today).slice(0, 20);
        
        const format = d => ({
            id: d.id,
            title: d.title || '',
            display_title: d.display_title || d.title || '',
            uploader: d.uploader || 'Unknown',
            category: d.category || 'General',
            duration: formatDuration(d.duration || 0),
            thumbnail: getThumbnail(d.id),
            streaming_url: getStreamingUrl(d.id),
            created_at: d.created_at,
            is_new: todayPodcasts.find(tp => tp.id === d.id) !== undefined,
            // Check if cached
            cached: fs.existsSync(path.join(CACHE_DIR, `${d.id}.ogg`))
        });
        
        res.json(success({ 
            trending: recent.slice(0, 10).map(format), 
            recent_today: todayPodcasts.map(format), 
            recent_yesterday: yesterdayPodcasts.map(format) 
        }));
    } catch(e) { 
        res.status(500).json({status:'error',message:e.message}); 
    }
});

app.get('/api/discover', (req,res) => {
    try {
        const {q, category, page=1, limit=20} = req.query;
        let podcasts = loadPodcasts();
        let podcastList = Object.values(podcasts);
        
        // Shuffle to mix channels (user preference)
        for (let i = podcastList.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [podcastList[i], podcastList[j]] = [podcastList[j], podcastList[i]];
        }
        
        if (q) { 
            const sq = q.toLowerCase();
            podcastList = podcastList.filter(d => 
                (d.title || '').toLowerCase().includes(sq) || 
                (d.uploader || '').toLowerCase().includes(sq)
            ); 
        }
        if (category) { 
            podcastList = podcastList.filter(d => (d.category || '') === category); 
        }
        
        const start = (parseInt(page) - 1) * parseInt(limit);
        const paginated = podcastList.slice(start, start + parseInt(limit));
        
        res.json(success({ 
            podcasts: paginated.map(d => ({
                id: d.id,
                title: d.title || '',
                display_title: d.display_title || d.title || '',
                uploader: d.uploader || 'Unknown',
                category: d.category || 'General',
                duration: formatDuration(d.duration || 0),
                thumbnail: getThumbnail(d.id),
                streaming_url: getStreamingUrl(d.id),
                created_at: d.created_at,
                cached: fs.existsSync(path.join(CACHE_DIR, `${d.id}.ogg`))
            })), 
            pagination: { 
                page: parseInt(page), 
                limit: parseInt(limit), 
                total: podcastList.length, 
                has_more: start + parseInt(limit) < podcastList.length 
            } 
        }));
    } catch(e) { 
        console.error('Discover error:', e.message);
        res.status(500).json({status:'error',message:e.message}); 
    }
});

app.get('/api/categories', (req,res) => {
    try {
        const podcasts = loadPodcasts();
        const podcastList = Object.values(podcasts);
        const cats = [...new Set(podcastList.map(d => d.category).filter(Boolean))];
        res.json(success({ categories: cats.sort(), total: cats.length }));
    } catch(e) { 
        res.status(500).json({status:'error',message:e.message}); 
    }
});

app.get('/api/podcasts/:id', (req,res) => {
    try {
        const podcasts = loadPodcasts();
        const d = podcasts[req.params.id];
        if (!d) return res.status(404).json({status:'error',message:'Podcast not found'});
        
        // Check cache status
        const cacheFile = path.join(CACHE_DIR, `${d.id}.ogg`);
        const isCached = fs.existsSync(cacheFile);
        const cacheSize = isCached ? `${(fs.statSync(cacheFile).size/1024/1024).toFixed(1)}MB` : null;
        
        res.json(success({ 
            id: d.id, 
            title: d.title || '', 
            display_title: d.display_title || d.title || '', 
            description: d.description || '', 
            uploader: d.uploader || 'Unknown', 
            category: d.category || 'General', 
            duration: formatDuration(d.duration || 0), 
            duration_seconds: d.duration || 0, 
            thumbnail: getThumbnail(d.id), 
            streaming_url: getStreamingUrl(d.id), 
            youtube_url: d.youtube_url || `https://www.youtube.com/watch?v=${d.id}`, 
            created_at: d.created_at,
            cached: isCached,
            cache_size: cacheSize,
            telegram_message_id: d.telegram_message_id || null
        }));
    } catch(e) { 
        res.status(500).json({status:'error',message:e.message}); 
    }
});

// REPLACED: /api/player/:id - With Local Cache + Pyrogram Fallback
app.get('/api/player/:id', async (req,res) => {
    try {
        const podcasts = loadPodcasts();
        const d = podcasts[req.params.id];
        if (!d) return res.status(404).json({status:'error',message:'Podcast not found'});
        
        // PRIORITY 1: Check local cache
        const cacheFile = path.join(CACHE_DIR, `${d.id}.ogg`);
        if (fs.existsSync(cacheFile) && fs.statSync(cacheFile).size > 100000) {
            console.log(`✅ CACHE HIT: ${d.id}`);
            return res.json(success({ 
                id: d.id, 
                title: d.display_title || d.title || '', 
                uploader: d.uploader || 'Unknown', 
                category: d.category || 'General', 
                duration: formatDuration(d.duration || 0), 
                duration_seconds: d.duration || 0, 
                thumbnail: getThumbnail(d.id), 
                audio_url: `/audio_cache/${d.id}.ogg`,  // LOCAL FILE
                cached: true,
                size: `${(fs.statSync(cacheFile).size/1024/1024).toFixed(1)}MB`,
                source: 'local_cache'
            }));
        }
        
        // PRIORITY 2: Check Pyrogram streamer (Telegram CDN)
        const telegramMsgId = d.telegram_message_id;
        if (telegramMsgId) {
            try {
                const pyroResp = await fetch(`http://localhost:5008/health`);
                if (pyroResp.ok) {
                    return res.json(success({ 
                        ...d, 
                        audio_url: `http://localhost:5008/stream/${telegramMsgId}`,
                        pyrogram: true,
                        source: 'pyrogram'
                    }));
                }
            } catch(e) {
                console.log('Pyrogram down, falling back...');
            }
        }
        
        // PRIORITY 3: YouTube embed (fallback - screen may turn off)
        res.json(success({ 
            id: d.id, 
            title: d.display_title || d.title || '', 
            uploader: d.uploader || 'Unknown', 
            category: d.category || 'General', 
            duration: formatDuration(d.duration || 0), 
            duration_seconds: d.duration || 0, 
            thumbnail: getThumbnail(d.id), 
            audio_url: getStreamingUrl(d.id),  // YouTube embed
            cached: false,
            source: 'youtube_embed'
        }));
        
    } catch(e) { 
        res.status(500).json({status:'error',message:e.message}); 
    }
});

// NEW: Cache popular podcasts on startup
app.get('/api/cache-popular', async (req,res) => {
    const podcasts = loadPodcasts();
    const podcastList = Object.values(podcasts)
        .filter(p => p.duration && p.duration < 3600 && p.duration > 60)  // <1hr, >1min
        .slice(0, 20);  // Top 20
    
    let cached = 0;
    let failed = 0;
    
    for (let podcast of podcastList) {
        const cacheFile = path.join(CACHE_DIR, `${podcast.id}.ogg`);
        if (!fs.existsSync(cacheFile)) {
            try {
                // Download from Pyrogram if available
                if (podcast.telegram_message_id) {
                    const audioUrl = `http://localhost:5008/stream/${podcast.telegram_message_id}`;
                    const response = await fetch(audioUrl);
                    if (response.ok) {
                        const buffer = await response.arrayBuffer();
                        fs.writeFileSync(cacheFile, Buffer.from(buffer));
                        console.log(`✅ CACHED: ${podcast.id}`);
                        cached++;
                    } else {
                        failed++;
                    }
                } else {
                    failed++;
                }
            } catch(e) {
                console.log(`❌ Cache failed: ${podcast.id} - ${e.message}`);
                failed++;
            }
        }
    }
    
    res.json({cached, failed, total: podcastList.length, message: `Cached ${cached} of ${podcastList.length} popular podcasts`});
});

// NEW: Get cache status
app.get('/api/cache-status', (req,res) => {
    try {
        const files = fs.readdirSync(CACHE_DIR);
        const totalSize = files.reduce((acc, f) => acc + fs.statSync(path.join(CACHE_DIR, f)).size, 0);
        
        res.json(success({
            cache_dir: CACHE_DIR,
            total_files: files.length,
            total_size_mb: (totalSize / 1024 / 1024).toFixed(2),
            files: files.map(f => ({
                name: f,
                size_mb: (fs.statSync(path.join(CACHE_DIR, f)).size / 1024 / 1024).toFixed(2)
            }))
        }));
    } catch(e) {
        res.status(500).json({status:'error',message:e.message});
    }
});

// NEW: Cache specific podcast
app.get('/api/cache/:id', async (req,res) => {
    try {
        const podcasts = loadPodcasts();
        const d = podcasts[req.params.id];
        if (!d) return res.status(404).json({status:'error',message:'Podcast not found'});
        
        const cacheFile = path.join(CACHE_DIR, `${d.id}.ogg`);
        
        if (fs.existsSync(cacheFile)) {
            return res.json(success({ 
                cached: true, 
                size: `${(fs.statSync(cacheFile).size/1024/1024).toFixed(1)}MB`,
                audio_url: `/audio_cache/${d.id}.ogg`
            }));
        }
        
        // Try to cache from Telegram
        if (d.telegram_message_id) {
            try {
                const audioUrl = `http://localhost:5008/stream/${d.telegram_message_id}`;
                const response = await fetch(audioUrl);
                if (response.ok) {
                    const buffer = await response.arrayBuffer();
                    fs.writeFileSync(cacheFile, Buffer.from(buffer));
                    return res.json(success({ 
                        cached: true, 
                        size: `${(fs.statSync(cacheFile).size/1024/1024).toFixed(1)}MB`,
                        audio_url: `/audio_cache/${d.id}.ogg`
                    }));
                }
            } catch(e) {
                return res.status(500).json({status:'error',message:'Failed to download: ' + e.message});
            }
        }
        
        res.status(400).json({status:'error',message:'No Telegram source available for this podcast'});
    } catch(e) {
        res.status(500).json({status:'error',message:e.message});
    }
});

// NEW: Stream YouTube audio directly (works with screen off!)
app.get('/api/youtube-audio/:id', (req, res) => {
    const videoId = req.params.id;
    const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
    
    console.log(`🎵 Streaming YouTube audio: ${videoId}`);
    
    // Use yt-dlp to stream audio directly - use best audio available
    const ytDlp = spawn('yt-dlp', [
        '-f', 'bestaudio/best',
        '--no-playlist',
        '--no-warnings',
        '-o', '-',
        youtubeUrl
    ]);
    
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Accept-Ranges', 'none');
    
    ytDlp.stdout.pipe(res);
    
    ytDlp.stderr.on('data', (data) => {
        console.log(`yt-dlp: ${data}`);
    });
    
    ytDlp.on('error', (err) => {
        console.error('yt-dlp error:', err);
        if (!res.headersSent) {
            res.status(500).json({status:'error',message:'Failed to stream YouTube audio'});
        }
    });
    
    ytDlp.on('close', (code) => {
        if (code !== 0) {
            console.log(`yt-dlp exited with code ${code}`);
        }
    });
    
    req.on('close', () => {
        ytDlp.kill();
    });
});

// NEW: Get YouTube audio URL for a video
app.get('/api/youtube-url/:id', async (req, res) => {
    const videoId = req.params.id;
    const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
    
    try {
        // First check if we have a cached version
        const cacheFile = path.join(CACHE_DIR, `${videoId}.ogg`);
        if (fs.existsSync(cacheFile) && fs.statSync(cacheFile).size > 100000) {
            return res.json(success({
                audio_url: `/audio_cache/${videoId}.ogg`,
                source: 'cache',
                cached: true
            }));
        }
        
        // Return the YouTube streaming URL (our own proxy)
        res.json(success({
            audio_url: `/api/youtube-audio/${videoId}`,
            source: 'youtube_stream',
            cached: false
        }));
    } catch(e) {
        res.status(500).json({status:'error',message:e.message});
    }
});

// Serve cached audio files
app.use('/audio_cache', express.static(CACHE_DIR));

app.get('/api/search', (req,res) => {
    try { 
        const {q, limit=50} = req.query;
        if (!q || q.length < 2) return res.status(400).json({status:'error',message:'Query too short'}); 
        
        const podcasts = loadPodcasts();
        const podcastList = Object.values(podcasts);
        const sq = q.toLowerCase();
        
        const results = podcastList
            .filter(d => 
                (d.title || '').toLowerCase().includes(sq) || 
                (d.uploader || '').toLowerCase().includes(sq)
            )
            .slice(0, parseInt(limit))
            .map(d => ({
                id: d.id,
                title: d.title || '',
                display_title: d.display_title || d.title || '',
                uploader: d.uploader || 'Unknown',
                category: d.category || 'General',
                duration: formatDuration(d.duration || 0),
                thumbnail: getThumbnail(d.id),
                streaming_url: getStreamingUrl(d.id),
                cached: fs.existsSync(path.join(CACHE_DIR, `${d.id}.ogg`))
            }));
        
        res.json(success({ query: q, results, total: results.length })); 
    }
    catch(e) { 
        res.status(500).json({status:'error',message:e.message}); 
    }
});

app.get('/api/channels/:channel', (req,res) => {
    try {
        const ch = req.params.channel.startsWith('@') ? req.params.channel : `@${req.params.channel}`;
        const {page=1, limit=20} = req.query;
        
        const podcasts = loadPodcasts();
        const podcastList = Object.values(podcasts).filter(d => d.uploader === ch);
        
        // Sort by created_at descending
        podcastList.sort((a,b) => {
            const dateA = new Date(a.created_at || 0);
            const dateB = new Date(b.created_at || 0);
            return dateB - dateA;
        });
        
        const start = (parseInt(page) - 1) * parseInt(limit);
        const paginated = podcastList.slice(start, start + parseInt(limit));
        
        res.json(success({ 
            channel: ch, 
            podcasts: paginated.map(d => ({
                id: d.id,
                title: d.title || '',
                display_title: d.display_title || d.title || '',
                category: d.category || 'General',
                duration: formatDuration(d.duration || 0),
                thumbnail: getThumbnail(d.id),
                streaming_url: getStreamingUrl(d.id),
                created_at: d.created_at,
                cached: fs.existsSync(path.join(CACHE_DIR, `${d.id}.ogg`))
            })), 
            pagination: { 
                page: parseInt(page), 
                limit: parseInt(limit), 
                total: podcastList.length, 
                has_more: start + parseInt(limit) < podcastList.length 
            } 
        }));
    } catch(e) { 
        res.status(500).json({status:'error',message:e.message}); 
    }
});

app.get('/api/stats', (req,res) => {
    try {
        const podcasts = loadPodcasts();
        const podcastList = Object.values(podcasts);
        
        // Count cached files
        const cachedFiles = fs.readdirSync(CACHE_DIR).filter(f => f.endsWith('.ogg'));
        
        res.json(success({ 
            total_podcasts: podcastList.length, 
            total_channels: WATCHLIST.length,
            cached_podcasts: cachedFiles.length,
            cache_size_mb: (cachedFiles.reduce((acc, f) => acc + fs.statSync(path.join(CACHE_DIR, f)).size, 0) / 1024 / 1024).toFixed(2)
        }));
    } catch(e) { 
        res.status(500).json({status:'error',message:e.message}); 
    }
});

app.get('/', (req,res) => res.json(success({ server:'Ethiopodcasts API v2 (JSON) - Offline Ready', status:'running' })));
app.use((req,res) => res.status(404).json({status:'error',message:'Not found'}));
app.use((e,req,res,next) => res.status(500).json({status:'error',message:e.message}));

app.listen(port, () => { 
    console.log(`\n🎧 Ethiopodcasts API v2 (JSON) running at http://localhost:${port}`);
    console.log(`📁 Reading podcasts from: ${PODCASTS_FILE}`);
    console.log(`💾 Cache directory: ${CACHE_DIR}\n`);
    console.log('Endpoints:');
    console.log('  GET /api/health');
    console.log('  GET /api/watchlist');
    console.log('  GET /api/home');
    console.log('  GET /api/discover');
    console.log('  GET /api/categories');
    console.log('  GET /api/podcasts/:id');
    console.log('  GET /api/player/:id (with cache + Pyrogram)');
    console.log('  GET /api/cache-popular');
    console.log('  GET /api/cache-status');
    console.log('  GET /api/cache/:id');
    console.log('  GET /api/search');
    console.log('  GET /api/channels/:channel');
    console.log('  GET /api/stats\n');
    console.log('🎯 Audio streaming:');
    console.log('  Priority 1: Local cache (offline ready)');
    console.log('  Priority 2: Pyrogram/Telegram CDN');
    console.log('  Priority 3: YouTube streaming\n');
});

module.exports = app;
