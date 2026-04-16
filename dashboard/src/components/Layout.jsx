import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { LayoutDashboard, Building2, KeyRound, MessageSquare, LogOut, BarChart3, Package } from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/apps', icon: Package, label: 'Applications' },
  { to: '/companies', icon: Building2, label: 'Entreprises' },
  { to: '/licenses', icon: KeyRound, label: 'Licences' },
  { to: '/contacts', icon: MessageSquare, label: 'Contacts' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">SmartSales</h1>
          <p className="text-sm text-gray-500">Administration</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
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
              {label}
            </NavLink>
          ))}
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
