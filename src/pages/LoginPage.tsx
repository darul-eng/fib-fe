import { useState } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn, ShieldCheck } from 'lucide-react';
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
    <div className="login-page">
      <div className="login-card">
        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo__icon">S</div>
          <span className="login-logo__name">SIMAF</span>
        </div>
        <p className="login-tagline">Sistem Manajemen Aset FIB Universitas Hasanuddin</p>

        <div className="login-divider" />

        {/* Form */}
        <form className="login-form" onSubmit={handleSubmit}>
          {error && <div className="login-error">{error}</div>}

          <div className="form-group">
            <label className="form-label" htmlFor="login-username">Username / NIP</label>
            <input
              id="login-username"
              type="text"
              className="form-input"
              placeholder="Masukkan username..."
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="login-password"
                type={showPass ? 'text' : 'password'}
                className="form-input"
                placeholder="Masukkan password..."
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                style={{ paddingRight: 42 }}
              />
              <button
                type="button"
                className="btn-icon"
                onClick={() => setShowPass(!showPass)}
                style={{
                  position: 'absolute', right: 6, top: '50%',
                  transform: 'translateY(-50%)', padding: 6,
                }}
                title={showPass ? 'Sembunyikan' : 'Tampilkan'}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="login-submit"
            disabled={loading}
            style={loading ? { opacity: 0.7, cursor: 'not-allowed' } : {}}
          >
            {loading ? (
              'Memverifikasi...'
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <LogIn size={16} /> Masuk ke Sistem
              </span>
            )}
          </button>

          <div className="login-divider" style={{ margin: '4px 0' }} />

          {/* SSO Button — Tahap 8, belum tersedia */}
          <button type="button" className="login-sso-btn" disabled title="Menyusul di Tahap 8">
            <ShieldCheck size={16} color="#059669" />
            Masuk via SSO Universitas (Keycloak)
          </button>
        </form>

        <p className="login-footer">
          Sistem Manajemen Aset FIB · v1.0.0-alpha<br />
          <span style={{ color: '#cbd5e1' }}>©2026 Fakultas Ilmu Budaya Universitas Hasanuddin</span>
        </p>
      </div>
    </div>
  );
}
