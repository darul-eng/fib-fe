import { Suspense, lazy, useEffect, useState } from 'react';
import {
  ClipboardCheck,
  ScanLine,
  Search,
  CheckCircle2,
  XCircle,
  ArrowLeftRight,
  HelpCircle,
  ArrowLeft,
  CircleDashed,
  History,
} from 'lucide-react';
import {
  finishAudit,
  getAuditSession,
  listAuditSessions,
  listLocations,
  manualCheckAudit,
  moveHereAudit,
  scanAudit,
  startAudit,
} from '../api/client';
import type { AuditSessionSummary, AuditSessionView, Location } from '../api/client';
import { ApiError } from '../api/client';
import { showToast } from '../components/ToastContainer';
import { confirmDialog } from '../components/ConfirmDialog';
import { useAuth } from '../auth/AuthContext';

// Lazy: html5-qrcode cukup besar, hanya dibutuhkan saat scanner benar-benar dibuka.
const QrScannerModal = lazy(() => import('../components/QrScannerModal').then((m) => ({ default: m.QrScannerModal })));

function extractToken(decodedText: string): string {
  try {
    const url = new URL(decodedText, window.location.origin);
    const match = url.pathname.match(/^\/a\/(.+)$/);
    if (match) return match[1];
  } catch {
    // bukan URL, pakai teks apa adanya sebagai token
  }
  return decodedText;
}

const SCAN_RESULT_LABEL: Record<string, string> = {
  ditemukan: 'Ditemukan',
  salah_ruangan: 'Salah ruangan',
  belum_terdaftar: 'QR tidak dikenal',
};

function RoomPicker({ onPick }: { onPick: (l: Location) => void }) {
  const [rooms, setRooms] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    const timeout = setTimeout(() => {
      listLocations({ tipe: 'ruangan', search, limit: 20 })
        .then(setRooms)
        .catch(() => showToast('Gagal memuat daftar ruangan', 'danger'))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timeout);
  }, [search]);

  return (
    <>
      <div className="flex items-center gap-2 border border-transparent sm:border-slate-200 rounded-full sm:rounded-lg px-3.5 sm:px-3 min-h-11 sm:w-80 bg-slate-100 sm:bg-white focus-within:bg-white focus-within:border-slate-300 transition-colors mb-4">
        <Search size={15} className="text-slate-400 shrink-0" />
        <input
          type="text"
          className="w-full text-base sm:text-xs outline-none bg-transparent"
          placeholder="Cari ruangan..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-100">
        {loading ? (
          <p className="text-slate-500 text-sm text-center py-6">Memuat ruangan...</p>
        ) : rooms.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-6">Tidak ada ruangan ditemukan.</p>
        ) : (
          rooms.map((r) => (
            <button
              key={r.id}
              className="w-full flex items-center justify-between gap-2 px-3 py-3 min-h-11 text-left hover:bg-slate-50"
              onClick={() => onPick(r)}
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{r.nama}</p>
                {r.parent && <p className="text-[11px] text-slate-500 truncate">{r.parent.nama}</p>}
              </div>
              <span className="btn-primary px-2.5 py-1.5 rounded-lg text-xs font-bold tracking-wide shadow-sm shrink-0 flex items-center gap-1.5">
                <ClipboardCheck size={13} /> Mulai Audit
              </span>
            </button>
          ))
        )}
      </div>
    </>
  );
}

const RESULT_BADGE_LABEL: { key: keyof AuditSessionSummary['counts']; label: string; className: string }[] = [
  { key: 'ditemukan', label: 'Ditemukan', className: 'bg-green-100 text-green-800' },
  { key: 'tidak_ditemukan', label: 'Tidak ditemukan', className: 'bg-red-100 text-red-800' },
  { key: 'salah_ruangan', label: 'Salah ruangan', className: 'bg-amber-100 text-amber-800' },
  { key: 'belum_terdaftar', label: 'Tidak dikenal', className: 'bg-slate-100 text-slate-600' },
];

const HISTORY_LIMIT = 10;

