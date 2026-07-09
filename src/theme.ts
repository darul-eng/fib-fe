// Tema dinamis SIAP.
// Semua warna UI berasal dari CSS variable (--color-*) di index.css.
// Modul ini meng-override variable itu saat runtime dari nilai yang tersimpan
// di backend (GET /api/settings/theme), sehingga admin bisa mengganti warna
// primer & warna lain tanpa mengubah kode.

import { apiGet } from './api/client';

export type Theme = {
  primary: string; // warna primer
  primaryDark: string; // header / area gelap
  accent: string; // aksen
  ink: string; // teks utama
  muted: string; // teks sekunder
  surface: string; // latar kartu
  tint: string; // latar lembut
  border: string; // garis
  danger: string; // error / bahaya
  bg: string; // latar halaman
};

// Default = fallback bila backend belum siap. HARUS sama dgn :root di index.css.
// Emerald green theme — sesuai desain REFERENSI-UI.html
export const defaultTheme: Theme = {
  primary: '#059669',
  primaryDark: '#047857',
  accent: '#10b981',
  ink: '#0f172a',
  muted: '#64748b',
  surface: '#ffffff',
  tint: '#f1f5f9',
  border: '#e2e8f0',
  danger: '#b42318',
  bg: '#f8fafc',
};

// Peta key Theme -> nama CSS variable.
const VAR: Record<keyof Theme, string> = {
  primary: '--color-primary',
  primaryDark: '--color-primary-dark',
  accent: '--color-accent',
  ink: '--color-ink',
  muted: '--color-muted',
  surface: '--color-surface',
  tint: '--color-tint',
  border: '--color-border',
  danger: '--color-danger',
  bg: '--color-bg',
};

function hexToRgbTriplet(hex: string): string | null {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!match) return null;
  const [, r, g, b] = match;
  return `${parseInt(r, 16)}, ${parseInt(g, 16)}, ${parseInt(b, 16)}`;
}

export function applyTheme(theme: Partial<Theme>) {
  const root = document.documentElement;
  (Object.keys(VAR) as (keyof Theme)[]).forEach((k) => {
    const val = theme[k];
    if (val) root.style.setProperty(VAR[k], val);
  });
  if (theme.primary) {
    const rgb = hexToRgbTriplet(theme.primary);
    if (rgb) root.style.setProperty('--color-primary-rgb', rgb);
  }
  if (theme.bg) document.body.style.background = theme.bg;
}

// Dipanggil sekali saat startup. Terapkan default dulu (tanpa kedip),
// lalu timpa dengan tema dari server bila ada.
export async function loadTheme() {
  applyTheme(defaultTheme);
  try {
    const theme = await apiGet<Partial<Theme>>('/settings/theme');
    applyTheme(theme);
  } catch {
    // biarkan default bila server belum siap
  }
}
