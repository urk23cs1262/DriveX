import { useEffect, useState } from 'react';
import { useFileStore } from '../../store/fileStore';

const NODE_COLORS = {
  node1: { bg: '#eef2ff', border: '#a5b4fc', text: '#4338ca', dot: '#6366f1' },
  node2: { bg: '#f0fdf4', border: '#86efac', text: '#15803d', dot: '#22c55e' },
  node3: { bg: '#fffbeb', border: '#fcd34d', text: '#b45309', dot: '#f59e0b' },
};

function ReplicaNode({ nodeId, status, animate, delay }) {
  const c = NODE_COLORS[nodeId] || NODE_COLORS.node1;
  const stored = status === 'stored';
  // console.log(status);
  return (
    <div
      className="flex flex-col items-center gap-1.5 transition-all duration-500"
      style={{ opacity: animate ? 1 : 0.35, transitionDelay: `${delay}ms` }}
    >
      {/* Node box */}
      <div
        className="w-16 h-16 rounded-xl flex flex-col items-center justify-center border-2 transition-all duration-700"
        style={{
          backgroundColor: animate && stored ? c.bg : '#f9fafb',
          borderColor: animate && stored ? c.border : '#e5e7eb',
        }}
      >
        <div
          className="w-3 h-3 rounded-full mb-1 transition-all duration-500"
          style={{ backgroundColor: animate && stored ? c.dot : '#d1d5db' }}
        />
        <span
          className="text-xs font-mono font-bold transition-colors duration-500"
          style={{ color: animate && stored ? c.text : '#9ca3af' }}
        >
          {nodeId}
        </span>
      </div>
      {/* Status label */}
      <span
        className={`text-xs font-medium transition-all duration-500 ${animate && stored ? 'opacity-100' : 'opacity-0'
          }`}
        style={{ color: c.text }}
      >
        {stored ? '✓ stored' : 'failed'}
      </span>
    </div>
  );
}

// Animated arrow/flow line between nodes
function FlowLine({ active, delay }) {
  return (
    <div className="flex flex-col items-center justify-center gap-0.5 mt-4">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-1 h-1 rounded-full bg-primary-400 transition-all duration-300"
          style={{
            opacity: active ? 1 : 0.15,
            transform: active ? 'scale(1)' : 'scale(0.5)',
            transitionDelay: active ? `${delay + i * 120}ms` : '0ms',
          }}
        />
      ))}
    </div>
  );
}

export default function ReplicationVisualizer() {
  const { files } = useFileStore();
  const [animating, setAnimating] = useState(false);
  const [displayFile, setDisplayFile] = useState(null);

  // Watch for newest file, trigger animation
  useEffect(() => {
    if (files.length === 0) return;
    const latest = files[0];
    if (!displayFile || latest.fileId !== displayFile.fileId) {
      setAnimating(false);
      setDisplayFile(latest);
      // Small delay so CSS transitions reset before re-animating
      const t = setTimeout(() => setAnimating(true), 100);
      return () => clearTimeout(t);
    }
  }, [files]);

  const replicas = displayFile?.replicas || [];

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-800">Replication Visualizer</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {displayFile ? `Latest: ${displayFile.originalName}` : 'Upload a file to see replication'}
          </p>
        </div>
        {displayFile && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${displayFile.replicationStatus === 'complete'
              ? 'bg-green-50 text-green-700 border-green-200'
              : displayFile.replicationStatus === 'partial'
                ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                : 'bg-gray-50 text-gray-500 border-gray-200'
            }`}>
            {displayFile.replicationStatus}
          </span>
        )}
      </div>

      {!displayFile ? (
        <div className="flex flex-col items-center justify-center h-40 gap-2">
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
            <span className="text-lg">📂</span>
          </div>
          <p className="text-xs text-gray-400">No files yet</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-0">
          {/* Source file */}
          <div
            className="flex items-center gap-2 px-4 py-2.5 bg-primary-50 border border-primary-200 rounded-xl transition-all duration-500"
            style={{ opacity: animating ? 1 : 0.4 }}
          >
            <div className="w-6 h-6 bg-primary-600 rounded-md flex items-center justify-center">
              <span className="text-white text-xs">F</span>
            </div>
            <div>
              <p className="text-xs font-semibold text-primary-800 max-w-[140px] truncate">
                {displayFile.originalName}
              </p>
              <p className="text-xs text-primary-500">
                {displayFile.size ? `${(displayFile.size / 1024).toFixed(1)} KB` : ''}
              </p>
            </div>
          </div>

          {/* Flow lines going down */}
          <div className="flex gap-6 mt-1">
            {replicas.map((r, i) => (
              <FlowLine key={r.nodeId} active={animating} delay={i * 150} />
            ))}
          </div>

          {/* Coordinator label */}
          <div
            className="text-xs text-gray-400 mb-1 transition-opacity duration-500"
            style={{ opacity: animating ? 1 : 0 }}
          >
            coordinator → parallel write
          </div>

          {/* Replica nodes */}
          <div className="flex gap-4 mt-1">
            {replicas.map((r, i) => (
              <ReplicaNode
                key={r.nodeId}
                nodeId={r.nodeId}
                status={r.status}
                animate={animating}
                delay={300 + i * 200}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}