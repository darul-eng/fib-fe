import { useEffect, useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { apiGet, apiPut, ApiError } from '../api/client';
import type { Theme } from '../theme';
import { applyTheme, defaultTheme } from '../theme';
import { showToast } from '../components/ToastContainer';
import { useAuth } from '../auth/AuthContext';

interface Preset {
  name: string;
  label: string;
  primary: string;
  primaryDark: string;
  btnClass: string;
}

const PRESETS: Preset[] = [
  {
    name: 'emerald',
    label: 'Emerald Green',
    primary: '#059669',
    primaryDark: '#047857',
    btnClass: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  },
  {
    name: 'slate',
    label: 'Slate Neutral',
    primary: '#475569',
    primaryDark: '#334155',
    btnClass: 'bg-slate-50 border-slate-200 text-slate-800',
  },
  {
    name: 'indigo',
    label: 'Indigo Modern',
    primary: '#4f46e5',
    primaryDark: '#4338ca',
    btnClass: 'bg-indigo-50 border-indigo-200 text-indigo-800',
  },
];

const CATEGORY_EXAMPLES: { name: string; fields: number; chipClass: string }[] = [
  { name: 'Laptop / Komputer', fields: 4, chipClass: 'bg-blue-100 text-blue-800' },
  { name: 'Mebel / Furnitur', fields: 2, chipClass: 'bg-green-100 text-green-800' },
  { name: 'Elektronik / AC', fields: 2, chipClass: 'bg-amber-100 text-amber-800' },
  { name: 'Kendaraan', fields: 2, chipClass: 'bg-pink-100 text-pink-800' },
];

const HEX_RE = /^#[0-9A-F]{6}$/i;

async function persistTheme(theme: { primary: string; primaryDark: string }, successMessage: string): Promise<void> {
  try {
    await apiPut('/settings/theme', theme);
    showToast(successMessage);
  } catch (e) {
    showToast(e instanceof ApiError ? e.message : 'Gagal menyimpan tema', 'danger');
  }
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [colorHex, setColorHex] = useState(defaultTheme.primary);
  const [ssoEnabled, setSsoEnabled] = useState(false);

  const [facultyName, setFacultyName] = useState('');
  const [savingFaculty, setSavingFaculty] = useState(false);
  const [showHolder, setShowHolder] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      applyTheme(defaultTheme);
      try {
        const loaded = await apiGet<Partial<Theme>>('/settings/theme');
        if (cancelled) return;
        applyTheme(loaded);
        if (loaded.primary) setColorHex(loaded.primary);
      } catch {
        // backend belum siap, tetap pakai default
      }
      try {
        const faculty = await apiGet<{ name?: string }>('/settings/faculty');
        if (!cancelled && faculty.name) setFacultyName(faculty.name);
      } catch {
        // belum diatur, pakai default kosong
      }
      try {
        const privacy = await apiGet<{ showHolder?: boolean }>('/settings/public_privacy');
        if (!cancelled && privacy.showHolder !== undefined) setShowHolder(privacy.showHolder);
      } catch {
        // belum diatur, default tampilkan pemegang
      }
    }
    void init();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSaveFaculty(e: React.FormEvent) {
    e.preventDefault();
    setSavingFaculty(true);
    try {
      await apiPut('/settings/faculty', { name: facultyName });
      showToast('Nama fakultas disimpan');
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : 'Gagal menyimpan nama fakultas', 'danger');
    } finally {
      setSavingFaculty(false);
    }
  }

  async function togglePrivacy(next: boolean) {
    setShowHolder(next);
    try {
      await apiPut('/settings/public_privacy', { showHolder: next });
      showToast(next ? 'Nama pemegang ditampilkan ke publik' : 'Nama pemegang disembunyikan dari publik');
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : 'Gagal menyimpan pengaturan privasi', 'danger');
      setShowHolder(!next);
    }
  }

  async function setPreset(preset: Preset) {
    applyTheme({ primary: preset.primary, primaryDark: preset.primaryDark });
    setColorHex(preset.primary);
    await persistTheme(
      { primary: preset.primary, primaryDark: preset.primaryDark },
      `Tema sistem diatur ke: ${preset.label}`,
    );
  }

  async function handleCustomColor(hex: string) {
    setColorHex(hex);
    if (!HEX_RE.test(hex)) return;
    applyTheme({ primary: hex, primaryDark: hex });
    await persistTheme({ primary: hex, primaryDark: hex }, 'Warna tema kustom disimpan');
  }

  function toggleSSO(enabled: boolean) {
    setSsoEnabled(enabled);
    showToast(
      enabled ? 'Integrasi Keycloak SSO diaktifkan' : 'Integrasi Keycloak SSO dinonaktifkan',
      enabled ? 'warning' : 'success',
    );
  }

  if (user?.role !== 'developer') {
    return (
      <div className="bg-white p-6 rounded-lg border border-slate-200 flex flex-col items-center text-center gap-2 max-w-md mx-auto">
        <ShieldAlert size={28} className="text-slate-400" />
        <h1 className="text-sm font-bold text-slate-800">Akses Ditolak</h1>
        <p className="text-xs text-slate-500">Halaman Pengaturan hanya bisa diakses oleh akun developer.</p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 sm:mb-6">
        <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-800">Sistem &amp; Pengaturan Tema Dinamis</h1>
        <p className="text-[11px] sm:text-xs text-slate-500">
          Sesuaikan tema warna primer SIAP, kelola definisi kategori (JSONB), dan konfigurasi Keycloak SSO.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Theme Settings */}
        <div className="bg-white p-3 sm:p-4 rounded-lg border border-slate-200">
          <h3 className="text-xs sm:text-sm font-bold text-slate-800 mb-3">Warna Tema Fakultas Dinamis</h3>
          <p className="text-xs text-slate-500 mb-4">
            Ubah warna primer sistem secara real-time. Perubahan disimpan ke server dan
            merender ulang CSS variables runtime.
          </p>

          <div className="flex flex-col gap-5">
            <div>
              <span className="block text-xs font-semibold text-slate-600 mb-2">Pilih Preset Tema Utama:</span>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    className={`min-h-11 px-2.5 sm:px-3 py-2 border rounded-lg font-bold text-xs ${preset.btnClass}`}
                    onClick={() => void setPreset(preset)}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="block text-xs font-semibold text-slate-600 mb-2">Atur Custom Color Palette (Hex):</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={colorHex}
                  onChange={(e) => void handleCustomColor(e.target.value)}
                  className="w-11 h-11 p-0 border border-slate-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={colorHex}
                  onChange={(e) => void handleCustomColor(e.target.value)}
                  placeholder="#059669"
                  className="min-h-11 text-base sm:text-xs p-2 border border-slate-300 rounded-lg w-32 outline-none"
                />
              </div>
            </div>

            {/* Live preview */}
            <div
              className="p-3 rounded-lg text-xs font-semibold text-primary"
              style={{
                background: 'rgba(var(--color-primary-rgb), 0.08)',
                border: '1px solid rgba(var(--color-primary-rgb), 0.2)',
              }}
            >
              Preview warna aktif: warna tombol, sidebar aktif, dan aksen akan mengikuti pilihan ini.
            </div>
          </div>
        </div>

        {/* SSO Config */}
        <div className="bg-white p-3 sm:p-4 rounded-lg border border-slate-200">
          <h3 className="text-xs sm:text-sm font-bold text-slate-800 mb-1">SSO Keycloak Universitas Config</h3>
          <span className="inline-block text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider mb-2">
            Tahap Akhir (Koordinasi Rektorat)
          </span>
          <p className="text-xs text-slate-500 mb-4">
            Simulasi integrasi portal Single Sign-On Kampus Pusat dengan OAuth2/OIDC mapping.
          </p>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <p className="text-xs font-semibold text-slate-800">Aktifkan Login SSO Keycloak</p>
                <p className="text-[11px] text-slate-500">Menyediakan tombol login OAuth2 di portal depan.</p>
              </div>
              <label className="min-h-11 min-w-11 flex items-center justify-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={ssoEnabled}
                  onChange={(e) => toggleSSO(e.target.checked)}
                  className="w-4 h-4 cursor-pointer"
                  style={{ accentColor: 'var(--color-primary)' }}
                />
              </label>
            </div>

            {ssoEnabled && (
              <div className="p-3.5 bg-blue-50 rounded-lg border border-blue-200 flex flex-col gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Keycloak Auth Server Endpoint URL</label>
                  <input
                    type="text"
                    className="min-h-11 text-base sm:text-xs w-full p-2 border border-slate-200 rounded-lg"
                    defaultValue="https://sso.unhas.ac.id/auth"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Realm Name &amp; Client ID</label>
                  <input
                    type="text"
                    className="min-h-11 text-base sm:text-xs w-full p-2 border border-slate-200 rounded-lg"
                    defaultValue="realm-mipa-siaf"
                  />
                </div>
                <p className="text-[10px] text-slate-500 m-0">
                  *Sesuai panduan integrasi SSO Universitas — Koordinasi dengan UPT TIK Pusat.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* QR & Halaman Publik */}
        <div className="bg-white p-3 sm:p-4 rounded-lg border border-slate-200 lg:col-span-2">
          <h3 className="text-xs sm:text-sm font-bold text-slate-800 mb-1">QR Code &amp; Halaman Publik</h3>
          <p className="text-xs text-slate-500 mb-4">
            Nama fakultas tampil di label QR yang dicetak. Privasi mengatur apa yang terlihat publik saat aset di-scan.
          </p>

          <form onSubmit={handleSaveFaculty} className="flex flex-col gap-3 mb-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Fakultas (untuk label QR)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="min-h-11 text-base sm:text-xs flex-1 p-2 border border-slate-200 rounded-lg outline-none"
                  placeholder="Contoh: Fakultas Ilmu Budaya"
                  value={facultyName}
                  onChange={(e) => setFacultyName(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={savingFaculty}
                  className="btn-primary min-h-11 px-3 rounded-lg text-xs font-bold shrink-0"
                >
                  {savingFaculty ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </div>
          </form>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div>
              <p className="text-xs font-semibold text-slate-800">Tampilkan Nama Pemegang ke Publik</p>
              <p className="text-[11px] text-slate-500">Jika dimatikan, nama pemegang disembunyikan di halaman scan QR.</p>
            </div>
            <label className="min-h-11 min-w-11 flex items-center justify-center cursor-pointer">
              <input
                type="checkbox"
                checked={showHolder}
                onChange={(e) => void togglePrivacy(e.target.checked)}
                className="w-4 h-4 cursor-pointer"
                style={{ accentColor: 'var(--color-primary)' }}
              />
            </label>
          </div>
        </div>

        {/* Categories Config (info panel) */}
        <div className="bg-white p-3 sm:p-4 rounded-lg border border-slate-200 lg:col-span-2">
          <h3 className="text-xs sm:text-sm font-bold text-slate-800 mb-1">Manajemen Kategori Aset (JSONB Fields)</h3>
          <p className="text-xs text-slate-500 mb-4">
            Definisi kategori dan custom fields tersimpan dalam format JSONB di database.
            Setiap kategori memiliki fields yang fleksibel (teks, angka, select).
          </p>
          <div className="flex flex-wrap gap-2.5">
            {CATEGORY_EXAMPLES.map((cat) => (
              <div key={cat.name} className={`px-3.5 py-2 rounded-lg text-xs font-semibold ${cat.chipClass}`}>
                {cat.name}
                <span className="ml-2 font-normal opacity-70 text-[11px]">({cat.fields} fields)</span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-slate-400 mt-3 mb-0">
            Pengelolaan kategori melalui halaman admin backend. Perubahan fields akan otomatis tercermin pada form tambah aset.
          </p>
        </div>
      </div>
    </>
  );
}
