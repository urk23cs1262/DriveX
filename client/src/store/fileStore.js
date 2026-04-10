import { create } from 'zustand';
import {
  listFilesAPI,
  uploadFileAPI,
  deleteFileAPI,
  toggleShareAPI,
  downloadFileAPI,
  listTrashAPI,
  restoreFileAPI,
  hardDeleteFileAPI,
} from '../api/apiClient';

export const useFileStore = create((set, get) => ({
  files: [],
  trashItems: [],
  isLoading: false,
  isUploading: false,
  uploadProgress: 0,
  error: null,

  // Upload queue — each item: { id, file, status, progress, error }
  uploadQueue: [],

  // Initialize SSE stream for file updates
  initializeFilesStream: async () => {
    if (typeof window === 'undefined') return;

    // Fetch initial files first
    try {
      const res = await listFilesAPI();
      set({ files: res.data.files, isLoading: false });
    } catch (err) {
      console.error('Failed to fetch initial files:', err);
      set({ error: err.message, isLoading: false });
    }

    // Then subscribe to SSE stream for real-time updates
    const baseURL = import.meta.env.VITE_API_URL || '/api';
    const eventSource = new EventSource(`${baseURL}/files-stream`);
    let lastReceivedDataStr = null;

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.error) {
          console.error('Files stream error:', data.error);
          return;
        }

        const { files } = data;
        const currentFiles = get().files;

        // Only update if files actually changed (deep comparison)
        const newDataStr = JSON.stringify(files);
        if (newDataStr !== lastReceivedDataStr) {
          lastReceivedDataStr = newDataStr;
          set({ files, error: null });
        }
      } catch (err) {
        console.error('Failed to parse files stream data:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('Files stream connection error:', err);
      eventSource.close();

      // Attempt to reconnect after 5 seconds
      setTimeout(() => {
        get().initializeFilesStream();
      }, 5000);
    };

    // Store reference to close on cleanup
    set({ _filesEventSource: eventSource });
  },

  // Cleanup SSE stream
  closeFilesStream: () => {
    const state = get();
    if (state._filesEventSource) {
      state._filesEventSource.close();
      set({ _filesEventSource: null });
    }
  },

  // ── Fetch all files (fallback, mainly used on initial load) ──────────────
  fetchFiles: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await listFilesAPI();
      set({ files: res.data.files, isLoading: false });
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },

  // ── Upload a file ────────────────────────────────────────────────────────
  uploadFile: async (file) => {
    const queueId = `${Date.now()}_${file.name}`;

    // Add to upload queue
    set((state) => ({
      uploadQueue: [
        ...state.uploadQueue,
        { id: queueId, name: file.name, status: 'uploading', progress: 0, error: null },
      ],
    }));

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await uploadFileAPI(formData, (progressEvent) => {
        const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        set((state) => ({
          uploadQueue: state.uploadQueue.map((q) =>
            q.id === queueId ? { ...q, progress: pct } : q
          ),
        }));
      });

      // Mark as done in queue
      set((state) => ({
        uploadQueue: state.uploadQueue.map((q) =>
          q.id === queueId ? { ...q, status: 'done', progress: 100 } : q
        ),
        files: [res.data.file, ...state.files],
      }));

      return res.data.file;
    } catch (err) {
      set((state) => ({
        uploadQueue: state.uploadQueue.map((q) =>
          q.id === queueId ? { ...q, status: 'error', error: err.message } : q
        ),
      }));
      throw err;
    }
  },

  // ── Delete a file ────────────────────────────────────────────────────────
  deleteFile: async (fileId) => {
    await deleteFileAPI(fileId);
    set((state) => ({
      files: state.files.filter((f) => f.fileId !== fileId),
    }));
  },

  // ── Toggle share ─────────────────────────────────────────────────────────
  toggleShare: async (fileId) => {
    const res = await toggleShareAPI(fileId);
    set((state) => ({
      files: state.files.map((f) =>
        f.fileId === fileId
          ? { ...f, isPublic: res.data.isPublic, shareToken: res.data.shareToken }
          : f
      ),
    }));
    return res.data;
  },

  // ── Download a file ──────────────────────────────────────────────────────
  downloadFile: async (fileId, fileName) => {
    const res = await downloadFileAPI(fileId);
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  // ── Clear completed uploads from queue ───────────────────────────────────
  clearCompletedUploads: () => {
    set((state) => ({
      uploadQueue: state.uploadQueue.filter((q) => q.status === 'uploading'),
    }));
  },

  // ── Fetch trash items ────────────────────────────────────────────────────
  fetchTrash: async () => {
    try {
      const res = await listTrashAPI();
      set({ trashItems: res.data.files });
    } catch (err) {
      console.error('Failed to fetch trash:', err.message);
    }
  },

  // ── Restore a file from trash ────────────────────────────────────────────
  restoreFile: async (fileId) => {
    try {
      const res = await restoreFileAPI(fileId);
      // Remove from trashItems
      set((state) => ({
        trashItems: state.trashItems.filter((f) => f.fileId !== fileId),
        files: [res.data.file, ...state.files], // Also optionally add back to files directly
      }));
    } catch (err) {
      console.error('Failed to restore file:', err.message);
      throw err;
    }
  },

  // ── Hard delete a file ───────────────────────────────────────────────────
  hardDeleteFile: async (fileId) => {
    try {
      await hardDeleteFileAPI(fileId);
      set((state) => ({
        trashItems: state.trashItems.filter((f) => f.fileId !== fileId),
      }));
    } catch (err) {
      console.error('Failed to hard delete file:', err.message);
      throw err;
    }
  },
}));