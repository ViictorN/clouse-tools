'use client';
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Icon } from '@/lib/icons';

interface ToastContextType {
  showToast: (message: string) => void;
}

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({
    message: '',
    visible: false,
  });

  const showToast = useCallback((message: string) => {
    setToast({ message, visible: true });
    const timer = setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 2200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-zone" aria-live="polite">
        <div className={`toast ${toast.visible ? 'show' : ''}`}>
          <Icon name="check" size={17} />
          <span>{toast.message}</span>
        </div>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
