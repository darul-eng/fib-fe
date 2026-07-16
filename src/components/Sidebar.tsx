import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Box, Shuffle, Package, Settings, ChevronLeft, ChevronRight, Tags, MapPin, ClipboardCheck, Warehouse } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  roles?: Array<'admin' | 'pimpinan' | 'developer' | 'warehouse'>;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <Home size={16} />, path: '/dashboard' },
  { id: 'categories', label: 'Kategori Aset', icon: <Tags size={16} />, path: '/kategori' },
  { id: 'locations', label: 'Lokasi', icon: <MapPin size={16} />, path: '/lokasi' },
  { id: 'assets', label: 'Manajemen Aset', icon: <Box size={16} />, path: '/aset' },
  { id: 'tracking', label: 'Mutasi & Riwayat', icon: <Shuffle size={16} />, path: '/mutasi' },
  { id: 'audit', label: 'Audit Ruangan', icon: <ClipboardCheck size={16} />, path: '/audit', roles: ['admin', 'developer'] },
  { id: 'warehouse', label: 'Warehouse', icon: <Warehouse size={16} />, path: '/warehouse', roles: ['admin', 'warehouse', 'developer'] },
  { id: 'consumables', label: 'Persediaan', icon: <Package size={16} />, path: '/persediaan' },
  { id: 'settings', label: 'Pengaturan', icon: <Settings size={16} />, path: '/pengaturan', roles: ['developer'] },
];

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  // Role `warehouse` dikecualikan dari kebijakan "tampil ke semua role" (item tanpa
  // `roles`) — hanya menu yang eksplisit mendaftarkan `warehouse` yang muncul untuknya,
  // sesuai PRD 5.12 ("hanya menu Warehouse yang muncul").
  const items = NAV_ITEMS.filter((item) => {
    if (item.roles) return !!user && item.roles.includes(user.role);
    return user?.role !== 'warehouse';
  });

  useEffect(() => {
    const stored = localStorage.getItem('sidebarCollapsed');
    if (stored === 'true') setCollapsed(true);
  }, []);

  function toggleCollapse() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('sidebarCollapsed', String(next));
  }

  function isActive(path: string) {
    return location.pathname === path || (path !== '/dashboard' && location.pathname.startsWith(path));
  }

  return (
    <nav
      className={`no-scrollbar fixed bottom-0 inset-x-0 md:sticky md:inset-x-auto w-full md:py-4 md:px-3 bg-white border-t md:border-t-0 border-r-0 md:border-r border-slate-200 pt-2 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] flex md:flex-col overflow-x-auto md:overflow-visible justify-start md:justify-start gap-1 z-40 md:top-[57px] md:h-[calc(100vh-57px)] shadow-lg md:shadow-none ${
        collapsed ? 'md:w-[72px] md:px-2' : 'md:w-60'
      }`}
    >
      <button
        className={`hidden md:flex items-center min-h-11 px-3 text-xs font-semibold text-slate-400 hover:bg-slate-50 hover:text-slate-700 rounded-md mb-2 ${
          collapsed ? 'justify-center' : 'justify-between'
        }`}
        onClick={toggleCollapse}
        title={collapsed ? 'Perluas Menu' : 'Sembunyikan Label'}
      >
        {!collapsed && <span>Collapse Menu</span>}
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      {items.map((item) => {
        const active = isActive(item.path);
        return (
          <button
            key={item.id}
            className={`flex items-center justify-center gap-2.5 min-h-11 min-w-11 shrink-0 px-3 py-3 md:py-2 text-sm font-medium rounded-md md:w-full md:justify-start transition-colors ${
              collapsed ? 'md:justify-center md:px-0' : ''
            } ${active ? 'bg-primary-tint text-primary' : 'text-slate-600 hover:bg-slate-50'}`}
            onClick={() => navigate(item.path)}
          >
            {item.icon}
            <span className={collapsed ? 'hidden' : 'hidden md:inline'}>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
