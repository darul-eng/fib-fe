import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { DoorOpen, ArrowLeft } from 'lucide-react';
import { getPublicLocation, ApiError } from '../api/client';
import type { PublicLocation, AssetCondition } from '../api/client';
import { KONDISI_LABEL, kondisiBadgeClass } from '../lib/kondisi';
import { useAuth } from '../auth/AuthContext';

export default function PublicLocationPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [location, setLocation] = useState<PublicLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    setNotFound(false);
    getPublicLocation(token)
      .then(setLocation)
      .catch((e) => {
        if (e instanceof ApiError && e.status === 404) setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200 shadow-sm px-4 py-3 flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-md flex items-center justify-center text-white font-bold text-lg"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          S
        </div>
        <div>
          <h1 className="text-sm font-semibold tracking-tight leading-none text-slate-800">SIAP</h1>
          <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Isi Ruangan Publik</span>
        </div>
        {user && (
          <button
            className="ml-auto min-h-11 flex items-center gap-1 px-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-md"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft size={14} /> Kembali
          </button>
        )}
      </header>

      <main className="flex-1 w-full max-w-lg mx-auto p-4">
        {loading && <p className="text-center text-sm text-slate-500 py-10">Memuat data ruangan...</p>}

        {!loading && notFound && (
          <div className="bg-white rounded-lg border border-slate-200 p-6 text-center">
            <p className="text-sm font-semibold text-slate-700">Kode QR Ruangan Tidak Ditemukan</p>
            <p className="text-xs text-slate-500 mt-1">Ruangan mungkin sudah dihapus atau token QR tidak valid.</p>
          </div>
        )}

        {!loading && location && (
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
            <div className="mb-3 flex items-start gap-2">
              <DoorOpen size={18} className="text-slate-400 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-bold uppercase text-slate-600">
                  Ruangan
                </span>
                <h2 className="text-md font-bold mt-1 text-slate-800">{location.nama}</h2>
                {location.lokasiInduk && <p className="text-xs text-slate-500 mt-0.5">{location.lokasiInduk}</p>}
              </div>
            </div>

            <div className="bg-slate-50 p-2.5 rounded text-xs mb-4 flex justify-between items-center flex-wrap gap-1.5">
              <span>
                Total Terdaftar: <strong className="text-slate-800">{location.totalAset} Aset</strong>
              </span>
              <div className="flex gap-1.5 flex-wrap">
                {(Object.entries(location.ringkasanKondisi) as [AssetCondition, number][]).map(([k, v]) => (
                  <span key={k} className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${kondisiBadgeClass(k)}`}>
                    {KONDISI_LABEL[k]}: {v}
                  </span>
                ))}
              </div>
            </div>

            <h3 className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Daftar Inventaris Ruang</h3>
            <div className="space-y-2">
              {location.aset.map((a) => (
                <Link
                  key={a.qrToken}
                  to={`/a/${a.qrToken}`}
                  className="p-2.5 border border-slate-100 rounded hover:border-slate-300 transition-all flex justify-between items-center gap-2 text-xs bg-white min-h-11"
                >
                  <div className="min-w-0">
                    <span className="font-semibold text-slate-700 block truncate">{a.nama}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{a.kode}</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0 ${kondisiBadgeClass(a.kondisi)}`}>
                    {KONDISI_LABEL[a.kondisi]}
                  </span>
                </Link>
              ))}
              {location.aset.length === 0 && (
                <p className="text-xs text-slate-400 italic text-center py-4">Tidak ada aset terdaftar di ruangan ini.</p>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 py-3 px-4 text-center text-xs text-slate-400">
        Sistem Manajeman Aset, Sarana, dan Prasarana
      </footer>
    </div>
  );
}
