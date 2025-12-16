# VideoForge_FS_Hackathon

**Video Forge** is a full-stack, asynchronous video processing application that allows users to upload videos, transcode them into multiple formats and resolutions, and download the results. Built with a modern "Glassmorphism" UI and a robust producer-consumer backend architecture.

## ✨ Features

-   **Drag & Drop Upload**: Easy video upload interface.
-   **Custom Transcoding**: Select desired **Formats** (MP4, WebM) and **Resolutions** (480p, 720p, 1080p).
-   **Real-time Status**: Live dashboard showing the processing state (Queued, Processing, Completed).
-   **Asynchronous Processing**: Decoupled architecture using a background worker and SQLite queue to handle long-running tasks without blocking the UI.
-   **Real FFmpeg Power**: Uses `ffmpeg` under the hood for actual video conversion and resizing.
-   **Download & Preview**: Preview videos in-browser or download them directly to your device.
-   **Modern UI**: Sleek, dark-themed interface with glassmorphism effects and window-style layout.

## ⚙️ System Architecture & Workflow

Video Forge operates on a decoupled **Producer-Consumer** architecture to ensure scalability and responsiveness.

### 1. The Producer (Express API)
-   **Endpoint**: `POST /upload`
-   **Action**: When a user uploads a file, the server uses `multer` to stream the video to disk.
-   **Task Generation**: It calculates the Cartesian product of selected formats (e.g., MP4, WebM) and resolutions (e.g., 480p, 1080p).
-   **Persistence**: A "parent" record is created in the `videos` table, and multiple "child" records are created in the `tasks` table with status `QUEUED`. This ensures no job is lost even if the server crashes.

### 2. The Consumer (Background Worker)
-   **Polling**: The worker runs independently (`worker.js`) and polls the SQLite database every 2 seconds for tasks marked `QUEUED`.
-   **Locking**: To prevent race conditions (in a multi-worker scenario), it immediately marks the picked task as `PROCESSING`.
-   **Transcoding Engine**: It spawns a child process using `fluent-ffmpeg`.
    -   **Resizing**: Applies scale filters (e.g., `scale=-1:720` for 720p).
    -   **Conversion**: Transcodes codecs (H.264 for MP4, VP9 for WebM) based on the target container.
-   **Completion**: Upon success, it updates the task status to `COMPLETED` and writes the output filename to the `meta` JSON column.

### 3. The Client (React Dashboard)
-   **Polling**: The frontend polls `GET /videos` every 3 seconds to fetch the latest state of the tasks.
-   **Interactive UI**: 
    -   **Preview**: "See Output" serves the file statically from the backend.
    -   **Download**: "Download" hits a specific endpoint that sets `Content-Disposition: attachment`, forcing a browser download.

## 🛠️ Tech Stack

-   **Frontend**: React, Vite, CSS Modules (Custom Glassmorphism Theme).
-   **Backend**: Node.js, Express.js.
-   **Database**: SQLite (for persistent job queue and metadata).
-   **Processing**: FFmpeg (via `fluent-ffmpeg` and `ffmpeg-static`).
-   **File Handling**: Multer (for uploads).

## 🚀 Getting Started

### Prerequisites

-   Node.js (v14+ recommended)
-   npm or yarn

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/video-forge.git
    cd video-forge
    ```

2.  **Setup Backend**
    ```bash
    cd backend
    npm install
    # This will also install ffmpeg-static automatically
    ```

3.  **Setup Frontend**
    ```bash
    cd frontend
    npm install
    ```

## 🏃‍♂️ Running the App

You need to run both the **Server**, the **Worker**, and the **Frontend** locally.

1.  **Start the Backend Server** (Terminal 1)
    ```bash
    cd backend
    node server.js
    ```
    *Runs on http://localhost:3000*

2.  **Start the Background Worker** (Terminal 2)
    ```bash
    cd backend
    node worker.js
    ```
    *Listens for tasks in the SQLite database*

3.  **Start the Frontend** (Terminal 3)
    ```bash
    cd frontend
    npm run dev
    ```
    *accessible at http://localhost:5173*

## 📖 Usage

1.  Open the web app.
2.  Click **Upload.exe** (the Upload window).
3.  Choose a video file.
4.  Select your target settings (e.g., **720p** and **WebM**).
5.  Click **Upload**.
6.  Watch the **Process_Monitor** window as your video goes from *QUEUED* -> *PROCESSING* -> *COMPLETED*.
7.  Click **See Output** to view or **Download** to save your new video!

## 🧩 Architecture

This project uses a **Producer-Consumer** pattern:
1.  **Producer**: The Express API receives the upload and inserts a task into the SQLite `tasks` table with status `QUEUED`.
2.  **Consumer**: The `worker.js` script continuously polls the database for `QUEUED` tasks. When found, it locks the task, processes it with FFmpeg, and updates the status to `COMPLETED`.
3.  **Client**: The React frontend polls the API to reflect these status changes in real-time.

---
## DEMO


https://github.com/user-attachments/assets/870d1025-0303-4610-980e-a5ff29e7bd70


