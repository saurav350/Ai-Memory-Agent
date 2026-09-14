import React, { useState } from 'react';

/**
 * Parses markdown-like text (headers, bold, lists) into React elements cleanly.
 */
function renderFormattedSummary(text) {
  if (!text) return null;

  const lines = text.split('\n');
  const elements = [];
  let currentList = [];

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} style={{ paddingLeft: '22px', marginBottom: '12px' }}>
          {currentList.map((item, idx) => (
            <li key={idx} style={{ marginBottom: '4px' }}>{item}</li>
          ))}
        </ul>
      );
      currentList = [];
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      return;
    }

    // Header 3: ###
    if (trimmed.startsWith('### ')) {
      flushList();
      elements.push(
        <h3 key={index} style={{ fontSize: '1.15rem', marginTop: '16px', marginBottom: '8px', color: '#c7d2fe' }}>
          {trimmed.replace('### ', '')}
        </h3>
      );
      return;
    }

    // Header 4: ####
    if (trimmed.startsWith('#### ')) {
      flushList();
      elements.push(
        <h4 key={index} style={{ fontSize: '1rem', marginTop: '12px', marginBottom: '6px', color: '#a5b4fc' }}>
          {trimmed.replace('#### ', '')}
        </h4>
      );
      return;
    }

    // Numbered header e.g. "1. **Executive Summary**"
    if (/^\d+\.\s+\*\*/.test(trimmed)) {
      flushList();
      elements.push(
        <h3 key={index} style={{ fontSize: '1.05rem', marginTop: '14px', marginBottom: '6px', color: '#e0e7ff' }}>
          {trimmed}
        </h3>
      );
      return;
    }

    // List item: - or *
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const itemContent = trimmed.substring(2);
      currentList.push(itemContent);
      return;
    }

    // Normal paragraph
    flushList();
    elements.push(
      <p key={index} style={{ marginBottom: '10px' }}>
        {trimmed}
      </p>
    );
  });

  flushList();
  return elements;
}

/**
 * Card/Modal displaying the Google Gemini AI Summary and Insights.
 */
export default function AiSummaryCard({ summaryData, onClose, onRefresh, isRefreshing }) {
  const [copied, setCopied] = useState(false);

  if (!summaryData) return null;

  const handleCopy = () => {
    if (summaryData.summary) {
      navigator.clipboard.writeText(summaryData.summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isSimulated = !summaryData.isAiGenerated;

  return (
    <section className="ai-summary-container">
      <div className="ai-header">
        <div className="ai-title-wrap">
          <span style={{ fontSize: '1.5rem' }}>✨</span>
          <h3 className="ai-title">Gemini AI Synthesis</h3>
          <span className={`ai-pill ${isSimulated ? 'simulated' : ''}`}>
            {isSimulated ? 'Simulation Mode' : 'gemini-1.5-flash'}
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            ({summaryData.memoriesAnalyzed} memories analyzed)
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* Copy Button */}
          <button
            type="button"
            className="btn btn-outline"
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
            onClick={handleCopy}
            title="Copy summary text"
          >
            {copied ? '✓ Copied' : '📋 Copy'}
          </button>

          {/* Refresh Button */}
          <button
            type="button"
            className="btn btn-outline"
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Re-generate summary"
          >
            {isRefreshing ? 'Thinking...' : '🔄 Refresh'}
          </button>

          {/* Close Button */}
          <button
            type="button"
            className="btn btn-outline"
            style={{ padding: '6px 10px', fontSize: '0.8rem' }}
            onClick={onClose}
            title="Dismiss summary"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Rendered content */}
      <div className="ai-content">
        {renderFormattedSummary(summaryData.summary)}
      </div>

      {/* Notice alert when API key is missing or informational */}
      {summaryData.notice && (
        <div className="ai-notice">
          ℹ️ {summaryData.notice}
        </div>
      )}
    </section>
  );
}
