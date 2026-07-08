// Tema dinamis SIAF.
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
export const defaultTheme: Theme = {
  primary: '#1C7293',
  primaryDark: '#0E3542',
  accent: '#02C39A',
  ink: '#1E293B',
  muted: '#5B6B75',
  surface: '#FFFFFF',
  tint: '#EEF4F6',
  border: '#E3EEF1',
  danger: '#B42318',
  bg: '#FFFFFF',
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

export function applyTheme(theme: Partial<Theme>) {
  const root = document.documentElement;
  (Object.keys(VAR) as (keyof Theme)[]).forEach((k) => {
    const val = theme[k];
    if (val) root.style.setProperty(VAR[k], val);
  });
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
