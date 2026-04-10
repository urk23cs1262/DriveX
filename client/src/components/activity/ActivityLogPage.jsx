import { useEffect } from 'react';
import { useActivityStore } from '../../store/activityStore';
import {
  FileUp, FileMinus, ServerCrash, Server, ShieldCheck,
  Clock, Activity, AlertTriangle, ArrowRightLeft, Radio
} from 'lucide-react';
import { SkeletonRow } from '../ui/Skeleton';
import EmptyState from '../ui/EmptyState';

function formatTimeAgo(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.round((now - date) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatDateFull(dateStr) {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', second: '2-digit'
  });
}

function getActivityIcon(type, action) {
  if (type === 'FILE') {
    if (action === 'UPLOADED') return { icon: FileUp, color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-100' };
    if (action === 'DELETED') return { icon: FileMinus, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-100' };
    if (action === 'REPLICATED') return { icon: ArrowRightLeft, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100' };
  }
  if (type === 'NODE') {
    if (action === 'ONLINE') return { icon: Server, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100' };
    if (action === 'OFFLINE') return { icon: ServerCrash, color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-100' };
  }
  return { icon: ShieldCheck, color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-100' };
}

export default function ActivityLogPage() {
  const { activities, isLoading, fetchActivities } = useActivityStore();

  useEffect(() => {
    fetchActivities(100);
    // Simple polling every 10 seconds to keep log fresh
    const interval = setInterval(() => fetchActivities(100), 10000);
    return () => clearInterval(interval);
  }, [fetchActivities]);

  if (isLoading && (!activities || activities.length === 0)) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mt-6 p-4">
        {[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl mt-6">
        <EmptyState
          icon={Activity}
          title="No activity recorded"
          description="System events and file operations will appear here."
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Radio size={24} className="text-primary-600" />
            Activity Log
          </h1>
          <p className="text-sm text-gray-500 mt-1">Real-time chronicle of cluster events and file operations.</p>
        </div>
        <div className="text-xs text-gray-400 bg-white border border-gray-200 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          Live Monitoring
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <ul className="divide-y divide-gray-100">
          {activities.map((activity, index) => {
            const { icon: Icon, color, bg, border } = getActivityIcon(activity.type, activity.action);

            return (
              <li key={activity._id || index} className="p-4 hover:bg-gray-50 transition-colors duration-150">
                <div className="flex items-start gap-4">

                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${bg} ${border}`}>
                    <Icon size={18} className={color} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-center justify-between gap-4 mb-1">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.message}
                      </p>
                      <time
                        className="text-xs text-gray-400 whitespace-nowrap flex items-center gap-1"
                        title={formatDateFull(activity.createdAt)}
                      >
                        <Clock size={12} />
                        {formatTimeAgo(activity.createdAt)}
                      </time>
                    </div>

                    {/* Meta tags */}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                        {activity.type}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                        {activity.action}
                      </span>

                      {activity.details?.nodeId && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                          Node: {activity.details.nodeId}
                        </span>
                      )}
                      {activity.details?.originalName && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-50 text-orange-700 border border-orange-100 truncate max-w-[200px]">
                          {activity.details.originalName}
                        </span>
                      )}
                      {activity.details?.replicationStatus && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                          Status: {activity.details.replicationStatus}
                        </span>
                      )}
                    </div>

                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="bg-gray-50 border-t border-gray-100 p-3 text-center">
          <p className="text-xs text-gray-500">Showing latest {activities.length} events</p>
        </div>
      </div>
    </div>
  );
}
