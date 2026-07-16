import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Building2,
  Layers,
  DoorOpen,
  Search,
  Printer,
  RefreshCw,
  MoreVertical,
  ChevronRight,
  ChevronDown,
  List,
  Eye,
  Warehouse,
} from 'lucide-react';
import {
  apiPost,
  apiPatch,
  apiDelete,
  ApiError,
  listLocations,
  getLocationAssetCounts,
  listAssets,
  printQrBatch,
  regenerateLocationToken,
  setLocationWarehouse,
} from '../api/client';
import type { Asset, Location, LocationType } from '../api/client';
import { showToast } from '../components/ToastContainer';
import { confirmDialog } from '../components/ConfirmDialog';
import { useAuth, hasFullAccess } from '../auth/AuthContext';
import { KONDISI_LABEL, kondisiBadgeClass } from '../lib/kondisi';

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const MENU_WIDTH = 192; // w-48

function LocationActionsMenu({
  tipe,
  isWarehouse,
  onListAset,
  onViewAssets,
  onPrintQr,
  onRegenerateToken,
  onToggleWarehouse,
  onDelete,
}: {
  tipe: LocationType;
  isWarehouse: boolean;
  onListAset: () => void;
  onViewAssets: () => void;
  onPrintQr: () => void;
  onRegenerateToken: () => void;
  onToggleWarehouse: () => void;
  onDelete: () => void;
}) {
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  function openMenu() {
    const rect = btnRef.current?.getBoundingClientRect();
    if (!rect) return;
    setCoords({
      top: rect.bottom + 4,
      left: Math.min(Math.max(8, rect.right - MENU_WIDTH), window.innerWidth - MENU_WIDTH - 8),
    });
  }

  useEffect(() => {
    if (!coords) return;
    function close() {
      setCoords(null);
    }
    function handleClickOutside(e: MouseEvent) {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) {
        close();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [coords]);

  return (
    <>
      <button
        ref={btnRef}
        className="p-2 min-h-11 min-w-11 flex items-center justify-center hover:bg-slate-100 rounded-md text-slate-600"
        title="Menu lainnya"
        onClick={() => (coords ? setCoords(null) : openMenu())}
      >
        <MoreVertical size={16} />
      </button>
      {coords &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed z-50 bg-white rounded-lg border border-slate-200 shadow-lg p-1.5"
            style={{ top: coords.top, left: coords.left, width: MENU_WIDTH }}
          >
            {tipe === 'ruangan' ? (
              <>
                <button
                  className="w-full flex items-center gap-2 px-2.5 py-2 min-h-11 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-md"
                  onClick={() => {
                    setCoords(null);
                    onViewAssets();
                  }}
                >
                  <Eye size={13} /> Lihat Aset
                </button>
                <button
                  className="w-full flex items-center gap-2 px-2.5 py-2 min-h-11 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-md"
                  onClick={() => {
                    setCoords(null);
                    onPrintQr();
                  }}
                >
                  <Printer size={13} /> Cetak QR
                </button>
                <button
                  className="w-full flex items-center gap-2 px-2.5 py-2 min-h-11 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-md"
                  onClick={() => {
                    setCoords(null);
                    onRegenerateToken();
                  }}
                >
                  <RefreshCw size={13} /> Buat Ulang Token QR
                </button>
                <button
                  className="w-full flex items-center gap-2 px-2.5 py-2 min-h-11 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-md"
                  onClick={() => {
                    setCoords(null);
                    onToggleWarehouse();
                  }}
                >
                  <Warehouse size={13} /> {isWarehouse ? 'Batalkan sebagai Gudang' : 'Jadikan Gudang'}
                </button>
              </>
            ) : (
              <button
                className="w-full flex items-center gap-2 px-2.5 py-2 min-h-11 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-md"
                onClick={() => {
                  setCoords(null);
                  onListAset();
                }}
              >
                <List size={13} /> List Aset
              </button>
            )}
            <div className="h-px bg-slate-100 my-1" />
            <button
              className="w-full flex items-center gap-2 px-2.5 py-2 min-h-11 text-xs font-medium text-red-600 hover:bg-red-50 rounded-md"
              onClick={() => {
                setCoords(null);
                onDelete();
              }}
            >
              <Trash2 size={13} /> Hapus
            </button>
          </div>,
          document.body,
        )}
    </>
  );
}

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

function WarehouseBadge({ isWarehouse }: { isWarehouse: boolean }) {
  if (!isWarehouse) return null;
  return (
    <span className="flex items-center gap-1 px-1.5 py-0.5 bg-primary-tint text-primary rounded text-[10px] font-bold uppercase shrink-0">
      <Warehouse size={11} /> Gudang
    </span>
  );
}

const PARENT_TYPE: Record<LocationType, LocationType | null> = {
  gedung: null,
  lantai: 'gedung',
  ruangan: 'lantai',
};

function AssetCountBadge({ count }: { count: number | undefined }) {
  if (!count) return null;
  return (
    <span className="text-[10px] font-semibold text-slate-400 shrink-0 whitespace-nowrap">
      {count} aset
    </span>
  );
}

const ROOM_ASSETS_LIMIT = 10;

// Modal daftar aset per ruangan: input pencarian di-debounce 250ms ke `search`
// (yang juga mereset halaman ke 1); efek pengambilan data bereaksi langsung
// begitu `search`/`page` menetap, tanpa debounce ganda.
function RoomAssetsModal({ location, onClose }: { location: Location; onClose: () => void }) {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 250);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    setLoading(true);
    listAssets({ locationId: location.id, search: search || undefined, page, limit: ROOM_ASSETS_LIMIT })
      .then((res) => {
        setAssets(res.data);
        setTotal(res.total);
      })
      .catch(() => showToast('Gagal memuat aset ruangan', 'danger'))
      .finally(() => setLoading(false));
  }, [location.id, search, page]);

  const totalPages = Math.max(1, Math.ceil(total / ROOM_ASSETS_LIMIT));

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl max-w-lg w-full border border-slate-200 p-5 my-8 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-800 truncate">Aset di {location.nama}</h3>
            <p className="text-[11px] text-slate-500">{total} aset ditemukan</p>
          </div>
          <button
            className="shrink-0 min-h-11 min-w-11 flex items-center justify-center text-slate-500 hover:bg-slate-100 rounded-md"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>

        <div className="relative mb-3">
          <Search size={15} className="text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari nama / kode aset..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-3 min-h-11 text-base sm:text-xs border border-slate-200 rounded-lg outline-none focus:border-slate-300"
          />
        </div>

        <div className="max-h-80 overflow-y-auto border border-slate-100 rounded-lg divide-y divide-slate-100">
          {loading ? (
            <p className="text-xs text-slate-400 text-center py-6">Memuat...</p>
          ) : assets.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">Tidak ada aset ditemukan.</p>
          ) : (
            assets.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-2 p-2.5">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">{a.nama}</p>
                  <p className="text-[11px] text-slate-500 truncate">{a.kode}</p>
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0 ${kondisiBadgeClass(a.kondisi)}`}
                >
                  {KONDISI_LABEL[a.kondisi]}
                </span>
              </div>
            ))
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-3 mt-1 text-xs text-slate-500">
            <span>
              Halaman {page} dari {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="min-h-11 px-2.5 sm:px-3 border border-slate-200 rounded-lg font-semibold disabled:opacity-40"
              >
                Sebelumnya
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="min-h-11 px-2.5 sm:px-3 border border-slate-200 rounded-lg font-semibold disabled:opacity-40"
              >
                Berikutnya
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

type TreeNode = Location & { children: TreeNode[] };

// `upper` hanya berisi gedung + lantai (selalu sedikit) — jadi pohon dua level ini
// aman dibangun sekaligus. Ruangan di bawah tiap lantai dimuat lambat (lihat roomsByParent).
function buildTree(upper: Location[]): TreeNode[] {
  const nodes = new Map<string, TreeNode>(upper.map((l) => [l.id, { ...l, children: [] }]));
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

export default function LocationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canManage = hasFullAccess(user);

  // Gedung + lantai saja — dasar pohon, selalu dimuat penuh (jumlahnya kecil).
  const [upper, setUpper] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ruangan per lantai dimuat lambat saat cabang dibuka, supaya lantai dengan ratusan
  // ruangan tidak ikut terunduh sebelum admin benar-benar membukanya.
  const [roomsByParent, setRoomsByParent] = useState<Record<string, Location[]>>({});
  const [expandedLantai, setExpandedLantai] = useState<Set<string>>(new Set());
  const [loadingRooms, setLoadingRooms] = useState<Set<string>>(new Set());

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nama, setNama] = useState('');
  const [tipe, setTipe] = useState<LocationType>('gedung');
  const [gedungId, setGedungId] = useState('');
  const [parentId, setParentId] = useState('');
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Location[] | null>(null);
  const [searching, setSearching] = useState(false);

  // Jumlah aset per lokasi (gedung/lantai/ruangan, sudah berjenjang dari backend)
  // untuk badge di tiap baris — dimuat sekali bareng pohon, bukan per-node.
  const [assetCounts, setAssetCounts] = useState<Record<string, number>>({});

  // Ruangan yang modal daftar asetnya sedang dibuka (null = tertutup).
  const [assetModalLocation, setAssetModalLocation] = useState<Location | null>(null);

  function load() {
    setLoading(true);
    Promise.all([listLocations(), getLocationAssetCounts()])
      .then(([locs, counts]) => {
        setUpper(locs);
        setAssetCounts(counts);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  // Pencarian lintas-tipe (gedung/lantai/ruangan) ke server — pohon tidak menyimpan
  // ruangan di client, jadi pencarian tidak bisa dilakukan di sisi klien lagi.
  useEffect(() => {
    const q = search.trim();
    if (!q) {
      setSearchResults(null);
      return;
    }
    setSearching(true);
    const timeout = setTimeout(() => {
      listLocations({ search: q, limit: 30 })
        .then(setSearchResults)
        .catch(() => showToast('Gagal mencari lokasi', 'danger'))
        .finally(() => setSearching(false));
    }, 250);
    return () => clearTimeout(timeout);
  }, [search]);

  async function refreshRooms(lantaiId: string) {
    try {
      const rooms = await listLocations({ parentId: lantaiId });
      setRoomsByParent((prev) => ({ ...prev, [lantaiId]: rooms }));
    } catch {
      // biarkan cache lama bila refresh gagal
    }
  }

  async function toggleExpand(lantaiId: string) {
    setExpandedLantai((prev) => {
      const next = new Set(prev);
      if (next.has(lantaiId)) next.delete(lantaiId);
      else next.add(lantaiId);
      return next;
    });
    if (roomsByParent[lantaiId]) return;
    setLoadingRooms((prev) => new Set(prev).add(lantaiId));
    await refreshRooms(lantaiId);
    setLoadingRooms((prev) => {
      const next = new Set(prev);
      next.delete(lantaiId);
      return next;
    });
  }

  // Dipanggil setelah create/update/delete — pohon atas (kecil) & cache ruangan yang
  // sudah pernah dimuat sama-sama disegarkan agar tetap konsisten dengan server.
  function reloadAll() {
    load();
    Object.keys(roomsByParent).forEach((pid) => void refreshRooms(pid));
  }

  const tree = useMemo(() => buildTree(upper), [upper]);
  const gedungOptions = useMemo(() => upper.filter((l) => l.tipe === 'gedung'), [upper]);
  const parentOptions = useMemo(() => {
    const options = upper.filter((l) => l.tipe === PARENT_TYPE[tipe]);
    // Untuk ruangan, pilihan lantai dipersempit ke gedung yang dipilih agar tidak
    // menampilkan seluruh lantai lintas gedung dalam satu dropdown datar.
    if (tipe === 'ruangan') return options.filter((l) => l.parentId === gedungId);
    return options;
  }, [upper, tipe, gedungId]);

  function openCreate(defaultTipe: LocationType = 'gedung', defaultParentId = '', defaultGedungId = '') {
    setEditingId(null);
    setNama('');
    setTipe(defaultTipe);
    setGedungId(defaultGedungId);
    setParentId(defaultParentId);
    setShowForm(true);
  }

  function openEdit(l: Location) {
    setEditingId(l.id);
    setNama(l.nama);
    setTipe(l.tipe);
    if (l.tipe === 'ruangan') {
      const lantai = upper.find((u) => u.id === l.parentId);
      setGedungId(lantai?.parentId ?? '');
    } else {
      setGedungId('');
    }
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
      const newRoomParentId = !editingId && tipe === 'ruangan' ? payload.parentId : undefined;
      closeForm();
      reloadAll();
      if (newRoomParentId) {
        setExpandedLantai((prev) => new Set(prev).add(newRoomParentId));
        void refreshRooms(newRoomParentId);
      }
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : 'Gagal menyimpan lokasi', 'danger');
    } finally {
      setSaving(false);
    }
  }

  async function handlePrintQr(l: Location) {
    try {
      const blob = await printQrBatch({ locationIds: [l.id] });
      downloadBlob(blob, `qr-lokasi-${l.nama.replace(/\s+/g, '-').toLowerCase()}.pdf`);
    } catch {
      showToast('Gagal membuat label QR', 'danger');
    }
  }

  async function handleRegenerateToken(l: Location) {
    const ok = await confirmDialog({
      title: 'Buat Ulang Token QR',
      message: `Token QR lama untuk "${l.nama}" tidak akan berlaku lagi. Cetak label baru setelah ini.`,
      confirmLabel: 'Buat Ulang',
      danger: true,
    });
    if (!ok) return;
    try {
      await regenerateLocationToken(l.id);
      showToast('Token QR berhasil dibuat ulang, cetak label baru');
      reloadAll();
    } catch {
      showToast('Gagal membuat ulang token QR', 'danger');
    }
  }

  async function handleToggleWarehouse(l: Location) {
    try {
      await setLocationWarehouse(l.id);
      showToast(l.isWarehouse ? `"${l.nama}" tidak lagi menjadi Gudang` : `"${l.nama}" dijadikan Gudang`);
      reloadAll();
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : 'Gagal mengubah status Gudang', 'danger');
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
      reloadAll();
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : 'Gagal menghapus lokasi', 'danger');
    }
  }

  function renderActions(node: Location, addChildTitle?: string, onAddChild?: () => void) {
    if (!canManage) return null;
    return (
      <div className="flex items-center gap-0.5 shrink-0">
        {onAddChild && (
          <button
            className="p-2 min-h-11 min-w-11 flex items-center justify-center hover:bg-slate-100 rounded-md text-slate-600"
            title={addChildTitle}
            onClick={onAddChild}
          >
            <Plus size={16} />
          </button>
        )}
        <button
          className="p-2 min-h-11 min-w-11 flex items-center justify-center hover:bg-slate-100 rounded-md text-slate-600"
          title="Ubah"
          onClick={() => openEdit(node)}
        >
          <Pencil size={16} />
        </button>
        <LocationActionsMenu
          tipe={node.tipe}
          isWarehouse={node.isWarehouse}
          onListAset={() => navigate(`/aset?locationId=${node.id}&locationNama=${encodeURIComponent(node.nama)}`)}
          onViewAssets={() => setAssetModalLocation(node)}
          onPrintQr={() => void handlePrintQr(node)}
          onRegenerateToken={() => void handleRegenerateToken(node)}
          onToggleWarehouse={() => void handleToggleWarehouse(node)}
          onDelete={() => void handleDelete(node)}
        />
      </div>
    );
  }

  function renderNode(node: TreeNode, depth: number) {
    const isLantai = node.tipe === 'lantai';
    const isExpanded = isLantai && expandedLantai.has(node.id);
    const rooms = roomsByParent[node.id];

    return (
      <div key={node.id}>
        <div
          className="flex items-center justify-between gap-2 py-2.5 px-3 border-b border-slate-100"
          style={{ paddingLeft: 12 + depth * 20 }}
        >
          <div className="flex items-center gap-2 min-w-0">
            {isLantai && (
              <button
                className="p-1 min-h-11 min-w-11 sm:min-h-0 sm:min-w-0 flex items-center justify-center text-slate-400 hover:text-slate-600 shrink-0"
                title={isExpanded ? 'Sembunyikan ruangan' : 'Tampilkan ruangan'}
                onClick={() => void toggleExpand(node.id)}
              >
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
            )}
            <span className="text-slate-500 shrink-0">{TYPE_ICON[node.tipe]}</span>
            <span className="font-semibold text-sm text-slate-800 truncate">{node.nama}</span>
            <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-600 uppercase shrink-0">
              {TYPE_LABEL[node.tipe]}
            </span>
            <WarehouseBadge isWarehouse={node.isWarehouse} />
            <AssetCountBadge count={assetCounts[node.id]} />
          </div>
          {renderActions(
            node,
            `Tambah ${node.tipe === 'gedung' ? 'Lantai' : 'Ruangan'} di sini`,
            () => openCreate(node.tipe === 'gedung' ? 'lantai' : 'ruangan', node.id, node.tipe === 'lantai' ? node.parentId ?? '' : ''),
          )}
        </div>
        {node.children.map((child) => renderNode(child, depth + 1))}
        {isLantai && isExpanded && (
          loadingRooms.has(node.id) ? (
            <p className="text-xs text-slate-400 py-2.5" style={{ paddingLeft: 12 + (depth + 1) * 20 }}>
              Memuat ruangan...
            </p>
          ) : !rooms || rooms.length === 0 ? (
            <p className="text-xs text-slate-400 py-2.5" style={{ paddingLeft: 12 + (depth + 1) * 20 }}>
              Belum ada ruangan di lantai ini.
            </p>
          ) : (
            rooms.map((room) => (
              <div
                key={room.id}
                className="flex items-center justify-between gap-2 py-2.5 px-3 border-b border-slate-100"
                style={{ paddingLeft: 12 + (depth + 1) * 20 }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-slate-500 shrink-0">{TYPE_ICON.ruangan}</span>
                  <span className="font-semibold text-sm text-slate-800 truncate">{room.nama}</span>
                  <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-600 uppercase shrink-0">
                    {TYPE_LABEL.ruangan}
                  </span>
                  <WarehouseBadge isWarehouse={room.isWarehouse} />
                  <AssetCountBadge count={assetCounts[room.id]} />
                </div>
                {renderActions(room)}
              </div>
            ))
          )
        )}
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
        <div className="flex gap-2 sm:items-center">
          <div className="flex items-center gap-2 border border-transparent sm:border-slate-200 rounded-full sm:rounded-lg px-3.5 sm:px-3 min-h-11 flex-1 sm:w-64 bg-slate-100 sm:bg-white focus-within:bg-white focus-within:border-slate-300 transition-colors">
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
              className="btn-primary px-3 rounded-lg text-xs font-bold tracking-wide shadow-sm min-h-11 shrink-0 flex items-center justify-center gap-1.5"
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
                onChange={(e) => { setTipe(e.target.value as LocationType); setGedungId(''); setParentId(''); }}
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
            {tipe === 'ruangan' && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Gedung</label>
                <select
                  className="w-full p-2 border border-slate-200 rounded-lg text-base sm:text-xs min-h-11"
                  required
                  value={gedungId}
                  onChange={(e) => { setGedungId(e.target.value); setParentId(''); }}
                >
                  <option value="" disabled>Pilih Gedung</option>
                  {gedungOptions.map((g) => <option key={g.id} value={g.id}>{g.nama}</option>)}
                </select>
              </div>
            )}
            {tipe !== 'gedung' && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Induk Lokasi ({TYPE_LABEL[PARENT_TYPE[tipe]!]})
                </label>
                <select
                  className="w-full p-2 border border-slate-200 rounded-lg text-base sm:text-xs min-h-11 disabled:bg-slate-50 disabled:text-slate-400"
                  required
                  disabled={tipe === 'ruangan' && !gedungId}
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                >
                  <option value="" disabled>
                    {tipe === 'ruangan' && !gedungId ? 'Pilih gedung dahulu' : `Pilih ${TYPE_LABEL[PARENT_TYPE[tipe]!]}`}
                  </option>
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
        {searchResults !== null ? (
          searching ? (
            <p className="text-slate-500 text-sm text-center py-6">Mencari...</p>
          ) : searchResults.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-6">Tidak ada lokasi yang cocok dengan pencarian.</p>
          ) : (
            searchResults.map((l) => (
              <div key={l.id} className="flex items-center justify-between gap-2 py-2.5 px-3 border-b border-slate-100">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-slate-500 shrink-0">{TYPE_ICON[l.tipe]}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-sm text-slate-800 truncate">{l.nama}</span>
                      <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-600 uppercase shrink-0">
                        {TYPE_LABEL[l.tipe]}
                      </span>
                      <WarehouseBadge isWarehouse={l.isWarehouse} />
                      <AssetCountBadge count={assetCounts[l.id]} />
                    </div>
                    {l.parent && <p className="text-[11px] text-slate-500 truncate">{l.parent.nama}</p>}
                  </div>
                </div>
                {renderActions(l)}
              </div>
            ))
          )
        ) : tree.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-6">Belum ada lokasi. Buat gedung pertama.</p>
        ) : (
          tree.map((node) => renderNode(node, 0))
        )}
      </div>

      {assetModalLocation && (
        <RoomAssetsModal location={assetModalLocation} onClose={() => setAssetModalLocation(null)} />
      )}
    </>
  );
}
