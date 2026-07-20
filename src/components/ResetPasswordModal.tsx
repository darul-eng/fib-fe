import { useState } from 'react';
import { KeyRound, X } from 'lucide-react';
import { resetUserPassword, ApiError, type User } from '../api/client';
import { showToast } from './ToastContainer';

export function ResetPasswordModal({ user, onClose }: { user: User; onClose: () => void }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast('Konfirmasi password tidak cocok', 'danger');
      return;
    }
    setSaving(true);
    try {
      await resetUserPassword(user.id, newPassword);
      showToast(`Password "${user.username}" berhasil direset`);
      onClose();
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : 'Gagal mereset password', 'danger');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl max-w-sm w-full border border-slate-200 p-5 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <KeyRound size={16} className="text-slate-500" />
            <h3 className="text-sm font-bold text-slate-800 m-0">Reset Password</h3>
          </div>
          <button
            type="button"
            className="p-2 hover:bg-slate-100 rounded-md text-slate-600 min-h-11 min-w-11 flex items-center justify-center"
            onClick={onClose}
          >
            <X size={14} />
          </button>
        </div>
        <p className="text-xs text-slate-500 mb-3.5">
          Atur password baru untuk <span className="font-semibold text-slate-700">{user.nama}</span> ({user.username}).
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Password Baru</label>
            <input
              type="password"
              className="w-full p-2 border border-slate-200 rounded-lg text-base sm:text-xs min-h-11"
              required
              autoFocus
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Konfirmasi Password Baru</label>
            <input
              type="password"
              className="w-full p-2 border border-slate-200 rounded-lg text-base sm:text-xs min-h-11"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 mt-1">
            <button
              type="button"
              className="min-h-11 px-3 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600"
              onClick={onClose}
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn-primary min-h-11 px-4 rounded-lg text-xs font-bold shadow-sm"
              disabled={saving}
            >
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
