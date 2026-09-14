import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import MemoryForm from './components/MemoryForm';
import MemoryList from './components/MemoryList';
import AiSummaryCard from './components/AiSummaryCard';
import { memoryApi } from './services/api';

export default function App() {
  const [memories, setMemories] = useState([]);
  const [summaryData, setSummaryData] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  }, []);

  // Fetch all memories from the backend
  const loadMemories = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await memoryApi.getAll();
      setMemories(data || []);
      setIsOnline(true);
    } catch (err) {
      console.error('Failed to load memories:', err);
      setIsOnline(false);
      showToast(
        `Backend unreachable: ${err.message}. Ensure ASP.NET Core API is running on http://localhost:5113`,
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  // Initial load and health ping
  useEffect(() => {
    loadMemories();

    const interval = setInterval(async () => {
      const healthy = await memoryApi.ping();
      setIsOnline(healthy);
    }, 10000);

    return () => clearInterval(interval);
  }, [loadMemories]);

  // Add new memory handler
  const handleAddMemory = async (formData) => {
    try {
      setIsSubmitting(true);
      const created = await memoryApi.create(formData);
      // Prepend newly created memory
      setMemories((prev) => [created, ...prev]);
      showToast('Memory successfully saved to MySQL database!', 'success');
      return true;
    } catch (err) {
      console.error('Create memory error:', err);
      showToast(`Failed to save memory: ${err.message}`, 'error');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete memory handler
  const handleDeleteMemory = async (id) => {
    try {
      await memoryApi.delete(id);
      setMemories((prev) => prev.filter((m) => m.id !== id));
      showToast('Memory deleted.', 'info');
    } catch (err) {
      console.error('Delete memory error:', err);
      showToast(`Failed to delete memory: ${err.message}`, 'error');
    }
  };

  // Trigger Gemini AI Summarize
  const handleSummarize = async () => {
    try {
      setIsSummarizing(true);
      const result = await memoryApi.summarize();
      setSummaryData(result);
      showToast('AI memory summary generated!', 'success');
      // Scroll to summary nicely
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Summarize error:', err);
      showToast(`AI Summarization failed: ${err.message}`, 'error');
    } finally {
      setIsSummarizing(false);
    }
  };

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <Navbar
        isOnline={isOnline}
        memoryCount={memories.length}
        onSummarize={handleSummarize}
        isSummarizing={isSummarizing}
      />

      {/* AI Summary Card (Shown when generated) */}
      {summaryData && (
        <AiSummaryCard
          summaryData={summaryData}
          onClose={() => setSummaryData(null)}
          onRefresh={handleSummarize}
          isRefreshing={isSummarizing}
        />
      )}

      {/* Main Grid: Left Form, Right Memory Feed */}
      <div className="main-layout">
        <MemoryForm
          onAddMemory={handleAddMemory}
          isSubmitting={isSubmitting}
        />

        <MemoryList
          memories={memories}
          onDeleteMemory={handleDeleteMemory}
          isLoading={isLoading}
        />
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={`toast ${toast.type}`}>
          <span>
            {toast.type === 'success' ? '✅' : toast.type === 'error' ? '⚠️' : 'ℹ️'}
          </span>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
