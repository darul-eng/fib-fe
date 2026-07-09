import { useState } from 'react';
import { CONSUMABLES_INIT, REQUESTS_INIT } from '../data/mockData';
import { showToast } from '../components/ToastContainer';

type Consumable = typeof CONSUMABLES_INIT[0];
type Request = typeof REQUESTS_INIT[0] & { status: string };

function statusBadge(status: string): string {
  const base = 'rounded-full text-[10px] font-semibold px-2 py-0.5';
  if (status === 'Diajukan')   return `${base} bg-blue-100 text-blue-800`;
  if (status === 'Disetujui')  return `${base} bg-amber-100 text-amber-800`;
  if (status === 'Diserahkan') return `${base} bg-green-100 text-green-800`;
  if (status === 'Ditolak')    return `${base} bg-red-100 text-red-800`;
  return `${base} bg-slate-100 text-slate-700`;
}

export default function ConsumablesPage() {
  const [consumables, setConsumables] = useState<Consumable[]>(CONSUMABLES_INIT);
  const [requests, setRequests] = useState<Request[]>(REQUESTS_INIT);

  // Form state
  const [fItem, setFItem]   = useState(CONSUMABLES_INIT[0].id);
  const [fQty, setFQty]     = useState(1);
  const [fBy, setFBy]       = useState('');

  function handleRequest(e: React.FormEvent) {
    e.preventDefault();
    const item = consumables.find(c => c.id === fItem);
    if (!item) return;
    const newReq: Request = {
      id: 'req-' + Date.now(),
      item: item.name, quantity: fQty, unit: item.unit,
      requestedBy: fBy,
      date: new Date().toISOString().split('T')[0],
      status: 'Diajukan',
    };
    setRequests(prev => [newReq, ...prev]);
    setFBy(''); setFQty(1);
    showToast(`Permintaan ${item.name} berhasil diajukan`);
  }

  function updateStatus(id: string, status: string) {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    showToast(`Status diubah menjadi: ${status}`);
  }

  function disbursed(id: string) {
    const req = requests.find(r => r.id === id);
    if (!req) return;
    const item = consumables.find(c => c.name === req.item);
    if (item) {
      if (item.stock < req.quantity) {
        showToast('Stok gudang tidak mencukupi!', 'danger');
        return;
      }
      setConsumables(prev => prev.map(c => c.id === item.id ? { ...c, stock: c.stock - req.quantity } : c));
    }
    updateStatus(id, 'Diserahkan');
    showToast(`Barang diserahkan! Stok berkurang.`);
  }

  return (
    <>
      <div className="mb-4 sm:mb-6">
        <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded tracking-wider uppercase">
          FASE 2 — MODUL PERSEDIAAN GUDANG
        </span>
        <h1 className="text-lg sm:text-xl font-bold tracking-tight mt-1">Gudang & Tata Usaha (Barang Habis Pakai)</h1>
        <p className="text-[11px] sm:text-xs text-slate-500">Mencatat kertas, galon, staples, dan spidol habis pakai. Terkoneksi dengan ledger / kartu stok otomatis.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Request Form */}
        <div className="bg-white p-3 sm:p-4 rounded-lg border border-slate-200 h-fit">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 pb-2 border-b border-slate-100">
            Ajukan Permintaan Barang (Form Pemohon)
          </h3>
          <form className="space-y-4 text-xs" onSubmit={handleRequest}>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-slate-600">Pilih Barang Habis Pakai*</label>
              <select
                className="w-full p-2.5 border border-slate-200 rounded-lg bg-white outline-none text-base sm:text-xs min-h-11"
                value={fItem}
                onChange={e => setFItem(e.target.value)}
              >
                {consumables.map(c => (
                  <option key={c.id} value={c.id}>{c.name} (Stok: {c.stock} {c.unit})</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-slate-600">Jumlah Unit*</label>
              <input
                type="number"
                required
                min={1}
                value={fQty}
                onChange={e => setFQty(parseInt(e.target.value))}
                className="w-full p-2.5 border border-slate-200 rounded-lg outline-none text-base sm:text-xs min-h-11"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-slate-600">Divisi / Jurusan Pemohon*</label>
              <input
                type="text"
                required
                placeholder="Contoh: Jurusan Fisika"
                value={fBy}
                onChange={e => setFBy(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-lg outline-none text-base sm:text-xs min-h-11"
              />
            </div>
            <button type="submit" className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold min-h-11">
              Kirim Pengajuan Permintaan
            </button>
          </form>

          {/* Top consumers */}
          <div className="mt-6 pt-5 border-t border-slate-150">
            <h4 className="text-xs font-bold text-slate-700 mb-3 uppercase tracking-wider">Top 3 Konsumen Teraktif</h4>
            <div className="space-y-3">
              {[
                { rank: 1, name: 'Tata Usaha Utama', count: 42 },
                { rank: 2, name: 'Jurusan Kimia',    count: 28 },
                { rank: 3, name: 'Jurusan Biologi',  count: 14 },
              ].map(item => (
                <div key={item.rank} className="flex justify-between items-center text-xs">
                  <span className="text-slate-600 font-semibold">{item.rank}. {item.name}</span>
                  <span className="font-bold text-slate-800">{item.count} Transaksi</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Ledger + Approvals */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ledger Cards */}
          <div className="bg-white p-3 sm:p-4 rounded-lg border border-slate-200">
            <h3 className="text-xs sm:text-sm font-bold text-slate-800 mb-3">Kartu Stok (Ledger Saldo Aktif)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {consumables.map(c => {
                const low = c.stock <= c.minStock;
                return (
                  <div key={c.id} className="bg-slate-50 rounded-lg border border-slate-200 p-3 flex justify-between items-start gap-2">
                    <div>
                      <p className="text-xs font-bold text-slate-800">{c.name}</p>
                      <p className="text-[10px] text-slate-400">Min. Safe Stock: {c.minStock} {c.unit}</p>
                    </div>
                    <div className="text-right">
                      <strong className={`text-sm font-black ${low ? 'text-red-600' : 'text-slate-800'}`}>
                        {c.stock} {c.unit}
                      </strong>
                      {low && (
                        <div>
                          <span className="text-[10px] font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded-full">
                            Stok Menipis
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Approval Flow */}
          <div className="bg-white p-3 sm:p-4 rounded-lg border border-slate-200">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 mb-3">
              <h3 className="text-xs sm:text-sm font-bold text-slate-800">Alur Permintaan Aktif (Tata Usaha Panel)</h3>
              <span className="text-[10px] text-slate-400">Verifikasi berkas persediaan TU</span>
            </div>

            <div className="space-y-3">
              {requests.map(r => (
                <div key={r.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 font-semibold">{r.date}</span>
                      <span className={statusBadge(r.status)}>{r.status}</span>
                    </div>
                    <p className="text-xs font-bold text-slate-800 my-0.5">
                      {r.item} (Qty: {r.quantity} {r.unit})
                    </p>
                    <p className="text-[11px] text-slate-500">Diajukan oleh: {r.requestedBy}</p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {r.status === 'Diajukan' && (
                      <>
                        <button
                          className="bg-slate-800 hover:bg-slate-700 text-white px-2.5 py-1 rounded text-[11px] font-bold min-h-11 sm:min-h-0"
                          onClick={() => updateStatus(r.id, 'Disetujui')}
                        >
                          Setujui
                        </button>
                        <button
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-2.5 py-1 rounded text-[11px] font-bold min-h-11 sm:min-h-0"
                          onClick={() => updateStatus(r.id, 'Ditolak')}
                        >
                          Tolak
                        </button>
                      </>
                    )}
                    {r.status === 'Disetujui' && (
                      <button
                        className="btn-primary px-2.5 py-1 rounded text-[11px] font-bold min-h-11 sm:min-h-0"
                        onClick={() => disbursed(r.id)}
                      >
                        Serahkan Barang
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
