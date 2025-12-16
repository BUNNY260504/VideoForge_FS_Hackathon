
const fs = require('fs');
const path = require('path');

async function test() {
    console.log("Starting verification flow...");

    // 1. Check if server is running (User must start it)
    try {
        const res = await fetch('http://localhost:3000/videos');
        if (!res.ok) throw new Error("Server not responding");
        console.log("✅ Backend is reachable");
    } catch (e) {
        console.error("❌ Backend is not running at http://localhost:3000");
        console.log("-> Please run `node backend/server.js` in a separate terminal.");
        return;
    }

    // 2. Upload a dummy video
    console.log("Uploading test video...");
    const dummyPath = path.join(__dirname, 'test_video.mp4');
    fs.writeFileSync(dummyPath, 'dummy video content');

    const formData = new FormData();
    formData.append('video', new Blob([fs.readFileSync(dummyPath)]), 'test_video.mp4');

    try {
        const res = await fetch('http://localhost:3000/upload', {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        console.log("✅ Upload successful. Video ID:", data.videoId);

        // 3. Monitor status
        console.log("Monitoring task status...");
        let attempts = 0;
        const interval = setInterval(async () => {
            attempts++;
            const videoRes = await fetch('http://localhost:3000/videos');
            const videos = await videoRes.json();
            const myVideo = videos.find(v => v.id === data.videoId);

            if (!myVideo) {
                console.error("❌ Video not found in list");
                clearInterval(interval);
                return;
            }

            const statuses = myVideo.tasks.map(t => t.status);
            console.log(`[Attempt ${attempts}] Statuses:`, statuses);

            if (statuses.every(s => s === 'COMPLETED' || s === 'FAILED')) {
                console.log("✅ All tasks finished processing!");
                clearInterval(interval);
                fs.unlinkSync(dummyPath);
            }

            if (attempts > 20) {
                console.error("❌ Timeout waiting for processing.");
                clearInterval(interval);
                fs.unlinkSync(dummyPath);
            }
        }, 2000);

    } catch (e) {
        console.error("❌ Upload failed:", e);
        fs.unlinkSync(dummyPath);
    }
}

// Polyfill for Node < 18 if fetch/FormData not available globally
if (!global.fetch) {
    console.log("Please use Node.js v18+ for this test script.");
} else {
    test();
}
