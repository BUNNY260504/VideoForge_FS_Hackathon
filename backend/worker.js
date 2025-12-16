require('dotenv').config();
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');

// Tell fluent-ffmpeg where to find the static binary
ffmpeg.setFfmpegPath(ffmpegPath);

let db;

async function connectDB() {
    try {
        db = await open({
            filename: path.join(__dirname, 'outputs.db'),
            driver: sqlite3.Database
        });
        console.log('✅ Worker connected to SQLite');
        pollQueue();
    } catch (err) {
        console.error('Worker DB Connection Error:', err);
        setTimeout(connectDB, 5000);
    }
}

async function pollQueue() {
    try {
        const task = await db.get(`
            SELECT * FROM tasks 
            WHERE status = 'QUEUED' 
            ORDER BY created_at ASC 
            LIMIT 1
        `);

        if (!task) {
            setTimeout(pollQueue, 2000);
            return;
        }

        // Mark as PROCESSING
        await db.run(
            "UPDATE tasks SET status = 'PROCESSING', updated_at = datetime('now') WHERE id = ?",
            task.id
        );

        console.log(`Processing task ${task.id} (${task.variant})...`);

        // Fetch input video filename
        const videoData = await db.get('SELECT filename FROM videos WHERE id = ?', task.video_id);
        if (!videoData) {
            throw new Error('Video not found for task');
        }

        const inputPath = path.join(__dirname, 'uploads', videoData.filename);

        // Parse variant (e.g., "MP4-720p")
        const [format, resolution] = task.variant.split('-');

        // Define Output Filename
        const outputFilename = `processed_${task.id}_${resolution}.${format.toLowerCase()}`;
        const outputPath = path.join(__dirname, 'uploads', outputFilename);

        // Determine FFMPEG settings
        let size = '?x?';
        if (resolution === '480p') size = '?x480';
        if (resolution === '720p') size = '?x720';
        if (resolution === '1080p') size = '?x1080';

        console.log(`Converting to ${format} ${resolution}...`);

        // Run FFMPEG
        ffmpeg(inputPath)
            .size(size)
            .output(outputPath)
            .on('end', async () => {
                console.log(`Task ${task.id} Finished!`);

                const meta = JSON.stringify({ outputFile: outputFilename });
                await db.run(
                    "UPDATE tasks SET status = 'COMPLETED', updated_at = datetime('now'), meta = ? WHERE id = ?",
                    meta, task.id
                );
                pollQueue();
            })
            .on('error', async (err) => {
                console.error('FFmpeg Error:', err);
                await db.run(
                    "UPDATE tasks SET status = 'FAILED', updated_at = datetime('now') WHERE id = ?",
                    task.id
                );
                pollQueue();
            })
            .run();

    } catch (err) {
        console.error('Worker Error:', err);
        setTimeout(pollQueue, 5000);
    }
}

connectDB();
