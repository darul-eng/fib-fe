import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, BarChart2, MapPin, Activity } from 'lucide-react';
import { ASSETS_INIT, LOCATIONS, MOVEMENTS_INIT, CATEGORIES } from '../data/mockData';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [assets] = useState(ASSETS_INIT);
  const [movements] = useState(MOVEMENTS_INIT);

  const totalAssets    = assets.length;
  const totalValuation = assets.reduce((s, a) => s + a.harga_beli, 0);
  const conditionGood  = assets.filter(a => a.kondisi === 'Baik').length;
  const conditionAlert = assets.filter(a => a.kondisi !== 'Baik').length;

  const rooms = LOCATIONS.filter(l => l.type === 'Ruangan');

  function getCatName(id: string) {
    return CATEGORIES.find(c => c.id === id)?.name ?? '—';
  }

  function getLocName(id: string) {
    return LOCATIONS.find(l => l.id === id)?.name ?? '—';
  }

  return (
    <>
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Ikhtisar Inventaris</h1>
          <p className="page-subtitle">Pemantauan sebaran, kondisi fisik, dan nilai buku aset Fakultas.</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/aset')}
        >
          <Plus size={16} /> Tambah Aset
        </button>
      </div>

      {/* Stats grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-card__label">Total Aset Fisik</span>
          <strong className="stat-card__value">{totalAssets}</strong>
          <span className="stat-card__sub green">100% Terinventaris</span>
        </div>
        <div className="stat-card">
          <span className="stat-card__label">Total Valuasi Aset</span>
          <strong className="stat-card__value">Rp {(totalValuation / 1_000_000).toFixed(1)}M</strong>
          <span className="stat-card__sub">Buku Neraca Aktif</span>
        </div>
        <div className="stat-card">
          <span className="stat-card__label">Kondisi Baik</span>
          <strong className="stat-card__value green">{conditionGood}</strong>
          <span className="stat-card__sub">Siap Pakai Operasional</span>
        </div>
        <div className="stat-card">
          <span className="stat-card__label">Butuh Perhatian</span>
          <strong className="stat-card__value amber">{conditionAlert}</strong>
          <span className="stat-card__sub">Rusak / Dalam Servis</span>
        </div>
      </div>

      {/* Main panel grid */}
      <div className="grid-3-main">
        {/* Room distribution */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <MapPin size={16} color="var(--color-primary)" />
            <h3 className="card__title" style={{ margin: 0 }}>Sebaran Lokasi Aset Terbesar</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {rooms.map(loc => {
              const count   = assets.filter(a => a.locationId === loc.id).length;
              const percent = totalAssets ? (count / totalAssets) * 100 : 0;
              return (
                <div key={loc.id} style={{ fontSize: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, marginBottom: 4 }}>
                    <span style={{ color: '#334155' }}>{loc.name}</span>
                    <span style={{ color: '#64748b' }}>{count} Aset ({percent.toFixed(0)}%)</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-bar__fill" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Stok Opname launcher */}
          <div className="divider" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <h4 style={{ fontSize: 12, fontWeight: 700, color: '#334155', margin: '0 0 2px' }}>
                Stok Opname Lapangan (Audit Fisik)
              </h4>
              <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>
                Mulai sesi audit fisik ruangan berbasis pemindaian kode QR.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <select className="filter-select" style={{ flex: 1 }}>
                {rooms.map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
              <button className="btn btn-dark btn-sm">Mulai Audit</button>
            </div>
          </div>
        </div>

        {/* Recent activity */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Activity size={16} color="var(--color-primary)" />
              <h3 className="card__title" style={{ margin: 0 }}>Aktivitas Terakhir</h3>
            </div>
            <span className="chip">Live Logs</span>
          </div>

          {movements.length === 0 ? (
            <p style={{ fontSize: 12, color: '#94a3b8' }}>Belum ada aktivitas terekam.</p>
          ) : (
            <div className="timeline">
              {movements.slice(0, 5).map(m => {
                const asset = assets.find(a => a.id === m.assetId);
                return (
                  <div key={m.id} className="timeline-item">
                    <span className="timeline-item__date">{m.date}</span>
                    <p className="timeline-item__title">{asset?.nama ?? 'Aset'}</p>
                    <p className="timeline-item__desc">{m.from} → {m.to}</p>
                    <span className="timeline-item__badge">Mod: {m.by}</span>
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
