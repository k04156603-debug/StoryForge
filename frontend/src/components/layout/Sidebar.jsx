import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Upload, FileText, Settings, Sparkles } from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/upload', icon: Upload, label: 'New PRD' },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[72px] bg-surface-900/80 backdrop-blur-xl border-r border-white/5 flex flex-col items-center py-6 z-50">
      {/* Logo */}
      <Link to="/" className="mb-8 group">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center group-hover:shadow-lg group-hover:shadow-primary-500/30 transition-all">
          <Sparkles size={20} className="text-white" />
        </div>
      </Link>

      {/* Nav Items */}
      <nav className="flex flex-col items-center gap-2 flex-1">
        {navItems.map(({ to, icon: Icon, label }) => {
          const active = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              title={label}
              className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 group relative
                ${active
                  ? 'bg-primary-600/20 text-primary-400 shadow-lg shadow-primary-600/10'
                  : 'text-surface-500 hover:text-surface-200 hover:bg-surface-800'
                }`}
            >
              <Icon size={20} />
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary-500" />
              )}
              <span className="absolute left-full ml-3 px-2 py-1 rounded-md bg-surface-800 text-xs text-surface-200 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Settings */}
      <Link
        to="/settings"
        title="Settings"
        className="w-11 h-11 rounded-xl flex items-center justify-center text-surface-500 hover:text-surface-200 hover:bg-surface-800 transition-colors"
      >
        <Settings size={20} />
      </Link>
    </aside>
  );
}
