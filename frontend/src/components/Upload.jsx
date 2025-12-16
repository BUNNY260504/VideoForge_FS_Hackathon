
import React, { useState } from 'react';

function Upload({ onUploadSuccess }) {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);

    // Selection State
    const [resolutions, setResolutions] = useState({
        '480p': true,
        '720p': false,
        '1080p': false
    });
    const [formats, setFormats] = useState({
        'MP4': true,
        'WebM': false
    });

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setError(null);
    };

    const toggleResolution = (res) => {
        setResolutions(prev => ({ ...prev, [res]: !prev[res] }));
    };

    const toggleFormat = (fmt) => {
        setFormats(prev => ({ ...prev, [fmt]: !prev[fmt] }));
    };

    const handleUpload = async () => {
        if (!file) {
            setError("Please select a file first.");
            return;
        }

        // Generate variants list
        const selectedRes = Object.keys(resolutions).filter(r => resolutions[r]);
        const selectedFmt = Object.keys(formats).filter(f => formats[f]);

        if (selectedRes.length === 0 || selectedFmt.length === 0) {
            setError("Please select at least one resolution and format.");
            return;
        }

        const variants = [];
        selectedFmt.forEach(fmt => {
            selectedRes.forEach(res => {
                variants.push(`${fmt}-${res}`);
            });
        });

        const formData = new FormData();
        formData.append('video', file);
        formData.append('variants', JSON.stringify(variants));

        setUploading(true);
        setError(null);

        try {
            const response = await fetch('http://localhost:3000/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const data = await response.json();
            console.log('Upload success:', data);
            setFile(null);
            // Reset file input if possible
            document.getElementById('videoInput').value = '';

            if (onUploadSuccess) onUploadSuccess();

        } catch (err) {
            console.error(err);
            setError("Failed to upload video. Ensure backend is running.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="card" style={{ background: 'transparent', border: 'none', boxShadow: 'none', padding: 0 }}>
            {/* File Input */}
            <div className="upload-container">
                <input
                    id="videoInput"
                    type="file"
                    accept="video/mp4,video/quicktime,video/webm"
                    onChange={handleFileChange}
                />

                {/* Options Section */}
                <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    {/* Resolutions */}
                    <div className="options-group">
                        <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Resolution</h4>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            {['480p', '720p', '1080p'].map(res => (
                                <label key={res} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={resolutions[res]}
                                        onChange={() => toggleResolution(res)}
                                    />
                                    <span style={{ fontSize: '0.9rem' }}>{res}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Formats */}
                    <div className="options-group">
                        <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Format</h4>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            {['MP4', 'WebM'].map(fmt => (
                                <label key={fmt} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={formats[fmt]}
                                        onChange={() => toggleFormat(fmt)}
                                    />
                                    <span style={{ fontSize: '0.9rem' }}>{fmt}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleUpload}
                    disabled={!file || uploading}
                    className="primary-btn"
                >
                    {uploading ? 'Uploading...' : 'Upload Video'}
                </button>
            </div>
            {error && <p className="error">{error}</p>}
        </div>
    );
}

export default Upload;
