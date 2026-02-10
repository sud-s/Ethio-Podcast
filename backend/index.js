const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static(__dirname));

const PODCASTS_FILE = path.join(__dirname, 'podcasts.json');

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
            is_new: todayPodcasts.find(tp => tp.id === d.id) !== undefined
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
                created_at: d.created_at
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
            created_at: d.created_at 
        }));
    } catch(e) { 
        res.status(500).json({status:'error',message:e.message}); 
    }
});

app.get('/api/player/:id', (req,res) => {
    try {
        const podcasts = loadPodcasts();
        const d = podcasts[req.params.id];
        if (!d) return res.status(404).json({status:'error',message:'Podcast not found'});
        
        res.json(success({ 
            id: d.id, 
            title: d.display_title || d.title || '', 
            uploader: d.uploader || 'Unknown', 
            category: d.category || 'General', 
            duration: formatDuration(d.duration || 0), 
            duration_seconds: d.duration || 0, 
            thumbnail: getThumbnail(d.id), 
            streaming_url: getStreamingUrl(d.id), 
            audio_only_url: getStreamingUrl(d.id) 
        }));
    } catch(e) { 
        res.status(500).json({status:'error',message:e.message}); 
    }
});

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
                streaming_url: getStreamingUrl(d.id)
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
                created_at: d.created_at
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
        res.json(success({ 
            total_podcasts: podcastList.length, 
            total_channels: WATCHLIST.length 
        }));
    } catch(e) { 
        res.status(500).json({status:'error',message:e.message}); 
    }
});

app.get('/', (req,res) => res.json(success({ server:'Ethiopodcasts API v2 (JSON)', status:'running' })));
app.use((req,res) => res.status(404).json({status:'error',message:'Not found'}));
app.use((e,req,res,next) => res.status(500).json({status:'error',message:e.message}));

app.listen(port, () => { 
    console.log(`\n🎧 Ethiopodcasts API v2 (JSON) running at http://localhost:${port}`);
    console.log(`📁 Reading podcasts from: ${PODCASTS_FILE}\n`);
    console.log('Endpoints:');
    console.log('  GET /api/health');
    console.log('  GET /api/watchlist');
    console.log('  GET /api/home');
    console.log('  GET /api/discover');
    console.log('  GET /api/categories');
    console.log('  GET /api/podcasts/:id');
    console.log('  GET /api/player/:id');
    console.log('  GET /api/search');
    console.log('  GET /api/channels/:channel');
    console.log('  GET /api/stats\n');
});

module.exports = app;
