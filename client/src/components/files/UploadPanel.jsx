import { useCallback, useState } from 'react';
import { Upload, X, CheckCircle, AlertCircle, Loader2, FileText, ImageIcon, Music, Video, File } from 'lucide-react';
import { useFileStore } from '../../store/fileStore';
import toast from 'react-hot-toast';

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

const getFileIcon = (fileName) => {
  const ext = fileName.split('.').pop().toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) return ImageIcon;
  if (['mp4', 'mkv', 'mov', 'avi'].includes(ext)) return Video;
  if (['mp3', 'wav', 'ogg'].includes(ext)) return Music;
  if (['pdf', 'doc', 'docx', 'txt', 'csv'].includes(ext)) return FileText;
  return File;
};

export default function UploadPanel() {
  const [dragging, setDragging] = useState(false);
  const { uploadFile, uploadQueue, clearCompletedUploads } = useFileStore();

  const handleFiles = useCallback(async (files) => {
    const fileArray = Array.from(files);
    for (const file of fileArray) {
      try {
        await uploadFile(file);
        toast.success(`"${file.name}" uploaded & replicated`);
      } catch (err) {
        toast.error(`Failed: ${file.name} — ${err.message}`);
      }
    }
  }, [uploadFile]);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const onDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);

  const statusIcon = (status) => {
    if (status === 'uploading') return <Loader2 size={14} className="animate-spin text-primary-500" />;
    if (status === 'done') return <CheckCircle size={14} className="text-green-500" />;
    if (status === 'error') return <AlertCircle size={14} className="text-red-500" />;
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`relative border-2 border-dashed rounded-xl p-10 text-center transition-colors ${dragging
            ? 'border-primary-400 bg-primary-50'
            : 'border-gray-200 bg-white hover:border-primary-300 hover:bg-gray-50'
          }`}
      >
        <input
          type="file"
          multiple
          className="absolute inset-0 opacity-0 cursor-pointer"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className="flex flex-col items-center gap-3">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center ${dragging ? 'bg-primary-100' : 'bg-gray-100'
            }`}>
            <Upload size={24} className={dragging ? 'text-primary-600' : 'text-gray-400'} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">
              {dragging ? 'Drop files here' : 'Drag & drop files, or click to browse'}
            </p>
            <p className="text-xs text-gray-400 mt-1">Any file type · Max 50 MB</p>
          </div>
          <span className="text-xs bg-primary-600 text-white px-4 py-1.5 rounded-full font-medium">
            Browse Files
          </span>
        </div>
      </div>

      {/* Upload Queue */}
      {uploadQueue.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden mt-6 shadow-sm">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50 bg-gray-50/50">
            <span className="text-sm font-semibold text-gray-700">Upload Queue ({uploadQueue.length})</span>
            <button
              onClick={clearCompletedUploads}
              className="text-xs text-primary-600 hover:text-primary-700 font-medium transition-colors flex items-center gap-1"
            >
              <X size={12} />
              Clear completed
            </button>
          </div>
          <ul className="divide-y divide-gray-50">
            {uploadQueue.map((item) => {
              const Icon = getFileIcon(item.name);
              return (
                <li key={item.id} className="px-4 py-3.5 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        item.status === 'done' ? 'bg-green-50 text-green-600' : 
                        item.status === 'error' ? 'bg-red-50 text-red-600' : 
                        'bg-primary-50 text-primary-600'
                      }`}>
                        {item.status === 'uploading' ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Icon size={14} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-700 truncate max-w-xs">{item.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                            {item.status === 'done' ? 'Stored & Replicated' : 
                             item.status === 'error' ? 'Upload Failed' : 'Syncing...'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right ml-4 shrink-0">
                      <span className="text-xs font-semibold text-gray-600">{item.progress}%</span>
                    </div>
                  </div>
                  
                  {/* Progress bar container */}
                  <div className="relative pt-1">
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ease-out shadow-sm ${
                          item.status === 'error' ? 'bg-red-500' : 
                          item.status === 'done' ? 'bg-green-500' : 
                          'bg-primary-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]'
                        }`}
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  </div>
                  
                  {item.error && (
                    <p className="text-[11px] text-red-500 mt-2 font-medium bg-red-50 p-1.5 rounded border border-red-100 italic">
                      Error: {item.error}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}