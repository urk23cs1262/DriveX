import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

// Response interceptor — normalize errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error ||
      error.message ||
      'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

// ── File APIs ──────────────────────────────────────────────────────────────

export const uploadFileAPI = (formData, onUploadProgress) =>
  apiClient.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  });

export const listFilesAPI = () =>
  apiClient.get('/files');

export const downloadFileAPI = (fileId) =>
  apiClient.get(`/file/${fileId}`, { responseType: 'blob' });

export const deleteFileAPI = (fileId) =>
  apiClient.delete(`/file/${fileId}`);

export const toggleShareAPI = (fileId) =>
  apiClient.patch(`/file/${fileId}/share`);

export const listTrashAPI = () =>
  apiClient.get('/trash');

export const restoreFileAPI = (fileId) =>
  apiClient.patch(`/file/${fileId}/restore`);

export const hardDeleteFileAPI = (fileId) =>
  apiClient.delete(`/file/${fileId}/hard`);

// ── Node APIs ──────────────────────────────────────────────────────────────

export const getClusterHealthAPI = () =>
  apiClient.get('/health');

export const toggleNodeAPI = (nodeId) =>
  apiClient.patch(`/node/${nodeId}/toggle`);

// ── Activity APIs ───────────────────────────────────────────────────────────

export const getActivityLogAPI = (limit = 100) =>
  apiClient.get(`/activity?limit=${limit}`);

export default apiClient;