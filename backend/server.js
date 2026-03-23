const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/downloads', express.static(path.join(__dirname, 'downloads')));

const DOWNLOADS_DIR = path.join(__dirname, 'downloads');
const DB_FILE = path.join(__dirname, 'songs.json');

// Simple JSON database
function loadDB() {
    try {
        if (fs.existsSync(DB_FILE)) {
            return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
        }
    } catch (e) { }
    return { songs: [], playlists: [] };
}

function saveDB(db) {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

// Detect URL type
function detectSource(url) {
    if (url.includes('tiktok.com') || url.includes('vm.tiktok.com')) return 'tiktok';
    if (url.includes('youtube.com') || url.includes('youtu.be') || url.includes('music.youtube.com')) return 'youtube';
    if (url.includes('soundcloud.com')) return 'soundcloud';
    if (url.includes('instagram.com') || url.includes('instagr.am')) return 'instagram';
    if (url.includes('facebook.com') || url.includes('fb.watch')) return 'facebook';
    if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter';
    if (url.includes('spotify.com')) return 'spotify';
    if (url.match(/\.(mp3|mp4|m4a|wav|ogg|flac|webm|aac)(\?|$)/i)) return 'direct';
    return 'generic';
}

// Get metadata from URL using yt-dlp
function getMetadata(url) {
    return new Promise((resolve, reject) => {
        const args = ['--dump-json', '--no-playlist', '--no-warnings', url];
        const ytdlp = spawn('yt-dlp', args);
        let stdout = '';
        let stderr = '';

        ytdlp.stdout.on('data', (data) => { stdout += data.toString(); });
        ytdlp.stderr.on('data', (data) => { stderr += data.toString(); });

        ytdlp.on('close', (code) => {
            if (code === 0) {
                try {
                    const info = JSON.parse(stdout);
                    resolve({
                        title: info.title || info.fulltitle || 'Unknown',
                        duration: info.duration || 0,
                        thumbnail: info.thumbnail || null,
                    });
                } catch (e) {
                    resolve({ title: 'Unknown', duration: 0, thumbnail: null });
                }
            } else {
                reject(new Error(`yt-dlp metadata failed: ${stderr}`));
            }
        });

        ytdlp.on('error', (err) => {
            reject(new Error(`yt-dlp not found: ${err.message}`));
        });
    });
}

// Check if ffmpeg is available
function checkFfmpeg() {
    return new Promise((resolve) => {
        const proc = spawn('ffmpeg', ['-version']);
        proc.on('close', (code) => resolve(code === 0));
        proc.on('error', () => resolve(false));
    });
}

// Download audio using yt-dlp
function downloadWithYtDlp(url, outputPath, songId) {
    return new Promise(async (resolve, reject) => {
        try {
            // Step 1: Get metadata
            const metadata = await getMetadata(url);

            // Step 2: Check ffmpeg availability
            const hasFfmpeg = await checkFfmpeg();

            // Step 3: Download audio
            const args = [
                '--no-playlist',
                '--no-warnings',
                '-o', outputPath,
            ];

            if (hasFfmpeg) {
                args.push('-x');
                args.push('--audio-format', 'mp3');
                args.push('--audio-quality', '0');
            } else {
                args.push('-f', 'bestaudio');
            }

            args.push(url);

            const ytdlp = spawn('yt-dlp', args);
            let stderr = '';

            ytdlp.stderr.on('data', (data) => { stderr += data.toString(); });
            ytdlp.stdout.on('data', (data) => {
                console.log('[yt-dlp]', data.toString().trim());
            });

            ytdlp.on('close', (code) => {
                if (code === 0) {
                    resolve(metadata);
                } else {
                    reject(new Error(`yt-dlp download failed: ${stderr}`));
                }
            });

            ytdlp.on('error', (err) => {
                reject(new Error(`yt-dlp not found. Please install yt-dlp: ${err.message}`));
            });
        } catch (err) {
            reject(err);
        }
    });
}

// Download direct audio file
async function downloadDirect(url, outputPath) {
    const response = await axios({
        method: 'GET',
        url: url,
        responseType: 'stream',
        headers: {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)'
        }
    });

    const writer = fs.createWriteStream(outputPath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
        writer.on('finish', () => resolve({ title: path.basename(url).split('?')[0], duration: 0, thumbnail: null }));
        writer.on('error', reject);
    });
}

// ==================== API ROUTES ====================

// Get all songs
app.get('/api/songs', (req, res) => {
    const db = loadDB();
    res.json({ success: true, songs: db.songs });
});

// Get single song
app.get('/api/songs/:id', (req, res) => {
    const db = loadDB();
    const song = db.songs.find(s => s.id === req.params.id);
    if (!song) return res.status(404).json({ success: false, error: 'Song not found' });
    res.json({ success: true, song });
});

