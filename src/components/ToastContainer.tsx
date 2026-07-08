import { useState, useCallback } from 'react';

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

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((message: string, type: ToastType = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  // register globally
  _showToast = show;

  const icons: Record<ToastType, string> = {
    success: '✓',
    warning: '⚠',
    danger: '✕',
  };

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span style={{ fontWeight: 800 }}>{icons[t.type]}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}
