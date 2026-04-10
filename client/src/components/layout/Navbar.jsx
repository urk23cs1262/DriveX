import { useState, useRef, useEffect } from 'react';
import { Search, Bell, User, RefreshCw, FileText, Download } from 'lucide-react';
import { useFileStore } from '../../store/fileStore';

export default function Navbar({ activePage, onRefresh, isRefreshing }) {
  const titles = {
    dashboard: 'Dashboard',
    files: 'My Files',
    upload: 'Upload Files',
    analytics: 'Analytics',
    nodes: 'Node Monitor',
    activity: 'Activity Log',
    trash: 'Recycle Bin',
  };

  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const searchRef = useRef(null);

  const files = useFileStore((state) => state.files);
  const downloadFile = useFileStore((state) => state.downloadFile);

  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [searchRef]);

  const searchResults = query.trim() === '' 
    ? [] 
    : files.filter(f => f.originalName.toLowerCase().includes(query.toLowerCase())).slice(0, 6);

  const handleDownload = async (e, file) => {
    e.stopPropagation();
    try {
      await downloadFile(file.fileId, file.originalName);
      setIsFocused(false);
      setQuery('');
    } catch (err) {
      console.error(err);
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '—';
    const k = 1024, sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-10">
      {/* Left */}
      <div>
        <h1 className="text-lg font-semibold text-gray-900">{titles[activePage]}</h1>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative hidden md:block" ref={searchRef}>
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search files..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            className="pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          />
          
          {/* Dropdown */}
          {isFocused && query.trim() !== '' && (
            <div className="absolute top-12 left-0 w-[400px] bg-white border border-gray-200 rounded-xl shadow-lg shadow-gray-200/50 py-2 z-50 overflow-hidden">
              {searchResults.length > 0 ? (
                <ul>
                  <li className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-widest">Files</li>
                  {searchResults.map((file) => (
                    <li 
                      key={file.fileId} 
                      className="px-3 py-2 hover:bg-gray-50 transition-colors flex items-center justify-between group cursor-default"
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
                          <FileText size={14} className="text-primary-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate" title={file.originalName}>
                            {file.originalName}
                          </p>
                          <p className="text-xs text-gray-400">
                            {formatSize(file.size)}
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={(e) => handleDownload(e, file)}
                        className="p-1.5 opacity-0 group-hover:opacity-100 bg-white border border-gray-200 rounded-md text-gray-400 hover:text-primary-600 hover:border-primary-200 shadow-sm transition-all shrink-0"
                        title="Download"
                      >
                        <Download size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-4 py-8 text-center">
                  <Search size={24} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-sm font-medium text-gray-800">No results found</p>
                  <p className="text-xs text-gray-500">Try adjusting your search query</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Refresh */}
        <button
          onClick={onRefresh}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
          title="Refresh"
        >
          <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
        </button>

        {/* Notifications */}
        <button className="p-2 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors relative">
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-primary-500 rounded-full" />
        </button>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
          <User size={15} className="text-primary-600" />
        </div>
      </div>
    </header>
  );
}