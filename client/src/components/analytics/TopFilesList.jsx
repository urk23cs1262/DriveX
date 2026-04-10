import React, { useMemo } from 'react';
import { Files, ChevronRight } from 'lucide-react';

const TopFilesList = ({ files }) => {
  const topFiles = useMemo(() => {
    return [...files]
      .sort((a, b) => (b.size || 0) - (a.size || 0))
      .slice(0, 5);
  }, [files]);

  const formatBytes = (b) => {
    if (!b) return '0 B';
    const k = 1024, s = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(b) / Math.log(k));
    return `${(b / Math.pow(k, i)).toFixed(1)} ${s[i]}`;
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 h-[350px] flex flex-col shadow-sm">
      <h3 className="text-sm font-semibold text-gray-800 mb-6">Top 5 Largest Files</h3>
      {topFiles.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 text-xs">
          <Files size={24} className="mb-2 opacity-20" />
          No files data yet
        </div>
      ) : (
        <div className="space-y-4">
          {topFiles.map((file, idx) => (
            <div key={file.fileId} className="group flex items-center justify-between p-2.5 hover:bg-gray-50 rounded-lg transition-all border border-transparent hover:border-gray-100 cursor-default">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 
                   ${idx === 0 ? 'bg-amber-50 text-amber-600' : 'bg-primary-50 text-primary-600'}`}>
                  <Files size={13} />
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-semibold text-gray-700 truncate">{file.originalName}</p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">{formatBytes(file.size)}</p>
                </div>
              </div>
              <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default React.memo(TopFilesList);
