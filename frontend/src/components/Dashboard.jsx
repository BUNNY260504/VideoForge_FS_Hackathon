
import React, { useEffect, useState } from 'react';

function Dashboard({ refreshTrigger }) {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchVideos = async () => {
        try {
            const response = await fetch('http://localhost:3000/videos');
            if (response.ok) {
                const data = await response.json();
                setVideos(data);
            }
        } catch (error) {
            console.error("Failed to fetch videos", error);
        } finally {
            setLoading(false);
        }
    };

    // Poll for updates
    useEffect(() => {
        fetchVideos();
        const interval = setInterval(fetchVideos, 3000); // Poll every 3 seconds
        return () => clearInterval(interval);
    }, [refreshTrigger]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'QUEUED': return 'status-queued';
            case 'PROCESSING': return 'status-processing';
            case 'COMPLETED': return 'status-completed';
            case 'FAILED': return 'status-failed';
            default: return '';
        }
    };

    if (loading && videos.length === 0) return <p>Loading videos...</p>;

    return (
        <div className="dashboard">
            <h2>Your Videos</h2>
            {videos.length === 0 ? (
                <p className="no-data">No videos uploaded yet.</p>
            ) : (
                <div className="video-list">
                    {videos.map((video) => (
                        <div key={video.id} className="video-card">
                            <div className="video-header">
                                <h3>{video.filename}</h3>
                                <span className="timestamp">{new Date(video.created_at).toLocaleString()}</span>
                            </div>
                            <div className="tasks-grid">
                                {video.tasks.map((task) => {
                                    let outputFile = null;
                                    try {
                                        if (task.meta) {
                                            const meta = JSON.parse(task.meta);
                                            outputFile = meta.outputFile;
                                        }
                                    } catch (e) {
                                        // Metadata might be empty or invalid JSON
                                    }

                                    return (
                                        <div key={task.id} className={`task-badge ${getStatusColor(task.status)}`}>
                                            <span className="variant-name">{task.variant}</span>
                                            <span className="status-label">{task.status}</span>
                                            {task.status === 'COMPLETED' && outputFile && (
                                                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                                    <a
                                                        href={`http://localhost:3000/uploads/${outputFile}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="see-output-btn"
                                                        style={{ flex: 1, textAlign: 'center', margin: 0 }}
                                                    >
                                                        See Output
                                                    </a>
                                                    <a
                                                        href={`http://localhost:3000/download/${outputFile}`}
                                                        className="see-output-btn"
                                                        style={{
                                                            flex: 1,
                                                            textAlign: 'center',
                                                            margin: 0,
                                                            backgroundColor: 'rgba(59, 130, 246, 0.5)', // Blue tint for download
                                                            border: '1px solid rgba(59, 130, 246, 0.5)'
                                                        }}
                                                    >
                                                        Download
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Dashboard;
