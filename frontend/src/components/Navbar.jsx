import React from 'react';

/**
 * Top Navigation Bar with brand logo, backend connectivity status, and AI trigger button.
 */
export default function Navbar({ isOnline, memoryCount, onSummarize, isSummarizing }) {
  return (
    <header className="navbar">
      <div className="brand">
        <span className="brand-icon" role="img" aria-label="brain">🧠</span>
        <div className="brand-info">
          <h1>AI Memory Agent</h1>
          <span>Knowledge & Insight Vault</span>
        </div>
      </div>

      <div className="nav-actions">
        {/* Backend Connectivity Status */}
        <div className="status-badge" title={isOnline ? "Backend connected" : "Backend offline or starting up"}>
          <span className={`status-dot ${isOnline ? 'online' : 'offline'}`}></span>
          <span>{isOnline ? 'API Connected' : 'API Connecting'}</span>
        </div>

        {/* AI Summarize Action Button */}
        <button
          id="btn-summarize-nav"
          className="btn btn-ai"
          onClick={onSummarize}
          disabled={isSummarizing || memoryCount === 0}
          title={memoryCount === 0 ? "Add memories first to summarize" : "Generate insights with Gemini 1.5 Flash"}
        >
          {isSummarizing ? (
            <>
              <span className="spinner"></span>
              <span>Thinking...</span>
            </>
          ) : (
            <>
              <span>✨ Summarize with Gemini</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}
