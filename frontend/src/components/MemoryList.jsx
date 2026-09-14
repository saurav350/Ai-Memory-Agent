import React, { useState, useMemo } from 'react';
import MemoryCard from './MemoryCard';

const STANDARD_CATEGORIES = ['All', 'Work', 'Personal', 'Learning', 'Ideas'];

/**
 * List component for filtering, searching, and displaying memories.
 */
export default function MemoryList({ memories, onDeleteMemory, isLoading }) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Dynamically extract any custom categories present in the stored memories
  const allCategories = useMemo(() => {
    const customCats = new Set();
    memories.forEach(m => {
      if (m.category && !STANDARD_CATEGORIES.includes(m.category)) {
        customCats.add(m.category);
      }
    });
    return [...STANDARD_CATEGORIES, ...Array.from(customCats)];
  }, [memories]);

  // Filter memories by category and search query
  const filteredMemories = useMemo(() => {
    return memories.filter(memory => {
      const matchesCategory = selectedCategory === 'All' ||
        memory.category?.toLowerCase() === selectedCategory.toLowerCase();

      const matchesSearch = !searchQuery.trim() ||
        memory.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        memory.category?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [memories, selectedCategory, searchQuery]);

  return (
    <main>
      {/* Header and counter */}
      <div className="feed-header">
        <div className="feed-title-wrap">
          <h2 className="feed-title">Stored Memories</h2>
          <span className="feed-count">
            {filteredMemories.length} of {memories.length}
          </span>
        </div>
      </div>

      {/* Filter and search bar */}
      <div className="filter-bar">
        <div className="search-wrap">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Search notes, insights, or topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="category-filter-pills">
          {allCategories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`filter-pill ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="empty-state">
          <div className="spinner" style={{ width: '32px', height: '32px', borderWidth: '3px', marginBottom: '16px' }}></div>
          <h3>Fetching memories from database...</h3>
        </div>
      ) : filteredMemories.length > 0 ? (
        /* Grid of Memory Cards */
        <div className="memories-grid">
          {filteredMemories.map((memory) => (
            <MemoryCard
              key={memory.id}
              memory={memory}
              onDelete={onDeleteMemory}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="empty-state glass-card">
          <div className="empty-icon">🗂️</div>
          <h3>No memories found</h3>
          <p>
            {memories.length === 0
              ? "Your vault is empty. Use the form on the left to capture your first memory or reflection!"
              : "No memories match your current filter or search criteria. Try selecting 'All' or clearing your search."}
          </p>
        </div>
      )}
    </main>
  );
}
