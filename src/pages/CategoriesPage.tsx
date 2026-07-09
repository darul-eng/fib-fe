import { useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, X, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiGet, apiPost, apiPatch, apiDelete, ApiError } from '../api/client';
import type { Category, CategoryFieldInput, FieldType } from '../api/client';
import { showToast } from '../components/ToastContainer';
import { confirmDialog } from '../components/ConfirmDialog';
import { useAuth } from '../auth/AuthContext';

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: 'text', label: 'Teks' },
  { value: 'number', label: 'Angka' },
  { value: 'date', label: 'Tanggal' },
  { value: 'select', label: 'Pilihan (dropdown)' },
  { value: 'boolean', label: 'Ya/Tidak' },
];

type FieldRow = CategoryFieldInput & { _rowId: number };
let rowSeq = 0;
function newFieldRow(): FieldRow {
  return { _rowId: ++rowSeq, label: '', key: '', tipe: 'text', wajib: false, opsi: [] };
}

function slugify(label: string) {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

const PAGE_SIZE = 9;

export default function CategoriesPage() {
  const { user } = useAuth();
  const canManage = user?.role === 'admin';

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nama, setNama] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [fields, setFields] = useState<FieldRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter(
      (c) =>
        c.nama.toLowerCase().includes(q) ||
        (c.deskripsi ?? '').toLowerCase().includes(q) ||
        c.fields.some((f) => f.label.toLowerCase().includes(q)),
    );
  }, [categories, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function load() {
    setLoading(true);
    apiGet<Category[]>('/categories')
      .then(setCategories)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  function openCreate() {
    setEditingId(null);
    setNama('');
    setDeskripsi('');
    setFields([]);
    setShowForm(true);
  }

  function openEdit(c: Category) {
    setEditingId(c.id);
    setNama(c.nama);
    setDeskripsi(c.deskripsi ?? '');
    setFields(
      c.fields.map((f) => ({
        _rowId: ++rowSeq,
        label: f.label,
        key: f.key,
        tipe: f.tipe,
        wajib: f.wajib,
        opsi: f.opsi ?? [],
      })),
    );
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
  }

  function updateField(rowId: number, patch: Partial<FieldRow>) {
    setFields((prev) => prev.map((f) => (f._rowId === rowId ? { ...f, ...patch } : f)));
  }

  function removeField(rowId: number) {
    setFields((prev) => prev.filter((f) => f._rowId !== rowId));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        nama,
        deskripsi: deskripsi || undefined,
        fields: fields.map((f) => ({
          label: f.label,
          key: f.key || slugify(f.label),
          tipe: f.tipe,
          wajib: f.wajib ?? false,
          opsi: f.tipe === 'select' ? f.opsi : undefined,
        })),
      };
      if (editingId) {
        await apiPatch(`/categories/${editingId}`, payload);
        showToast('Kategori berhasil diperbarui');
      } else {
        await apiPost('/categories', payload);
        showToast('Kategori berhasil dibuat');
      }
      closeForm();
      load();
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : 'Gagal menyimpan kategori', 'danger');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(c: Category) {
    const ok = await confirmDialog({
      title: 'Hapus Kategori',
      message: `Hapus kategori "${c.nama}"? Tindakan ini tidak bisa dibatalkan.`,
      confirmLabel: 'Hapus',
      danger: true,
    });
    if (!ok) return;
    try {
      await apiDelete(`/categories/${c.id}`);
      showToast(`Kategori "${c.nama}" dihapus`);
      load();
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : 'Gagal menghapus kategori', 'danger');
    }
  }

  if (loading) return <p className="text-slate-500 text-sm">Memuat kategori...</p>;
  if (error) {
    return (
      <div>
        <p className="text-red-600 text-sm">Gagal memuat: {error}</p>
        <p className="text-slate-500 text-sm">Pastikan backend berjalan &amp; sudah login.</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
        <div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-800">Kategori Aset</h1>
          <p className="text-[11px] sm:text-xs text-slate-500">{categories.length} kategori terdaftar, lengkap dengan atribut khususnya.</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-2.5 min-h-11 bg-white">
            <Search size={15} className="text-slate-400 shrink-0" />
            <input
              type="text"
              className="w-full bg-transparent outline-none text-base sm:text-xs text-slate-800 placeholder:text-slate-400"
              placeholder="Cari nama kategori / atribut..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
          {canManage && (
            <button
              className="btn-primary px-2.5 py-1.5 sm:px-3 rounded-lg text-xs font-bold tracking-wide shadow-sm min-h-11 flex items-center gap-1.5"
              onClick={openCreate}
            >
              <Plus size={14} /> Kategori Baru
            </button>
          )}
        </div>
      </div>

      {canManage && showForm && (
        <div className="bg-white p-3 sm:p-4 rounded-lg border border-slate-200 mb-4 sm:mb-6">
          <div className="flex items-center justify-between mb-3.5">
            <h3 className="m-0 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {editingId ? 'Ubah Kategori' : 'Kategori Baru'}
            </h3>
            <button
              type="button"
              className="p-2 hover:bg-slate-100 rounded-md text-slate-600 min-h-11 min-w-11 flex items-center justify-center"
              onClick={closeForm}
            >
              <X size={14} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Nama Kategori <span className="text-red-600">*</span>
                </label>
                <input
                  className="w-full p-2 border border-slate-200 rounded-lg text-base sm:text-xs min-h-11"
                  required
                  placeholder="Contoh: Laptop"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Deskripsi</label>
                <input
                  className="w-full p-2 border border-slate-200 rounded-lg text-base sm:text-xs min-h-11"
                  placeholder="Opsional"
                  value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-3.5">
              <div className="flex justify-between items-center mb-2.5">
                <span className="text-xs font-semibold text-slate-600">Atribut Khusus Kategori</span>
                <button
                  type="button"
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-2.5 py-1.5 sm:px-3 rounded-lg text-xs font-bold min-h-11 flex items-center gap-1"
                  onClick={() => setFields((p) => [...p, newFieldRow()])}
                >
                  <Plus size={12} /> Tambah Atribut
                </button>
              </div>

              {fields.length === 0 && (
                <p className="text-slate-500 text-[11px] m-0">Belum ada atribut khusus.</p>
              )}

              <div className="flex flex-col gap-2.5">
                {fields.map((f) => (
                  <div
                    key={f._rowId}
                    className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto_auto] gap-2 items-center"
                  >
                    <input
                      className="w-full p-2 border border-slate-200 rounded-lg text-base sm:text-xs min-h-11"
                      placeholder="Nama atribut (mis. CPU)"
                      value={f.label}
                      onChange={(e) => updateField(f._rowId, { label: e.target.value })}
                      required
                    />
                    <select
                      className="w-full p-2 border border-slate-200 rounded-lg text-base sm:text-xs min-h-11"
                      value={f.tipe}
                      onChange={(e) => updateField(f._rowId, { tipe: e.target.value as FieldType })}
                    >
                      {FIELD_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                    <label className="flex items-center gap-1.5 text-[11px] text-slate-600 whitespace-nowrap min-h-11">
                      <input
                        type="checkbox"
                        className="w-4 h-4"
                        checked={f.wajib ?? false}
                        onChange={(e) => updateField(f._rowId, { wajib: e.target.checked })}
                      />
                      Wajib
                    </label>
                    <button
                      type="button"
                      className="p-2 hover:bg-slate-100 rounded-md text-slate-600 min-h-11 min-w-11 flex items-center justify-center justify-self-start"
                      onClick={() => removeField(f._rowId)}
                    >
                      <Trash2 size={14} />
                    </button>
                    {f.tipe === 'select' && (
                      <input
                        className="w-full p-2 border border-slate-200 rounded-lg text-base sm:text-xs min-h-11 sm:col-span-4"
                        placeholder="Opsi, pisahkan dengan koma (mis. 4 GB, 8 GB, 16 GB)"
                        value={(f.opsi ?? []).join(', ')}
                        onChange={(e) =>
                          updateField(f._rowId, {
                            opsi: e.target.value
                              .split(',')
                              .map((s) => s.trim())
                              .filter(Boolean),
                          })
                        }
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                className="px-2.5 py-1.5 sm:px-3 border border-slate-200 rounded text-xs font-semibold text-slate-600 min-h-11"
                onClick={closeForm}
              >
                Batal
              </button>
              <button
                type="submit"
                className="btn-primary px-2.5 py-1.5 sm:px-3 rounded-lg text-xs font-bold tracking-wide shadow-sm min-h-11"
                disabled={saving}
              >
                {saving ? 'Menyimpan...' : 'Simpan Kategori'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {paginated.map((c) => (
          <div className="bg-white p-3 sm:p-4 rounded-lg border border-slate-200" key={c.id}>
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="m-0 text-xs sm:text-sm font-bold text-slate-800">{c.nama}</h3>
                {c.deskripsi && <p className="text-slate-500 text-[11px] mt-0.5 mb-0">{c.deskripsi}</p>}
              </div>
              {canManage && (
                <div className="flex gap-1 shrink-0">
                  <button
                    className="p-2 hover:bg-slate-100 rounded-md text-slate-600 min-h-11 min-w-11 flex items-center justify-center"
                    title="Ubah"
                    onClick={() => openEdit(c)}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    className="p-2 hover:bg-slate-100 rounded-md text-slate-600 min-h-11 min-w-11 flex items-center justify-center"
                    title="Hapus"
                    onClick={() => handleDelete(c)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
            {c.fields.length === 0 ? (
              <p className="text-slate-500 text-[11px]">Tanpa atribut khusus</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {c.fields.map((f) => (
                  <span key={f.id} className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-600 uppercase">
                    {f.label}
                    {f.wajib ? '*' : ''}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-slate-500 text-sm text-center py-6 col-span-full">
            {categories.length === 0 ? 'Belum ada kategori. Buat kategori pertama.' : 'Tidak ada kategori yang cocok dengan pencarian.'}
          </p>
        )}
      </div>

      {filtered.length > PAGE_SIZE && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4">
          <span className="text-xs text-slate-500">
            Halaman {currentPage} dari {totalPages} ({filtered.length} kategori)
          </span>
          <div className="flex items-center gap-2">
            <button
              className="p-2 hover:bg-slate-100 rounded-md text-slate-600 min-h-11 min-w-11 flex items-center justify-center disabled:opacity-40 disabled:pointer-events-none border border-slate-200"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => p - 1)}
              title="Sebelumnya"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              className="p-2 hover:bg-slate-100 rounded-md text-slate-600 min-h-11 min-w-11 flex items-center justify-center disabled:opacity-40 disabled:pointer-events-none border border-slate-200"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              title="Berikutnya"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
