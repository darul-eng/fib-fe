import { useState } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuth, ApiError } from '../auth/AuthContext';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, loading: sessionLoading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Sudah login — jangan tampilkan form login lagi.
  if (!sessionLoading && user) {
    const from = (location.state as { from?: { pathname?: string } })?.from?.pathname ?? '/dashboard';
    return <Navigate to={from} replace />;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(username, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal terhubung ke server');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm bg-white rounded-xl border border-slate-200 p-6 shadow-lg">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-md flex items-center justify-center text-white font-bold text-lg"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            S
          </div>
          <span className="text-sm font-semibold tracking-tight text-primary">SIAP</span>
        </div>
        <p className="mt-2 text-xs text-slate-500">Sistem Manajeman Aset, Sarana, dan Prasarana</p>

        <div className="my-4 border-t border-slate-200" />

        {/* Form */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg p-3">{error}</div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="login-username">
              Username / NIP
            </label>
            <input
              id="login-username"
              type="text"
              className="w-full min-h-11 p-2 text-base border border-slate-200 rounded-lg"
              placeholder="Masukkan username..."
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="login-password">
              Password
            </label>
            <div className="relative">
              <input
                id="login-password"
                type={showPass ? 'text' : 'password'}
                className="w-full min-h-11 p-2 pr-11 text-base border border-slate-200 rounded-lg"
                placeholder="Masukkan password..."
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="absolute right-1 top-1/2 -translate-y-1/2 min-h-11 min-w-11 flex items-center justify-center text-slate-500 hover:bg-slate-100 rounded-md"
                onClick={() => setShowPass(!showPass)}
                title={showPass ? 'Sembunyikan' : 'Tampilkan'}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary w-full min-h-11 rounded-lg text-sm font-bold shadow-sm flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? (
              'Memverifikasi...'
            ) : (
              <>
                <LogIn size={16} /> Masuk ke Sistem
              </>
            )}
          </button>
        </form>

        <p className="text-center text-[11px] text-slate-400 mt-6">
          Sistem Manajemen Aset FIB · v1.0.0-alpha
          <br />
          <span className="text-slate-300">©2026 Fakultas Ilmu Budaya Universitas Hasanuddin</span>
        </p>
      </div>
    </div>
  );
}
