import { LogOut, Smartphone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const ROLE_LABEL: Record<string, string> = {
  admin: 'Admin',
  pimpinan: 'Pimpinan',
};

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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

      {/* Sesi pengguna */}
      {user && (
        <div className="user-menu">
          <div className="user-menu__info">
            <span className="user-menu__nama">{user.nama}</span>
            <span className="badge badge-slate">{ROLE_LABEL[user.role] ?? user.role}</span>
          </div>
          <button className="btn-icon" onClick={handleLogout} title="Keluar">
            <LogOut size={18} />
          </button>
        </div>
      )}

      {/* Mobile PWA button */}
      <button className="btn-icon hide-desktop" title="PWA Simulator">
        <Smartphone size={20} />
      </button>
    </header>
  );
}
