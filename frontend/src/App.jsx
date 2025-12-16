
import React, { useState } from 'react';
import Upload from './components/Upload';
import Dashboard from './components/Dashboard';

function App() {
  const [refresh, setRefresh] = useState(0);

  const handleUploadSuccess = () => {
    setRefresh(prev => prev + 1);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Video Forge ⚡️</h1>
        <p>Premium Async Video Processing System</p>
      </header>

      <main>
        <div className="layout">
          {/* Upload Window */}
          <div className="window">
            <div className="window-header">
              <div className="window-dots">
                <div className="dot red"></div>
                <div className="dot yellow"></div>
                <div className="dot green"></div>
              </div>
              <div className="window-title">Upload.exe</div>
            </div>
            <div className="window-content">
              <Upload onUploadSuccess={handleUploadSuccess} />
            </div>
          </div>

          {/* Dashboard Window */}
          <div className="window">
            <div className="window-header">
              <div className="window-dots">
                <div className="dot red"></div>
                <div className="dot yellow"></div>
                <div className="dot green"></div>
              </div>
              <div className="window-title">Process_Monitor</div>
            </div>
            <div className="window-content">
              <Dashboard refreshTrigger={refresh} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
