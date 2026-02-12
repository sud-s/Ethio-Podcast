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

// 🔐 Firebase Auth Middleware
const { verifyToken, optionalAuth, requireAdmin, db, admin } = require('./middleware/auth');

// 📁 User Data Files
const USERS_FILE = path.join(__dirname, 'users.json');

// Load user data
function loadUsers() {
    try {
        if (fs.existsSync(USERS_FILE)) {
            const data = fs.readFileSync(USERS_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (e) {
        console.error('Error loading users:', e.message);
    }
    return { users: {}, watchlists: {}, history: {}, last_playback_positions: {} };
}

// Save user data
function saveUsers(data) {
    try {
        fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (e) {
        console.error('Error saving users:', e.message);
        return false;
    }
}

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

// ============================================
// 🔐 AUTHENTICATION ENDPOINTS (Protected)
// ============================================

// GET /api/auth/login - Get current user info (requires auth)
app.get('/api/auth/login', verifyToken, (req,res) => {
    try {
        const users = loadUsers();
        const userData = users.users[req.user.uid] || {
            uid: req.user.uid,
            email: req.user.email,
            displayName: req.user.name || req.user.email?.split('@')[0],
            photoURL: req.user.picture,
            createdAt: new Date().toISOString()
        };
        
        // Update last login
        userData.lastLoginAt = new Date().toISOString();
        users.users[req.user.uid] = userData;
        saveUsers(users);
        
        res.json(success({
            user: userData,
            isAuthenticated: true
        }));
    } catch(e) {
        res.status(500).json({status:'error',message:e.message});
    }
});

// ============================================
// 👤 WATCHLIST ENDPOINTS
// ============================================

// GET /api/user/watchlist - Get user's saved podcasts
app.get('/api/user/watchlist', verifyToken, (req,res) => {
    try {
        const users = loadUsers();
        const watchlist = users.watchlists[req.user.uid] || [];
        
        res.json(success({
            watchlist,
            total: watchlist.length
        }));
    } catch(e) {
        res.status(500).json({status:'error',message:e.message});
    }
});

// POST /api/user/watchlist - Add podcast to watchlist
app.post('/api/user/watchlist', verifyToken, (req,res) => {
    try {
        const { podcastId, podcastData } = req.body;
        
        if (!podcastId) {
            return res.status(400).json({status:'error',message:'podcastId required'});
        }
        
        const users = loadUsers();
        
        if (!users.watchlists[req.user.uid]) {
            users.watchlists[req.user.uid] = [];
        }
        
        // Check if already exists
        const exists = users.watchlists[req.user.uid].find(w => w.id === podcastId);
        if (exists) {
            return res.json(success({ message: 'Already in watchlist' }));
        }
        
        // Add to watchlist
        const watchlistItem = {
            id: podcastId,
            addedAt: new Date().toISOString(),
            data: podcastData || null
        };
        
        users.watchlists[req.user.uid].push(watchlistItem);
        
        if (saveUsers(users)) {
            res.json(success({ watchlist: users.watchlists[req.user.uid] }));
        } else {
            throw new Error('Failed to save');
        }
    } catch(e) {
        res.status(500).json({status:'error',message:e.message});
    }
});

// DELETE /api/user/watchlist/:podcastId - Remove from watchlist
app.delete('/api/user/watchlist/:podcastId', verifyToken, (req,res) => {
    try {
        const { podcastId } = req.params;
        const users = loadUsers();
        
        if (!users.watchlists[req.user.uid]) {
            return res.status(404).json({status:'error',message:'Watchlist not found'});
        }
        
        users.watchlists[req.user.uid] = users.watchlists[req.user.uid]
            .filter(w => w.id !== podcastId);
        
        if (saveUsers(users)) {
            res.json(success({ 
                message: 'Removed from watchlist',
                watchlist: users.watchlists[req.user.uid] 
            }));
        } else {
            throw new Error('Failed to save');
        }
    } catch(e) {
        res.status(500).json({status:'error',message:e.message});
    }
});

// ============================================
// 📜 LISTENING HISTORY ENDPOINTS
// ============================================

// GET /api/user/history - Get user's listening history
app.get('/api/user/history', verifyToken, (req,res) => {
    try {
        const { limit = 50 } = req.query;
        const users = loadUsers();
        let history = users.history[req.user.uid] || [];
        
        // Sort by playedAt descending (most recent first)
        history.sort((a, b) => new Date(b.playedAt) - new Date(a.playedAt));
        
        // Limit results
        history = history.slice(0, parseInt(limit));
        
        res.json(success({
            history,
            total: history.length
        }));
    } catch(e) {
        res.status(500).json({status:'error',message:e.message});
    }
});

// POST /api/user/history - Add to listening history
app.post('/api/user/history', verifyToken, (req,res) => {
    try {
        const { podcastId, podcastData, position = 0 } = req.body;
        
        if (!podcastId) {
            return res.status(400).json({status:'error',message:'podcastId required'});
        }
        
        const users = loadUsers();
        
        if (!users.history[req.user.uid]) {
            users.history[req.user.uid] = [];
        }
        
        // Check if already in history, update it
        const existingIndex = users.history[req.user.uid].findIndex(h => h.id === podcastId);
        
        const historyItem = {
            id: podcastId,
            playedAt: new Date().toISOString(),
            data: podcastData || null,
            position
        };
        
        if (existingIndex >= 0) {
            // Update existing entry
            users.history[req.user.uid][existingIndex] = historyItem;
        } else {
            // Add new entry
            users.history[req.user.uid].push(historyItem);
        }
        
        // Keep only last 100 items
        if (users.history[req.user.uid].length > 100) {
            users.history[req.user.uid] = users.history[req.user.uid].slice(-100);
        }
        
        if (saveUsers(users)) {
            res.json(success({ message: 'Added to history' }));
        } else {
            throw new Error('Failed to save');
        }
    } catch(e) {
        res.status(500).json({status:'error',message:e.message});
    }
});

// DELETE /api/user/history - Clear listening history
app.delete('/api/user/history', verifyToken, (req,res) => {
    try {
        const users = loadUsers();
        users.history[req.user.uid] = [];
        
        if (saveUsers(users)) {
            res.json(success({ message: 'History cleared' }));
        } else {
            throw new Error('Failed to save');
        }
    } catch(e) {
        res.status(500).json({status:'error',message:e.message});
    }
});

// ============================================
// ⏱️ PLAYBACK POSITION ENDPOINTS
// ============================================

// GET /api/user/position/:podcastId - Get saved playback position
app.get('/api/user/position/:podcastId', verifyToken, (req,res) => {
    try {
        const { podcastId } = req.params;
        const users = loadUsers();
        
        const positions = users.last_playback_positions[req.user.uid] || {};
        const position = positions[podcastId] || { position: 0, updatedAt: null };
        
        res.json(success({
            podcastId,
            position: position.position,
            updatedAt: position.updatedAt
        }));
    } catch(e) {
        res.status(500).json({status:'error',message:e.message});
    }
});

// POST /api/user/position/:podcastId - Save playback position
app.post('/api/user/position/:podcastId', verifyToken, (req,res) => {
    try {
        const { podcastId } = req.params;
        const { position } = req.body;
        
        if (typeof position !== 'number') {
            return res.status(400).json({status:'error',message:'position must be a number'});
        }
        
        const users = loadUsers();
        
        if (!users.last_playback_positions[req.user.uid]) {
            users.last_playback_positions[req.user.uid] = {};
        }
        
        users.last_playback_positions[req.user.uid][podcastId] = {
            position,
            updatedAt: new Date().toISOString()
        };
        
        if (saveUsers(users)) {
            res.json(success({ message: 'Position saved' }));
        } else {
            throw new Error('Failed to save');
        }
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
    console.log('📻 Podcast Endpoints:');
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
    console.log('🔐 Auth Endpoints (Require Firebase Token):');
    console.log('  GET  /api/auth/login');
    console.log('  GET  /api/user/watchlist');
    console.log('  POST /api/user/watchlist');
    console.log('  DELETE /api/user/watchlist/:id');
    console.log('  GET  /api/user/history');
    console.log('  POST /api/user/history');
    console.log('  DELETE /api/user/history');
    console.log('  GET  /api/user/position/:id');
    console.log('  POST /api/user/position/:id\n');
});

module.exports = app;
