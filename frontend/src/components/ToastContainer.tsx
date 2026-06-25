import { useToastStore } from '@/store/toast';
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';
import clsx from 'clsx';

const icons = {
  success: <CheckCircle size={20} />,
  error: <AlertCircle size={20} />,
  info: <Info size={20} />,
  warning: <AlertTriangle size={20} />,
};

const colors = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
};

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-4 right-4 space-y-2 z-50">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={clsx('flex items-center gap-3 p-4 border rounded-lg shadow-md', colors[toast.type])}
        >
          <div className="flex-shrink-0">{icons[toast.type]}</div>
          <div className="flex-1">{toast.message}</div>
          <button
            onClick={() => removeToast(toast.id)}
            className="flex-shrink-0 hover:opacity-70 transition-opacity"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
