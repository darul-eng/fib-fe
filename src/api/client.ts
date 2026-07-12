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

export async function apiPut<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, {
    method: 'PUT',
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

export async function apiUpload<T>(path: string, form: FormData): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, {
    method: 'POST',
    credentials: 'include',
    body: form,
  });
  if (!res.ok) throw new ApiError(res.status, await extractErrorMessage(res));
  return res.json() as Promise<T>;
}

export async function apiDownload(path: string): Promise<Blob> {
  const res = await fetch(`${BASE}/api${path}`, { credentials: 'include' });
  if (!res.ok) throw new ApiError(res.status, await extractErrorMessage(res));
  return res.blob();
}

export type FieldType = 'text' | 'number' | 'date' | 'select' | 'boolean';

export type CategoryField = {
  id: string;
  label: string;
  key: string;
  tipe: FieldType;
  wajib: boolean;
  isPublic: boolean;
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
  isPublic?: boolean;
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

export type LocationQuery = {
  search?: string;
  parentId?: string;
  tipe?: LocationType;
  limit?: number;
};

// GET /locations tanpa parameter = gedung + lantai saja (selalu sedikit).
// Pakai `search` untuk pemilih ruangan cari-sambil-ketik, atau `parentId` untuk
// buka-cabang pohon secara lambat (lihat LocationsPage).
export function listLocations(query: LocationQuery = {}) {
  return apiGet<Location[]>(`/locations${toQueryString(query)}`);
}

export type AssetCondition = 'baik' | 'rusak_ringan' | 'rusak_berat' | 'perbaikan' | 'dihapus';

export type Person = {
  id: string;
  nama: string;
};

export type Asset = {
  id: string;
  kode: string;
  qrToken: string;
  nama: string;
  categoryId: string;
  kondisi: AssetCondition;
  tahunBeli: number | null;
  hargaBeli: string | null;
  sumberDana: string | null;
  locationId: string | null;
  personId: string | null;
  fotoPath: string | null;
  attributes: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  category: Category;
  location: Location | null;
  person: Person | null;
};

export type AssetInput = {
  nama: string;
  categoryId: string;
  kondisi?: AssetCondition;
  tahunBeli?: number;
  hargaBeli?: number;
  sumberDana?: string;
  locationId?: string;
  holderName?: string;
  attributes?: Record<string, unknown>;
};

export type AssetQuery = {
  search?: string;
  categoryId?: string;
  locationId?: string;
  kondisi?: AssetCondition;
  tahunBeli?: number;
  page?: number;
  limit?: number;
};

export type AssetListResult = {
  data: Asset[];
  total: number;
  page: number;
  limit: number;
};

export type ImportRowResult =
  | { row: number; ok: true; dto: AssetInput }
  | { row: number; ok: false; message: string };

export type ImportPreviewResult = {
  valid: Extract<ImportRowResult, { ok: true }>[];
  errors: Extract<ImportRowResult, { ok: false }>[];
};

export type ImportCommitResult = {
  created: number;
  failed: { row: number; message: string }[];
};

function toQueryString(query: Record<string, string | number | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export function listAssets(query: AssetQuery) {
  return apiGet<AssetListResult>(`/assets${toQueryString(query)}`);
}

export function getAsset(id: string) {
  return apiGet<Asset>(`/assets/${id}`);
}

export function createAsset(input: AssetInput) {
  return apiPost<Asset>('/assets', input);
}

export function updateAsset(id: string, input: Partial<AssetInput>) {
  return apiPatch<Asset>(`/assets/${id}`, input);
}

export function deleteAsset(id: string) {
  return apiDelete(`/assets/${id}`);
}

export function duplicateAsset(id: string, jumlah: number) {
  return apiPost<Asset[]>(`/assets/${id}/duplicate`, { jumlah });
}

export function getAssetByToken(token: string) {
  return apiGet<Asset>(`/assets/by-token/${token}`);
}

export function uploadAssetPhoto(id: string, file: File) {
  const form = new FormData();
  form.append('foto', file);
  return apiUpload<Asset>(`/assets/${id}/photo`, form);
}

export function previewAssetImport(file: File) {
  const form = new FormData();
  form.append('file', file);
  return apiUpload<ImportPreviewResult>('/assets/import/preview', form);
}

export function commitAssetImport(rows: AssetInput[]) {
  return apiPost<ImportCommitResult>('/assets/import/commit', { rows });
}

export function downloadAssetImportTemplate(categoryId?: string) {
  return apiDownload(`/assets/import/template${toQueryString({ categoryId })}`);
}

export type MovementType = 'lokasi' | 'pemegang' | 'kondisi';

export type Movement = {
  id: string;
  assetId: string;
  tipe: MovementType;
  fromLocationId: string | null;
  toLocationId: string | null;
  fromPersonId: string | null;
  toPersonId: string | null;
  fromKondisi: AssetCondition | null;
  toKondisi: AssetCondition | null;
  catatan: string | null;
  createdAt: string;
  asset: { id: string; kode: string; nama: string };
  fromLocation: { id: string; nama: string } | null;
  toLocation: { id: string; nama: string } | null;
  fromPerson: { id: string; nama: string } | null;
  toPerson: { id: string; nama: string } | null;
  movedBy: { id: string; nama: string } | null;
};

export type MovementListResult = {
  data: Movement[];
  total: number;
  page: number;
  limit: number;
};

export type MoveAssetInput = {
  assetId: string;
  locationId?: string;
  holderName?: string;
  kondisi?: AssetCondition;
  catatan?: string;
};

export function listMovements(query: { assetId?: string; page?: number; limit?: number }) {
  return apiGet<MovementListResult>(`/movements${toQueryString(query)}`);
}

export function moveAsset(input: MoveAssetInput) {
  return apiPost<{ asset: Asset; movement: Movement }>('/movements', input);
}

// ---------- QR & Cetak Label (Tahap 4) ----------

export function assetQrPngUrl(id: string) {
  return `${BASE}/api/qr/assets/${id}/png`;
}

export function locationQrPngUrl(id: string) {
  return `${BASE}/api/qr/locations/${id}/png`;
}

export type PrintQrInput = {
  assetIds?: string[];
  locationIds?: string[];
  columns?: number;
  size?: 'kecil' | 'sedang';
};

export async function printQrBatch(input: PrintQrInput): Promise<Blob> {
  const res = await fetch(`${BASE}/api/qr/print`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new ApiError(res.status, await extractErrorMessage(res));
  return res.blob();
}

export function regenerateAssetToken(id: string) {
  return apiPost<Asset>(`/assets/${id}/regenerate-token`);
}

export function regenerateLocationToken(id: string) {
  return apiPost<Location>(`/locations/${id}/regenerate-token`);
}

// ---------- Halaman Publik (scan QR, tanpa login) ----------

export type PublicMovement = {
  tipe: MovementType;
  dari: string | null;
  ke: string | null;
  catatan: string | null;
  createdAt: string;
};

export type PublicAsset = {
  kode: string;
  nama: string;
  kategori: string;
  kondisi: AssetCondition;
  lokasi: string | null;
  pemegang: string | null;
  foto: string | null;
  attributes: { label: string; value: unknown }[];
  timeline: PublicMovement[];
};

export type PublicLocationAsset = {
  kode: string;
  nama: string;
  kondisi: AssetCondition;
  qrToken: string;
};

export type PublicLocation = {
  nama: string;
  tipe: LocationType;
  lokasiInduk: string | null;
  totalAset: number;
  ringkasanKondisi: Partial<Record<AssetCondition, number>>;
  aset: PublicLocationAsset[];
  page: number;
  limit: number;
};

// ---------- Dashboard Pimpinan (Tahap 5) ----------

export type DashboardQuery = {
  categoryId?: string;
  locationId?: string;
  kondisi?: AssetCondition;
};

export type ConditionCount = { kondisi: AssetCondition; count: number };

export type LocationCount = { locationId: string | null; locationName: string; count: number };

export type DashboardStats = {
  totalAssets: number;
  totalValue: number;
  conditionDistribution: ConditionCount[];
  needsAttention: number;
  locationDistribution: LocationCount[];
  recentMovements: Movement[];
};

export function getDashboardStats(query: DashboardQuery) {
  return apiGet<DashboardStats>(`/dashboard/stats${toQueryString(query)}`);
}

export function downloadDashboardExport(query: DashboardQuery) {
  return apiDownload(`/dashboard/export${toQueryString(query)}`);
}

export function getPublicAsset(token: string) {
  return apiGet<PublicAsset>(`/public/assets/${token}`);
}

export function getPublicLocation(token: string, page = 1) {
  return apiGet<PublicLocation>(`/public/locations/${token}${toQueryString({ page })}`);
}

// ---------- Stok Opname / Audit Ruangan (Tahap 7) ----------

export type AuditAssetRef = { id: string; kode: string; nama: string };

export type AuditStatus = 'berjalan' | 'selesai';

export type AuditSessionView = {
  id: string;
  locationId: string;
  locationNama: string;
  status: AuditStatus;
  startedAt: string;
  finishedAt: string | null;
  catatan: string | null;
  ditemukan: AuditAssetRef[];
  belumDicek: AuditAssetRef[];
  tidakDitemukan: AuditAssetRef[];
  salahRuangan: { itemId: string; asset: AuditAssetRef }[];
  belumTerdaftar: { itemId: string; scannedToken: string | null }[];
};

export type AuditScanResult = AuditSessionView & {
  lastScan: { result: AuditItemResult; assetNama: string | null };
};

export type AuditItemResult = 'ditemukan' | 'tidak_ditemukan' | 'salah_ruangan' | 'belum_terdaftar';

export function startAudit(locationId: string) {
  return apiPost<AuditSessionView>('/audit-sessions', { locationId });
}

export function getAuditSession(id: string) {
  return apiGet<AuditSessionView>(`/audit-sessions/${id}`);
}

export function scanAudit(id: string, token: string) {
  return apiPost<AuditScanResult>(`/audit-sessions/${id}/scan`, { token });
}

export function manualCheckAudit(id: string, assetId: string) {
  return apiPost<AuditSessionView>(`/audit-sessions/${id}/manual`, { assetId });
}

export function moveHereAudit(id: string, assetId: string) {
  return apiPost<AuditSessionView>(`/audit-sessions/${id}/move-here`, { assetId });
}

export function finishAudit(id: string, catatan?: string) {
  return apiPost<AuditSessionView>(`/audit-sessions/${id}/finish`, { catatan });
}

// ---------- Riwayat Audit ----------

export type AuditSessionSummary = {
  id: string;
  locationId: string;
  locationNama: string;
  conductedByNama: string | null;
  status: AuditStatus;
  startedAt: string;
  finishedAt: string | null;
  counts: Record<AuditItemResult, number>;
};

export type AuditSessionListResult = {
  data: AuditSessionSummary[];
  total: number;
  page: number;
  limit: number;
};

export type AuditSessionQuery = {
  locationId?: string;
  page?: number;
  limit?: number;
};

export function listAuditSessions(query: AuditSessionQuery = {}) {
  return apiGet<AuditSessionListResult>(`/audit-sessions${toQueryString(query)}`);
}
