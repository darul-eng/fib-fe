import { useEffect, useRef, useState } from 'react';
import { Plus, X, KeyRound, ShieldAlert } from 'lucide-react';
import { listUsers, registerUser, ApiError, type User, type UserRole } from '../api/client';
import { showToast } from '../components/ToastContainer';
import { ResetPasswordModal } from '../components/ResetPasswordModal';
import { useAuth, hasFullAccess } from '../auth/AuthContext';

const ROLE_LABEL: Record<UserRole, string> = {
  admin: 'Admin',
  pimpinan: 'Pimpinan',
  developer: 'Developer',
  warehouse: 'Warehouse',
};

const EMPTY_FORM = { nama: '', username: '', email: '', password: '', role: 'pimpinan' as UserRole };

export default function UsersPage() {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const formRef = useRef<HTMLDivElement | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [resetTarget, setResetTarget] = useState<User | null>(null);

  useEffect(() => {
    if (showForm) formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [showForm]);

  function load() {
    setLoading(true);
    listUsers()
      .then(setUsers)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  function openCreate() {
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await registerUser({ ...form, email: form.email || undefined });
      showToast('Pengguna berhasil dibuat');
      closeForm();
      load();
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : 'Gagal membuat pengguna', 'danger');
    } finally {
      setSaving(false);
    }
  }

  if (!hasFullAccess(currentUser)) {
    return (
      <div className="bg-white p-6 rounded-lg border border-slate-200 flex flex-col items-center text-center gap-2 max-w-md mx-auto">
        <ShieldAlert size={28} className="text-slate-400" />
        <h1 className="text-sm font-bold text-slate-800">Akses Ditolak</h1>
        <p className="text-xs text-slate-500">Halaman Manajemen Pengguna hanya bisa diakses oleh akun admin.</p>
      </div>
    );
  }

  if (loading) return <p className="text-slate-500 text-sm">Memuat pengguna...</p>;
  if (error) {
    return (
      <div>
        <p className="text-red-600 text-sm">Gagal memuat: {error}</p>
        <p className="text-slate-500 text-sm">Pastikan backend berjalan &amp; sudah login.</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
        <div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-800">Manajemen Pengguna</h1>
          <p className="text-[11px] sm:text-xs text-slate-500">{users.length} akun terdaftar di sistem.</p>
        </div>
        <button
          className="btn-primary px-2.5 py-1.5 sm:px-3 rounded-lg text-xs font-bold tracking-wide shadow-sm min-h-11 flex items-center justify-center gap-1.5 shrink-0 whitespace-nowrap"
          onClick={openCreate}
        >
          <Plus size={14} /> Pengguna Baru
        </button>
      </div>

      {showForm && (
        <div ref={formRef} className="bg-white p-3 sm:p-4 rounded-lg border border-slate-200 mb-4 sm:mb-6 scroll-mt-20">
          <div className="flex items-center justify-between mb-3.5">
            <h3 className="m-0 text-[11px] font-bold uppercase tracking-wider text-slate-500">Pengguna Baru</h3>
            <button
              type="button"
              className="p-2 hover:bg-slate-100 rounded-md text-slate-600 min-h-11 min-w-11 flex items-center justify-center"
              onClick={closeForm}
            >
              <X size={14} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Nama Lengkap <span className="text-red-600">*</span>
                </label>
                <input
                  className="w-full p-2 border border-slate-200 rounded-lg text-base sm:text-xs min-h-11"
                  required
                  value={form.nama}
                  onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Username <span className="text-red-600">*</span>
                </label>
                <input
                  className="w-full p-2 border border-slate-200 rounded-lg text-base sm:text-xs min-h-11"
                  required
                  minLength={3}
                  value={form.username}
                  onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
                <input
                  type="email"
                  className="w-full p-2 border border-slate-200 rounded-lg text-base sm:text-xs min-h-11"
                  placeholder="Opsional"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Password Awal <span className="text-red-600">*</span>
                </label>
                <input
                  type="password"
                  className="w-full p-2 border border-slate-200 rounded-lg text-base sm:text-xs min-h-11"
                  required
                  minLength={8}
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Role <span className="text-red-600">*</span>
                </label>
                <select
                  className="w-full p-2 border border-slate-200 rounded-lg text-base sm:text-xs min-h-11"
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as UserRole }))}
                >
                  {Object.entries(ROLE_LABEL).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                className="px-2.5 py-1.5 sm:px-3 border border-slate-200 rounded text-xs font-semibold text-slate-600 min-h-11"
                onClick={closeForm}
              >
                Batal
              </button>
              <button
                type="submit"
                className="btn-primary px-2.5 py-1.5 sm:px-3 rounded-lg text-xs font-bold tracking-wide shadow-sm min-h-11"
                disabled={saving}
              >
                {saving ? 'Menyimpan...' : 'Simpan Pengguna'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {users.map((u) => (
          <div className="bg-white p-3 sm:p-4 rounded-lg border border-slate-200" key={u.id}>
            <div className="flex justify-between items-start mb-2">
              <div className="min-w-0">
                <h3 className="m-0 text-xs sm:text-sm font-bold text-slate-800 truncate">{u.nama}</h3>
                <p className="text-slate-500 text-[11px] mt-0.5 mb-0 truncate">
                  {u.username}
                  {u.email ? ` · ${u.email}` : ''}
                </p>
              </div>
              <button
                className="p-2 hover:bg-slate-100 rounded-md text-slate-600 min-h-11 min-w-11 flex items-center justify-center shrink-0"
                title="Reset Password"
                onClick={() => setResetTarget(u)}
              >
                <KeyRound size={14} />
              </button>
            </div>
            <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-600 uppercase">
              {ROLE_LABEL[u.role] ?? u.role}
            </span>
          </div>
        ))}
        {users.length === 0 && (
          <p className="text-slate-500 text-sm text-center py-6 col-span-full">Belum ada pengguna.</p>
        )}
      </div>

      {resetTarget && <ResetPasswordModal user={resetTarget} onClose={() => setResetTarget(null)} />}
    </>
  );
}
