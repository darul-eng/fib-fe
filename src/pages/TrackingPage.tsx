import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronDown, History, MapPin, MessageSquare, Search, Shuffle, User, X } from 'lucide-react';
import { ApiError, getAssetByToken, listAssets, listMovements, moveAsset } from '../api/client';
import type { Asset, AssetCondition, Movement } from '../api/client';
import { showToast } from '../components/ToastContainer';
import { RoomSelect } from '../components/RoomSelect';

const KONDISI_LABEL: Record<AssetCondition, string> = {
  baik: 'Baik',
  rusak_ringan: 'Rusak Ringan',
  rusak_berat: 'Rusak Berat',
  perbaikan: 'Dalam Perbaikan',
  dihapus: 'Dihapus',
};

const KONDISI_BADGE: Record<AssetCondition, string> = {
  baik: 'bg-green-100 text-green-800',
  rusak_ringan: 'bg-yellow-100 text-yellow-800',
  rusak_berat: 'bg-red-100 text-red-800',
  perbaikan: 'bg-amber-100 text-amber-800',
  dihapus: 'bg-red-100 text-red-800',
};

const KONDISI_OPTIONS: AssetCondition[] = ['baik', 'rusak_ringan', 'rusak_berat', 'perbaikan'];

const LIST_LIMIT = 20;
const HISTORY_LIMIT = 50;

const FIELD_BASE =
  'w-full py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white outline-none text-base sm:text-xs min-h-11';
const FIELD_CLASS = `${FIELD_BASE} pl-8 pr-2`;
const SELECT_CLASS_PLAIN = `${FIELD_BASE} pl-2 pr-8 appearance-none`;

function MovementEntry({ m }: { m: Movement }) {
  return (
    <div className="relative">
      <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-slate-300" />
      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide block mb-0.5">
        {new Date(m.createdAt).toLocaleString('id-ID')}
      </span>
      <p className="text-xs font-bold text-slate-800">
        {m.asset.nama}{' '}
        <span className="font-mono text-[10px] text-slate-400 font-normal">({m.asset.kode})</span>
      </p>
      <div className="text-[11px] text-slate-500 mt-0.5 space-y-0.5">
        {m.toLocationId !== null && (
          <p>
            Lokasi: <strong className="text-slate-700 font-semibold">{m.fromLocation?.nama ?? '—'}</strong>
            {' → '}
            <strong className="text-slate-700 font-semibold">{m.toLocation?.nama ?? '—'}</strong>
          </p>
        )}
        {(m.fromPersonId !== null || m.toPersonId !== null) && (
          <p>
            Pemegang: <strong className="text-slate-700 font-semibold">{m.fromPerson?.nama ?? '—'}</strong>
            {' → '}
            <strong className="text-slate-700 font-semibold">{m.toPerson?.nama ?? '—'}</strong>
          </p>
        )}
        {m.toKondisi !== null && (
          <p>
            Kondisi: <strong className="text-slate-700 font-semibold">{m.fromKondisi ? KONDISI_LABEL[m.fromKondisi] : '—'}</strong>
            {' → '}
            <strong className="text-slate-700 font-semibold">{KONDISI_LABEL[m.toKondisi]}</strong>
          </p>
        )}
      </div>
      <span className="text-[11px] text-slate-500 mt-0.5 block">
        {m.catatan ? `Alasan: "${m.catatan}" · ` : ''}Diinput oleh: {m.movedBy?.nama ?? 'Sistem'}
      </span>
    </div>
  );
}