// Delete song
app.delete('/api/songs/:id', (req, res) => {
    const db = loadDB();
    const index = db.songs.findIndex(s => s.id === req.params.id);
    if (index === -1) return res.status(404).json({ success: false, error: 'Song not found' });

    const song = db.songs[index];
    // Delete file
    const filePath = path.join(DOWNLOADS_DIR, song.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    db.songs.splice(index, 1);
    saveDB(db);
    res.json({ success: true });
});

// Download from URL
app.post('/api/download', async (req, res) => {
    const { url, customTitle, customArtist } = req.body;

    if (!url) {
        return res.status(400).json({ success: false, error: 'URL is required' });
    }

    const songId = uuidv4();
    const source = detectSource(url);
    const filename = `${songId}.mp3`;
    const outputPath = path.join(DOWNLOADS_DIR, filename);

    try {
        let info;

        if (source === 'direct') {
            // Direct download
            const ext = path.extname(url.split('?')[0]).toLowerCase();
            const directFilename = `${songId}${ext}`;
            const directPath = path.join(DOWNLOADS_DIR, directFilename);
            info = await downloadDirect(url, directPath);
            info.filename = directFilename;
        } else {
            // Use yt-dlp for everything else
            const tempOutput = path.join(DOWNLOADS_DIR, `${songId}.%(ext)s`);
            info = await downloadWithYtDlp(url, tempOutput, songId);

            // Find the actual output file (yt-dlp may add extension)
            const files = fs.readdirSync(DOWNLOADS_DIR).filter(f => f.startsWith(songId));
            if (files.length === 0) throw new Error('Download failed - no output file');
            info.filename = files[0];
        }

        // Create song record
        const song = {
            id: songId,
            title: customTitle || info.title || 'Unknown Title',
            artist: customArtist || 'Unknown Artist',
            duration: info.duration || 0,
            filename: info.filename,
            thumbnail: info.thumbnail || null,
            source: source,
            sourceUrl: url,
            audioUrl: `/downloads/${info.filename}`,
            createdAt: new Date().toISOString(),
            favorite: false
        };

        const db = loadDB();
        db.songs.unshift(song);
        saveDB(db);

        res.json({ success: true, song });
    } catch (error) {
        // Clean up any partial downloads
        try {
            const files = fs.readdirSync(DOWNLOADS_DIR).filter(f => f.startsWith(songId));
            files.forEach(f => fs.unlinkSync(path.join(DOWNLOADS_DIR, f)));
        } catch (e) { }

        res.status(500).json({
            success: false,
            error: error.message,
            hint: source !== 'direct' ? 'Make sure yt-dlp is installed: pip install yt-dlp' : undefined
        });
    }
});

// Toggle favorite
app.put('/api/songs/:id/favorite', (req, res) => {
    const db = loadDB();
    const song = db.songs.find(s => s.id === req.params.id);
    if (!song) return res.status(404).json({ success: false, error: 'Song not found' });

    song.favorite = !song.favorite;
    saveDB(db);
    res.json({ success: true, song });
});

// Update song info
app.put('/api/songs/:id', (req, res) => {
    const db = loadDB();
    const song = db.songs.find(s => s.id === req.params.id);
    if (!song) return res.status(404).json({ success: false, error: 'Song not found' });

    if (req.body.title) song.title = req.body.title;
    if (req.body.artist) song.artist = req.body.artist;

    saveDB(db);
    res.json({ success: true, song });
});

// ==================== PLAYLISTS ====================

app.get('/api/playlists', (req, res) => {
    const db = loadDB();
    res.json({ success: true, playlists: db.playlists || [] });
});

app.post('/api/playlists', (req, res) => {
    const { name } = req.body;
    const db = loadDB();
    if (!db.playlists) db.playlists = [];

    const playlist = {
        id: uuidv4(),
        name,
        songIds: [],
        createdAt: new Date().toISOString()
    };

    db.playlists.push(playlist);
    saveDB(db);
    res.json({ success: true, playlist });
});

app.post('/api/playlists/:id/songs', (req, res) => {
    const { songId } = req.body;
    const db = loadDB();
    const playlist = (db.playlists || []).find(p => p.id === req.params.id);
    if (!playlist) return res.status(404).json({ success: false, error: 'Playlist not found' });

    if (!playlist.songIds.includes(songId)) {
        playlist.songIds.push(songId);
        saveDB(db);
    }
    res.json({ success: true, playlist });
});

app.delete('/api/playlists/:id', (req, res) => {
    const db = loadDB();
    db.playlists = (db.playlists || []).filter(p => p.id !== req.params.id);
    saveDB(db);
    res.json({ success: true });
});

// Search songs
app.get('/api/search', (req, res) => {
    const { q } = req.query;
    const db = loadDB();
    const results = db.songs.filter(s =>
        s.title.toLowerCase().includes(q.toLowerCase()) ||
        s.artist.toLowerCase().includes(q.toLowerCase())
    );
    res.json({ success: true, songs: results });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', version: '1.0.0' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🎵 Music Downloader API running on port ${PORT}`);
    console.log(`📁 Downloads directory: ${DOWNLOADS_DIR}`);
    console.log(`🌐 Access from phone: http://<your-ip>:${PORT}`);
});
