import { useEffect, useState } from 'react';
import {
  Plus,
  Search,
  Download,
  Printer,
  Copy,
  Archive,
  Pencil,
  X,
  Image as ImageIcon,
  FileText,
} from 'lucide-react';
import { apiGet, ApiError } from '../api/client';
import type {
  Asset,
  AssetCondition,
  AssetInput,
  Category,
  ImportPreviewResult,
  Location,
} from '../api/client';
import {
  listAssets,
  createAsset,
  updateAsset,
  deleteAsset,
  duplicateAsset,
  uploadAssetPhoto,
  previewAssetImport,
  commitAssetImport,
  downloadAssetImportTemplate,
} from '../api/client';
import { showToast } from '../components/ToastContainer';
import { confirmDialog } from '../components/ConfirmDialog';

const KONDISI_OPTIONS: AssetCondition[] = ['baik', 'rusak_ringan', 'rusak_berat', 'perbaikan'];

const KONDISI_LABEL: Record<AssetCondition, string> = {
  baik: 'Baik',
  rusak_ringan: 'Rusak Ringan',
  rusak_berat: 'Rusak Berat',
  perbaikan: 'Dalam Perbaikan',
  dihapus: 'Dihapus',
};

function kondisiBadgeClass(kondisi: AssetCondition) {
  if (kondisi === 'baik') return 'bg-green-100 text-green-800';
  if (kondisi === 'rusak_ringan') return 'bg-yellow-100 text-yellow-800';
  if (kondisi === 'perbaikan') return 'bg-amber-100 text-amber-800';
  return 'bg-red-100 text-red-800';
}

type FormState = {
  nama: string;
  categoryId: string;
  kondisi: AssetCondition;
  tahunBeli: string;
  hargaBeli: string;
  sumberDana: string;
  locationId: string;
  holderName: string;
  attributes: Record<string, string>;
};

const EMPTY_FORM: FormState = {
  nama: '',
  categoryId: '',
  kondisi: 'baik',
  tahunBeli: String(new Date().getFullYear()),
  hargaBeli: '',
  sumberDana: '',
  locationId: '',
  holderName: '',
  attributes: {},
};

