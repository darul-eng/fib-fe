import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ShieldCheck, MapPin, User } from 'lucide-react';
import { getPublicAsset, ApiError } from '../api/client';
import type { PublicAsset, MovementType } from '../api/client';
import { KONDISI_LABEL, kondisiBadgeClass } from '../lib/kondisi';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

const MOVEMENT_TYPE_LABEL: Record<MovementType, string> = {
  lokasi: 'Perpindahan Lokasi',
  pemegang: 'Perpindahan Pemegang',
  kondisi: 'Perubahan Kondisi',
};

export default function PublicAssetPage() {
  const { token } = useParams<{ token: string }>();
  const [asset, setAsset] = useState<PublicAsset | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    setNotFound(false);
    getPublicAsset(token)
      .then(setAsset)
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
          <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Detail Aset Publik</span>
        </div>
      </header>

      <main className="flex-1 w-full max-w-lg mx-auto p-4">
        {loading && <p className="text-center text-sm text-slate-500 py-10">Memuat data aset...</p>}

        {!loading && notFound && (
          <div className="bg-white rounded-lg border border-slate-200 p-6 text-center">
            <p className="text-sm font-semibold text-slate-700">Kode QR Tidak Ditemukan</p>
            <p className="text-xs text-slate-500 mt-1">Aset mungkin sudah dihapus atau token QR tidak valid.</p>
          </div>
        )}

        {!loading && asset && (
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
            {asset.foto && (
              <img
                src={`${API_BASE}${asset.foto}`}
                alt={asset.nama}
                className="w-full h-40 object-cover rounded-lg mb-3"
                loading="lazy"
              />
            )}
            <div className="flex justify-between items-start gap-2 mb-2">
              <div className="min-w-0">
                <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-primary-tint text-primary">
                  {asset.kategori}
                </span>
                <h2 className="text-md font-bold mt-1 text-slate-800">{asset.nama}</h2>
                <p className="text-[11px] text-slate-400 mt-0.5 font-mono">{asset.kode}</p>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0 ${kondisiBadgeClass(asset.kondisi)}`}>
                {KONDISI_LABEL[asset.kondisi]}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 my-4 py-3 border-t border-b border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 flex items-center gap-1 mb-0.5">
                  <MapPin size={11} /> Ruangan
                </span>
                <span className="font-semibold text-slate-700">{asset.lokasi ?? '—'}</span>
              </div>
              <div>
                <span className="text-slate-400 flex items-center gap-1 mb-0.5">
                  <User size={11} /> Pemegang
                </span>
                <span className="font-semibold text-slate-700">{asset.pemegang ?? '—'}</span>
              </div>
              {asset.attributes.map((a) => (
                <div key={a.label}>
                  <span className="text-slate-400 block">{a.label}</span>
                  <span className="font-semibold text-slate-700">{String(a.value)}</span>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 p-2.5 rounded text-[10px] text-blue-800 flex items-start gap-1.5 mb-4">
              <ShieldCheck size={14} className="mt-0.5 flex-shrink-0" />
              <span>Data sensitif (harga beli, sumber dana) disembunyikan otomatis untuk publik.</span>
            </div>

            <h3 className="text-xs font-bold text-slate-700 mb-2">Riwayat Perpindahan</h3>
            {asset.timeline.length === 0 ? (
              <p className="text-[11px] text-slate-400">Belum ada riwayat perpindahan.</p>
            ) : (
              <div className="border-l-2 border-slate-200 pl-3.5 ml-2 space-y-3">
                {asset.timeline.map((m, i) => (
                  <div key={i} className="relative text-xs">
                    <div className="w-2 h-2 rounded-full bg-slate-300 absolute -left-[20.5px] top-1 border border-white" />
                    <span className="text-[10px] text-slate-400 font-semibold">
                      {new Date(m.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}{' '}
                      · {MOVEMENT_TYPE_LABEL[m.tipe] ?? m.tipe}
                    </span>
                    <p className="font-medium text-slate-700 leading-tight">
                      {m.dari ?? '—'} → {m.ke ?? '—'}
                    </p>
                    {m.catatan && <p className="text-[11px] text-slate-500">{m.catatan}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 py-3 px-4 text-center text-xs text-slate-400">
        Sistem Manajeman Aset, Sarana, dan Prasarana
      </footer>
    </div>
  );
}
