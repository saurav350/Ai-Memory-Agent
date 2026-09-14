import React, { useState } from 'react';

/**
 * Maps category name to CSS badge class.
 */
function getCategoryBadgeClass(category) {
  const lower = (category || '').toLowerCase();
  if (lower.includes('work')) return 'badge-work';
  if (lower.includes('personal')) return 'badge-personal';
  if (lower.includes('learn')) return 'badge-learning';
  if (lower.includes('idea')) return 'badge-ideas';
  return 'badge-general';
}

/**
 * Format date string into human readable format.
 */
function formatDate(isoString) {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return isoString;
  }
}

/**
 * Single Memory Card component.
 */
export default function MemoryCard({ memory, onDelete }) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!isConfirming) {
      setIsConfirming(true);
      return;
    }

    setIsDeleting(true);
    await onDelete(memory.id);
  };

  const badgeClass = getCategoryBadgeClass(memory.category);

  return (
    <article className="memory-card">
      <div className="card-header">
        <span className={`badge-category ${badgeClass}`}>
          {memory.category}
        </span>
        <time className="card-time" dateTime={memory.createdAt}>
          {formatDate(memory.createdAt)}
        </time>
      </div>

      <div className="card-content">
        {memory.content}
      </div>

      <div className="card-footer">
        {isConfirming ? (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Delete?</span>
            <button
              type="button"
              className="btn btn-outline"
              style={{ padding: '3px 8px', fontSize: '0.75rem' }}
              onClick={() => setIsConfirming(false)}
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-icon"
              style={{
                background: 'var(--danger-bg)',
                color: 'var(--danger)',
                padding: '3px 8px',
                fontSize: '0.75rem',
                border: '1px solid rgba(239, 68, 68, 0.4)'
              }}
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Confirm'}
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="btn-icon"
            onClick={handleDelete}
            title="Delete this memory"
            aria-label="Delete memory"
          >
            🗑️
          </button>
        )}
      </div>
    </article>
  );
}
