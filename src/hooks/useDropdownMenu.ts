import { useEffect, useRef, useState } from 'react';

type Coords = { top: number; left: number };

const VIEWPORT_MARGIN = 8;

// Menu "titik 3" (dropdown via portal) yang dipakai di beberapa halaman (Aset, Lokasi).
// Posisi awal dihitung dari tombol pemicu; kalau tombol ada di baris paling bawah
// (mis. item terakhir daftar / dekat bottom-nav mobile), menu dibalik ke atas tombol
// supaya tidak terpotong di luar viewport.
export function useDropdownMenu(width: number) {
  const [coords, setCoords] = useState<Coords | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  function open() {
    const rect = btnRef.current?.getBoundingClientRect();
    if (!rect) return;
    setCoords({
      top: rect.bottom + 4,
      left: Math.min(Math.max(VIEWPORT_MARGIN, rect.right - width), window.innerWidth - width - VIEWPORT_MARGIN),
    });
  }

  function close() {
    setCoords(null);
  }

  function toggle() {
    if (coords) close();
    else open();
  }

  // Setelah menu benar-benar dirender (tinggi sebenarnya baru diketahui di sini),
  // koreksi posisi ke atas tombol bila melebihi batas bawah viewport.
  useEffect(() => {
    if (!coords || !menuRef.current || !btnRef.current) return;
    const menuRect = menuRef.current.getBoundingClientRect();
    const overflow = menuRect.bottom - (window.innerHeight - VIEWPORT_MARGIN);
    if (overflow > 0.5) {
      const btnRect = btnRef.current.getBoundingClientRect();
      const flippedTop = Math.max(VIEWPORT_MARGIN, btnRect.top - menuRect.height - 4);
      setCoords((prev) => (prev && prev.top !== flippedTop ? { ...prev, top: flippedTop } : prev));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coords?.top, coords?.left]);

  useEffect(() => {
    if (!coords) return;
    function handleClickOutside(e: MouseEvent) {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) {
        close();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    // capture=true: tabel/daftar punya scroll sendiri, event scroll tidak selalu bubble ke window
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coords]);

  return { coords, btnRef, menuRef, toggle, close };
}
