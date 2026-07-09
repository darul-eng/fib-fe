import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { ToastContainer } from './ToastContainer';
import { ConfirmDialogHost } from './ConfirmDialog';

export function DashboardLayout() {
  return (
    <div className="min-h-screen flex flex-col">
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
