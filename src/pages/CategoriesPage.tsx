import { useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, X, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiGet, apiPost, apiPatch, apiDelete, ApiError } from '../api/client';
import type { Category, CategoryFieldInput, FieldType } from '../api/client';
import { showToast } from '../components/ToastContainer';
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
    if (!confirm(`Hapus kategori "${c.nama}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    try {
      await apiDelete(`/categories/${c.id}`);
      showToast(`Kategori "${c.nama}" dihapus`);
      load();
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : 'Gagal menghapus kategori', 'danger');
    }
  }

  if (loading) return <p className="text-muted">Memuat kategori...</p>;
  if (error) {
    return (
      <div>
        <p style={{ color: 'var(--color-danger)' }}>Gagal memuat: {error}</p>
        <p className="text-muted">Pastikan backend berjalan & sudah login.</p>
      </div>
    );
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Kategori Aset</h1>
          <p className="page-subtitle">{categories.length} kategori terdaftar, lengkap dengan atribut khususnya.</p>
        </div>
        <div className="toolbar">
          <div className="search-wrap">
            <Search size={15} />
            <input
              type="text"
              className="search-input"
              placeholder="Cari nama kategori / atribut..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
          {canManage && (
            <button className="btn btn-primary btn-sm" onClick={openCreate}>
              <Plus size={14} /> Kategori Baru
            </button>
          )}
        </div>
      </div>

      {canManage && showForm && (
        <div className="accordion-form">
          <div className="accordion-form__header">
            <h3 style={{ margin: 0, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}>
              {editingId ? 'Ubah Kategori' : 'Kategori Baru'}
            </h3>
            <button type="button" className="btn-icon" onClick={closeForm}><X size={14} /></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-grid--2">
              <div className="form-group">
                <label className="form-label required">Nama Kategori</label>
                <input className="form-input" required placeholder="Contoh: Laptop"
                  value={nama} onChange={(e) => setNama(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Deskripsi</label>
                <input className="form-input" placeholder="Opsional"
                  value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} />
              </div>
            </div>

            <div className="dynamic-fields" style={{ marginTop: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span className="dynamic-fields__label" style={{ marginBottom: 0 }}>Atribut Khusus Kategori</span>
                <button type="button" className="btn btn-outline btn-xs" onClick={() => setFields((p) => [...p, newFieldRow()])}>
                  <Plus size={12} /> Tambah Atribut
                </button>
              </div>

              {fields.length === 0 && (
                <p className="text-muted" style={{ fontSize: 11, margin: 0 }}>Belum ada atribut khusus.</p>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {fields.map((f) => (
                  <div key={f._rowId} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: 8, alignItems: 'center' }}>
                    <input className="form-input" placeholder="Nama atribut (mis. CPU)"
                      value={f.label} onChange={(e) => updateField(f._rowId, { label: e.target.value })} required />
                    <select className="form-select" value={f.tipe}
                      onChange={(e) => updateField(f._rowId, { tipe: e.target.value as FieldType })}>
                      {FIELD_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#475569', whiteSpace: 'nowrap' }}>
                      <input type="checkbox" checked={f.wajib ?? false}
                        onChange={(e) => updateField(f._rowId, { wajib: e.target.checked })} />
                      Wajib
                    </label>
                    <button type="button" className="btn-icon" onClick={() => removeField(f._rowId)}>
                      <Trash2 size={14} />
                    </button>
                    {f.tipe === 'select' && (
                      <input className="form-input" placeholder="Opsi, pisahkan dengan koma (mis. 4 GB, 8 GB, 16 GB)"
                        style={{ gridColumn: '1 / -1' }}
                        value={(f.opsi ?? []).join(', ')}
                        onChange={(e) => updateField(f._rowId, { opsi: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="form-footer">
              <button type="button" className="btn btn-outline btn-sm" onClick={closeForm}>Batal</button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                {saving ? 'Menyimpan...' : 'Simpan Kategori'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="cards-static-grid">
        {paginated.map((c) => (
          <div className="card" key={c.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>{c.nama}</h3>
                {c.deskripsi && <p className="text-muted" style={{ fontSize: 11, margin: '2px 0 0' }}>{c.deskripsi}</p>}
              </div>
              {canManage && (
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  <button className="btn-icon" title="Ubah" onClick={() => openEdit(c)}><Pencil size={14} /></button>
                  <button className="btn-icon" title="Hapus" onClick={() => handleDelete(c)}><Trash2 size={14} /></button>
                </div>
              )}
            </div>
            {c.fields.length === 0 ? (
              <p className="text-muted" style={{ fontSize: 11 }}>Tanpa atribut khusus</p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {c.fields.map((f) => (
                  <span key={f.id} className="chip">{f.label}{f.wajib ? '*' : ''}</span>
                ))}
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-muted" style={{ gridColumn: '1/-1', textAlign: 'center', padding: 24 }}>
            {categories.length === 0 ? 'Belum ada kategori. Buat kategori pertama.' : 'Tidak ada kategori yang cocok dengan pencarian.'}
          </p>
        )}
      </div>

      {filtered.length > PAGE_SIZE && (
        <div className="pagination">
          <span className="pagination__info">Halaman {currentPage} dari {totalPages} ({filtered.length} kategori)</span>
          <div className="pagination__controls">
            <button
              className="btn-icon"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => p - 1)}
              title="Sebelumnya"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              className="btn-icon"
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
