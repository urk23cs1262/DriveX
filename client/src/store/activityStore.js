import { create } from 'zustand';
import { getActivityLogAPI } from '../api/apiClient';

export const useActivityStore = create((set) => ({
  activities: [],
  isLoading: false,
  error: null,

  fetchActivities: async (limit = 100) => {
    set({ isLoading: true, error: null });
    try {
      const res = await getActivityLogAPI(limit);
      set({ activities: res.data.activities, isLoading: false });
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },
}));
