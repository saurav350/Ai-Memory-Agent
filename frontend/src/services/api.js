/**
 * API service for communicating with the ASP.NET Core Memory Agent Web API.
 * Uses proxy configured in Vite ('/api') or explicit API URL if defined in VITE_API_URL.
 */

const API_BASE = import.meta.env.VITE_API_URL || '';

/**
 * Handle HTTP response and extract JSON or error message.
 */
async function handleResponse(response) {
  if (!response.ok) {
    let errorDetail = `Request failed with status ${response.status}`;
    try {
      const errorJson = await response.json();
      errorDetail = errorJson.message || errorJson.title || JSON.stringify(errorJson);
    } catch {
      // response was not JSON
    }
    throw new Error(errorDetail);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return null;
  }

  return await response.json();
}

export const memoryApi = {
  /**
   * Fetch all memories, optionally filtered by category.
   * @param {string} [category]
   * @returns {Promise<Array>}
   */
  async getAll(category = '') {
    const url = category && category !== 'All'
      ? `${API_BASE}/api/memories?category=${encodeURIComponent(category)}`
      : `${API_BASE}/api/memories`;

    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' }
    });
    return handleResponse(res);
  },

  /**
   * Fetch a single memory by ID.
   * @param {number} id
   * @returns {Promise<Object>}
   */
  async getById(id) {
    const res = await fetch(`${API_BASE}/api/memories/${id}`, {
      headers: { 'Accept': 'application/json' }
    });
    return handleResponse(res);
  },

  /**
   * Create a new memory.
   * @param {{ content: string, category: string }} data
   * @returns {Promise<Object>}
   */
  async create(data) {
    const res = await fetch(`${API_BASE}/api/memories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        content: data.content,
        category: data.category || 'General'
      })
    });
    return handleResponse(res);
  },

  /**
   * Delete a memory by ID.
   * @param {number} id
   * @returns {Promise<null>}
   */
  async delete(id) {
    const res = await fetch(`${API_BASE}/api/memories/${id}`, {
      method: 'DELETE'
    });
    return handleResponse(res);
  },

  /**
   * Trigger Google Gemini AI memory summarization.
   * @returns {Promise<{ summary: string, memoriesAnalyzed: number, generatedAt: string, isAiGenerated: boolean, notice?: string }>}
   */
  async summarize() {
    const res = await fetch(`${API_BASE}/api/memories/summarize`, {
      method: 'POST',
      headers: { 'Accept': 'application/json' }
    });
    return handleResponse(res);
  },

  /**
   * Ping backend to check connectivity status.
   * @returns {Promise<boolean>}
   */
  async ping() {
    try {
      const res = await fetch(`${API_BASE}/api/memories`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(3500)
      });
      return res.ok;
    } catch {
      return false;
    }
  }
};
