import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 300000, // 5 min for AI processing
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sf_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || error.message || 'An error occurred';
    return Promise.reject({ message, status: error.response?.status });
  }
);

// ─── PRD APIs ────────────────────────────────────
export const prdApi = {
  upload: (formData) => api.post('/prd/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  uploadText: (content, title) => api.post('/prd/upload', { content, title }),
  process: (id) => api.post(`/prd/${id}/process`),
  getStatus: (id) => api.get(`/prd/${id}`),
  getAll: (page = 1) => api.get(`/prd?page=${page}`),
  delete: (id) => api.delete(`/prd/${id}`),
};

// ─── Story APIs ──────────────────────────────────
export const storyApi = {
  getByPrd: (prdId, grouped = true) => api.get(`/stories/${prdId}?grouped=${grouped}`),
  getById: (id) => api.get(`/stories/detail/${id}`),
  update: (id, data) => api.put(`/stories/${id}`, data),
  getStats: (prdId) => api.get(`/stories/${prdId}/stats`),
};

// ─── Analysis APIs ───────────────────────────────
export const analysisApi = {
  getIssues: (prdId, filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return api.get(`/analysis/${prdId}/issues${params ? '?' + params : ''}`);
  },
  getSummary: (prdId) => api.get(`/analysis/${prdId}/summary`),
  resolveIssue: (id) => api.patch(`/analysis/issues/${id}/resolve`),
  getDependencies: (prdId) => api.get(`/analysis/${prdId}/dependencies`),
};

// ─── Export APIs ─────────────────────────────────
export const exportApi = {
  export: (prdId, format, storyIds) => {
    if (format === 'jira') {
      return api.post(`/export/${prdId}`, { format, storyIds });
    }
    return api.post(`/export/${prdId}`, { format, storyIds }, { responseType: 'blob' });
  },
};

export default api;