export default function TrackingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const [showPanel, setShowPanel] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerResults, setPickerResults] = useState<Asset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [showAssetResults, setShowAssetResults] = useState(false);
  const [newLoc, setNewLoc] = useState('');
  const [newHolder, setNewHolder] = useState('');
  const [newKondisi, setNewKondisi] = useState('');
  const [notes, setNotes] = useState('');
  const assetBoxRef = useRef<HTMLDivElement>(null);

  const [historyAsset, setHistoryAsset] = useState<Asset | null>(null);
  const [historyMovements, setHistoryMovements] = useState<Movement[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / LIST_LIMIT));

  function loadAssets() {
    setLoading(true);
    listAssets({ search: search || undefined, page, limit: LIST_LIMIT })
      .then((res) => {
        setAssets(res.data);
        setTotal(res.total);
      })
      .catch(() => showToast('Gagal memuat daftar aset', 'danger'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadAssets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    loadAssets();
  }

  // Dibuka dari hasil scan QR (Header) — /mutasi?assetToken=... langsung membuka form mutasi terisi.
  useEffect(() => {
    const token = searchParams.get('assetToken');
    if (!token) return;
    setSearchParams({}, { replace: true });
    getAssetByToken(token)
      .then((asset) => openPanel(asset))
      .catch(() => showToast('Aset dari QR tidak ditemukan', 'danger'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    if (selectedAsset) return;
    const timeout = setTimeout(() => {
      listAssets({ search: pickerSearch || undefined, limit: 20 })
        .then((res) => setPickerResults(res.data))
        .catch(() => showToast('Gagal memuat daftar aset', 'danger'));
    }, 300);
    return () => clearTimeout(timeout);
  }, [pickerSearch, selectedAsset]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (assetBoxRef.current && !assetBoxRef.current.contains(e.target as Node)) setShowAssetResults(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function resetForm() {
    setSelectedAsset(null);
    setPickerSearch('');
    setShowAssetResults(false);
    setNewLoc('');
    setNewHolder('');
    setNewKondisi('');
    setNotes('');
  }

  function selectAsset(a: Asset) {
    setSelectedAsset(a);
    setPickerSearch(`${a.nama} (${a.kode})`);
    setShowAssetResults(false);
  }

  function openPanel(asset?: Asset) {
    resetForm();
    if (asset) selectAsset(asset);
    setShowPanel(true);
  }

  function closePanel() {
    setShowPanel(false);
    resetForm();
  }

  async function handleTransfer(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedAsset) return;

    setSaving(true);
    try {
      const result = await moveAsset({
        assetId: selectedAsset.id,
        locationId: newLoc || undefined,
        holderName: newHolder || undefined,
        kondisi: (newKondisi as AssetCondition) || undefined,
        catatan: notes || undefined,
      });
      closePanel();
      loadAssets();
      if (historyAsset?.id === result.asset.id) openHistory(result.asset);
      showToast(`Mutasi ${result.asset.nama} berhasil direkam`);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Gagal menyimpan mutasi';
      showToast(message, 'danger');
    } finally {
      setSaving(false);
    }
  }

  function openHistory(asset: Asset) {
    setHistoryAsset(asset);
    setHistoryLoading(true);
    listMovements({ assetId: asset.id, limit: HISTORY_LIMIT })
      .then((res) => setHistoryMovements(res.data))
      .catch(() => showToast('Gagal memuat riwayat aset', 'danger'))
      .finally(() => setHistoryLoading(false));
  }

  function closeHistory() {
    setHistoryAsset(null);
    setHistoryMovements([]);
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
        <div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight">Pelacakan Perpindahan & Riwayat</h2>
          <p className="text-[11px] sm:text-xs text-slate-500">Pilih aset untuk melihat riwayat mutasinya, atau catat mutasi baru.</p>
        </div>
        <button
          className="btn-primary px-2.5 py-1.5 sm:px-3 rounded-lg text-xs font-bold tracking-wide shadow-sm min-h-11 flex items-center gap-1.5 w-full sm:w-auto justify-center"
          onClick={() => openPanel()}
        >
          <Shuffle size={14} /> Mutasi Aset
        </button>
      </div>

      <form onSubmit={handleSearchSubmit} className="relative mb-4 sm:mb-6 max-w-sm">
        <Search size={16} className="text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Cari nama / kode aset..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-8 pr-3 min-h-11 text-base sm:text-xs border border-slate-200 rounded-lg bg-white outline-none"
        />
      </form>

      {/* Asset list — table di desktop, kartu di mobile */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="p-3">Aset</th>
                <th className="p-3">Lokasi</th>
                <th className="p-3">Pemegang</th>
                <th className="p-3">Kondisi</th>
                <th className="p-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {!loading && assets.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-slate-400 py-10">
                    Tidak ada aset ditemukan.
                  </td>
                </tr>
              ) : (
                assets.map((a) => (
                  <tr key={a.id}>
                    <td className="p-3">
                      <strong className="block text-slate-800">{a.nama}</strong>
                      <span className="font-mono text-[10px] text-slate-400">{a.kode}</span>
                    </td>
                    <td className="p-3 text-slate-700">{a.location?.nama ?? '—'}</td>
                    <td className="p-3 font-medium text-slate-700">{a.person?.nama ?? '—'}</td>
                    <td className="p-3">
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${KONDISI_BADGE[a.kondisi]}`}>
                        {KONDISI_LABEL[a.kondisi]}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1 justify-end">
                        <button className="p-1 hover:bg-slate-100 rounded text-slate-500" title="Riwayat" onClick={() => openHistory(a)}>
                          <History size={15} />
                        </button>
                        <button className="p-1 hover:bg-slate-100 rounded text-slate-500" title="Mutasi" onClick={() => openPanel(a)}>
                          <Shuffle size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 lg:hidden bg-slate-50/50">
          {assets.map((a) => (
            <div key={a.id} className="bg-white p-3 rounded-lg border border-slate-200">
              <div className="flex justify-between items-start mb-2">
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${KONDISI_BADGE[a.kondisi]}`}>
                  {KONDISI_LABEL[a.kondisi]}
                </span>
              </div>
              <p className="text-xs sm:text-sm font-bold text-slate-800">{a.nama}</p>
              <p className="font-mono text-[10px] text-slate-400">{a.kode}</p>
              <div className="text-xs text-slate-500 mt-2 space-y-0.5">
                <div>Lokasi: <strong className="text-slate-800">{a.location?.nama ?? '—'}</strong></div>
                <div>Pemegang: <strong className="text-slate-800">{a.person?.nama ?? '—'}</strong></div>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  className="flex-1 min-h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center justify-center gap-1"
                  onClick={() => openHistory(a)}
                >
                  <History size={13} /> Riwayat
                </button>
                <button
                  className="flex-1 min-h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center justify-center gap-1"
                  onClick={() => openPanel(a)}
                >
                  <Shuffle size={13} /> Mutasi
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
            <span>Halaman {page} dari {totalPages} · {total} aset</span>
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

      {/* Mutasi Form Modal */}
      {showPanel && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 overflow-y-auto" onClick={closePanel}>
          <div className="min-h-full flex items-center justify-center p-4">
            <div
              className="bg-white rounded-xl max-w-md w-full border border-slate-200 p-4 sm:p-5 shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-3 pb-3 mb-3.5 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary-tint text-primary flex items-center justify-center shrink-0">
                    <Shuffle size={16} />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-800">Mutasi Aset</h3>
                    <p className="text-[11px] text-slate-500">Pindahkan lokasi, pemegang, atau kondisi</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="p-2 hover:bg-slate-100 rounded-md text-slate-500 min-h-11 min-w-11 flex items-center justify-center shrink-0"
                  onClick={closePanel}
                >
                  <X size={14} />
                </button>
              </div>

              <form className="flex flex-col gap-3.5" onSubmit={handleTransfer}>
                <div className="flex flex-col gap-1.5" ref={assetBoxRef}>
                  <label className="text-xs font-semibold text-slate-600">Cari & Pilih Aset*</label>
                  <div className="relative">
                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      className={FIELD_CLASS}
                      placeholder="Ketik nama atau kode aset..."
                      value={pickerSearch}
                      onChange={(e) => {
                        setPickerSearch(e.target.value);
                        setSelectedAsset(null);
                        setShowAssetResults(true);
                      }}
                      onFocus={() => {
                        if (!selectedAsset) setShowAssetResults(true);
                      }}
                      required
                    />
                    {showAssetResults && pickerResults.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {pickerResults.map((a) => (
                          <button
                            key={a.id}
                            type="button"
                            className="w-full min-h-11 flex items-center justify-between gap-2 px-3 py-2 text-left hover:bg-slate-50 text-xs"
                            onClick={() => selectAsset(a)}
                          >
                            <span className="font-semibold text-slate-800 truncate">{a.nama}</span>
                            <span className="text-[10px] text-slate-400 font-mono shrink-0">{a.kode}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {selectedAsset && (
                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-md text-[10px] font-semibold text-slate-600">
                        <MapPin size={11} /> {selectedAsset.location?.nama ?? 'Tanpa lokasi'}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-md text-[10px] font-semibold text-slate-600">
                        <User size={11} /> {selectedAsset.person?.nama ?? 'Tanpa pemegang'}
                      </span>
                      <span className={`px-2 py-1 rounded-md text-[10px] font-semibold ${KONDISI_BADGE[selectedAsset.kondisi]}`}>
                        {KONDISI_LABEL[selectedAsset.kondisi]}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600">Lokasi Ruangan Baru</label>
                  <RoomSelect value={newLoc} onChange={(id) => setNewLoc(id)} placeholder="Kosongkan bila tidak diubah" />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600">Nama Pemegang Baru</label>
                  <div className="relative">
                    <User size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      className={FIELD_CLASS}
                      placeholder="Kosongkan bila tidak diubah"
                      value={newHolder}
                      onChange={(e) => setNewHolder(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600">Kondisi Baru</label>
                  <div className="relative">
                    <select className={SELECT_CLASS_PLAIN} value={newKondisi} onChange={(e) => setNewKondisi(e.target.value)}>
                      <option value="">-- Tidak diubah --</option>
                      {KONDISI_OPTIONS.map((k) => <option key={k} value={k}>{KONDISI_LABEL[k]}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600">Catatan</label>
                  <div className="relative">
                    <MessageSquare size={14} className="absolute left-2.5 top-2.5 text-slate-400 pointer-events-none" />
                    <textarea
                      className={`${FIELD_CLASS} h-20`}
                      placeholder="Contoh: Penataan ulang meja lab programming"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-1">
                  <button
                    type="button"
                    className="px-2.5 py-1.5 sm:px-3 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 min-h-11"
                    onClick={closePanel}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="btn-primary px-3 py-1.5 sm:px-4 rounded-lg text-xs font-bold tracking-wide shadow-sm min-h-11 disabled:opacity-60"
                    disabled={saving || !selectedAsset}
                  >
                    {saving ? 'Menyimpan...' : 'Simpan Mutasi'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Riwayat Aset Modal */}
      {historyAsset && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 overflow-y-auto" onClick={closeHistory}>
          <div className="min-h-full flex items-center justify-center p-4">
            <div
              className="bg-white rounded-xl max-w-lg w-full border border-slate-200 p-4 sm:p-5 shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-3 pb-3 mb-3.5 border-b border-slate-100">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-primary-tint text-primary flex items-center justify-center shrink-0">
                    <History size={16} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-800 truncate">{historyAsset.nama}</h3>
                    <p className="text-[11px] text-slate-500 font-mono">{historyAsset.kode}</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="p-2 hover:bg-slate-100 rounded-md text-slate-500 min-h-11 min-w-11 flex items-center justify-center shrink-0"
                  onClick={closeHistory}
                >
                  <X size={14} />
                </button>
              </div>

              {historyLoading ? (
                <p className="text-xs text-slate-400">Memuat riwayat...</p>
              ) : historyMovements.length === 0 ? (
                <p className="text-xs text-slate-400">Belum ada riwayat mutasi untuk aset ini.</p>
              ) : (
                <div className="border-l-2 border-slate-100 pl-4 ml-2 space-y-4 max-h-[60vh] overflow-y-auto">
                  {historyMovements.map((m) => <MovementEntry key={m.id} m={m} />)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
