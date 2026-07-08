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
      <div className="page-header">
        <div>
          <h1 className="page-title">Pelacakan Perpindahan & Riwayat</h1>
          <p className="page-subtitle">Mencatat mutasi fisik ruang, pergantian pemegang aset, dan riwayat kondisi otomatis.</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowPanel(v => !v)}
        >
          {showPanel ? <X size={14} /> : null}
          {showPanel ? 'Tutup Form' : '+ Mutasi Aset'}
        </button>
      </div>

      {/* Mutasi Form Panel */}
      {showPanel && (
        <div className="accordion-form" style={{ maxWidth: 520 }}>
          <div className="accordion-form__header">
            <h3 style={{ margin: 0, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}>
              Form Mutasi Aset
            </h3>
            <button className="btn-icon" onClick={() => setShowPanel(false)}><X size={14} /></button>
          </div>
          <form style={{ display: 'flex', flexDirection: 'column', gap: 14 }} onSubmit={handleTransfer}>
            <div className="form-group">
              <label className="form-label required">Pilih Aset</label>
              <select className="form-select" value={selectedAssetId} onChange={e => setSelectedAssetId(e.target.value)} required>
                <option value="">-- Pilih Aset --</option>
                {assets.map(a => (
                  <option key={a.id} value={a.id}>{a.nama} ({a.kode})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label required">Lokasi Ruangan Baru</label>
              <select className="form-select" value={newLoc} onChange={e => setNewLoc(e.target.value)}>
                {rooms.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label required">Nama Pemegang Baru</label>
              <input className="form-input" placeholder="Contoh: Prof. Siti Aminah"
                value={newHolder} onChange={e => setNewHolder(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label required">Alasan Perpindahan / Catatan</label>
              <textarea className="form-textarea" placeholder="Contoh: Penataan ulang meja lab programming"
                value={notes} onChange={e => setNotes(e.target.value)} required />
            </div>
            <div className="form-footer">
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowPanel(false)}>Batal</button>
              <button type="submit" className="btn btn-primary btn-sm">Simpan Mutasi</button>
            </div>
          </form>
        </div>
      )}

      {/* Timeline */}
      <div className="card">
        <h3 className="card__title">Log Riwayat Perpindahan Aset Global</h3>
        {movements.length === 0 ? (
          <p style={{ fontSize: 12, color: '#94a3b8' }}>Belum ada riwayat mutasi.</p>
        ) : (
          <div className="timeline">
            {movements.map(m => {
              const asset = assets.find(a => a.id === m.assetId);
              return (
                <div key={m.id} className="timeline-item">
                  <span className="timeline-item__date">{m.date}</span>
                  <p className="timeline-item__title">
                    {asset?.nama ?? 'Aset'}{' '}
                    <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#94a3b8' }}>
                      ({asset?.kode ?? ''})
                    </span>
                  </p>
                  <p className="timeline-item__desc">
                    Mutasi: <strong style={{ color: '#334155' }}>{m.from}</strong>
                    {' → '}
                    <strong style={{ color: '#334155' }}>{m.to}</strong>
                  </p>
                  <span className="timeline-item__desc">
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
