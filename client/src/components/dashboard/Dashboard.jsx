import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Files, HardDrive, CheckCircle, AlertTriangle, Upload } from 'lucide-react';
import { useFileStore } from '../../store/fileStore';
import { useNodeStore } from '../../store/nodeStore';
import NodeHealthChart from './NodeHealthChart';
import ReplicationVisualizer from './ReplicationVisualizer';
import StatCard from '../ui/StatCard';


export default function Dashboard() {
  const navigate = useNavigate();
  const { files, fetchFiles, initializeFilesStream, closeFilesStream } = useFileStore();
  const { nodes, onlineNodes, totalNodes, initializeHealthStream, closeHealthStream } = useNodeStore();

  // Initialize SSE streams on mount
  useEffect(() => {
    initializeHealthStream();
    initializeFilesStream();

    return () => {
      closeHealthStream();
      closeFilesStream();
    };
  }, [initializeHealthStream, initializeFilesStream, closeHealthStream, closeFilesStream]);

  const totalSize = files.reduce((acc, f) => acc + (f.size || 0), 0);
  const formatBytes = (b) => {
    if (!b) return '0 B';
    const k = 1024, s = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(b) / Math.log(k));
    return `${(b / Math.pow(k, i)).toFixed(1)} ${s[i]}`;
  };
  const replicatedCount = files.filter((f) => f.replicationStatus === 'complete').length;

  return (
    <div className="space-y-5">

      {/* ── Stat Cards ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Files} label="Total Files" value={files.length} sub="across all nodes" color="indigo" />
        <StatCard icon={HardDrive} label="Storage Used" value={formatBytes(totalSize)} sub="across all replicas" color="blue" />
        <StatCard icon={CheckCircle} label="Replicated" value={replicatedCount} sub={`of ${files.length} files`} color="green" />
        <StatCard icon={AlertTriangle} label="Nodes Online" value={`${onlineNodes}/${totalNodes}`} sub="storage cluster" color="yellow" />
      </div>

      {/* ── Charts Grid ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <NodeHealthChart />
        <ReplicationVisualizer />
      </div>

      {/* ── Bottom Grid: Recent Files + Node Status ───────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Recent Files — takes 2/3 */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-800">Recent Files</h2>
            <button
              onClick={() => navigate('/files')}
              className="text-xs text-primary-600 hover:text-primary-700 font-medium"
            >
              View all →
            </button>
          </div>
          {files.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-sm">No files yet</div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {files.slice(0, 5).map((file) => (
                <li key={file.fileId} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center shrink-0">
                      <Files size={13} className="text-primary-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-700 truncate max-w-xs">{file.originalName}</p>
                      <p className="text-xs text-gray-400">{formatBytes(file.size)}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0 ml-3">
                    {file.replicas?.map((r) => (
                      <span
                        key={r.nodeId}
                        className={`text-xs px-1.5 py-0.5 rounded font-mono ${r.status === 'stored' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-500'
                          }`}
                      >
                        {r.nodeId}
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Node Status — takes 1/3 */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-800">Node Status</h2>
            <button
              onClick={() => navigate('/nodes')}
              className="text-xs text-primary-600 hover:text-primary-700 font-medium"
            >
              Manage →
            </button>
          </div>
          <div className="p-4 space-y-2">
            {nodes.map((node) => (
              <div
                key={node.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${node.status === 'online'
                    ? 'bg-green-50 border-green-100'
                    : 'bg-red-50 border-red-100'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${node.status === 'online' ? 'bg-green-500 animate-pulse' : 'bg-red-400'
                      }`}
                  />
                  <span className="text-xs font-mono font-semibold text-gray-700 uppercase">{node.id}</span>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-gray-700">{node.fileCount || 0}</p>
                  <p className="text-xs text-gray-400">files</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── Quick Action ──────────────────────────────────────────────── */}
      <button
        onClick={() => navigate('/upload')}
        className="w-full flex items-center justify-center gap-2 py-3 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-xl transition-colors"
      >
        <Upload size={16} />
        Upload New File
      </button>

    </div>
  );
}