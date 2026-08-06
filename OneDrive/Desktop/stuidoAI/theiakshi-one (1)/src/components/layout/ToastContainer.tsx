import React from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useNotification();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full">
      {toasts.map((toast) => {
        const icons = {
          SUCCESS: <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />,
          ERROR: <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />,
          WARNING: <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />,
          INFO: <Info className="h-5 w-5 text-blue-500 shrink-0" />,
        };

        const bgColors = {
          SUCCESS: 'border-emerald-200 bg-emerald-50/90 dark:border-emerald-900/60 dark:bg-emerald-950/80',
          ERROR: 'border-red-200 bg-red-50/90 dark:border-red-900/60 dark:bg-red-950/80',
          WARNING: 'border-amber-200 bg-amber-50/90 dark:border-amber-900/60 dark:bg-amber-950/80',
          INFO: 'border-blue-200 bg-blue-50/90 dark:border-blue-900/60 dark:bg-blue-950/80',
        };

        return (
          <div
            key={toast.id}
            className={`flex items-start justify-between gap-3 rounded-2xl border p-4 shadow-xl backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-2 ${
              bgColors[toast.type]
            }`}
          >
            <div className="flex items-start gap-3">
              {icons[toast.type]}
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">{toast.title}</h4>
                <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">{toast.message}</p>
              </div>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
