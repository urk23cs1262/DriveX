import { create } from 'zustand';
import { getClusterHealthAPI, toggleNodeAPI } from '../api/apiClient';

const MAX_HISTORY = 12; // 12 points × 5s = 60 seconds of history

export const useNodeStore = create((set, get) => ({
  nodes: [],
  clusterStatus: 'unknown',
  onlineNodes: 0,
  totalNodes: 0,
  isLoading: false,

  // Health history for the timeline chart
  // Shape: [{ time: '12:01:05', node1: 1, node2: 1, node3: 0 }, ...]
  healthHistory: [],

  // Fetch health via REST API (for polling)
  fetchHealth: async () => {
    try {
      const res = await getClusterHealthAPI();
      const { nodes, clusterStatus, onlineNodes, totalNodes } = res.data;

      // Build a new history data point
      const now = new Date();
      const timeLabel = now.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      const point = { time: timeLabel };
      nodes.forEach((n) => {
        point[n.id] = n.status === 'online' ? 1 : 0;
      });

      set((state) => {
        const updated = [...state.healthHistory, point];
        // Keep only last MAX_HISTORY points
        if (updated.length > MAX_HISTORY) updated.shift();
        return {
          nodes,
          clusterStatus,
          onlineNodes,
          totalNodes,
          healthHistory: updated,
        };
      });
    } catch (err) {
      console.error('Failed to fetch health:', err);
    }
  },

  // Initialize SSE stream
  initializeHealthStream: () => {
    if (typeof window === 'undefined') return;

    const baseURL = import.meta.env.VITE_API_URL || '/api';
    const eventSource = new EventSource(`${baseURL}/health-stream`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.error) {
          console.error('Health stream error:', data.error);
          return;
        }

        const { nodes, clusterStatus, onlineNodes, totalNodes } = data;

        // Build a new history data point
        const now = new Date();
        const timeLabel = now.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });

        const point = { time: timeLabel };
        nodes.forEach((n) => {
          point[n.id] = n.status === 'online' ? 1 : 0;
        });

        set((state) => {
          const updated = [...state.healthHistory, point];
          // Keep only last MAX_HISTORY points
          if (updated.length > MAX_HISTORY) updated.shift();
          return {
            nodes,
            clusterStatus,
            onlineNodes,
            totalNodes,
            healthHistory: updated,
          };
        });
      } catch (err) {
        console.error('Failed to parse health stream data:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('Health stream connection error:', err);
      eventSource.close();

      // Attempt to reconnect after 5 seconds
      setTimeout(() => {
        get().initializeHealthStream();
      }, 5000);
    };

    // Store reference to close on cleanup
    set({ _healthEventSource: eventSource });
  },

  // Cleanup SSE stream
  closeHealthStream: () => {
    const state = get();
    if (state._healthEventSource) {
      state._healthEventSource.close();
      set({ _healthEventSource: null });
    }
  },

  toggleNode: async (nodeId) => {
    const res = await toggleNodeAPI(nodeId);
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId ? { ...n, status: res.data.node.status } : n
      ),
    }));
  },
}));