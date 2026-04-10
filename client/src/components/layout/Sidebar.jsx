import { LayoutDashboard, Files, Upload, Server, Settings, HardDrive, BarChart3, Trash2, ScrollText } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Files, label: 'My Files', path: '/files' },
  { icon: Upload, label: 'Upload', path: '/upload' },
  { icon: BarChart3, label: 'Analytics', path: '/analytics' },
  { icon: Server, label: 'Nodes', path: '/nodes' },
  { icon: ScrollText, label: 'Activity Log', path: '/activity' },
  { icon: Trash2, label: 'Recycle Bin', path: '/trash' },
];

export default function Sidebar() {
  return (
    <aside className="w-60 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-6 py-5 border-b border-gray-100">
        <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
          <HardDrive size={16} className="text-white" />
        </div>
        <span className="font-semibold text-gray-900 text-lg tracking-tight">DriveX</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ icon: Icon, label, path }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                ? 'bg-primary-50 text-primary-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={18} className={isActive ? 'text-primary-600' : 'text-gray-400'} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-gray-100">
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
          <Settings size={18} className="text-gray-400" />
          Settings
        </button>
      </div>
    </aside>
  );
}