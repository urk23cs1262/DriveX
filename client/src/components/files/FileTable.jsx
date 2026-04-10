import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Download, Trash2, Share2, CheckCircle, AlertTriangle,
    Clock, FileText, Copy, Check, ChevronUp, ChevronDown, Files
} from 'lucide-react';
import { useFileStore } from '../../store/fileStore';
import Modal from '../ui/Modal';
import Badge from '../ui/Badge';
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

function ReplicationStatus({ status, replicas }) {
    const storedCount = replicas?.filter((r) => r.status === 'stored').length || 0;
    const config = {
        complete: { variant: 'green', label: `Replicated (${storedCount})` },
        partial: { variant: 'yellow', label: `Partial (${storedCount})` },
        failed: { variant: 'red', label: 'Failed' },
        pending: { variant: 'gray', label: 'Pending' },
    };
    const c = config[status] || config.pending;
    return <Badge label={c.label} variant={c.variant} />;
}

export default function FileTable() {
    const navigate = useNavigate();
    const { files, isLoading, deleteFile, toggleShare, downloadFile } = useFileStore();
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [shareTarget, setShareTarget] = useState(null);
    const [copiedToken, setCopiedToken] = useState(false);
    const [sortKey, setSortKey] = useState('createdAt');
    const [sortDir, setSortDir] = useState('desc');

    const handleSort = (key) => {
        if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortKey(key); setSortDir('asc'); }
    };

    const sorted = [...files].sort((a, b) => {
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

    const handleDelete = async () => {
        try {
            await deleteFile(deleteTarget.fileId);
            toast.success('File deleted from all nodes');
        } catch { toast.error('Delete failed'); }
        finally { setDeleteTarget(null); }
    };

    const handleShare = async (file) => {
        try {
            const res = await toggleShare(file.fileId);
            setShareTarget({ ...file, ...res });
        } catch { toast.error('Share toggle failed'); }
    };

    const copyLink = (token) => {
        navigator.clipboard.writeText(`http://localhost:5000/api/shared/${token}`);
        setCopiedToken(true);
        setTimeout(() => setCopiedToken(false), 2000);
    };

    const handleDownload = async (file) => {
        try {
            await downloadFile(file.fileId, file.originalName);
            toast.success('Download started');
        } catch { toast.error('Download failed'); }
    };

    const thClass = 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide cursor-pointer select-none hover:text-gray-700';

    if (isLoading && files.length === 0) {
        return (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full">
                    <tbody className="divide-y divide-gray-50">
                        {[...Array(4)].map((_, i) => <SkeletonRow key={i} />)}
                    </tbody>
                </table>
            </div>
        );
    }

    if (!isLoading && files.length === 0) {
        return (
            <div className="bg-white border border-gray-200 rounded-xl">
                <EmptyState
                    icon={Files}
                    title="No files uploaded yet"
                    description="Upload a file to see it replicated across nodes"
                    action="Upload your first file"
                    onAction={() => navigate('/upload')}
                />
            </div>
        );
    }

    return (
        <>
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
                                <th className={thClass}>Replication</th>
                                <th className={thClass}>Nodes</th>
                                <th className={thClass} onClick={() => handleSort('createdAt')}>
                                    <div className="flex items-center gap-1">Uploaded <SortIcon col="createdAt" /></div>
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
                                            <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center shrink-0">
                                                <FileText size={14} className="text-primary-500" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-gray-800 truncate max-w-xs">
                                                    {file.originalName}
                                                </p>
                                                <p className="text-xs text-gray-400">{file.mimeType || 'unknown'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    {/* Size */}
                                    <td className="px-4 py-3 text-sm text-gray-500">{formatBytes(file.size)}</td>
                                    {/* Replication */}
                                    <td className="px-4 py-3">
                                        <ReplicationStatus status={file.replicationStatus} replicas={file.replicas} />
                                    </td>
                                    {/* Nodes */}
                                    <td className="px-4 py-3">
                                        <div className="flex gap-1 flex-wrap">
                                            {file.replicas?.map((r) => (
                                                <span
                                                    key={r.nodeId}
                                                    className={`text-xs px-1.5 py-0.5 rounded font-mono ${r.status === 'stored'
                                                        ? 'bg-green-50 text-green-700'
                                                        : 'bg-red-50 text-red-600'
                                                        }`}
                                                >
                                                    {r.nodeId}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    {/* Date */}
                                    <td className="px-4 py-3 text-sm text-gray-500">{formatDate(file.createdAt)}</td>
                                    {/* Actions */}
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                onClick={() => handleDownload(file)}
                                                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                                                title="Download"
                                            >
                                                <Download size={15} />
                                            </button>
                                            <button
                                                onClick={() => handleShare(file)}
                                                className={`p-1.5 rounded-lg transition-colors ${file.isPublic
                                                    ? 'text-primary-500 bg-primary-50 hover:bg-primary-100'
                                                    : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                                                    }`}
                                                title="Share"
                                            >
                                                <Share2 size={15} />
                                            </button>
                                            <button
                                                onClick={() => setDeleteTarget(file)}
                                                className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                                                title="Delete"
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
                <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
                    <p className="text-xs text-gray-400">{files.length} file{files.length !== 1 ? 's' : ''}</p>
                </div>
            </div>

            {/* Delete Modal */}
            <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete File">
                <p className="text-sm text-gray-600 mb-1">
                    Are you sure you want to delete <span className="font-medium text-gray-800">"{deleteTarget?.originalName}"</span>?
                </p>
                <p className="text-xs text-gray-400 mb-5">This will remove the file from all storage nodes.</p>
                <div className="flex justify-end gap-2">
                    <button
                        onClick={() => setDeleteTarget(null)}
                        className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleDelete}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                    >
                        Delete
                    </button>
                </div>
            </Modal>

            {/* Share Modal */}
            <Modal isOpen={!!shareTarget} onClose={() => setShareTarget(null)} title="Share File">
                {shareTarget?.isPublic ? (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <CheckCircle size={15} className="text-green-500 shrink-0" />
                            <p className="text-sm text-green-700">File is now publicly accessible</p>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-500 block mb-1.5">Share link</label>
                            <div className="flex gap-2">
                                <input
                                    readOnly
                                    value={`http://localhost:5000/api/shared/${shareTarget?.shareToken}`}
                                    className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 font-mono text-gray-600"
                                />
                                <button
                                    onClick={() => copyLink(shareTarget?.shareToken)}
                                    className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                                >
                                    {copiedToken ? <Check size={15} /> : <Copy size={15} />}
                                </button>
                            </div>
                        </div>
                        <button
                            onClick={() => handleShare(shareTarget)}
                            className="w-full py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                        >
                            Make Private
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600">This file is private. Make it public to share.</p>
                        <button
                            onClick={() => handleShare(shareTarget)}
                            className="w-full py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
                        >
                            Generate Share Link
                        </button>
                    </div>
                )}
            </Modal>
        </>
    );
}