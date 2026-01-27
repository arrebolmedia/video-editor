import { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type, onClose, duration = 5000 }: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const styles = {
    success: 'bg-green-500 text-white',
    error: 'bg-red-500 text-white',
    info: 'bg-blue-500 text-white',
    warning: 'bg-orange-500 text-white',
  };

  const icons = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '⚠',
  };

  return (
    <div className={`fixed top-4 right-4 z-[9999] max-w-md rounded-lg shadow-lg p-4 flex items-start gap-3 animate-slide-in ${styles[type]}`}>
      <div className="text-xl font-bold">{icons[type]}</div>
      <div className="flex-1 text-sm whitespace-pre-line">{message}</div>
      <button
        onClick={onClose}
        className="text-white hover:text-gray-200 transition text-lg leading-none"
      >
        ×
      </button>
    </div>
  );
}
