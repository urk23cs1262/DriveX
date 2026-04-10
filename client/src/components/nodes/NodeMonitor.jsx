import { useEffect } from 'react';
import { Server, Power, Wifi, WifiOff, HardDrive, Activity, ShieldCheck, Database } from 'lucide-react';
import { useNodeStore } from '../../store/nodeStore';
import StatCard from '../ui/StatCard';
import toast from 'react-hot-toast';

function NodeCard({ node, onToggle }) {
  const online = node.status === 'online';
  return (
    <div className={`bg-white border-2 rounded-2xl p-6 transition-all duration-300 group hover:shadow-lg ${
      online ? 'border-gray-100' : 'border-red-100 bg-red-50/20'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${
            online ? 'bg-primary-50 text-primary-600 shadow-sm' : 'bg-red-50 text-red-500 shadow-sm'
          }`}>
            <Server size={22} />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 font-mono tracking-wider uppercase">{node.id}</p>
            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[140px]" title={node.path}>{node.path?.split('/').pop() || node.id}</p>
          </div>
        </div>

        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-tight ${
          online ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700 shadow-inner'
        }`}>
          <span className={`w-2 h-2 rounded-full ${online ? 'bg-green-500 animate-pulse' : 'bg-red-400'}`} />
          {online ? 'Active' : 'Offline'}
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-100/50">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Stored</p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-gray-800">{node.fileCount || 0}</span>
            <span className="text-[10px] text-gray-400 font-medium">Files</span>
          </div>
        </div>
        <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-100/50 flex flex-col items-center justify-center">
          {online ? (
            <>
              <Wifi size={20} className="text-green-500 mb-1" />
              <p className="text-[10px] font-bold text-green-600 uppercase">Synchronized</p>
            </>
          ) : (
            <>
              <WifiOff size={20} className="text-red-400 mb-1" />
              <p className="text-[10px] font-bold text-red-400 uppercase">Disconnected</p>
            </>
          )}
        </div>
      </div>

      {/* Failure Simulation Action */}
      <button
        onClick={() => onToggle(node.id)}
        className={`w-full flex items-center justify-center gap-2.5 py-3 rounded-xl text-xs font-bold transition-all ${
          online
            ? 'bg-white border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300'
            : 'bg-green-600 text-white hover:bg-green-700 shadow-md shadow-green-200'
        }`}
      >
        <Power size={14} />
        {online ? 'Simulate Node Failure' : 'Initialize Re-sync'}
      </button>
    </div>
  );
}

export default function NodeMonitor() {
  const { nodes, clusterStatus, onlineNodes, totalNodes, initializeHealthStream, closeHealthStream, toggleNode } = useNodeStore();

  useEffect(() => {
    initializeHealthStream();
    return () => closeHealthStream();
  }, [initializeHealthStream, closeHealthStream]);

  const handleToggle = async (nodeId) => {
    try {
      await toggleNode(nodeId);
      toast.success(`Node ${nodeId} state updated`, {
        style: { borderRadius: '12px', background: '#333', color: '#fff' }
      });
    } catch {
      toast.error('Protocol violation: Failed to toggle node');
    }
  };

  const totalFiles = nodes.reduce((acc, n) => acc + (n.fileCount || 0), 0);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Page Title & Cluster Health Summary */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">System Monitor</h1>
          <p className="text-gray-500 mt-2 font-medium">Real-time visualization of the distributed storage fabric.</p>
        </div>
        <div className={`flex items-center gap-4 px-6 py-4 rounded-2xl border-2 shadow-sm ${
          clusterStatus === 'healthy' ? 'bg-green-50/50 border-green-100' : 'bg-red-50/50 border-red-100 animate-pulse'
        }`}>
          <div className="flex flex-col items-center">
             <div className="relative">
                <ShieldCheck size={32} className={clusterStatus === 'healthy' ? 'text-green-600' : 'text-red-500'} />
                {clusterStatus === 'healthy' && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                )}
             </div>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-0.5">Cluster Health</p>
            <p className={`text-xl font-black uppercase tracking-tighter ${
              clusterStatus === 'healthy' ? 'text-green-700' : 'text-red-700'
            }`}>
              {clusterStatus}
            </p>
          </div>
        </div>
      </div>

      {/* Advanced Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={Activity} 
          label="Network Load" 
          value={`${((onlineNodes / totalNodes) * 100 || 0).toFixed(0)}%`} 
          sub="availability rate" 
          color="indigo" 
        />
        <StatCard 
          icon={Server} 
          label="Operational" 
          value={`${onlineNodes}/${totalNodes}`} 
          sub="nodes online" 
          color="blue" 
        />
        <StatCard 
          icon={Database} 
          label="Total Replicas" 
          value={totalFiles} 
          sub="across all storage" 
          color="green" 
        />
        <StatCard 
          icon={HardDrive} 
          label="System Mode" 
          value="Redundant" 
          sub="RAID-z equivalent" 
          color="yellow" 
        />
      </div>

      {/* Nodes Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
           <Activity size={18} className="text-primary-500" />
           Active Instances
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {nodes.length > 0 ? (
            nodes.map((node) => (
              <NodeCard key={node.id} node={node} onToggle={handleToggle} />
            ))
          ) : (
             <div className="col-span-full py-20 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                <Server size={40} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 font-medium">No nodes detected in the cluster.</p>
             </div>
          )}
        </div>
      </div>

      {/* Network Protocol Legend */}
      <div className="bg-white border-2 border-primary-50 rounded-3xl p-8 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-50 rounded-full -mr-32 -mt-32 opacity-50 group-hover:scale-110 transition-transform duration-700" />
        <div className="relative z-10">
          <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
            <ShieldCheck className="text-primary-600" />
            Distributed Storage Protocol (DSP-2)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <div className="w-10 h-10 bg-primary-600 text-white rounded-xl flex items-center justify-center font-black text-lg shadow-lg shadow-primary-200">1</div>
              <h4 className="font-bold text-gray-800 text-sm">Adaptive Load Balancing</h4>
              <p className="text-xs leading-relaxed text-gray-500 font-medium">Incoming uploads are automatically routed to nodes with the highest available I/O and lowest disk latency.</p>
            </div>
            <div className="space-y-3">
              <div className="w-10 h-10 bg-primary-600 text-white rounded-xl flex items-center justify-center font-black text-lg shadow-lg shadow-primary-200">2</div>
              <h4 className="font-bold text-gray-800 text-sm">Triple-Path Replication</h4>
              <p className="text-xs leading-relaxed text-gray-500 font-medium">Each asset is split into chunks and replicated across a minimum of three distinct physical instances for binary parity.</p>
            </div>
            <div className="space-y-3">
              <div className="w-10 h-10 bg-primary-600 text-white rounded-xl flex items-center justify-center font-black text-lg shadow-lg shadow-primary-200">3</div>
              <h4 className="font-bold text-gray-800 text-sm">Self-Healing Fabric</h4>
              <p className="text-xs leading-relaxed text-gray-500 font-medium">If a node goes offline, the monitor instantly marks affected files for re-replication from surviving healthy nodes.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}