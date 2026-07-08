import { useState } from 'react';
import { Plus, Search, Download, Printer, Copy, Shuffle, Eye, X } from 'lucide-react';
import { ASSETS_INIT, CATEGORIES, LOCATIONS, type Asset } from '../data/mockData';
import { showToast } from '../components/ToastContainer';

const CONDITIONS = ['Baik', 'Rusak Ringan', 'Rusak Berat', 'Dalam Perbaikan'] as const;

function conditionBadgeClass(kondisi: string) {
  if (kondisi === 'Baik')              return 'badge badge-green';
  if (kondisi === 'Rusak Ringan')      return 'badge badge-yellow';
  if (kondisi === 'Rusak Berat')       return 'badge badge-red';
  if (kondisi === 'Dalam Perbaikan')   return 'badge badge-amber';
  return 'badge badge-slate';
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>(ASSETS_INIT);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('All');
  const [filterCond, setFilterCond] = useState('All');

  // Form state
  const [fName, setFName] = useState('');
  const [fCat, setFCat]   = useState(CATEGORIES[0].id);
  const [fCond, setFCond] = useState<Asset['kondisi']>('Baik');
  const [fYear, setFYear] = useState(2026);
  const [fPrice, setFPrice] = useState('');
  const [fLoc, setFLoc]   = useState(LOCATIONS.filter(l => l.type === 'Ruangan')[0]?.id ?? '');
  const [fHolder, setFHolder] = useState('');

  const rooms = LOCATIONS.filter(l => l.type === 'Ruangan');

  function getCatName(id: string) {
    return CATEGORIES.find(c => c.id === id)?.name ?? '—';
  }
  function getLocName(id: string) {
    return LOCATIONS.find(l => l.id === id)?.name ?? '—';
  }

  const filtered = assets.filter(a => {
    const matchSearch = a.nama.toLowerCase().includes(search.toLowerCase()) ||
                        a.kode.toLowerCase().includes(search.toLowerCase());
    const matchCat    = filterCat === 'All' || a.categoryId === filterCat;
    const matchCond   = filterCond === 'All' || a.kondisi === filterCond;
    return matchSearch && matchCat && matchCond;
  });

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const cat = CATEGORIES.find(c => c.id === fCat);
    const prefix = cat ? cat.name.toUpperCase().substring(0, 3) : 'AST';
    const newId = `ast-${assets.length + 1}`;
    const newAsset: Asset = {
      id: newId,
      kode: `INV/MIPA/${fYear}/${prefix}-0${assets.length + 1}`,
      qr_token: 'ast-' + Math.random().toString(36).substring(2, 6),
      nama: fName,
      categoryId: fCat,
      kondisi: fCond,
      tahun_beli: fYear,
      harga_beli: parseInt(fPrice) || 0,
      sumber_dana: 'APBN',
      locationId: fLoc,
      holderName: fHolder || '-',
      attributes: {},
    };
    setAssets(prev => [newAsset, ...prev]);
    setShowForm(false);
    setFName(''); setFPrice(''); setFHolder('');
    showToast(`Aset "${newAsset.nama}" berhasil didaftarkan!`);
  }

  function cloneAsset(id: string) {
    const target = assets.find(a => a.id === id);
    if (!target) return;
    const cat = CATEGORIES.find(c => c.id === target.categoryId);
    const prefix = cat ? cat.name.toUpperCase().substring(0, 3) : 'AST';
    const newId  = `ast-${assets.length + 1}`;
    setAssets(prev => [...prev, {
      ...target,
      id: newId,
      kode: `INV/MIPA/${target.tahun_beli}/${prefix}-0${assets.length + 1}`,
      qr_token: 'ast-' + Math.random().toString(36).substring(2, 6),
      nama: `${target.nama} (Copy)`,
    }]);
    showToast(`Duplikasi "${target.nama}" berhasil!`);
  }

  return (
    <>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Manajemen Aset Tetap</h1>
          <p className="page-subtitle">Pencatatan data, duplikasi massal, cetak batch label QR, dan custom fields.</p>
        </div>

        {/* Toolbar */}
        <div className="toolbar">
          <div className="search-wrap">
            <Search size={15} />
            <input
              type="text"
              className="search-input"
              placeholder="Cari nama / kode..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <select
            className="filter-select"
            value={filterCat}
            onChange={e => setFilterCat(e.target.value)}
          >
            <option value="All">Semua Kategori</option>
            {CATEGORIES.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            className="filter-select"
            value={filterCond}
            onChange={e => setFilterCond(e.target.value)}
          >
            <option value="All">Semua Kondisi</option>
            {CONDITIONS.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <button
            className="btn btn-primary btn-sm"
            onClick={() => setShowForm(v => !v)}
          >
            <Plus size={14} />
            {showForm ? 'Batal' : 'Aset Baru'}
          </button>

          <button className="btn btn-dark btn-sm">
            <Download size={14} /> Import CSV
          </button>

          <button className="btn btn-outline btn-sm">
            <Printer size={14} /> Cetak QR
          </button>
        </div>
      </div>

      {/* Add Asset Form */}
      {showForm && (
        <div className="accordion-form">
          <div className="accordion-form__header">
            <h3 style={{ margin: 0, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}>
              Formulir Pendaftaran Aset Baru
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="accordion-form__tag">Auto-generate QR Token & Kode</span>
              <button className="btn-icon" onClick={() => setShowForm(false)}><X size={14} /></button>
            </div>
          </div>

          <form className="form-grid" onSubmit={handleSave}>
            <div className="form-group">
              <label className="form-label required">Nama Aset</label>
              <input className="form-input" required placeholder="Contoh: ThinkPad T14s"
                value={fName} onChange={e => setFName(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label required">Kategori</label>
              <select className="form-select" value={fCat} onChange={e => setFCat(e.target.value)}>
                {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label required">Kondisi Fisik</label>
              <select className="form-select" value={fCond} onChange={e => setFCond(e.target.value as Asset['kondisi'])}>
                {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label required">Tahun Perolehan</label>
              <input type="number" className="form-input" value={fYear}
                onChange={e => setFYear(parseInt(e.target.value))} />
            </div>
            <div className="form-group">
              <label className="form-label required">Harga Beli (Rp)</label>
              <input type="number" className="form-input" required placeholder="Contoh: 14000000"
                value={fPrice} onChange={e => setFPrice(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label required">Lokasi Ruang</label>
              <select className="form-select" value={fLoc} onChange={e => setFLoc(e.target.value)}>
                {rooms.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            <div className="form-group full">
              <label className="form-label required">Nama Pemegang</label>
              <input className="form-input" required placeholder="Contoh: Dr. Budi Santoso"
                value={fHolder} onChange={e => setFHolder(e.target.value)} />
            </div>
            <div className="form-footer">
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowForm(false)}>Batal</button>
              <button type="submit" className="btn btn-primary btn-sm">Simpan Aset</button>
            </div>
          </form>
        </div>
      )}

      {/* Asset Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Desktop Table */}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nama & Kode</th>
                <th>Kategori</th>
                <th>Kondisi</th>
                <th>Lokasi Ruang</th>
                <th>Pemegang</th>
                <th>Atribut</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: '#94a3b8', padding: 32 }}>
                    Tidak ada aset ditemukan.
                  </td>
                </tr>
              ) : filtered.map(a => (
                <tr key={a.id}>
                  <td>
                    <strong style={{ display: 'block', color: '#1e293b' }}>{a.nama}</strong>
                    <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#94a3b8' }}>{a.kode}</span>
                    <span style={{ fontSize: 10, color: '#2563eb', fontWeight: 600, display: 'block' }}>
                      Token: {a.qr_token}
                    </span>
                  </td>
                  <td><span className="chip">{getCatName(a.categoryId)}</span></td>
                  <td><span className={conditionBadgeClass(a.kondisi)}>{a.kondisi}</span></td>
                  <td style={{ color: '#334155' }}>{getLocName(a.locationId)}</td>
                  <td style={{ fontWeight: 500 }}>{a.holderName}</td>
                  <td style={{ fontSize: 10, color: '#64748b' }}>
                    {Object.entries(a.attributes).map(([k, v]) => (
                      <div key={k}>{k}: <strong>{v}</strong></div>
                    ))}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                      <button className="btn-icon" title="Duplikasi" onClick={() => cloneAsset(a.id)}>
                        <Copy size={15} />
                      </button>
                      <button className="btn-icon" title="Mutasi">
                        <Shuffle size={15} />
                      </button>
                      <button className="btn-icon" title="Preview QR">
                        <Eye size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="cards-grid">
          {filtered.map(a => (
            <div key={a.id} className="asset-card">
              <div className="asset-card__head">
                <div>
                  <span className="chip" style={{ marginBottom: 4 }}>{getCatName(a.categoryId)}</span>
                </div>
                <span className={conditionBadgeClass(a.kondisi)}>{a.kondisi}</span>
              </div>
              <div>
                <p className="asset-card__name">{a.nama}</p>
                <p className="asset-card__code">{a.kode}</p>
              </div>
              <div className="asset-card__meta">
                <div>Lokasi: <strong style={{ color: '#1e293b' }}>{getLocName(a.locationId)}</strong></div>
                <div>Pemegang: <strong style={{ color: '#1e293b' }}>{a.holderName}</strong></div>
              </div>
              <div className="asset-card__actions">
                <button className="btn btn-outline btn-xs" onClick={() => cloneAsset(a.id)}>
                  <Copy size={12} /> Clone
                </button>
                <button className="btn btn-dark btn-xs">
                  <Shuffle size={12} /> Mutasi
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <p style={{ fontSize: 12, color: '#94a3b8', gridColumn: '1/-1', textAlign: 'center', padding: 24 }}>
              Tidak ada aset ditemukan.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
