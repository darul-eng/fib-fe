import { useEffect, useRef, useState } from 'react';
import { LogOut, Smartphone, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const ROLE_LABEL: Record<string, string> = {
  admin: 'Admin',
  pimpinan: 'Pimpinan',
};

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <header className="site-header">
      {/* Brand */}
      <div className="site-header__brand">
        <div className="site-header__logo">S</div>
        <div>
          <span className="site-header__title">SIMAF</span>
          <span className="site-header__subtitle">Fakultas Ilmu Budaya</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {/* Mobile PWA button */}
        <button className="btn-icon hide-desktop" title="PWA Simulator">
          <Smartphone size={20} />
        </button>

        {/* Sesi pengguna — disembunyikan di balik tombol, hanya muncul saat ditekan */}
        {user && (
          <div className="user-menu" ref={menuRef}>
            <button
              className="user-menu__trigger"
              onClick={() => setMenuOpen((v) => !v)}
              title="Akun"
            >
              <span className="user-menu__avatar">{user.nama.charAt(0).toUpperCase()}</span>
              <ChevronDown size={14} className="hide-mobile" />
            </button>

            {menuOpen && (
              <div className="user-menu__dropdown">
                <div className="user-menu__info">
                  <span className="user-menu__nama">{user.nama}</span>
                  <span className="badge badge-slate">{ROLE_LABEL[user.role] ?? user.role}</span>
                </div>
                <button className="user-menu__logout" onClick={handleLogout}>
                  <LogOut size={14} /> Keluar
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
