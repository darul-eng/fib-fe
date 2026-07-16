import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { ToastContainer } from './ToastContainer';
import { ConfirmDialogHost } from './ConfirmDialog';
import { useAuth, isWarehouseOnly } from '../auth/AuthContext';

export function DashboardLayout() {
  const { user } = useAuth();
  const location = useLocation();

  // Role warehouse hanya boleh berada di Menu Warehouse (PRD 5.12) — Sidebar sudah
  // menyembunyikan menu lain, ini menutup celah akses langsung lewat URL.
  if (isWarehouseOnly(user) && location.pathname !== '/warehouse') {
    return <Navigate to="/warehouse" replace />;
  }

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <ToastContainer />
      <ConfirmDialogHost />
      <Header />
      <div className="flex-1 flex flex-col md:flex-row">
        <Sidebar />
        <main className="flex-1 p-3 pb-24 sm:p-4 md:p-6 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
