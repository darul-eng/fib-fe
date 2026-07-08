import { useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, X, Building2, Layers, DoorOpen, Search } from 'lucide-react';
import { apiGet, apiPost, apiPatch, apiDelete, ApiError } from '../api/client';
import type { Location, LocationType } from '../api/client';
import { showToast } from '../components/ToastContainer';
import { confirmDialog } from '../components/ConfirmDialog';
import { useAuth } from '../auth/AuthContext';

const TYPE_LABEL: Record<LocationType, string> = {
  gedung: 'Gedung',
  lantai: 'Lantai',
  ruangan: 'Ruangan',
};

const TYPE_ICON: Record<LocationType, React.ReactNode> = {
  gedung: <Building2 size={14} />,
  lantai: <Layers size={14} />,
  ruangan: <DoorOpen size={14} />,
};

const PARENT_TYPE: Record<LocationType, LocationType | null> = {
  gedung: null,
  lantai: 'gedung',
  ruangan: 'lantai',
};

type TreeNode = Location & { children: TreeNode[] };

function buildTree(locations: Location[]): TreeNode[] {
  const nodes = new Map<string, TreeNode>(locations.map((l) => [l.id, { ...l, children: [] }]));
  const roots: TreeNode[] = [];
  for (const node of nodes.values()) {
    if (node.parentId && nodes.has(node.parentId)) {
      nodes.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

// Menyaring lokasi berdasarkan nama, tapi tetap menyertakan induknya
// agar konteks hierarki (Gedung → Lantai → Ruangan) tidak putus.
function filterWithAncestors(locations: Location[], query: string): Location[] {
  const q = query.trim().toLowerCase();
  if (!q) return locations;

  const byId = new Map(locations.map((l) => [l.id, l]));
  const keep = new Set<string>();
  for (const l of locations) {
    if (l.nama.toLowerCase().includes(q)) {
      let current: Location | undefined = l;
      while (current && !keep.has(current.id)) {
        keep.add(current.id);
        current = current.parentId ? byId.get(current.parentId) : undefined;
      }
    }
  }
  return locations.filter((l) => keep.has(l.id));
}

export default function LocationsPage() {
  const { user } = useAuth();
  const canManage = user?.role === 'admin';

  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nama, setNama] = useState('');
  const [tipe, setTipe] = useState<LocationType>('gedung');
  const [parentId, setParentId] = useState('');
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  function load() {
    setLoading(true);
    apiGet<Location[]>('/locations')
      .then(setLocations)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  const tree = useMemo(() => buildTree(filterWithAncestors(locations, search)), [locations, search]);
  const parentOptions = useMemo(
    () => locations.filter((l) => l.tipe === PARENT_TYPE[tipe]),
    [locations, tipe],
  );

  function openCreate(defaultTipe: LocationType = 'gedung', defaultParentId = '') {
    setEditingId(null);
    setNama('');
    setTipe(defaultTipe);
    setParentId(defaultParentId);
    setShowForm(true);
  }

  function openEdit(l: Location) {
    setEditingId(l.id);
    setNama(l.nama);
    setTipe(l.tipe);
    setParentId(l.parentId ?? '');
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { nama, tipe, parentId: tipe === 'gedung' ? undefined : parentId || undefined };
      if (editingId) {
        await apiPatch(`/locations/${editingId}`, payload);
        showToast('Lokasi berhasil diperbarui');
      } else {
        await apiPost('/locations', payload);
        showToast('Lokasi berhasil dibuat');
      }
      closeForm();
      load();
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : 'Gagal menyimpan lokasi', 'danger');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(l: Location) {
    const ok = await confirmDialog({
      title: 'Hapus Lokasi',
      message: `Hapus lokasi "${l.nama}"? Tindakan ini tidak bisa dibatalkan.`,
      confirmLabel: 'Hapus',
      danger: true,
    });
    if (!ok) return;
    try {
      await apiDelete(`/locations/${l.id}`);
      showToast(`Lokasi "${l.nama}" dihapus`);
      load();
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : 'Gagal menghapus lokasi', 'danger');
    }
  }

  function renderNode(node: TreeNode, depth: number) {
    return (
      <div key={node.id}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            padding: '10px 12px',
            marginLeft: depth * 20,
            borderBottom: '1px solid #f1f5f9',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <span style={{ color: '#64748b', flexShrink: 0 }}>{TYPE_ICON[node.tipe]}</span>
            <span style={{ fontWeight: 600, fontSize: 13, color: '#1e293b' }}>{node.nama}</span>
            <span className="chip">{TYPE_LABEL[node.tipe]}</span>
          </div>
          {canManage && (
            <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
              {node.tipe !== 'ruangan' && (
                <button
                  className="btn-icon"
                  title={`Tambah ${node.tipe === 'gedung' ? 'Lantai' : 'Ruangan'} di sini`}
                  onClick={() => openCreate(node.tipe === 'gedung' ? 'lantai' : 'ruangan', node.id)}
                >
                  <Plus size={14} />
                </button>
              )}
              <button className="btn-icon" title="Ubah" onClick={() => openEdit(node)}><Pencil size={14} /></button>
              <button className="btn-icon" title="Hapus" onClick={() => handleDelete(node)}><Trash2 size={14} /></button>
            </div>
          )}
        </div>
        {node.children.map((child) => renderNode(child, depth + 1))}
      </div>
    );
  }

  if (loading) return <p className="text-muted">Memuat lokasi...</p>;
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
          <h1 className="page-title">Lokasi</h1>
          <p className="page-subtitle">Hierarki Gedung → Lantai → Ruangan untuk penempatan aset.</p>
        </div>
        <div className="toolbar">
          <div className="search-wrap">
            <Search size={15} />
            <input
              type="text"
              className="search-input"
              placeholder="Cari gedung / lantai / ruangan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {canManage && (
            <button className="btn btn-primary btn-sm" onClick={() => openCreate('gedung')}>
              <Plus size={14} /> Gedung Baru
            </button>
          )}
        </div>
      </div>

      {canManage && showForm && (
        <div className="accordion-form">
          <div className="accordion-form__header">
            <h3 style={{ margin: 0, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}>
              {editingId ? 'Ubah Lokasi' : 'Lokasi Baru'}
            </h3>
            <button type="button" className="btn-icon" onClick={closeForm}><X size={14} /></button>
          </div>

          <form className="form-grid--2" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label required">Tipe</label>
              <select className="form-select" value={tipe}
                onChange={(e) => { setTipe(e.target.value as LocationType); setParentId(''); }}>
                <option value="gedung">Gedung</option>
                <option value="lantai">Lantai</option>
                <option value="ruangan">Ruangan</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label required">Nama</label>
              <input className="form-input" required placeholder="Contoh: Gedung Dekanat"
                value={nama} onChange={(e) => setNama(e.target.value)} />
            </div>
            {tipe !== 'gedung' && (
              <div className="form-group full">
                <label className="form-label required">Induk Lokasi ({TYPE_LABEL[PARENT_TYPE[tipe]!]})</label>
                <select className="form-select" required value={parentId} onChange={(e) => setParentId(e.target.value)}>
                  <option value="" disabled>Pilih {TYPE_LABEL[PARENT_TYPE[tipe]!]}</option>
                  {parentOptions.map((p) => <option key={p.id} value={p.id}>{p.nama}</option>)}
                </select>
              </div>
            )}
            <div className="form-footer">
              <button type="button" className="btn btn-outline btn-sm" onClick={closeForm}>Batal</button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                {saving ? 'Menyimpan...' : 'Simpan Lokasi'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card" style={{ padding: 0 }}>
        {tree.length === 0 ? (
          <p className="text-muted" style={{ textAlign: 'center', padding: 24 }}>
            {locations.length === 0 ? 'Belum ada lokasi. Buat gedung pertama.' : 'Tidak ada lokasi yang cocok dengan pencarian.'}
          </p>
        ) : (
          tree.map((node) => renderNode(node, 0))
        )}
      </div>
    </>
  );
}
