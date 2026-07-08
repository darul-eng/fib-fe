const BASE = import.meta.env.VITE_API_BASE_URL ?? '';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function extractErrorMessage(res: Response): Promise<string> {
  try {
    const body = await res.json();
    if (typeof body?.message === 'string') return body.message;
    if (Array.isArray(body?.message)) return body.message.join(', ');
  } catch {
    // respons bukan JSON, pakai pesan default
  }
  return `Permintaan gagal (${res.status})`;
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  if (!res.ok) throw new ApiError(res.status, await extractErrorMessage(res));
  return res.json() as Promise<T>;
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw new ApiError(res.status, await extractErrorMessage(res));
  return res.json() as Promise<T>;
}

export async function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw new ApiError(res.status, await extractErrorMessage(res));
  return res.json() as Promise<T>;
}

export async function apiDelete(path: string): Promise<void> {
  const res = await fetch(`${BASE}/api${path}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) throw new ApiError(res.status, await extractErrorMessage(res));
}

export type FieldType = 'text' | 'number' | 'date' | 'select' | 'boolean';

export type CategoryField = {
  id: string;
  label: string;
  key: string;
  tipe: FieldType;
  wajib: boolean;
  opsi: string[] | null;
};

export type Category = {
  id: string;
  nama: string;
  deskripsi: string | null;
  fields: CategoryField[];
};

export type CategoryFieldInput = {
  label: string;
  key: string;
  tipe: FieldType;
  wajib?: boolean;
  opsi?: string[];
};

export type CategoryInput = {
  nama: string;
  deskripsi?: string;
  fields?: CategoryFieldInput[];
};

export type LocationType = 'gedung' | 'lantai' | 'ruangan';

export type Location = {
  id: string;
  nama: string;
  tipe: LocationType;
  parentId: string | null;
  qrToken: string;
  parent: { id: string; nama: string; tipe: LocationType } | null;
};

export type LocationInput = {
  nama: string;
  tipe: LocationType;
  parentId?: string;
};
