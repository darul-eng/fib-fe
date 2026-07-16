import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { LogOut, ScanLine, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { showToast } from './ToastContainer';

// Lazy: html5-qrcode cukup besar, hanya dibutuhkan saat scanner benar-benar dibuka.
const QrScannerModal = lazy(() => import('./QrScannerModal').then((m) => ({ default: m.QrScannerModal })));

const ROLE_LABEL: Record<string, string> = {
  admin: 'Admin',
  pimpinan: 'Pimpinan',
  developer: 'Developer',
  warehouse: 'Warehouse',
};

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
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

  function handleScanDecode(text: string) {
    setShowScanner(false);
    try {
      const url = new URL(text, window.location.origin);
      const assetMatch = url.pathname.match(/^\/a\/(.+)$/);
      if (assetMatch) {
        navigate(`/a/${assetMatch[1]}`);
        return;
      }
      const locationMatch = url.pathname.match(/^\/r\/(.+)$/);
      if (locationMatch) {
        navigate(`/r/${locationMatch[1]}`);
        return;
      }
    } catch {
      // bukan URL yang valid, jatuh ke pesan error di bawah
    }
    showToast('QR tidak dikenali oleh sistem', 'danger');
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm px-3 py-2 sm:px-4 sm:py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-md flex items-center justify-center text-white font-bold text-lg"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          S
        </div>
        <div>
          <h1 className="text-sm font-semibold tracking-tight leading-none text-slate-800">SIAP</h1>
          <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
            Fakultas Ilmu Budaya
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {user?.role !== 'warehouse' && (
          <button
            className="min-h-11 min-w-11 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded-md sm:hidden"
            title="Pindai QR"
            onClick={() => setShowScanner(true)}
          >
            <ScanLine size={20} />
          </button>
        )}
        {showScanner && (
          <Suspense fallback={null}>
            <QrScannerModal open={showScanner} onClose={() => setShowScanner(false)} onDecode={handleScanDecode} />
          </Suspense>
        )}

        {user && (
          <div className="relative" ref={menuRef}>
            <button
              className="min-h-11 flex items-center gap-1.5 px-2 hover:bg-slate-100 rounded-md"
              onClick={() => setMenuOpen((v) => !v)}
              title="Akun"
            >
              <span
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                {user.nama.charAt(0).toUpperCase()}
              </span>
              <ChevronDown size={14} className="hidden sm:inline text-slate-500" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg border border-slate-200 shadow-lg p-2 z-50">
                <div className="px-2 py-1.5 mb-1 border-b border-slate-100">
                  <span className="block text-sm font-semibold text-slate-800 truncate">{user.nama}</span>
                  <span className="inline-block mt-1 px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-600 uppercase">
                    {ROLE_LABEL[user.role] ?? user.role}
                  </span>
                </div>
                <button
                  className="w-full min-h-11 flex items-center gap-2 px-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50"
                  onClick={handleLogout}
                >
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
