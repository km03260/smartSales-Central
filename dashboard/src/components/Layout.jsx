import { useEffect, useState, useCallback } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { api } from '../lib/api';
import { LayoutDashboard, Building2, KeyRound, MessageSquare, LogOut, Package, Server, FileText } from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/apps', icon: Package, label: 'Applications' },
  { to: '/companies', icon: Building2, label: 'Entreprises' },
  { to: '/licenses', icon: KeyRound, label: 'Licences' },
  { to: '/deployments', icon: Server, label: 'Déploiements' },
  { divider: true },
  { to: '/contacts', icon: MessageSquare, label: 'Contacts', badgeKey: 'contactsUnread' },
  { to: '/blog', icon: FileText, label: 'Blog' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [badges, setBadges] = useState({ contactsUnread: 0 });

  const refreshBadges = useCallback(async () => {
    try {
      const { count } = await api.getContactsUnreadCount();
      setBadges((b) => ({ ...b, contactsUnread: count }));
    } catch (err) {
      // Silencieux : le badge n'est pas critique
    }
  }, []);

  useEffect(() => {
    refreshBadges();
    const interval = setInterval(refreshBadges, 30_000);
    return () => clearInterval(interval);
  }, [refreshBadges]);

  // Rafraîchir au changement de page (ex: après avoir traité une demande)
  useEffect(() => {
    refreshBadges();
  }, [location.pathname, refreshBadges]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">customApps</h1>
          <p className="text-sm text-gray-500">Administration</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item, i) => {
            if (item.divider) {
              return <div key={`div-${i}`} className="my-2 mx-2 border-t border-gray-200"></div>;
            }
            const { to, icon: Icon, label, badgeKey } = item;
            const badge = badgeKey ? badges[badgeKey] : 0;
            return (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`
                }
              >
                <Icon size={18} />
                <span className="flex-1">{label}</span>
                {badge > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-xs font-semibold">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="text-sm text-gray-500 mb-2">{user?.email}</div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-600 transition-colors cursor-pointer"
          >
            <LogOut size={16} />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
