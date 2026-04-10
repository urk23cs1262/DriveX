import React, { useEffect } from 'react';
import { useFileStore } from '../../store/fileStore';
import { useNodeStore } from '../../store/nodeStore';
import StorageUsageChart from './StorageUsageChart';
import FileTypeChart from './FileTypeChart';
import ActivityTimelineChart from './ActivityTimelineChart';
import TopFilesList from './TopFilesList';
import { Info } from 'lucide-react';

const Analytics = () => {
  const { files, fetchFiles, initializeFilesStream, closeFilesStream } = useFileStore();
  const { nodes, fetchHealth, initializeHealthStream, closeHealthStream } = useNodeStore();

  useEffect(() => {
    // Initial fetch
    fetchFiles();
    fetchHealth();

    // Subscribe to real-time updates
    initializeFilesStream();
    initializeHealthStream();

    return () => {
      closeFilesStream();
      closeHealthStream();
    };
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* Header Info Banner */}
      <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-primary-600 shadow-sm shrink-0">
          <Info size={18} />
        </div>
        <div>
          <h2 className="text-sm font-bold text-primary-900">Cluster Insights</h2>
          <p className="text-xs text-primary-700 opacity-80">
            Real-time analytics for your distributed storage cluster across {nodes.length} nodes.
          </p>
        </div>
      </div>

      {/* Grid: Storage Distribution + File Types */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StorageUsageChart data={nodes} />
        <FileTypeChart files={files} />
      </div>

      {/* Grid: Global Activity Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ActivityTimelineChart />
        <TopFilesList files={files} />
      </div>

    </div>
  );
};

export default React.memo(Analytics);
