import { useCallback } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/layout/Sidebar';
import Navbar from './components/layout/Navbar';
import Dashboard from './components/dashboard/Dashboard';
import FileTable from './components/files/FileTable';
import UploadPage from './components/files/UploadPage';
import NodeMonitor from './components/nodes/NodeMonitor';
import Analytics from './components/analytics/Analytics';
import ActivityLogPage from './components/activity/ActivityLogPage';
import TrashPage from './components/files/TrashPage';
import ErrorBoundary from './components/ui/ErrorBoundary';
import { useFileStore } from './store/fileStore';
import { useNodeStore } from './store/nodeStore';

export default function App() {
  const location = useLocation();
  // Use selectors to only subscribe to these specific functions, not the entire store
  const fetchFiles = useFileStore((state) => state.fetchFiles);
  const fetchHealth = useNodeStore((state) => state.fetchHealth);

  const handleRefresh = useCallback(async () => {
    await Promise.all([fetchFiles(), fetchHealth()]);
  }, [fetchFiles, fetchHealth]);
  console.log("DriveX")

  // Get current page from URL
  const getPageFromPath = (path) => {
    if (path === '/') return 'dashboard';
    return path.slice(1); // Remove leading /
  };

  const activePage = getPageFromPath(location.pathname);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { fontFamily: 'Inter, sans-serif', fontSize: '14px' },
        }}
      />
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar activePage={activePage} onRefresh={handleRefresh} />
        <main className="flex-1 overflow-y-auto p-6">
          <ErrorBoundary key={activePage}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/files" element={<FileTable />} />
              <Route path="/upload" element={<UploadPage />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/nodes" element={<NodeMonitor />} />
              <Route path="/activity" element={<ActivityLogPage />} />
              <Route path="/trash" element={<TrashPage />} />
            </Routes>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}