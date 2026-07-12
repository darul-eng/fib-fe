import { useEffect, useState } from 'react';
import { Activity, Download, PieChart as PieChartIcon, BarChart3 } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { apiGet } from '../api/client';
import type { AssetCondition, Category, DashboardQuery, DashboardStats, Location, Movement } from '../api/client';
import { getDashboardStats, downloadDashboardExport } from '../api/client';
import { showToast } from '../components/ToastContainer';
import { KONDISI_LABEL } from '../lib/kondisi';

const KONDISI_OPTIONS: AssetCondition[] = ['baik', 'rusak_ringan', 'rusak_berat', 'perbaikan'];

const KONDISI_COLOR: Record<AssetCondition, string> = {
  baik: '#16a34a',
  rusak_ringan: '#ca8a04',
  rusak_berat: '#dc2626',
  perbaikan: '#d97706',
  dihapus: '#94a3b8',
};

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function formatRupiah(value: number): string {
  return `Rp ${value.toLocaleString('id-ID')}`;
}

function movementLabel(m: Movement): string {
  if (m.tipe === 'lokasi') return `${m.fromLocation?.nama ?? '-'} → ${m.toLocation?.nama ?? '-'}`;
  if (m.tipe === 'pemegang') return `${m.fromPerson?.nama ?? '-'} → ${m.toPerson?.nama ?? '-'}`;
  return `${m.fromKondisi ? KONDISI_LABEL[m.fromKondisi] : '-'} → ${m.toKondisi ? KONDISI_LABEL[m.toKondisi] : '-'}`;
}

