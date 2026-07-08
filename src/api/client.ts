const BASE = import.meta.env.VITE_API_BASE_URL ?? '';

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`Gagal memuat: ${res.status}`);
  return res.json() as Promise<T>;
}

export type CategoryField = {
  id: string;
  label: string;
  key: string;
  tipe: 'text' | 'number' | 'date' | 'select' | 'boolean';
  wajib: boolean;
  opsi: string[] | null;
};

export type Category = {
  id: string;
  nama: string;
  deskripsi: string | null;
  fields: CategoryField[];
};
