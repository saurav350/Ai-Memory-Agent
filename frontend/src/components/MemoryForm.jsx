import React, { useState } from 'react';

const CATEGORY_PRESETS = ['Work', 'Personal', 'Learning', 'Ideas', 'General'];

/**
 * Form component to submit a new memory note.
 */
export default function MemoryForm({ onAddMemory, isSubmitting }) {
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('General');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    const finalCategory = isCustomCategory
      ? (customCategory.trim() || 'General')
      : category;

    const success = await onAddMemory({
      content: content.trim(),
      category: finalCategory
    });

    if (success) {
      setContent('');
      if (isCustomCategory) {
        setCustomCategory('');
        setIsCustomCategory(false);
        setCategory('General');
      }
    }
  };

  const handleSelectPreset = (cat) => {
    setIsCustomCategory(false);
    setCategory(cat);
  };

  return (
    <aside className="glass-card">
      <div className="form-title">
        <span>✍️</span>
        <h2>Store New Memory</h2>
      </div>
      <p className="form-subtitle">
        Record ideas, updates, or lessons learned. The AI Memory Agent will synthesize them.
      </p>

      <form onSubmit={handleSubmit}>
        {/* Content Field */}
        <div className="form-group">
          <label htmlFor="memory-content">Memory Content *</label>
          <textarea
            id="memory-content"
            className="form-control"
            placeholder="What's on your mind? (e.g., Designed new API contract for caching layer...)"
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            disabled={isSubmitting}
          />
        </div>

        {/* Category Selection */}
        <div className="form-group">
          <label>Category</label>
          <div className="category-presets">
            {CATEGORY_PRESETS.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`category-tag-btn ${!isCustomCategory && category === cat ? 'active' : ''}`}
                onClick={() => handleSelectPreset(cat)}
              >
                {cat}
              </button>
            ))}
            <button
              type="button"
              className={`category-tag-btn ${isCustomCategory ? 'active' : ''}`}
              onClick={() => setIsCustomCategory(true)}
            >
              + Custom
            </button>
          </div>

          {/* Custom Category Input */}
          {isCustomCategory && (
            <div style={{ marginTop: '10px' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Enter custom category name..."
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                maxLength={50}
                autoFocus
              />
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          id="btn-save-memory"
          className="btn btn-primary"
          style={{ width: '100%', marginTop: '8px' }}
          disabled={isSubmitting || !content.trim()}
        >
          {isSubmitting ? (
            <>
              <span className="spinner"></span>
              <span>Saving Memory...</span>
            </>
          ) : (
            <>
              <span>💾 Save Memory</span>
            </>
          )}
        </button>
      </form>
    </aside>
  );
}
