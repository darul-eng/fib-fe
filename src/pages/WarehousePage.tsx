import { Suspense, lazy, useEffect, useState } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, PackageSearch, Warehouse as WarehouseIcon } from 'lucide-react';
import { getAssetByToken, getGudangLocation, warehouseKeluar, warehouseMasuk, ApiError } from '../api/client';
import type { Asset, Location } from '../api/client';
import { RoomSelect } from '../components/RoomSelect';
import { showToast } from '../components/ToastContainer';
import { KONDISI_LABEL, kondisiBadgeClass } from '../lib/kondisi';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

// Lazy: html5-qrcode cukup besar, hanya dibutuhkan saat scanner benar-benar dibuka.
const QrScannerModal = lazy(() => import('../components/QrScannerModal').then((m) => ({ default: m.QrScannerModal })));

type Arah = 'masuk' | 'keluar';

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

function ScanButton({ arah, onClick }: { arah: Arah; onClick: () => void }) {
  const isMasuk = arah === 'masuk';
  return (
    <button
      className={`flex-1 flex flex-col items-center justify-center gap-2 rounded-xl border p-6 min-h-32 shadow-sm ${
        isMasuk ? 'btn-primary' : 'bg-slate-800 hover:bg-slate-700 text-white border-transparent'
      }`}
      onClick={onClick}
    >
      {isMasuk ? <ArrowDownToLine size={28} /> : <ArrowUpFromLine size={28} />}
      <span className="text-sm font-bold tracking-wide">{isMasuk ? 'Masuk' : 'Keluar'}</span>
    </button>
  );
}

function ConfirmPanel({
  arah,
  asset,
  onCancel,
  onConfirm,
}: {
  arah: Arah;
  asset: Asset;
  onCancel: () => void;
  onConfirm: (locationId?: string) => void;
}) {
  const [locationId, setLocationId] = useState('');
  const [saving, setSaving] = useState(false);
  const needsDestination = arah === 'keluar';
  const canConfirm = !needsDestination || !!locationId;

  async function handleConfirm() {
    setSaving(true);
    try {
      await onConfirm(needsDestination ? locationId : undefined);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4" onClick={onCancel}>
      <div
        className="bg-white rounded-xl max-w-sm w-full border border-slate-200 p-5 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-sm font-bold text-slate-800 mb-3">
          Aset akan dicatat {arah === 'masuk' ? 'Masuk' : 'Keluar'} Gudang
        </h3>

        <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-3 mb-4">
          {asset.fotoPath ? (
            <img
              src={`${API_BASE}${asset.fotoPath}`}
              alt={asset.nama}
              className="w-14 h-14 rounded-lg object-cover shrink-0 border border-slate-200"
            />
          ) : (
            <div className="w-14 h-14 rounded-lg bg-slate-200 flex items-center justify-center shrink-0 text-slate-400">
              <PackageSearch size={22} />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-800 truncate">{asset.nama}</p>
            <p className="text-[11px] text-slate-500 font-mono">{asset.kode}</p>
            <span className={`inline-block mt-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${kondisiBadgeClass(asset.kondisi)}`}>
              {KONDISI_LABEL[asset.kondisi]}
            </span>
          </div>
        </div>

        {needsDestination && (
          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-600 mb-1">Ruangan Tujuan</label>
            <RoomSelect value={locationId} onChange={(id) => setLocationId(id)} placeholder="Cari ruangan tujuan..." />
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            className="min-h-11 px-3 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600"
            onClick={onCancel}
            disabled={saving}
          >
            Tidak
          </button>
          <button
            className="min-h-11 px-4 rounded-lg text-xs font-bold text-white btn-primary disabled:opacity-50"
            onClick={handleConfirm}
            disabled={!canConfirm || saving}
          >
            {saving ? 'Menyimpan...' : 'Ya, Lanjutkan'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function WarehousePage() {
  const [gudang, setGudang] = useState<Location | null>(null);
  const [loadingGudang, setLoadingGudang] = useState(true);
  const [scanArah, setScanArah] = useState<Arah | null>(null);
  const [pendingAsset, setPendingAsset] = useState<{ arah: Arah; asset: Asset; qrToken: string } | null>(null);

  useEffect(() => {
    getGudangLocation()
      .then(setGudang)
      .catch(() => setGudang(null))
      .finally(() => setLoadingGudang(false));
  }, []);

  async function handleDecode(text: string) {
    const arah = scanArah;
    setScanArah(null);
    if (!arah) return;

    const token = extractToken(text);
    try {
      const asset = await getAssetByToken(token);
      setPendingAsset({ arah, asset, qrToken: asset.qrToken });
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : 'QR tidak dikenali oleh sistem', 'danger');
    }
  }

  async function handleConfirm(locationId?: string) {
    if (!pendingAsset) return;
    const { arah, qrToken, asset } = pendingAsset;
    try {
      if (arah === 'masuk') {
        await warehouseMasuk(qrToken);
        showToast(`${asset.nama} tercatat Masuk Gudang`);
      } else {
        await warehouseKeluar(qrToken, locationId!);
        showToast(`${asset.nama} tercatat Keluar Gudang`);
      }
      setPendingAsset(null);
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : 'Gagal mencatat perpindahan', 'danger');
    }
  }

  return (
    <>
      <div className="mb-4 sm:mb-6">
        <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-800">Menu Warehouse</h1>
        <p className="text-[11px] sm:text-xs text-slate-500 flex items-center gap-1">
          <WarehouseIcon size={12} />
          {loadingGudang
            ? 'Memuat lokasi Gudang...'
            : gudang
              ? `Gudang: ${gudang.nama}`
              : 'Lokasi Gudang belum diatur — hubungi admin.'}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <ScanButton arah="masuk" onClick={() => setScanArah('masuk')} />
        <ScanButton arah="keluar" onClick={() => setScanArah('keluar')} />
      </div>

      {scanArah && (
        <Suspense fallback={null}>
          <QrScannerModal open={!!scanArah} onClose={() => setScanArah(null)} onDecode={handleDecode} />
        </Suspense>
      )}

      {pendingAsset && (
        <ConfirmPanel
          arah={pendingAsset.arah}
          asset={pendingAsset.asset}
          onCancel={() => setPendingAsset(null)}
          onConfirm={handleConfirm}
        />
      )}
    </>
  );
}
