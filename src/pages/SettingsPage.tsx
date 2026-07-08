import { useState } from 'react';
import { showToast } from '../components/ToastContainer';

interface Theme {
  primary: string;
  primaryDark: string;
  rgb: string;
}

const PRESETS: Record<string, Theme> = {
  emerald: { primary: '#059669', primaryDark: '#047857', rgb: '5, 150, 105' },
  slate:   { primary: '#475569', primaryDark: '#334155', rgb: '71, 85, 105' },
  indigo:  { primary: '#4f46e5', primaryDark: '#4338ca', rgb: '79, 70, 229' },
};

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.style.setProperty('--color-primary', theme.primary);
  root.style.setProperty('--color-primary-dark', theme.primaryDark);
  root.style.setProperty('--color-primary-rgb', theme.rgb);
}

export default function SettingsPage() {
  const [colorHex, setColorHex]   = useState('#059669');
  const [ssoEnabled, setSsoEnabled] = useState(false);

  function setPreset(name: string) {
    const t = PRESETS[name];
    if (!t) return;
    applyTheme(t);
    setColorHex(t.primary);
    showToast(`Tema sistem diatur ke: ${name}`);
  }

  function handleCustomColor(hex: string) {
    setColorHex(hex);
    if (/^#[0-9A-F]{6}$/i.test(hex)) {
      document.documentElement.style.setProperty('--color-primary', hex);
      document.documentElement.style.setProperty('--color-primary-dark', hex);
    }
  }

  function toggleSSO(enabled: boolean) {
    setSsoEnabled(enabled);
    showToast(
      enabled ? 'Integrasi Keycloak SSO diaktifkan' : 'Integrasi Keycloak SSO dinonaktifkan',
      enabled ? 'warning' : 'success'
    );
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Sistem & Pengaturan Tema Dinamis</h1>
          <p className="page-subtitle">Sesuaikan tema warna primer SIMAF, kelola definisi kategori (JSONB), dan konfigurasi Keycloak SSO.</p>
        </div>
      </div>

      <div className="grid-2">
        {/* Theme Settings */}
        <div className="card">
          <h3 className="card__title">Warna Tema Fakultas Dinamis</h3>
          <p style={{ fontSize: 12, color: '#64748b', marginBottom: 16, marginTop: -8 }}>
            Ubah warna primer sistem secara real-time. Perubahan disimpan dalam memori browser
            dan merender ulang CSS variables runtime.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 8 }}>
                Pilih Preset Tema Utama:
              </span>
              <div className="theme-preset-btns">
                <button className="theme-preset-btn theme-btn-emerald" onClick={() => setPreset('emerald')}>
                  Emerald Green
                </button>
                <button className="theme-preset-btn theme-btn-slate" onClick={() => setPreset('slate')}>
                  Slate Neutral
                </button>
                <button className="theme-preset-btn theme-btn-indigo" onClick={() => setPreset('indigo')}>
                  Indigo Modern
                </button>
              </div>
            </div>

            <div>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 8 }}>
                Atur Custom Color Palette (Hex):
              </span>
              <div className="color-picker-row">
                <input
                  type="color"
                  value={colorHex}
                  onChange={e => handleCustomColor(e.target.value)}
                />
                <input
                  type="text"
                  value={colorHex}
                  onChange={e => handleCustomColor(e.target.value)}
                  placeholder="#059669"
                />
              </div>
            </div>

            {/* Live preview */}
            <div style={{
              padding: 12,
              borderRadius: 8,
              background: 'rgba(var(--color-primary-rgb), 0.08)',
              border: '1px solid rgba(var(--color-primary-rgb), 0.2)',
              fontSize: 12,
              color: 'var(--color-primary)',
              fontWeight: 600,
            }}>
              ✓ Preview warna aktif: warna tombol, sidebar aktif, dan aksen akan mengikuti pilihan ini.
            </div>
          </div>
        </div>

        {/* SSO Config */}
        <div className="card">
          <h3 className="card__title">SSO Keycloak Universitas Config</h3>
          <span className="section-badge section-badge-amber" style={{ marginTop: -8, marginBottom: 12 }}>
            Tahap Akhir (Koordinasi Rektorat)
          </span>
          <p style={{ fontSize: 12, color: '#64748b', marginBottom: 16, marginTop: 8 }}>
            Simulasi integrasi portal Single Sign-On Kampus Pusat dengan OAuth2/OIDC mapping.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="sso-toggle-row">
              <div>
                <p className="sso-toggle-row__title">Aktifkan Login SSO Keycloak</p>
                <p className="sso-toggle-row__desc">Menyediakan tombol login OAuth2 di portal depan.</p>
              </div>
              <input
                type="checkbox"
                checked={ssoEnabled}
                onChange={e => toggleSSO(e.target.checked)}
                style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--color-primary)' }}
              />
            </div>

            {ssoEnabled && (
              <div style={{
                padding: 14,
                background: '#eff6ff',
                borderRadius: 8,
                border: '1px solid #bfdbfe',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}>
                <div className="form-group">
                  <label className="form-label">Keycloak Auth Server Endpoint URL</label>
                  <input
                    type="text"
                    className="form-input"
                    defaultValue="https://sso.unhas.ac.id/auth"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Realm Name & Client ID</label>
                  <input
                    type="text"
                    className="form-input"
                    defaultValue="realm-mipa-siaf"
                  />
                </div>
                <p style={{ fontSize: 10, color: '#64748b', margin: 0 }}>
                  *Sesuai panduan integrasi SSO Universitas — Koordinasi dengan UPT TIK Pusat.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Categories Config (info panel) */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <h3 className="card__title">Manajemen Kategori Aset (JSONB Fields)</h3>
          <p style={{ fontSize: 12, color: '#64748b', marginBottom: 16, marginTop: -8 }}>
            Definisi kategori dan custom fields tersimpan dalam format JSONB di database.
            Setiap kategori memiliki fields yang fleksibel (teks, angka, select).
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {[
              { name: 'Laptop / Komputer', fields: 4, color: '#dbeafe', text: '#1e40af' },
              { name: 'Mebel / Furnitur',  fields: 2, color: '#f0fdf4', text: '#166534' },
              { name: 'Elektronik / AC',   fields: 2, color: '#fef3c7', text: '#92400e' },
              { name: 'Kendaraan',         fields: 2, color: '#fce7f3', text: '#9d174d' },
            ].map(cat => (
              <div key={cat.name} style={{
                padding: '8px 14px',
                borderRadius: 8,
                background: cat.color,
                color: cat.text,
                fontSize: 12,
                fontWeight: 600,
              }}>
                {cat.name}
                <span style={{ marginLeft: 8, fontWeight: 400, opacity: 0.7, fontSize: 11 }}>
                  ({cat.fields} fields)
                </span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 12, marginBottom: 0 }}>
            Pengelolaan kategori melalui halaman admin backend. Perubahan fields akan otomatis tercermin pada form tambah aset.
          </p>
        </div>
      </div>
    </>
  );
}
