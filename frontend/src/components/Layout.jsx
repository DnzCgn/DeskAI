import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../lib/api';
import AnimatedBackground from './AnimatedBackground';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/users', label: 'Users', icon: '👥', roles: ['owner', 'company_admin', 'department_manager'] },
  { path: '/organization', label: 'Organization', icon: '🏢', roles: ['owner', 'company_admin'] },
  { path: '/security', label: 'Security', icon: '🔐' },
  { path: '/devices', label: 'Devices', icon: '🖥', roles: ['owner', 'company_admin', 'department_manager'] },
  { path: '/billing', label: 'Billing', icon: '💳', roles: ['owner', 'company_admin'] },
  { path: '/settings', label: 'Settings', icon: '⚙️' },
];

export default function Layout() {
  const [user, setUser] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/auth/me')
      .then(({ data }) => setUser(data.user))
      .catch(() => { localStorage.removeItem('token'); navigate('/login'); });
  }, [navigate]);

  function handleLogout() {
    localStorage.removeItem('token');
    navigate('/login');
  }

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  );

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex relative">
      <AnimatedBackground />

      <motion.aside
        animate={{ width: collapsed ? 72 : 256 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="h-screen sticky top-0 bg-zinc-900/40 backdrop-blur-xl border-r border-zinc-800/50 flex flex-col z-40 overflow-hidden"
      >
        <div className="p-4 flex items-center gap-3 border-b border-zinc-800/50">
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-emerald-500 bg-clip-text text-transparent truncate"
            >
              DESKA
            </motion.span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={collapsed ? "M13 5l7 7-7 7M5 5l7 7-7 7" : "M11 19l-7-7 7-7m8 14l-7-7 7-7"} />
            </svg>
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {visibleItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30 border border-transparent'
                } ${collapsed ? 'justify-center' : ''}`
              }
            >
              <span className="text-lg flex-shrink-0">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-zinc-800/50">
          <div className={`flex items-center gap-3 px-3 py-2 ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-sm font-bold text-emerald-400 flex-shrink-0">
              {user.email?.[0]?.toUpperCase() || '?'}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{user.email}</p>
                <p className="text-xs text-zinc-500 capitalize">{user.role?.replace(/_/g, ' ')}</p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className={`mt-2 w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-500 hover:text-red-400 hover:bg-red-500/5 rounded-xl transition-colors ${collapsed ? 'justify-center' : ''}`}
          >
            <span className="text-lg flex-shrink-0">🚪</span>
            {!collapsed && 'Sign out'}
          </button>
        </div>
      </motion.aside>

      <main className="flex-1 min-w-0">
        <motion.header
          initial={{ y: -32, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="border-b border-zinc-800/50 bg-zinc-900/40 backdrop-blur-xl sticky top-0 z-30 px-6 py-4 flex items-center justify-between"
        >
          <span className="text-sm text-zinc-400 capitalize">{user.role?.replace(/_/g, ' ')}</span>
          <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {user.mode} mode
          </span>
        </motion.header>
        <div className="p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
