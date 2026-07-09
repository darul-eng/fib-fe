import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from './components/DashboardLayout';
import { AuthProvider } from './auth/AuthContext';
import { RequireAuth } from './auth/RequireAuth';
import LoginPage       from './pages/LoginPage';
import CategoriesPage  from './pages/CategoriesPage';
import LocationsPage   from './pages/LocationsPage';
import AssetsPage      from './pages/AssetsPage';
import TrackingPage    from './pages/TrackingPage';
import ConsumablesPage from './pages/ConsumablesPage';
import SettingsPage    from './pages/SettingsPage';
import PublicAssetPage    from './pages/PublicAssetPage';
import PublicLocationPage from './pages/PublicLocationPage';
import { loadTheme }   from './theme';
import './index.css';

// Lazy: DashboardPage memuat recharts, cukup besar untuk di-split dari bundle awal.
const DashboardPage = lazy(() => import('./pages/DashboardPage'));

// Terapkan tema dinamis (warna primer & lainnya) sebelum/di awal render.
loadTheme();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Login — standalone, tidak pakai layout */}
          <Route path="/login" element={<LoginPage />} />

          {/* Halaman publik (scan QR) — tanpa login, tanpa layout admin */}
          <Route path="/a/:token" element={<PublicAssetPage />} />
          <Route path="/r/:token" element={<PublicLocationPage />} />

          {/* Area terkelola — wajib login */}
          <Route element={<RequireAuth />}>
            <Route element={<DashboardLayout />}>
              <Route
                path="/dashboard"
                element={
                  <Suspense fallback={<p className="text-xs text-slate-400">Memuat dashboard...</p>}>
                    <DashboardPage />
                  </Suspense>
                }
              />
              <Route path="/kategori"    element={<CategoriesPage />} />
              <Route path="/lokasi"      element={<LocationsPage />} />
              <Route path="/aset"        element={<AssetsPage />} />
              <Route path="/mutasi"      element={<TrackingPage />} />
              <Route path="/persediaan"  element={<ConsumablesPage />} />
              <Route path="/pengaturan"  element={<SettingsPage />} />
            </Route>
          </Route>

          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
