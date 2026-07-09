import { useCallback, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

export type ConfirmOptions = {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
};

type PendingConfirm = ConfirmOptions & { resolve: (value: boolean) => void };

let _requestConfirm: ((opts: ConfirmOptions) => Promise<boolean>) | null = null;

// Pengganti window.confirm() bawaan browser — dipanggil dari mana saja,
// dirender lewat <ConfirmDialogHost /> yang dipasang sekali di layout utama.
export function confirmDialog(opts: ConfirmOptions | string): Promise<boolean> {
  const normalized: ConfirmOptions = typeof opts === 'string' ? { message: opts } : opts;
  if (!_requestConfirm) return Promise.resolve(false);
  return _requestConfirm(normalized);
}

export function ConfirmDialogHost() {
  const [pending, setPending] = useState<PendingConfirm | null>(null);

  const request = useCallback((opts: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setPending({ ...opts, resolve });
    });
  }, []);
  _requestConfirm = request;

  function close(result: boolean) {
    pending?.resolve(result);
    setPending(null);
  }

  if (!pending) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4" onClick={() => close(false)}>
      <div
        className="bg-white rounded-xl max-w-sm w-full border border-slate-200 p-5 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex gap-3 items-start">
          {pending.danger && (
            <div className="w-9 h-9 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
              <AlertTriangle size={18} />
            </div>
          )}
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-1">{pending.title ?? 'Konfirmasi'}</h3>
            <p className="text-xs text-slate-500">{pending.message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button
            className="min-h-11 px-3 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600"
            onClick={() => close(false)}
          >
            {pending.cancelLabel ?? 'Batal'}
          </button>
          <button
            className={`min-h-11 px-4 rounded-lg text-xs font-bold text-white ${
              pending.danger ? 'bg-red-600 hover:bg-red-700' : 'btn-primary'
            }`}
            onClick={() => close(true)}
            autoFocus
          >
            {pending.confirmLabel ?? 'Hapus'}
          </button>
        </div>
      </div>
    </div>
  );
}
