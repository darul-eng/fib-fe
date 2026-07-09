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
          className="flex items-center justify-between gap-2 py-2.5 px-3 border-b border-slate-100"
          style={{ paddingLeft: 12 + depth * 20 }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-slate-500 shrink-0">{TYPE_ICON[node.tipe]}</span>
            <span className="font-semibold text-sm text-slate-800 truncate">{node.nama}</span>
            <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-600 uppercase shrink-0">
              {TYPE_LABEL[node.tipe]}
            </span>
          </div>
          {canManage && (
            <div className="flex gap-1 shrink-0">
              {node.tipe !== 'ruangan' && (
                <button
                  className="p-2 min-h-11 min-w-11 flex items-center justify-center hover:bg-slate-100 rounded-md text-slate-600"
                  title={`Tambah ${node.tipe === 'gedung' ? 'Lantai' : 'Ruangan'} di sini`}
                  onClick={() => openCreate(node.tipe === 'gedung' ? 'lantai' : 'ruangan', node.id)}
                >
                  <Plus size={14} />
                </button>
              )}
              <button
                className="p-2 min-h-11 min-w-11 flex items-center justify-center hover:bg-slate-100 rounded-md text-slate-600"
                title="Ubah"
                onClick={() => openEdit(node)}
              >
                <Pencil size={14} />
              </button>
              <button
                className="p-2 min-h-11 min-w-11 flex items-center justify-center hover:bg-slate-100 rounded-md text-slate-600"
                title="Hapus"
                onClick={() => handleDelete(node)}
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>
        {node.children.map((child) => renderNode(child, depth + 1))}
      </div>
    );
  }

  if (loading) return <p className="text-slate-500 text-sm">Memuat lokasi...</p>;
  if (error) {
    return (
      <div>
        <p className="text-red-600 text-sm">Gagal memuat: {error}</p>
        <p className="text-slate-500 text-sm">Pastikan backend berjalan & sudah login.</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
        <div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-800">Lokasi</h1>
          <p className="text-[11px] sm:text-xs text-slate-500">Hierarki Gedung → Lantai → Ruangan untuk penempatan aset.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 min-h-11 w-full sm:w-64">
            <Search size={15} className="text-slate-400 shrink-0" />
            <input
              type="text"
              className="w-full text-base sm:text-xs outline-none bg-transparent"
              placeholder="Cari gedung / lantai / ruangan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {canManage && (
            <button
              className="btn-primary px-2.5 py-1.5 sm:px-3 rounded-lg text-xs font-bold tracking-wide shadow-sm min-h-11 flex items-center justify-center gap-1.5"
              onClick={() => openCreate('gedung')}
            >
              <Plus size={14} /> Gedung Baru
            </button>
          )}
        </div>
      </div>

      {canManage && showForm && (
        <div className="bg-white p-3 sm:p-4 rounded-lg border border-slate-200 mb-4 sm:mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="m-0 text-[11px] font-bold uppercase tracking-wide text-slate-500">
              {editingId ? 'Ubah Lokasi' : 'Lokasi Baru'}
            </h3>
            <button
              type="button"
              className="p-2 min-h-11 min-w-11 flex items-center justify-center hover:bg-slate-100 rounded-md text-slate-600"
              onClick={closeForm}
            >
              <X size={14} />
            </button>
          </div>

          <form className="grid grid-cols-1 sm:grid-cols-2 gap-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Tipe</label>
              <select
                className="w-full p-2 border border-slate-200 rounded-lg text-base sm:text-xs min-h-11"
                value={tipe}
                onChange={(e) => { setTipe(e.target.value as LocationType); setParentId(''); }}
              >
                <option value="gedung">Gedung</option>
                <option value="lantai">Lantai</option>
                <option value="ruangan">Ruangan</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Nama</label>
              <input
                className="w-full p-2 border border-slate-200 rounded-lg text-base sm:text-xs min-h-11"
                required
                placeholder="Contoh: Gedung Dekanat"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
              />
            </div>
            {tipe !== 'gedung' && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Induk Lokasi ({TYPE_LABEL[PARENT_TYPE[tipe]!]})
                </label>
                <select
                  className="w-full p-2 border border-slate-200 rounded-lg text-base sm:text-xs min-h-11"
                  required
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                >
                  <option value="" disabled>Pilih {TYPE_LABEL[PARENT_TYPE[tipe]!]}</option>
                  {parentOptions.map((p) => <option key={p.id} value={p.id}>{p.nama}</option>)}
                </select>
              </div>
            )}
            <div className="sm:col-span-2 flex justify-end gap-2">
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
                {saving ? 'Menyimpan...' : 'Simpan Lokasi'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg border border-slate-200">
        {tree.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-6">
            {locations.length === 0 ? 'Belum ada lokasi. Buat gedung pertama.' : 'Tidak ada lokasi yang cocok dengan pencarian.'}
          </p>
        ) : (
          tree.map((node) => renderNode(node, 0))
        )}
      </div>
    </>
  );
}