export default function AssetsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 20;
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterKondisi, setFilterKondisi] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const [duplicateTarget, setDuplicateTarget] = useState<Asset | null>(null);
  const [duplicateCount, setDuplicateCount] = useState(2);

  const [showImport, setShowImport] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportPreviewResult | null>(null);
  const [importing, setImporting] = useState(false);

  const rooms = locations.filter((l) => l.tipe === 'ruangan');
  const selectedCategory = categories.find((c) => c.id === form.categoryId);

  useEffect(() => {
    apiGet<Category[]>('/categories').then(setCategories).catch(() => showToast('Gagal memuat kategori', 'danger'));
    apiGet<Location[]>('/locations').then(setLocations).catch(() => showToast('Gagal memuat lokasi', 'danger'));
  }, []);

  useEffect(() => {
    void loadAssets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filterCategory, filterKondisi]);

  async function loadAssets() {
    setLoading(true);
    try {
      const result = await listAssets({
        search: search || undefined,
        categoryId: filterCategory || undefined,
        kondisi: (filterKondisi as AssetCondition) || undefined,
        page,
        limit,
      });
      setAssets(result.data);
      setTotal(result.total);
    } catch {
      showToast('Gagal memuat data aset', 'danger');
    } finally {
      setLoading(false);
    }
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    void loadAssets();
  }

  function openCreateForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setPhotoFile(null);
    setShowForm(true);
  }

  function openEditForm(asset: Asset) {
    setEditingId(asset.id);
    setForm({
      nama: asset.nama,
      categoryId: asset.categoryId,
      kondisi: asset.kondisi,
      tahunBeli: asset.tahunBeli ? String(asset.tahunBeli) : '',
      hargaBeli: asset.hargaBeli ?? '',
      sumberDana: asset.sumberDana ?? '',
      locationId: asset.locationId ?? '',
      holderName: asset.person?.nama ?? '',
      attributes: Object.fromEntries(
        Object.entries(asset.attributes).map(([k, v]) => [k, String(v)]),
      ),
    });
    setPhotoFile(null);
    setShowForm(true);
  }

  function setAttribute(key: string, value: string) {
    setForm((f) => ({ ...f, attributes: { ...f.attributes, [key]: value } }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const input: AssetInput = {
        nama: form.nama,
        categoryId: form.categoryId,
        kondisi: form.kondisi,
        tahunBeli: form.tahunBeli ? Number(form.tahunBeli) : undefined,
        hargaBeli: form.hargaBeli ? Number(form.hargaBeli) : undefined,
        sumberDana: form.sumberDana || undefined,
        locationId: form.locationId || undefined,
        holderName: form.holderName || undefined,
        attributes: form.attributes,
      };

      const saved = editingId ? await updateAsset(editingId, input) : await createAsset(input);

      if (photoFile) {
        await uploadAssetPhoto(saved.id, photoFile);
      }

      showToast(editingId ? `Aset "${saved.nama}" berhasil diperbarui!` : `Aset "${saved.nama}" berhasil didaftarkan!`);
      setShowForm(false);
      setEditingId(null);
      setPhotoFile(null);
      await loadAssets();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Gagal menyimpan aset', 'danger');
    } finally {
      setSaving(false);
    }
  }

  async function handleArchive(asset: Asset) {
    const ok = await confirmDialog({
      title: 'Arsipkan Aset',
      message: `Aset "${asset.nama}" akan diarsipkan dan tidak muncul di daftar. Riwayat tetap tersimpan.`,
      confirmLabel: 'Arsipkan',
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteAsset(asset.id);
      showToast(`Aset "${asset.nama}" diarsipkan`);
      await loadAssets();
    } catch {
      showToast('Gagal mengarsipkan aset', 'danger');
    }
  }

  async function handleDuplicateConfirm() {
    if (!duplicateTarget) return;
    try {
      const created = await duplicateAsset(duplicateTarget.id, duplicateCount);
      showToast(`${created.length} salinan aset "${duplicateTarget.nama}" berhasil dibuat`);
      setDuplicateTarget(null);
      await loadAssets();
    } catch {
      showToast('Gagal menduplikasi aset', 'danger');
    }
  }

  async function handleImportPreview() {
    if (!importFile) return;
    setImporting(true);
    try {
      const result = await previewAssetImport(importFile);
      setImportResult(result);
    } catch {
      showToast('Gagal membaca file import', 'danger');
    } finally {
      setImporting(false);
    }
  }

  async function handleImportCommit() {
    if (!importResult || importResult.valid.length === 0) return;
    setImporting(true);
    try {
      const result = await commitAssetImport(importResult.valid.map((r) => r.dto));
      showToast(`${result.created} aset berhasil diimpor`);
      setShowImport(false);
      setImportFile(null);
      setImportResult(null);
      await loadAssets();
    } catch {
      showToast('Gagal menyimpan hasil import', 'danger');
    } finally {
      setImporting(false);
    }
  }

  async function handleDownloadTemplate() {
    try {
      const blob = await downloadAssetImportTemplate(filterCategory || undefined);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'template-import-aset.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      showToast('Gagal mengunduh template', 'danger');
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <>
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800">Manajemen Aset Tetap</h1>
          <p className="text-xs text-slate-500">Pencatatan data, duplikasi massal, dan atribut kustom per kategori.</p>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:flex-none">
            <Search size={16} className="text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama / kode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 min-h-11 text-base sm:text-xs border border-slate-200 rounded-lg w-full sm:w-48 bg-white outline-none"
            />
          </form>

          <select
            value={filterCategory}
            onChange={(e) => {
              setFilterCategory(e.target.value);
              setPage(1);
            }}
            className="min-h-11 text-base sm:text-xs p-2 border border-slate-200 rounded-lg bg-white"
          >
            <option value="">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nama}
              </option>
            ))}
          </select>

          <select
            value={filterKondisi}
            onChange={(e) => {
              setFilterKondisi(e.target.value);
              setPage(1);
            }}
            className="min-h-11 text-base sm:text-xs p-2 border border-slate-200 rounded-lg bg-white"
          >
            <option value="">Semua Kondisi</option>
            {KONDISI_OPTIONS.map((k) => (
              <option key={k} value={k}>
                {KONDISI_LABEL[k]}
              </option>
            ))}
          </select>

          <button
            className="btn-primary flex items-center gap-1.5 min-h-11 px-3 rounded-lg text-xs font-bold shadow-sm"
            onClick={openCreateForm}
          >
            <Plus size={16} /> Aset Baru
          </button>
          <button
            className="bg-slate-800 hover:bg-slate-700 text-white flex items-center gap-1.5 min-h-11 px-3 rounded-lg text-xs font-bold shadow-sm"
            onClick={() => setShowImport(true)}
          >
            <Download size={16} /> Import
          </button>
          <button
            disabled
            title="Cetak QR tersedia di Tahap 4"
            className="bg-slate-100 text-slate-400 cursor-not-allowed flex items-center gap-1.5 min-h-11 px-3 rounded-lg text-xs font-bold border border-slate-200"
          >
            <Printer size={16} /> Cetak QR
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white p-4 rounded-lg border border-slate-200 mb-6">
          <div className="flex justify-between items-center pb-2 mb-4 border-b border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {editingId ? 'Ubah Data Aset' : 'Formulir Pendaftaran Aset Baru'}
            </h3>
            <button className="min-h-11 min-w-11 flex items-center justify-center text-slate-500 hover:bg-slate-100 rounded-md" onClick={() => setShowForm(false)}>
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600">Nama Aset*</label>
              <input
                required
                value={form.nama}
                onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))}
                placeholder="Contoh: ThinkPad T14s"
                className="p-2.5 min-h-11 text-base sm:text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600">Kategori*</label>
              <select
                required
                value={form.categoryId}
                onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value, attributes: {} }))}
                className="p-2.5 min-h-11 text-base sm:text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white outline-none"
              >
                <option value="">Pilih kategori</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nama}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600">Kondisi Fisik*</label>
              <select
                value={form.kondisi}
                onChange={(e) => setForm((f) => ({ ...f, kondisi: e.target.value as AssetCondition }))}
                className="p-2.5 min-h-11 text-base sm:text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white outline-none"
              >
                {KONDISI_OPTIONS.map((k) => (
                  <option key={k} value={k}>
                    {KONDISI_LABEL[k]}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600">Tahun Perolehan</label>
              <input
                type="number"
                inputMode="numeric"
                value={form.tahunBeli}
                onChange={(e) => setForm((f) => ({ ...f, tahunBeli: e.target.value }))}
                className="p-2.5 min-h-11 text-base sm:text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600">Harga Beli (Rp)</label>
              <input
                type="number"
                inputMode="numeric"
                value={form.hargaBeli}
                onChange={(e) => setForm((f) => ({ ...f, hargaBeli: e.target.value }))}
                placeholder="Contoh: 14000000"
                className="p-2.5 min-h-11 text-base sm:text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600">Sumber Dana</label>
              <input
                value={form.sumberDana}
                onChange={(e) => setForm((f) => ({ ...f, sumberDana: e.target.value }))}
                placeholder="Contoh: APBN"
                className="p-2.5 min-h-11 text-base sm:text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600">Lokasi Ruang</label>
              <select
                value={form.locationId}
                onChange={(e) => setForm((f) => ({ ...f, locationId: e.target.value }))}
                className="p-2.5 min-h-11 text-base sm:text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white outline-none"
              >
                <option value="">Tidak ditentukan</option>
                {rooms.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.nama}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600">Nama Pemegang</label>
              <input
                value={form.holderName}
                onChange={(e) => setForm((f) => ({ ...f, holderName: e.target.value }))}
                placeholder="Kosongkan jika milik umum"
                className="p-2.5 min-h-11 text-base sm:text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                <ImageIcon size={13} /> Foto Aset
              </label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
                className="text-xs file:mr-2 file:min-h-11 file:px-3 file:rounded-lg file:border-0 file:bg-slate-100 file:text-slate-700 file:font-semibold"
              />
            </div>

            {selectedCategory && selectedCategory.fields.length > 0 && (
              <div className="md:col-span-3 border-t border-slate-100 pt-3 mt-1 grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg">
                {selectedCategory.fields.map((field) => (
                  <div key={field.id} className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-600">
                      {field.label}
                      {field.wajib ? '*' : ''}
                    </label>
                    {field.tipe === 'select' ? (
                      <select
                        required={field.wajib}
                        value={form.attributes[field.key] ?? ''}
                        onChange={(e) => setAttribute(field.key, e.target.value)}
                        className="p-2 min-h-11 text-base sm:text-sm border border-slate-200 rounded-lg bg-white outline-none"
                      >
                        <option value="">Pilih {field.label}</option>
                        {(field.opsi ?? []).map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : field.tipe === 'boolean' ? (
                      <select
                        value={form.attributes[field.key] ?? 'false'}
                        onChange={(e) => setAttribute(field.key, e.target.value)}
                        className="p-2 min-h-11 text-base sm:text-sm border border-slate-200 rounded-lg bg-white outline-none"
                      >
                        <option value="false">Tidak</option>
                        <option value="true">Ya</option>
                      </select>
                    ) : (
                      <input
                        type={field.tipe === 'number' ? 'number' : field.tipe === 'date' ? 'date' : 'text'}
                        required={field.wajib}
                        value={form.attributes[field.key] ?? ''}
                        onChange={(e) => setAttribute(field.key, e.target.value)}
                        className="p-2 min-h-11 text-base sm:text-sm border border-slate-200 rounded-lg bg-white outline-none"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="md:col-span-3 flex justify-end gap-2 pt-2">
              <button type="button" className="min-h-11 px-3 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600" onClick={() => setShowForm(false)}>
                Batal
              </button>
              <button type="submit" disabled={saving} className="btn-primary min-h-11 px-4 rounded-lg text-xs font-bold">
                {saving ? 'Menyimpan...' : 'Simpan Aset'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                <th className="p-3">Nama & Kode</th>
                <th className="p-3">Kategori</th>
                <th className="p-3">Kondisi</th>
                <th className="p-3">Lokasi Ruang</th>
                <th className="p-3">Pemegang</th>
                <th className="p-3">Atribut</th>
                <th className="p-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {!loading && assets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-slate-400 py-10">
                    Tidak ada aset ditemukan.
                  </td>
                </tr>
              ) : (
                assets.map((a) => (
                  <tr key={a.id}>
                    <td className="p-3">
                      <strong className="block text-slate-800">{a.nama}</strong>
                      <span className="font-mono text-[10px] text-slate-400">{a.kode}</span>
                      <span className="text-[10px] text-primary font-semibold block">Token: {a.qrToken}</span>
                    </td>
                    <td className="p-3">
                      <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-600 uppercase">
                        {a.category.nama}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${kondisiBadgeClass(a.kondisi)}`}>
                        {KONDISI_LABEL[a.kondisi]}
                      </span>
                    </td>
                    <td className="p-3 text-slate-700">{a.location?.nama ?? '—'}</td>
                    <td className="p-3 font-medium text-slate-700">{a.person?.nama ?? '—'}</td>
                    <td className="p-3 text-[10px] text-slate-500">
                      {Object.entries(a.attributes).map(([k, v]) => (
                        <div key={k}>
                          {k}: <strong>{String(v)}</strong>
                        </div>
                      ))}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1 justify-end">
                        <button className="p-1 hover:bg-slate-100 rounded text-slate-500" title="Edit" onClick={() => openEditForm(a)}>
                          <Pencil size={15} />
                        </button>
                        <button
                          className="p-1 hover:bg-slate-100 rounded text-slate-500"
                          title="Duplikasi"
                          onClick={() => {
                            setDuplicateTarget(a);
                            setDuplicateCount(2);
                          }}
                        >
                          <Copy size={15} />
                        </button>
                        <button className="p-1 hover:bg-slate-100 rounded text-red-500" title="Arsipkan" onClick={() => handleArchive(a)}>
                          <Archive size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 lg:hidden bg-slate-50/50">
          {assets.map((a) => (
            <div key={a.id} className="bg-white p-3 rounded-lg border border-slate-200">
              <div className="flex justify-between items-start mb-2">
                <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-600 uppercase">
                  {a.category.nama}
                </span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${kondisiBadgeClass(a.kondisi)}`}>
                  {KONDISI_LABEL[a.kondisi]}
                </span>
              </div>
              <p className="text-sm font-bold text-slate-800">{a.nama}</p>
              <p className="font-mono text-[10px] text-slate-400">{a.kode}</p>
              <div className="text-xs text-slate-500 mt-2 space-y-0.5">
                <div>
                  Lokasi: <strong className="text-slate-800">{a.location?.nama ?? '—'}</strong>
                </div>
                <div>
                  Pemegang: <strong className="text-slate-800">{a.person?.nama ?? '—'}</strong>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  className="flex-1 min-h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center justify-center gap-1"
                  onClick={() => openEditForm(a)}
                >
                  <Pencil size={13} /> Edit
                </button>
                <button
                  className="flex-1 min-h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center justify-center gap-1"
                  onClick={() => {
                    setDuplicateTarget(a);
                    setDuplicateCount(2);
                  }}
                >
                  <Copy size={13} /> Duplikasi
                </button>
                <button
                  className="min-h-11 min-w-11 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg flex items-center justify-center"
                  onClick={() => handleArchive(a)}
                >
                  <Archive size={15} />
                </button>
              </div>
            </div>
          ))}
          {!loading && assets.length === 0 && (
            <p className="text-xs text-slate-400 col-span-full text-center py-8">Tidak ada aset ditemukan.</p>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between p-3 border-t border-slate-100 text-xs text-slate-500">
            <span>
              Halaman {page} dari {totalPages} · {total} aset
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="min-h-11 px-3 border border-slate-200 rounded-lg font-semibold disabled:opacity-40"
              >
                Sebelumnya
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="min-h-11 px-3 border border-slate-200 rounded-lg font-semibold disabled:opacity-40"
              >
                Berikutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {duplicateTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4" onClick={() => setDuplicateTarget(null)}>
          <div className="bg-white rounded-xl max-w-sm w-full border border-slate-200 p-5 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-slate-800 mb-1">Duplikasi Aset</h3>
            <p className="text-xs text-slate-500 mb-4">
              Buat salinan dari &quot;{duplicateTarget.nama}&quot; dengan kode & token QR baru.
            </p>
            <label className="text-xs font-semibold text-slate-600 block mb-1">Jumlah salinan</label>
            <input
              type="number"
              min={1}
              max={100}
              value={duplicateCount}
              onChange={(e) => setDuplicateCount(Math.max(1, Number(e.target.value)))}
              className="w-full p-2.5 min-h-11 text-base border border-slate-200 rounded-lg outline-none mb-4"
            />
            <div className="flex justify-end gap-2">
              <button className="min-h-11 px-3 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600" onClick={() => setDuplicateTarget(null)}>
                Batal
              </button>
              <button className="btn-primary min-h-11 px-4 rounded-lg text-xs font-bold" onClick={handleDuplicateConfirm}>
                Duplikasi
              </button>
            </div>
          </div>
        </div>
      )}

      {showImport && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setShowImport(false)}
        >
          <div className="bg-white rounded-xl max-w-lg w-full border border-slate-200 p-5 shadow-lg my-8" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-slate-800 mb-1">Import Aset Massal via Excel/CSV</h3>
            <p className="text-xs text-slate-500 mb-4">
              Unggah file berisi banyak aset sekaligus. Kolom "Kategori" & "Lokasi" harus cocok dengan data yang sudah ada.
            </p>

            <button
              className="w-full flex items-center justify-center gap-1.5 min-h-11 mb-3 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50"
              onClick={handleDownloadTemplate}
            >
              <FileText size={14} /> Unduh Template
            </button>

            <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center mb-4">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => {
                  setImportFile(e.target.files?.[0] ?? null);
                  setImportResult(null);
                }}
                className="text-xs"
              />
            </div>

            {importResult && (
              <div className="mb-4 space-y-2">
                <div className="bg-green-50 p-2.5 rounded text-[11px] text-green-800">
                  <strong>{importResult.valid.length} baris valid</strong> siap diimpor.
                </div>
                {importResult.errors.length > 0 && (
                  <div className="bg-red-50 p-2.5 rounded text-[11px] text-red-800 max-h-32 overflow-y-auto">
                    <strong>{importResult.errors.length} baris gagal:</strong>
                    <ul className="list-disc list-inside mt-1">
                      {importResult.errors.map((err) => (
                        <li key={err.row}>
                          Baris {err.row}: {err.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <button
                className="min-h-11 px-3 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600"
                onClick={() => {
                  setShowImport(false);
                  setImportFile(null);
                  setImportResult(null);
                }}
              >
                Batal
              </button>
              {!importResult ? (
                <button
                  disabled={!importFile || importing}
                  className="btn-primary min-h-11 px-4 rounded-lg text-xs font-bold"
                  onClick={handleImportPreview}
                >
                  {importing ? 'Memproses...' : 'Pratinjau'}
                </button>
              ) : (
                <button
                  disabled={importResult.valid.length === 0 || importing}
                  className="btn-primary min-h-11 px-4 rounded-lg text-xs font-bold"
                  onClick={handleImportCommit}
                >
                  {importing ? 'Menyimpan...' : `Terapkan Import (${importResult.valid.length})`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
