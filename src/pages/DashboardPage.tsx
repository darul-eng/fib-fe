import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, MapPin, Activity } from 'lucide-react';
import { ASSETS_INIT, LOCATIONS, MOVEMENTS_INIT } from '../data/mockData';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [assets] = useState(ASSETS_INIT);
  const [movements] = useState(MOVEMENTS_INIT);

  const totalAssets    = assets.length;
  const totalValuation = assets.reduce((s, a) => s + a.harga_beli, 0);
  const conditionGood  = assets.filter(a => a.kondisi === 'Baik').length;
  const conditionAlert = assets.filter(a => a.kondisi !== 'Baik').length;

  const rooms = LOCATIONS.filter(l => l.type === 'Ruangan');

  return (
    <>
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Ikhtisar Inventaris</h1>
          <p className="text-xs text-slate-500">Pemantauan sebaran, kondisi fisik, dan nilai buku aset Fakultas.</p>
        </div>
        <button
          className="btn-primary min-h-11 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold tracking-wide shadow-sm w-full sm:w-auto"
          onClick={() => navigate('/aset')}
        >
          <Plus size={16} /> Tambah Aset
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
        <div className="bg-white p-3.5 rounded-lg border border-slate-200">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Aset Fisik</span>
          <strong className="text-2xl font-black mt-1 block">{totalAssets}</strong>
          <span className="text-[10px] text-green-600 font-medium mt-1 inline-flex items-center gap-0.5">100% Terinventaris</span>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-slate-200">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Valuasi Aset</span>
          <strong className="text-2xl font-black mt-1 block">Rp {(totalValuation / 1_000_000).toFixed(1)}M</strong>
          <span className="text-[10px] text-slate-500 block">Buku Neraca Aktif</span>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-slate-200">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Kondisi Baik</span>
          <strong className="text-2xl font-black text-green-700 mt-1 block">{conditionGood}</strong>
          <span className="text-[10px] text-slate-500 block">Siap Pakai Operasional</span>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-slate-200">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Butuh Perhatian</span>
          <strong className="text-2xl font-black text-amber-600 mt-1 block">{conditionAlert}</strong>
          <span className="text-[10px] text-slate-500 block">Rusak / Dalam Servis</span>
        </div>
      </div>

      {/* Main panel grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Room distribution */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <MapPin size={16} className="text-primary" />
            <h3 className="text-sm font-bold text-slate-800">Sebaran Lokasi Aset Terbesar</h3>
          </div>

          <div className="space-y-4">
            {rooms.map(loc => {
              const count   = assets.filter(a => a.locationId === loc.id).length;
              const percent = totalAssets ? (count / totalAssets) * 100 : 0;
              return (
                <div key={loc.id}>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-700">{loc.name}</span>
                    <span className="text-slate-500">{count} Aset ({percent.toFixed(0)}%)</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${percent}%`, backgroundColor: 'var(--color-primary)' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Stok Opname launcher */}
          <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <div>
              <h4 className="text-xs font-bold text-slate-700">Stok Opname Lapangan (Audit Fisik)</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Mulai sesi audit fisik ruangan berbasis pemindaian kode QR.
              </p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <select className="min-h-11 text-base sm:text-xs p-2 border border-slate-200 rounded-lg bg-white flex-1 sm:flex-none">
                {rooms.map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
              <button className="min-h-11 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold whitespace-nowrap">
                Mulai Audit
              </button>
            </div>
          </div>
        </div>

        {/* Recent activity */}
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-primary" />
              <h3 className="text-sm font-bold text-slate-800">Aktivitas Terakhir</h3>
            </div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Live Logs</span>
          </div>

          {movements.length === 0 ? (
            <p className="text-xs text-slate-400">Belum ada aktivitas terekam.</p>
          ) : (
            <div className="border-l-2 border-slate-100 pl-4 ml-2 space-y-4">
              {movements.slice(0, 5).map(m => {
                const asset = assets.find(a => a.id === m.assetId);
                return (
                  <div key={m.id} className="relative">
                    <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-slate-300" />
                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">{m.date}</span>
                    <p className="text-xs font-bold text-slate-800 mt-0.5">{asset?.nama ?? 'Aset'}</p>
                    <p className="text-[11px] text-slate-500">{m.from} → {m.to}</p>
                    <span className="inline-block mt-1 px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-600 uppercase">
                      Mod: {m.by}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
