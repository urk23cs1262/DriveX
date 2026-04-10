import { HardDrive, Share2, Shield, Layout } from 'lucide-react';
import { useFileStore } from '../../store/fileStore';
import { useNodeStore } from '../../store/nodeStore';
import StatCard from '../ui/StatCard';
import UploadPanel from './UploadPanel';

export default function UploadPage() {
  const { files } = useFileStore();
  const { onlineNodes, totalNodes } = useNodeStore();

  const totalSize = files.reduce((acc, f) => acc + (f.size || 0), 0);
  const formatBytes = (b) => {
    if (!b) return '0 B';
    const k = 1024, s = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(b) / Math.log(k));
    return `${(b / Math.pow(k, i)).toFixed(1)} ${s[i]}`;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Upload Center</h1>
          <p className="text-gray-500 mt-1">Add new assets to your distributed storage cluster.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400 bg-gray-100 px-3 py-1.5 rounded-lg w-fit">
          <Shield size={14} className="text-primary-500" />
          End-to-End Encrypted
        </div>
      </div>

      {/* Stats Quick Look */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={HardDrive} 
          label="Current Usage" 
          value={formatBytes(totalSize)} 
          sub="of 10 GB limit" 
          color="indigo" 
        />
        <StatCard 
          icon={Layout} 
          label="Active Nodes" 
          value={`${onlineNodes}/${totalNodes}`} 
          sub="replication targets" 
          color="blue" 
        />
        <StatCard 
          icon={Share2} 
          label="Public Links" 
          value={files.filter(f => f.isPublic).length} 
          sub="accessible assets" 
          color="green" 
        />
        <StatCard 
          icon={Shield} 
          label="Security Level" 
          value="High" 
          sub="distributed & redundent" 
          color="yellow" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Upload Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Add Files</h2>
            <UploadPanel />
          </div>
        </div>

        {/* Sidebar Context */}
        <div className="space-y-6">
          <div className="bg-primary-600 rounded-2xl p-6 text-white shadow-lg overflow-hidden relative">
            <div className="relative z-10">
              <h3 className="font-bold text-lg mb-2">Pro Tip</h3>
              <p className="text-primary-100 text-sm leading-relaxed">
                Every file you upload is automatically split and replicated across at least 3 nodes to ensure 99.99% availability.
              </p>
            </div>
            <div className="absolute -right-6 -bottom-6 opacity-20 transform rotate-12">
              <Shield size={120} />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-3">Upload Guidelines</h3>
            <ul className="space-y-3 text-sm text-gray-500">
              <li className="flex gap-2">
                <span className="text-primary-500 font-bold">•</span>
                Max file size: 50MB per file
              </li>
              <li className="flex gap-2">
                <span className="text-primary-500 font-bold">•</span>
                Supported types: Images, Docs, Video
              </li>
              <li className="flex gap-2">
                <span className="text-primary-500 font-bold">•</span>
                Files are replicated instantly
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
