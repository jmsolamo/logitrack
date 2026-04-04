import React from 'react';
import { X } from 'lucide-react';

const AlertDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Are you sure?", 
  description = "This action cannot be undone.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "destructive" 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Dialog Content */}
      <div className="relative w-full max-w-[400px] overflow-hidden rounded-2xl border border-border bg-card shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-2 duration-300">
        <div className="p-5">
          <div className="text-left">
            <div className="flex flex-col">
              {/* Header */}
              <h2 className="text-sm font-bold tracking-tight text-foreground uppercase">{title}</h2>
              <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">{description}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              onClick={onClose}
              className="inline-flex h-8 min-w-[80px] items-center justify-center rounded-xl border border-border bg-background px-3 text-[11px] font-semibold text-foreground transition-all hover:bg-muted active:scale-95"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`inline-flex h-8 min-w-[80px] items-center justify-center rounded-xl px-3 text-[11px] font-bold text-white shadow-sm transition-all active:scale-95 ${variant === 'destructive' ? 'bg-destructive hover:bg-destructive/90' : 'bg-primary hover:bg-primary/90'}`}
            >
              {confirmText}
            </button>
          </div>
        </div>

        {/* Close button (top right) */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded-sm opacity-50 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-1 focus:ring-ring focus:ring-offset-1 disabled:pointer-events-none"
        >
          <X className="h-3.5 w-3.5" />
          <span className="sr-only">Close</span>
        </button>
      </div>
    </div>
  );
};

export default AlertDialog;
