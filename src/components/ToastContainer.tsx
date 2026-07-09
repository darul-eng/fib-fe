import { useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

export type ToastType = 'success' | 'warning' | 'danger';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

let _showToast: ((msg: string, type?: ToastType) => void) | null = null;

export function showToast(message: string, type: ToastType = 'success') {
  _showToast?.(message, type);
}

const STYLE: Record<ToastType, string> = {
  success: 'border-green-200 text-green-800',
  warning: 'border-amber-200 text-amber-800',
  danger: 'border-red-200 text-red-800',
};

const ICON: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 size={16} />,
  warning: <AlertTriangle size={16} />,
  danger: <XCircle size={16} />,
};

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((message: string, type: ToastType = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  _showToast = show;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`p-3.5 rounded-lg text-xs font-semibold shadow-lg bg-white border flex items-center gap-2 pointer-events-auto ${STYLE[t.type]}`}
        >
          {ICON[t.type]}
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}
