const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Paths
const VIDEOS_DIR = path.join(__dirname, 'Videos');
const FRONTEND_DIR = path.join(__dirname, 'DOPMAXWEBGG');

// Ensure Videos directory exists
if (!fs.existsSync(VIDEOS_DIR)) {
    fs.mkdirSync(VIDEOS_DIR, { recursive: true });
}

// Serve static files from frontend
app.use(express.static(FRONTEND_DIR));

// Serve videos from Videos directory
app.use('/videos', express.static(VIDEOS_DIR));

// API: Get list of videos
app.get('/api/videos', (req, res) => {
    try {
        const files = fs.readdirSync(VIDEOS_DIR);
        const videoExtensions = ['.mp4', '.webm', '.ogg', '.avi', '.mov', '.mkv'];
        
        const videos = files
            .filter(file => {
                const ext = path.extname(file).toLowerCase();
                return videoExtensions.includes(ext);
            })
            .map((file, index) => ({
                id: index + 1,
                name: path.basename(file, path.extname(file)),
                filename: file,
                url: `/videos/${encodeURIComponent(file)}`,
                extension: path.extname(file).toLowerCase()
            }));
        
        res.json(videos);
    } catch (error) {
        console.error('Error reading videos:', error);
        res.status(500).json({ error: 'Failed to read videos directory' });
    }
});

// Configure multer for video uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, VIDEOS_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 100 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /mp4|webm|ogg|avi|mov|mkv/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        if (extname) {
            cb(null, true);
        } else {
            cb(new Error('Invalid video format'));
        }
    }
});

// API: Upload video
app.post('/api/videos/upload', upload.single('video'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No video file provided' });
        }
        
        res.json({
            success: true,
            message: 'Video uploaded successfully',
            video: {
                id: Date.now(),
                name: path.basename(req.file.originalname, path.extname(req.file.originalname)),
                filename: req.file.filename,
                url: `/videos/${encodeURIComponent(req.file.filename)}`
            }
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to upload video' });
    }
});

// Serve index.html for root route
app.get('/', (req, res) => {
    res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🎬 DOPMAX Server running at http://localhost:${PORT}`);
    console.log(`🅡 Videos directory: ${VIDEOS_DIR});
    console.log(`🏗 Frontend: ${FRONTEND_DIR}`);
});