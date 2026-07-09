import { useState } from 'react';
import { X } from 'lucide-react';
import { ASSETS_INIT, LOCATIONS, MOVEMENTS_INIT } from '../data/mockData';
import { showToast } from '../components/ToastContainer';

type Movement = typeof MOVEMENTS_INIT[0];

export default function TrackingPage() {
  const [assets] = useState(ASSETS_INIT);
  const [movements, setMovements] = useState<Movement[]>(MOVEMENTS_INIT);
  const [showPanel, setShowPanel] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [newLoc, setNewLoc] = useState(LOCATIONS.filter(l => l.type === 'Ruangan')[0]?.id ?? '');
  const [newHolder, setNewHolder] = useState('');
  const [notes, setNotes] = useState('');

  const rooms = LOCATIONS.filter(l => l.type === 'Ruangan');

  function getLocName(id: string) {
    return LOCATIONS.find(l => l.id === id)?.name ?? '—';
  }

  function handleTransfer(e: React.FormEvent) {
    e.preventDefault();
    const asset = assets.find(a => a.id === selectedAssetId);
    if (!asset) return;
    const from = getLocName(asset.locationId);
    const to   = getLocName(newLoc);
    const newMov: Movement = {
      id: 'm-' + Date.now(),
      assetId: selectedAssetId,
      type: 'Lokasi',
      from, to,
      by: 'Admin (SIMAF)',
      date: new Date().toISOString().split('T')[0],
      notes: notes || 'Mutasi reguler',
    };
    setMovements(prev => [newMov, ...prev]);
    setShowPanel(false);
    setNotes('');
    showToast(`Mutasi lokasi ${asset.nama} sukses direkam`);
  }

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Pelacakan Perpindahan & Riwayat</h2>
          <p className="text-xs text-slate-500">Mencatat mutasi fisik ruang, pergantian pemegang aset, dan riwayat kondisi otomatis.</p>
        </div>
        <button
          className="btn-primary px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide shadow-sm min-h-11 flex items-center gap-1.5"
          onClick={() => setShowPanel(v => !v)}
        >
          {showPanel ? <X size={14} /> : null}
          {showPanel ? 'Tutup Form' : '+ Mutasi Aset'}
        </button>
      </div>

      {/* Mutasi Form Panel */}
      {showPanel && (
        <div className="bg-white p-4 rounded-lg border border-slate-200 mb-6 max-w-lg">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100 mb-3">
            <h3 className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
              Form Mutasi Aset
            </h3>
            <button
              type="button"
              className="p-2 hover:bg-slate-100 rounded-md text-slate-600 min-h-11 min-w-11 flex items-center justify-center"
              onClick={() => setShowPanel(false)}
            >
              <X size={14} />
            </button>
          </div>
          <form className="flex flex-col gap-3.5" onSubmit={handleTransfer}>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600">Pilih Aset*</label>
              <select
                className="p-2 border border-slate-200 rounded-lg outline-none text-base sm:text-xs min-h-11"
                value={selectedAssetId}
                onChange={e => setSelectedAssetId(e.target.value)}
                required
              >
                <option value="">-- Pilih Aset --</option>
                {assets.map(a => (
                  <option key={a.id} value={a.id}>{a.nama} ({a.kode})</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600">Lokasi Ruangan Baru*</label>
              <select
                className="p-2 border border-slate-200 rounded-lg outline-none text-base sm:text-xs min-h-11"
                value={newLoc}
                onChange={e => setNewLoc(e.target.value)}
              >
                {rooms.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600">Nama Pemegang Baru*</label>
              <input
                className="p-2 border border-slate-200 rounded-lg outline-none text-base sm:text-xs min-h-11"
                placeholder="Contoh: Prof. Siti Aminah"
                value={newHolder}
                onChange={e => setNewHolder(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600">Alasan Perpindahan / Catatan*</label>
              <textarea
                className="p-2 border border-slate-200 rounded-lg outline-none text-base sm:text-xs h-20"
                placeholder="Contoh: Penataan ulang meja lab programming"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                required
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                className="px-3 py-1.5 border border-slate-200 rounded text-xs font-semibold text-slate-600 min-h-11"
                onClick={() => setShowPanel(false)}
              >
                Batal
              </button>
              <button
                type="submit"
                className="btn-primary px-4 py-1.5 rounded-lg text-xs font-bold tracking-wide shadow-sm min-h-11"
              >
                Simpan Mutasi
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Timeline */}
      <div className="bg-white p-4 rounded-lg border border-slate-200">
        <h3 className="text-sm font-bold text-slate-800 mb-4">Log Riwayat Perpindahan Aset Global</h3>
        {movements.length === 0 ? (
          <p className="text-xs text-slate-400">Belum ada riwayat mutasi.</p>
        ) : (
          <div className="border-l-2 border-slate-100 pl-4 ml-2 space-y-4">
            {movements.map(m => {
              const asset = assets.find(a => a.id === m.assetId);
              return (
                <div key={m.id} className="relative">
                  <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-slate-300" />
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide block mb-0.5">
                    {m.date}
                  </span>
                  <p className="text-xs font-bold text-slate-800">
                    {asset?.nama ?? 'Aset'}{' '}
                    <span className="font-mono text-[10px] text-slate-400 font-normal">
                      ({asset?.kode ?? ''})
                    </span>
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Mutasi: <strong className="text-slate-700 font-semibold">{m.from}</strong>
                    {' → '}
                    <strong className="text-slate-700 font-semibold">{m.to}</strong>
                  </p>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">
                    Alasan: "{m.notes}" · Diinput oleh: {m.by}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
