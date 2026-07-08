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
    <div className="modal-overlay" onClick={() => close(false)}>
      <div className="modal-box" style={{ maxWidth: 380 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          {pending.danger && (
            <div style={{
              width: 36, height: 36, borderRadius: 8, background: '#fef2f2',
              color: 'var(--color-danger)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', flexShrink: 0,
            }}>
              <AlertTriangle size={18} />
            </div>
          )}
          <div>
            <h3 className="modal-box__title">{pending.title ?? 'Konfirmasi'}</h3>
            <p className="modal-box__desc" style={{ marginBottom: 0 }}>{pending.message}</p>
          </div>
        </div>
        <div className="modal-box__footer">
          <button className="btn btn-outline btn-sm" onClick={() => close(false)}>
            {pending.cancelLabel ?? 'Batal'}
          </button>
          <button
            className={`btn btn-sm ${pending.danger ? 'btn-danger' : 'btn-primary'}`}
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
