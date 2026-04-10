import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, CheckCircle, RotateCcw, AlertTriangle, FileText, ChevronUp, ChevronDown, Files } from 'lucide-react';
import { useFileStore } from '../../store/fileStore';
import Modal from '../ui/Modal';
import EmptyState from '../ui/EmptyState';
import { SkeletonRow } from '../ui/Skeleton';
import toast from 'react-hot-toast';

function formatBytes(bytes) {
  if (!bytes) return '—';
  const k = 1024, sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });
}

export default function TrashPage() {
  const navigate = useNavigate();
  const { trashItems, fetchTrash, restoreFile, hardDeleteFile } = useFileStore();
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [sortKey, setSortKey] = useState('deletedAt');
  const [sortDir, setSortDir] = useState('desc');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTrash = async () => {
      setIsLoading(true);
      await fetchTrash();
      setIsLoading(false);
    };
    loadTrash();
  }, [fetchTrash]);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const sorted = [...(trashItems || [])].sort((a, b) => {
    let av = a[sortKey], bv = b[sortKey];
    if (typeof av === 'string') av = av.toLowerCase();
    if (typeof bv === 'string') bv = bv.toLowerCase();
    if (av < bv) return sortDir === 'asc' ? -1 : 1;
    if (av > bv) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const SortIcon = ({ col }) => {
    if (sortKey !== col) return <ChevronUp size={12} className="text-gray-300" />;
    return sortDir === 'asc'
      ? <ChevronUp size={12} className="text-primary-500" />
      : <ChevronDown size={12} className="text-primary-500" />;
  };

  const handleHardDelete = async () => {
    try {
      await hardDeleteFile(deleteTarget.fileId);
      toast.success('File permanently deleted');
    } catch { 
      toast.error('Permanent delete failed'); 
    } finally { 
      setDeleteTarget(null); 
    }
  };

  const handleRestore = async (file) => {
    try {
      await restoreFile(file.fileId);
      toast.success('File restored successfully');
    } catch { 
      toast.error('Restore failed'); 
    }
  };

  const thClass = 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide cursor-pointer select-none hover:text-gray-700';

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mt-6">
        <table className="w-full">
          <tbody className="divide-y divide-gray-50">
            {[...Array(4)].map((_, i) => <SkeletonRow key={i} />)}
          </tbody>
        </table>
      </div>
    );
  }

  if (!isLoading && (!trashItems || trashItems.length === 0)) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl mt-6">
        <EmptyState
          icon={Files}
          title="Recycle bin is empty"
          description="Deleted files will appear here and are permanently deleted after 30 days."
        />
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 bg-yellow-50 text-yellow-800 text-sm p-3 rounded-lg flex items-start gap-2 border border-yellow-200">
        <AlertTriangle size={18} className="mt-0.5" />
        <p>Items in the recycle bin are automatically deleted forever after 30 days.</p>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className={thClass} onClick={() => handleSort('originalName')}>
                  <div className="flex items-center gap-1">Name <SortIcon col="originalName" /></div>
                </th>
                <th className={thClass} onClick={() => handleSort('size')}>
                  <div className="flex items-center gap-1">Size <SortIcon col="size" /></div>
                </th>
                <th className={thClass} onClick={() => handleSort('deletedAt')}>
                  <div className="flex items-center gap-1">Deleted On <SortIcon col="deletedAt" /></div>
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sorted.map((file) => (
                <tr key={file.fileId} className="hover:bg-gray-50 transition-colors">
                  {/* Name */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                        <FileText size={14} className="text-gray-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate max-w-xs">{file.originalName}</p>
                        <p className="text-xs text-gray-400">{file.mimeType || 'unknown'}</p>
                      </div>
                    </div>
                  </td>
                  {/* Size */}
                  <td className="px-4 py-3 text-sm text-gray-500">{formatBytes(file.size)}</td>
                  {/* Date Deleted */}
                  <td className="px-4 py-3 text-sm text-gray-500">{formatDate(file.deletedAt)}</td>
                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleRestore(file)}
                        className="p-1.5 rounded-lg text-gray-400 hover:bg-green-50 hover:text-green-600 transition-colors"
                        title="Restore"
                      >
                        <RotateCcw size={15} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(file)}
                        className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                        title="Delete Permanently"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
          <p className="text-xs text-gray-400">{trashItems?.length || 0} file{(trashItems?.length || 0) !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Delete Modal */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete File Permanently">
        <p className="text-sm text-gray-600 mb-1">
          Are you sure you want to permanently delete <span className="font-medium text-gray-800">"{deleteTarget?.originalName}"</span>?
        </p>
        <p className="text-xs text-red-500 mb-5 font-medium">This action cannot be undone.</p>
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setDeleteTarget(null)}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleHardDelete}
            className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
          >
            Delete Permanently
          </button>
        </div>
      </Modal>
    </>
  );
}
