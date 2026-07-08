import { useState } from 'react';
import { CONSUMABLES_INIT, REQUESTS_INIT } from '../data/mockData';
import { showToast } from '../components/ToastContainer';

type Consumable = typeof CONSUMABLES_INIT[0];
type Request = typeof REQUESTS_INIT[0] & { status: string };

function statusBadge(status: string) {
  if (status === 'Diajukan')  return 'badge badge-blue';
  if (status === 'Disetujui') return 'badge badge-amber';
  if (status === 'Diserahkan')return 'badge badge-green';
  if (status === 'Ditolak')   return 'badge badge-red';
  return 'badge badge-slate';
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
      <div className="page-header">
        <div>
          <span className="section-badge section-badge-emerald">FASE 2 — MODUL PERSEDIAAN GUDANG</span>
          <h1 className="page-title">Gudang & Tata Usaha (Barang Habis Pakai)</h1>
          <p className="page-subtitle">Mencatat kertas, galon, staples, dan spidol habis pakai. Terkoneksi dengan ledger / kartu stok otomatis.</p>
        </div>
      </div>

      <div className="grid-3-split">
        {/* Left: Request Form */}
        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <h3 className="card__title">Ajukan Permintaan Barang (Form Pemohon)</h3>
            <form style={{ display: 'flex', flexDirection: 'column', gap: 12 }} onSubmit={handleRequest}>
              <div className="form-group">
                <label className="form-label required">Pilih Barang Habis Pakai</label>
                <select className="form-select" value={fItem} onChange={e => setFItem(e.target.value)}>
                  {consumables.map(c => (
                    <option key={c.id} value={c.id}>{c.name} (Stok: {c.stock} {c.unit})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label required">Jumlah Unit</label>
                <input type="number" className="form-input" min={1} value={fQty}
                  onChange={e => setFQty(parseInt(e.target.value))} required />
              </div>
              <div className="form-group">
                <label className="form-label required">Divisi / Jurusan Pemohon</label>
                <input className="form-input" placeholder="Contoh: Jurusan Fisika"
                  value={fBy} onChange={e => setFBy(e.target.value)} required />
              </div>
              <button type="submit" className="btn btn-dark">Kirim Pengajuan Permintaan</button>
            </form>
          </div>

          {/* Top consumers */}
          <div className="card">
            <h3 className="card__title">Top 3 Konsumen Teraktif</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { rank: 1, name: 'Tata Usaha Utama', count: 42 },
                { rank: 2, name: 'Jurusan Kimia',    count: 28 },
                { rank: 3, name: 'Jurusan Biologi',  count: 14 },
              ].map(item => (
                <div key={item.rank} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ fontWeight: 600, color: '#334155' }}>{item.rank}. {item.name}</span>
                  <span style={{ fontWeight: 700, color: '#1e293b' }}>{item.count} Transaksi</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Ledger + Approvals */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Ledger Cards */}
          <div className="card">
            <h3 className="card__title">Kartu Stok (Ledger Saldo Aktif)</h3>
            <div className="ledger-grid">
              {consumables.map(c => {
                const low = c.stock <= c.minStock;
                return (
                  <div key={c.id} className="ledger-card">
                    <div>
                      <p className="ledger-card__name">{c.name}</p>
                      <p className="ledger-card__min">Min. Safe Stock: {c.minStock} {c.unit}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <strong className={`ledger-card__stock${low ? ' low' : ''}`}>
                        {c.stock} {c.unit}
                      </strong>
                      {low && <span className="ledger-card__alert">Stok Menipis</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Approval Flow */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 className="card__title" style={{ margin: 0 }}>Alur Permintaan Aktif (Tata Usaha Panel)</h3>
              <span style={{ fontSize: 10, color: '#94a3b8' }}>Verifikasi berkas persediaan TU</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {requests.map(r => (
                <div key={r.id} className="approval-row">
                  <div>
                    <div className="approval-row__meta">
                      <span className="approval-row__date">{r.date}</span>
                      <span className={statusBadge(r.status)}>{r.status}</span>
                    </div>
                    <p className="approval-row__title" style={{ margin: '2px 0' }}>
                      {r.item} (Qty: {r.quantity} {r.unit})
                    </p>
                    <p className="approval-row__by">Diajukan oleh: {r.requestedBy}</p>
                  </div>
                  <div className="approval-row__actions">
                    {r.status === 'Diajukan' && (
                      <>
                        <button className="btn btn-dark btn-xs" onClick={() => updateStatus(r.id, 'Disetujui')}>
                          Setujui
                        </button>
                        <button className="btn btn-outline btn-xs" onClick={() => updateStatus(r.id, 'Ditolak')}>
                          Tolak
                        </button>
                      </>
                    )}
                    {r.status === 'Disetujui' && (
                      <button className="btn btn-primary btn-xs" onClick={() => disbursed(r.id)}>
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
