import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { AlertToast } from './alert-toast';

const ToastContext = createContext(null);

export function AlertToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  // Default auto-close time is 4 seconds
  const addToast = useCallback(({ title, description, variant = 'info', styleVariant = 'default', duration = 4000 }) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    
    setToasts((prev) => [...prev, { id, title, description, variant, styleVariant }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  // API that matches what the app already expects (success, error)
  const success = useCallback((description, title = 'Success') => {
    addToast({ title, description, variant: 'success', styleVariant: 'default' });
  }, [addToast]);

  const error = useCallback((description, title = 'Error') => {
    addToast({ title, description, variant: 'error', styleVariant: 'default' });
  }, [addToast]);

  const info = useCallback((description, title = 'Info') => {
    addToast({ title, description, variant: 'info', styleVariant: 'default' });
  }, [addToast]);

  const warning = useCallback((description, title = 'Warning') => {
    addToast({ title, description, variant: 'warning', styleVariant: 'default' });
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ success, error, info, warning }}>
      {children}
      
      {/* Toast Portal/Container */}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 w-full max-w-sm sm:max-w-xs p-4 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <div key={toast.id} className="pointer-events-auto">
              <AlertToast
                variant={toast.variant}
                styleVariant={toast.styleVariant}
                title={toast.title}
                description={toast.description}
                onClose={() => removeToast(toast.id)}
              />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

// Hook for components to use
export function useAppToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useAppToast must be used within an AlertToastProvider');
  }
  return context;
}
