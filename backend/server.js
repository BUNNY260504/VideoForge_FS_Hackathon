
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// GET /download/:filename
app.get('/download/:filename', (req, res) => {
    const filename = req.params.filename;
    const file = path.join(__dirname, 'uploads', filename);

    // Check if file exists
    if (fs.existsSync(file)) {
        res.download(file, filename, (err) => {
            if (err) {
                console.error("Download Error:", err);
                // Don't modify headers if streaming has started
                if (!res.headersSent) {
                    res.status(500).send("Could not download file.");
                }
            }
        });
    } else {
        res.status(404).send("File not found.");
    }
});

// Database Connection
let db;
async function connectDB() {
    try {
        db = await open({
            filename: path.join(__dirname, 'outputs.db'),
            driver: sqlite3.Database
        });
        console.log("✅ Server connected to SQLite (outputs.db)");
    } catch (err) {
        console.error("❌ DB Connection Failed:", err);
    }
}
connectDB();

// Multer Setup
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir)
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, uniqueSuffix + '-' + file.originalname)
    }
});
const upload = multer({
    storage: storage,
    limits: { fileSize: 200 * 1024 * 1024 } // 200MB limit
});

// Routes
// POST /upload
app.post('/upload', upload.single('video'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No video file provided' });
    }

    try {
        const videoId = crypto.randomUUID();
        const filename = req.file.filename;

        // 1. Save video metadata
        await db.run(
            'INSERT INTO videos (id, filename) VALUES (?, ?)',
            videoId, filename
        );

        // 2. Create tasks for variants
        let variants = ['MP4-480p', 'WebM-720p', 'MP4-1080p'];

        if (req.body.variants) {
            try {
                const parsed = JSON.parse(req.body.variants);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    variants = parsed;
                }
            } catch (e) {
                console.error("Failed to parse variants", e);
            }
        }

        for (const variant of variants) {
            const taskId = crypto.randomUUID();
            await db.run(
                'INSERT INTO tasks (id, video_id, variant, status) VALUES (?, ?, ?, ?)',
                taskId, videoId, variant, 'QUEUED'
            );
        }

        res.status(201).json({
            message: 'Upload successful, tasks created',
            videoId: videoId
        });

    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET /videos (list all videos and their tasks)
app.get('/videos', async (req, res) => {
    try {
        const videos = await db.all('SELECT * FROM videos ORDER BY created_at DESC');

        const videosWithTasks = await Promise.all(videos.map(async (video) => {
            const tasks = await db.all('SELECT * FROM tasks WHERE video_id = ?', video.id);
            return {
                ...video,
                tasks: tasks
            };
        }));

        res.json(videosWithTasks);
    } catch (error) {
        console.error('Fetch Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
