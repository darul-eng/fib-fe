import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { apiGet, apiPost, ApiError, setUnauthorizedHandler } from '../api/client';
import { showToast } from '../components/ToastContainer';

export type CurrentUser = {
  id: string;
  nama: string;
  username: string | null;
  email: string | null;
  role: 'admin' | 'pimpinan' | 'developer' | 'warehouse';
};

type AuthContextValue = {
  user: CurrentUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

export function hasFullAccess(user: CurrentUser | null): boolean {
  return user?.role === 'admin' || user?.role === 'developer';
}

// Role terbatas: hanya boleh mengakses Menu Warehouse (PRD 5.12), menu lain
// ditolak/disembunyikan.
export function isWarehouseOnly(user: CurrentUser | null): boolean {
  return user?.role === 'warehouse';
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const userRef = useRef<CurrentUser | null>(null);
  userRef.current = user;

  useEffect(() => {
    apiGet<CurrentUser>('/auth/me')
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  // Sesi bisa kedaluwarsa di tengah pemakaian (token 7 hari) — tanpa ini, request
  // yang gagal 401 hanya menampilkan toast error generik tanpa pernah mengarahkan
  // balik ke /login (RequireAuth bereaksi otomatis begitu `user` jadi null).
  useEffect(() => {
    setUnauthorizedHandler(() => {
      if (userRef.current) {
        showToast('Sesi Anda berakhir, silakan login kembali', 'danger');
      }
      setUser(null);
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const loggedIn = await apiPost<CurrentUser>('/auth/login', { username, password });
    setUser(loggedIn);
  }, []);

  const logout = useCallback(async () => {
    await apiPost('/auth/logout');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth harus dipakai di dalam AuthProvider');
  return ctx;
}

export { ApiError };