function HistoryList({ onOpen }: { onOpen: (session: AuditSessionView) => void }) {
  const [items, setItems] = useState<AuditSessionSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const totalPages = Math.max(1, Math.ceil(total / HISTORY_LIMIT));

  useEffect(() => {
    setLoading(true);
    listAuditSessions({ page, limit: HISTORY_LIMIT })
      .then((res) => {
        setItems(res.data);
        setTotal(res.total);
      })
      .catch(() => showToast('Gagal memuat riwayat audit', 'danger'))
      .finally(() => setLoading(false));
  }, [page]);

  async function handleOpen(id: string) {
    try {
      onOpen(await getAuditSession(id));
    } catch {
      showToast('Gagal memuat detail sesi audit', 'danger');
    }
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-100">
      {loading ? (
        <p className="text-slate-500 text-sm text-center py-6">Memuat riwayat...</p>
      ) : items.length === 0 ? (
        <p className="text-slate-400 text-sm text-center py-6">Belum ada riwayat audit.</p>
      ) : (
        items.map((s) => (
          <button
            key={s.id}
            className="w-full text-left px-3 py-3 min-h-11 hover:bg-slate-50"
            onClick={() => void handleOpen(s.id)}
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-sm font-semibold text-slate-800 truncate">{s.locationNama}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${
                  s.status === 'selesai' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                }`}
              >
                {s.status === 'selesai' ? 'Selesai' : 'Berjalan'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mb-1.5">
              {new Date(s.startedAt).toLocaleString('id-ID')} · {s.conductedByNama ?? 'Sistem'}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {RESULT_BADGE_LABEL.filter(({ key }) => key === 'ditemukan' || s.counts[key] > 0).map(({ key, label, className }) => (
                <span key={key} className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${className}`}>
                  {label} {s.counts[key]}
                </span>
              ))}
            </div>
          </button>
        ))
      )}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-3 text-xs text-slate-500">
          <span>Halaman {page} dari {totalPages}</span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="min-h-11 px-2.5 border border-slate-200 rounded-lg font-semibold disabled:opacity-40"
            >
              Sebelumnya
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="min-h-11 px-2.5 border border-slate-200 rounded-lg font-semibold disabled:opacity-40"
            >
              Berikutnya
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AssetChip({ label }: { label: string }) {
  return <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-600">{label}</span>;
}

