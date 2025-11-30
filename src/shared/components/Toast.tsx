import { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastProps {
  toast: Toast;
  onClose: (id: string) => void;
}

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const colors = {
  success: 'bg-emerald-500 border-emerald-600',
  error: 'bg-red-500 border-red-600',
  info: 'bg-blue-500 border-blue-600',
  warning: 'bg-yellow-500 border-yellow-600',
};

export default function ToastComponent({ toast, onClose }: ToastProps) {
  const Icon = icons[toast.type];
  const colorClass = colors[toast.type];

  useEffect(() => {
    const duration = toast.duration || 5000;
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, duration);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onClose]);

  return (
    <div
      className={`
        ${colorClass}
        text-white px-4 py-3 rounded-lg shadow-lg border-2
        flex items-center gap-3 min-w-[300px] max-w-[500px]
        animate-in slide-in-from-top-5 fade-in
      `}
      role="alert"
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button
        onClick={() => onClose(toast.id)}
        className="flex-shrink-0 hover:opacity-80 transition-opacity"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

