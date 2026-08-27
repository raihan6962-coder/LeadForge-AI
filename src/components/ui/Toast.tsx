import { CheckCircle2, Info, AlertTriangle, XCircle, X } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import type { NotificationType } from '@/types';

const iconMap: Record<NotificationType, typeof CheckCircle2> = {
  success: CheckCircle2,
  info: Info,
  warning: AlertTriangle,
  error: XCircle,
};

const colorMap: Record<NotificationType, string> = {
  success: 'text-success-400 border-success-500/20',
  info: 'text-accent-400 border-accent-500/20',
  warning: 'text-warning-400 border-warning-500/20',
  error: 'text-error-400 border-error-500/20',
};

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map(toast => {
        const Icon = iconMap[toast.type];
        return (
          <div
            key={toast.id}
            className={`glass-strong rounded-xl border p-4 shadow-xl animate-slide-in-right flex items-start gap-3 ${colorMap[toast.type]}`}
          >
            <Icon size={18} className="flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-primary">{toast.title}</p>
              {toast.message && <p className="text-xs text-secondary mt-0.5">{toast.message}</p>}
            </div>
            <button onClick={() => removeToast(toast.id)} className="text-muted hover:text-primary transition-colors flex-shrink-0">
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
