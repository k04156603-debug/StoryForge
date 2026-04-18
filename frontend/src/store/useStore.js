import { create } from 'zustand';
import { prdApi, storyApi, analysisApi } from '../api/client';

const useStore = create((set, get) => ({
  // ─── PRD State ───────────────────────────────────
  prds: [],
  currentPrd: null,
  prdLoading: false,
  prdError: null,

  // ─── Stories State ───────────────────────────────
  stories: [],
  groupedStories: [],
  storyStats: null,
  storiesLoading: false,

  // ─── Analysis State ──────────────────────────────
  qualityIssues: [],
  qualitySummary: null,
  dependencyGraph: null,
  analysisLoading: false,

  // ─── UI State ────────────────────────────────────
  activeTab: 'stories',
  selectedStory: null,
  processingStatus: null,

  // ─── PRD Actions ─────────────────────────────────
  fetchPrds: async () => {
    set({ prdLoading: true, prdError: null });
    try {
      const res = await prdApi.getAll();
      set({ prds: res.data, prdLoading: false });
    } catch (err) {
      set({ prdError: err.message, prdLoading: false });
    }
  },

  uploadPrd: async (formData) => {
    set({ prdLoading: true, prdError: null });
    try {
      const res = await prdApi.upload(formData);
      return res.data;
    } catch (err) {
      set({ prdError: err.message, prdLoading: false });
      throw err;
    } finally {
      set({ prdLoading: false });
    }
  },

  uploadPrdText: async (content, title) => {
    set({ prdLoading: true, prdError: null });
    try {
      const res = await prdApi.uploadText(content, title);
      return res.data;
    } catch (err) {
      set({ prdError: err.message, prdLoading: false });
      throw err;
    } finally {
      set({ prdLoading: false });
    }
  },

  startProcessing: async (prdId) => {
    try {
      await prdApi.process(prdId);
      set({ processingStatus: { id: prdId, progress: 0, message: 'Starting...' } });
    } catch (err) {
      set({ prdError: err.message });
      throw err;
    }
  },

  pollStatus: async (prdId) => {
    try {
      const res = await prdApi.getStatus(prdId);
      const prd = res.data;
      set({
        currentPrd: prd,
        processingStatus: {
          id: prdId,
          progress: prd.processingProgress,
          message: prd.processingMessage,
          status: prd.status,
        },
      });
      return prd;
    } catch (err) {
      set({ prdError: err.message });
      throw err;
    }
  },

  deletePrd: async (id) => {
    try {
      await prdApi.delete(id);
      set((state) => ({ prds: state.prds.filter((p) => p._id !== id) }));
    } catch (err) {
      set({ prdError: err.message });
    }
  },

  // ─── Story Actions ───────────────────────────────
  fetchStories: async (prdId) => {
    set({ storiesLoading: true });
    try {
      const [grouped, stats] = await Promise.all([
        storyApi.getByPrd(prdId, true),
        storyApi.getStats(prdId),
      ]);
      set({
        groupedStories: grouped.data,
        storyStats: stats.data,
        storiesLoading: false,
      });
    } catch (err) {
      set({ storiesLoading: false, prdError: err.message });
    }
  },

  updateStory: async (id, data) => {
    try {
      const res = await storyApi.update(id, data);
      // Update in grouped stories
      set((state) => ({
        groupedStories: state.groupedStories.map((group) => ({
          ...group,
          stories: group.stories.map((s) => (s._id === id ? res.data : s)),
        })),
      }));
      return res.data;
    } catch (err) {
      set({ prdError: err.message });
      throw err;
    }
  },

  // ─── Analysis Actions ────────────────────────────
  fetchAnalysis: async (prdId) => {
    set({ analysisLoading: true });
    try {
      const [issues, summary, deps] = await Promise.all([
        analysisApi.getIssues(prdId),
        analysisApi.getSummary(prdId),
        analysisApi.getDependencies(prdId).catch(() => ({ data: null })),
      ]);
      set({
        qualityIssues: issues.data,
        qualitySummary: summary.data,
        dependencyGraph: deps.data,
        analysisLoading: false,
      });
    } catch (err) {
      set({ analysisLoading: false, prdError: err.message });
    }
  },

  resolveIssue: async (issueId) => {
    try {
      await analysisApi.resolveIssue(issueId);
      set((state) => ({
        qualityIssues: state.qualityIssues.map((i) =>
          i._id === issueId ? { ...i, resolved: true } : i
        ),
      }));
    } catch (err) {
      set({ prdError: err.message });
    }
  },

  // ─── UI Actions ──────────────────────────────────
  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedStory: (story) => set({ selectedStory: story }),
  clearError: () => set({ prdError: null }),
  reset: () => set({
    currentPrd: null,
    stories: [],
    groupedStories: [],
    storyStats: null,
    qualityIssues: [],
    qualitySummary: null,
    dependencyGraph: null,
    processingStatus: null,
    selectedStory: null,
    activeTab: 'stories',
  }),
}));

export default useStore;