function SessionView({ session, onChange, onExit }: { session: AuditSessionView; onChange: (v: AuditSessionView) => void; onExit: () => void }) {
  const [showScanner, setShowScanner] = useState(false);
  const [busyAssetId, setBusyAssetId] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);
  const isDone = session.status === 'selesai';

  async function handleDecode(text: string) {
    setShowScanner(false);
    const token = extractToken(text);
    try {
      const result = await scanAudit(session.id, token);
      onChange(result);
      const label = SCAN_RESULT_LABEL[result.lastScan.result] ?? result.lastScan.result;
      showToast(result.lastScan.assetNama ? `${result.lastScan.assetNama}: ${label}` : label, result.lastScan.result === 'ditemukan' ? 'success' : 'danger');
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : 'Gagal memproses hasil scan', 'danger');
    }
  }

  async function handleManual(assetId: string) {
    setBusyAssetId(assetId);
    try {
      onChange(await manualCheckAudit(session.id, assetId));
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : 'Gagal menandai aset', 'danger');
    } finally {
      setBusyAssetId(null);
    }
  }

  async function handleMoveHere(assetId: string) {
    setBusyAssetId(assetId);
    try {
      onChange(await moveHereAudit(session.id, assetId));
      showToast('Aset dipindahkan ke ruangan ini');
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : 'Gagal memindahkan aset', 'danger');
    } finally {
      setBusyAssetId(null);
    }
  }

  async function handleFinish() {
    const ok = await confirmDialog({
      title: 'Selesaikan Audit',
      message: `Aset yang belum dicek (${session.belumDicek.length}) akan ditandai "tidak ditemukan". Lanjutkan?`,
      confirmLabel: 'Selesaikan',
    });
    if (!ok) return;
    setFinishing(true);
    try {
      onChange(await finishAudit(session.id));
      showToast('Sesi audit diselesaikan');
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : 'Gagal menyelesaikan audit', 'danger');
    } finally {
      setFinishing(false);
    }
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6">
        <div className="min-w-0">
          <button className="flex items-center gap-1 text-[11px] text-slate-500 font-semibold mb-1" onClick={onExit}>
            <ArrowLeft size={12} /> Kembali
          </button>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-800 truncate">{session.locationNama}</h1>
          <p className="text-[11px] sm:text-xs text-slate-500">
            {isDone ? 'Sesi selesai' : 'Sesi berjalan'} · Ditemukan {session.ditemukan.length} dari{' '}
            {session.ditemukan.length + session.belumDicek.length + session.tidakDitemukan.length} aset
          </p>
        </div>
        {!isDone && (
          <button
            className="btn-primary px-3 rounded-lg text-xs font-bold tracking-wide shadow-sm min-h-11 shrink-0 flex items-center gap-1.5"
            onClick={() => setShowScanner(true)}
          >
            <ScanLine size={15} /> Scan QR
          </button>
        )}
      </div>

      {showScanner && (
        <Suspense fallback={null}>
          <QrScannerModal open={showScanner} onClose={() => setShowScanner(false)} onDecode={handleDecode} />
        </Suspense>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <section className="bg-white rounded-lg border border-slate-200 p-3.5">
          <h3 className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-2">
            <CheckCircle2 size={14} className="text-green-600" /> Ditemukan ({session.ditemukan.length})
          </h3>
          {session.ditemukan.length === 0 ? (
            <p className="text-[11px] text-slate-400">Belum ada aset ditemukan.</p>
          ) : (
            <ul className="space-y-1.5">
              {session.ditemukan.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-slate-700 truncate">{a.nama}</span>
                  <AssetChip label={a.kode} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-white rounded-lg border border-slate-200 p-3.5">
          <h3 className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-2">
            <CircleDashed size={14} className="text-slate-400" /> Belum Dicek ({session.belumDicek.length})
          </h3>
          {session.belumDicek.length === 0 ? (
            <p className="text-[11px] text-slate-400">Semua aset sudah dicek.</p>
          ) : (
            <ul className="space-y-1.5">
              {session.belumDicek.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-slate-700 truncate">{a.nama}</span>
                  {!isDone && (
                    <button
                      className="px-2 py-1 min-h-11 sm:min-h-0 bg-slate-100 hover:bg-slate-200 rounded text-[10px] font-bold text-slate-600 shrink-0 disabled:opacity-50"
                      disabled={busyAssetId === a.id}
                      onClick={() => handleManual(a.id)}
                    >
                      Tandai Manual
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {session.salahRuangan.length > 0 && (
          <section className="bg-white rounded-lg border border-slate-200 p-3.5">
            <h3 className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-2">
              <ArrowLeftRight size={14} className="text-amber-600" /> Salah Ruangan ({session.salahRuangan.length})
            </h3>
            <ul className="space-y-1.5">
              {session.salahRuangan.map(({ itemId, asset }) => (
                <li key={itemId} className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-slate-700 truncate">{asset.nama}</span>
                  {!isDone && (
                    <button
                      className="px-2 py-1 min-h-11 sm:min-h-0 bg-amber-100 hover:bg-amber-200 rounded text-[10px] font-bold text-amber-800 shrink-0 disabled:opacity-50"
                      disabled={busyAssetId === asset.id}
                      onClick={() => handleMoveHere(asset.id)}
                    >
                      Pindahkan ke Sini
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {session.belumTerdaftar.length > 0 && (
          <section className="bg-white rounded-lg border border-slate-200 p-3.5">
            <h3 className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-2">
              <HelpCircle size={14} className="text-slate-400" /> Tidak Dikenal ({session.belumTerdaftar.length})
            </h3>
            <ul className="space-y-1.5">
              {session.belumTerdaftar.map(({ itemId, scannedToken }) => (
                <li key={itemId} className="text-xs text-slate-500 font-mono truncate">
                  {scannedToken ?? '—'}
                </li>
              ))}
            </ul>
          </section>
        )}

        {isDone && session.tidakDitemukan.length > 0 && (
          <section className="bg-white rounded-lg border border-slate-200 p-3.5">
            <h3 className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-2">
              <XCircle size={14} className="text-red-600" /> Tidak Ditemukan ({session.tidakDitemukan.length})
            </h3>
            <ul className="space-y-1.5">
              {session.tidakDitemukan.map((a) => (
                <li key={a.id} className="text-xs text-slate-700 truncate">{a.nama}</li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {!isDone && (
        <div className="flex justify-end mt-4 sm:mt-6">
          <button
            className="bg-slate-800 hover:bg-slate-700 text-white px-4 rounded-lg text-xs font-bold shadow-sm min-h-11 disabled:opacity-60"
            disabled={finishing}
            onClick={handleFinish}
          >
            {finishing ? 'Menyelesaikan...' : 'Selesaikan Audit'}
          </button>
        </div>
      )}
    </>
  );
}

type Tab = 'mulai' | 'riwayat';

export default function AuditPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('mulai');
  const [session, setSession] = useState<AuditSessionView | null>(null);

  if (user?.role !== 'admin') {
    return <p className="text-slate-500 text-sm">Fitur audit ruangan khusus untuk Admin.</p>;
  }

  async function handlePick(location: Location) {
    try {
      setSession(await startAudit(location.id));
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : 'Gagal memulai audit', 'danger');
    }
  }

  if (session) {
    return <SessionView session={session} onChange={setSession} onExit={() => setSession(null)} />;
  }

  return (
    <>
      <div className="mb-4 sm:mb-6">
        <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-800">Stok Opname / Audit Ruangan</h1>
        <p className="text-[11px] sm:text-xs text-slate-500">
          {tab === 'mulai' ? 'Pilih ruangan untuk memulai atau melanjutkan sesi audit.' : 'Riwayat sesi audit yang pernah dijalankan.'}
        </p>
      </div>

      <div className="flex gap-1.5 mb-4 sm:mb-6 bg-slate-100 p-1 rounded-lg w-full sm:w-fit">
        <button
          className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 min-h-11 px-3 rounded-md text-xs font-bold ${
            tab === 'mulai' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
          }`}
          onClick={() => setTab('mulai')}
        >
          <ClipboardCheck size={14} /> Mulai Audit
        </button>
        <button
          className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 min-h-11 px-3 rounded-md text-xs font-bold ${
            tab === 'riwayat' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
          }`}
          onClick={() => setTab('riwayat')}
        >
          <History size={14} /> Riwayat Audit
        </button>
      </div>

      {tab === 'mulai' ? <RoomPicker onPick={handlePick} /> : <HistoryList onOpen={setSession} />}
    </>
  );
}