export default function DashboardPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterKondisi, setFilterKondisi] = useState('');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    apiGet<Category[]>('/categories').then(setCategories).catch(() => showToast('Gagal memuat kategori', 'danger'));
    apiGet<Location[]>('/locations').then(setLocations).catch(() => showToast('Gagal memuat lokasi', 'danger'));
  }, []);

  const query: DashboardQuery = {
    categoryId: filterCategory || undefined,
    locationId: filterLocation || undefined,
    kondisi: (filterKondisi || undefined) as AssetCondition | undefined,
  };

  useEffect(() => {
    setLoading(true);
    getDashboardStats(query)
      .then(setStats)
      .catch(() => showToast('Gagal memuat data dashboard', 'danger'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterCategory, filterLocation, filterKondisi]);

  async function handleExport() {
    setExporting(true);
    try {
      const blob = await downloadDashboardExport(query);
      downloadBlob(blob, 'laporan-aset.xlsx');
    } catch {
      showToast('Gagal mengekspor laporan', 'danger');
    } finally {
      setExporting(false);
    }
  }

  const conditionGood = stats?.conditionDistribution.find((c) => c.kondisi === 'baik')?.count ?? 0;
  const pieData =
    stats?.conditionDistribution.map((c) => ({ name: KONDISI_LABEL[c.kondisi], value: c.count, kondisi: c.kondisi })) ?? [];

  return (
    <>
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
        <div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight">Ikhtisar Inventaris</h1>
          <p className="text-[11px] sm:text-xs text-slate-500">Pemantauan sebaran, kondisi fisik, dan nilai buku aset Fakultas.</p>
        </div>
        <button
          className="bg-slate-800 hover:bg-slate-700 text-white min-h-11 flex items-center justify-center gap-1.5 px-3 py-2.5 sm:px-4 rounded-lg text-xs font-bold tracking-wide shadow-sm w-full sm:w-auto disabled:opacity-60"
          onClick={handleExport}
          disabled={exporting}
        >
          <Download size={16} /> {exporting ? 'Mengekspor...' : 'Ekspor Excel'}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4 sm:mb-6">
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="min-h-11 text-base sm:text-xs p-2 border border-slate-200 rounded-lg bg-white flex-1"
        >
          <option value="">Semua Kategori</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.nama}</option>
          ))}
        </select>
        <select
          value={filterLocation}
          onChange={(e) => setFilterLocation(e.target.value)}
          className="min-h-11 text-base sm:text-xs p-2 border border-slate-200 rounded-lg bg-white flex-1"
        >
          <option value="">Semua Lokasi</option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>{l.nama}</option>
          ))}
        </select>
        <select
          value={filterKondisi}
          onChange={(e) => setFilterKondisi(e.target.value)}
          className="min-h-11 text-base sm:text-xs p-2 border border-slate-200 rounded-lg bg-white flex-1"
        >
          <option value="">Semua Kondisi</option>
          {KONDISI_OPTIONS.map((k) => (
            <option key={k} value={k}>{KONDISI_LABEL[k]}</option>
          ))}
        </select>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-4 sm:mb-6">
        <div className="bg-white p-3 sm:p-3.5 rounded-lg border border-slate-200">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Aset Fisik</span>
          <strong className="text-xl sm:text-2xl font-black mt-1 block">{loading ? '…' : stats?.totalAssets ?? 0}</strong>
        </div>
        <div className="bg-white p-3 sm:p-3.5 rounded-lg border border-slate-200">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Valuasi Aset</span>
          <strong className="text-xl sm:text-2xl font-black mt-1 block">{loading ? '…' : formatRupiah(stats?.totalValue ?? 0)}</strong>
        </div>
        <div className="bg-white p-3 sm:p-3.5 rounded-lg border border-slate-200">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Kondisi Baik</span>
          <strong className="text-xl sm:text-2xl font-black text-green-700 mt-1 block">{loading ? '…' : conditionGood}</strong>
        </div>
        <div className="bg-white p-3 sm:p-3.5 rounded-lg border border-slate-200">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Butuh Perhatian</span>
          <strong className="text-xl sm:text-2xl font-black text-amber-600 mt-1 block">{loading ? '…' : stats?.needsAttention ?? 0}</strong>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-3 sm:p-4 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2 mb-4">
            <PieChartIcon size={16} className="text-primary" />
            <h3 className="text-xs sm:text-sm font-bold text-slate-800">Distribusi Kondisi</h3>
          </div>
          {pieData.length === 0 ? (
            <p className="text-xs text-slate-400">Belum ada data.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
                  {pieData.map((entry) => (
                    <Cell key={entry.kondisi} fill={KONDISI_COLOR[entry.kondisi]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="flex flex-wrap gap-2 mt-2">
            {pieData.map((entry) => (
              <span key={entry.kondisi} className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600">
                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: KONDISI_COLOR[entry.kondisi] }} />
                {entry.name} ({entry.value})
              </span>
            ))}
          </div>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-lg border border-slate-200 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={16} className="text-primary" />
            <h3 className="text-xs sm:text-sm font-bold text-slate-800">Sebaran Lokasi Aset Terbesar</h3>
          </div>
          {(stats?.locationDistribution.length ?? 0) === 0 ? (
            <p className="text-xs text-slate-400">Belum ada data.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats?.locationDistribution} layout="vertical" margin={{ left: 8, right: 16 }}>
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="locationName" width={110} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" fill="var(--color-primary)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent activity */}
      <div className="bg-white p-3 sm:p-4 rounded-lg border border-slate-200">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-primary" />
            <h3 className="text-xs sm:text-sm font-bold text-slate-800">Aktivitas Terakhir</h3>
          </div>
        </div>

        {(stats?.recentMovements.length ?? 0) === 0 ? (
          <p className="text-xs text-slate-400">Belum ada aktivitas terekam.</p>
        ) : (
          <div className="border-l-2 border-slate-100 pl-4 ml-2 space-y-4">
            {stats?.recentMovements.map((m) => (
              <div key={m.id} className="relative">
                <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-slate-300" />
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">
                  {new Date(m.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
                <p className="text-xs font-bold text-slate-800 mt-0.5">{m.asset.nama}</p>
                <p className="text-[11px] text-slate-500">{movementLabel(m)}</p>
                <span className="inline-block mt-1 px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-600 uppercase">
                  Oleh: {m.movedBy?.nama ?? '-'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
