import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, ScanLine } from 'lucide-react';

const READER_ID = 'qr-reader-region';

type Props = {
  open: boolean;
  onClose: () => void;
  onDecode: (text: string) => void;
};

export function QrScannerModal({ open, onClose, onDecode }: Props) {
  const [error, setError] = useState('');
  const onDecodeRef = useRef(onDecode);
  onDecodeRef.current = onDecode;

  useEffect(() => {
    if (!open) return;
    setError('');
    let stopped = false;
    const scanner = new Html5Qrcode(READER_ID);

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 240 },
        (decodedText) => {
          if (stopped) return;
          stopped = true;
          scanner.stop().then(() => scanner.clear()).catch(() => {});
          onDecodeRef.current(decodedText);
        },
        () => {},
      )
      .catch(() => setError('Tidak bisa mengakses kamera. Periksa izin kamera pada browser.'));

    return () => {
      stopped = true;
      scanner.stop().then(() => scanner.clear()).catch(() => {});
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-slate-950 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <div className="flex items-center gap-2 text-white">
          <ScanLine size={18} />
          <span className="text-sm font-bold">Pindai QR Aset / Ruangan</span>
        </div>
        <button
          className="min-h-11 min-w-11 flex items-center justify-center text-slate-300 hover:bg-slate-800 rounded-md"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div id={READER_ID} className="w-full max-w-sm rounded-lg overflow-hidden" />
        {error ? (
          <p className="text-xs text-red-400 mt-4 text-center max-w-sm">{error}</p>
        ) : (
          <p className="text-xs text-slate-400 mt-4 text-center">Arahkan kamera ke label QR pada aset atau ruangan.</p>
        )}
      </div>
    </div>
  );
}
