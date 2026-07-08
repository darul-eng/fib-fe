import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  Box,
  Shuffle,
  Package,
  Settings,
  ChevronLeft,
  ChevronRight,
  Monitor,
  Tags,
  MapPin,
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard',    label: 'Dashboard',         icon: <Home size={16} />,    path: '/dashboard' },
  { id: 'categories',   label: 'Kategori Aset',     icon: <Tags size={16} />,    path: '/kategori' },
  { id: 'locations',    label: 'Lokasi',            icon: <MapPin size={16} />,  path: '/lokasi' },
  { id: 'assets',       label: 'Manajemen Aset',    icon: <Box size={16} />,     path: '/aset' },
  { id: 'tracking',     label: 'Mutasi & Riwayat',  icon: <Shuffle size={16} />, path: '/mutasi' },
  { id: 'consumables',  label: 'Fase 2: Persediaan',icon: <Package size={16} />, path: '/persediaan' },
  { id: 'settings',     label: 'Pengaturan',        icon: <Settings size={16} />, path: '/pengaturan' },
];

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

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
    return location.pathname === path ||
      (path !== '/dashboard' && location.pathname.startsWith(path));
  }

  return (
    <nav className={`sidebar${collapsed ? ' collapsed' : ''}`}>
      {/* Collapse button (desktop only) */}
      <button
        className="sidebar-collapse-btn"
        onClick={toggleCollapse}
        title={collapsed ? 'Perluas Menu' : 'Sembunyikan Label'}
      >
        <span className="nav-text"></span>
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      {/* Nav links */}
      {NAV_ITEMS.map(item => (
        <button
          key={item.id}
          className={`nav-btn${isActive(item.path) ? ' active' : ''}`}
          onClick={() => navigate(item.path)}
        >
          {item.icon}
          <span className="nav-text">{item.label}</span>
        </button>
      ))}

      {/* PWA Status Banner (desktop footer) */}
      <div className="sidebar-footer">
        <div className="pwa-banner">
          <span className="pwa-banner__title">PWA Status: Ready</span>
          <span className="pwa-banner__desc">Simulasi integrasi PWA lokal.</span>
          <button className="pwa-banner__btn">
            <Monitor size={12} style={{ display: 'inline', marginRight: 4 }} />
            PWA Scan Simulator
          </button>
        </div>
      </div>
    </nav>
  );
}
