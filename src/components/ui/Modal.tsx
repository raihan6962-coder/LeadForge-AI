import { type ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ open, onClose, title, subtitle, children, footer, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [open]);

  if (!open) return null;

  const sizeClass = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${sizeClass[size]} glass-strong rounded-xl shadow-2xl max-h-[90vh] flex flex-col animate-slide-up`}>
        <div className="flex items-start justify-between p-5 border-b border-white/10">
          <div>
            <h2 className="text-base font-semibold text-primary">{title}</h2>
            {subtitle && <p className="text-xs text-muted mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="text-muted hover:text-primary transition-colors p-1 -mr-1">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {children}
        </div>
        {footer && <div className="flex items-center justify-end gap-2 p-5 border-t border-white/10">{footer}</div>}
      </div>
    </div>
  );
}

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: 'md' | 'lg' | 'xl';
}

export function Drawer({ open, onClose, title, subtitle, children, footer, width = 'lg' }: DrawerProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [open]);

  if (!open) return null;

  const widthClass = { md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-2xl' };

  return (
    <div className="fixed inset-0 z-50 animate-fade-in">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`absolute right-0 top-0 bottom-0 w-full ${widthClass[width]} glass-strong shadow-2xl flex flex-col animate-slide-in-right`}>
        <div className="flex items-start justify-between p-5 border-b border-white/10">
          <div>
            <h2 className="text-base font-semibold text-primary">{title}</h2>
            {subtitle && <p className="text-xs text-muted mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="text-muted hover:text-primary transition-colors p-1">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {children}
        </div>
        {footer && <div className="flex items-center justify-end gap-2 p-5 border-t border-white/10">{footer}</div>}
      </div>
    </div>
  );
}

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger = false }: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>{cancelLabel}</Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</Button>
        </>
      }
    >
      <p className="text-sm text-secondary">{message}</p>
    </Modal>
  );
}

interface TooltipProps {
  content: string;
  children: ReactNode;
}

export function Tooltip({ content, children }: TooltipProps) {
  return (
    <div className="relative group inline-flex">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-black/90 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
        {content}
      </div>
    </div>
  );
}
