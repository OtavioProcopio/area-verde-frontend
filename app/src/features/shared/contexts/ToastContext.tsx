import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

export type ToastTone = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  tone: ToastTone;
  message: string;
}

interface ToastContextValue {
  toasts: Toast[];
  showToast: (tone: ToastTone, message: string) => void;
}

const MAX_VISIBLE_TOASTS = 3;
const AUTO_DISMISS_MS = 5000;

const ToastContext = createContext<ToastContextValue | null>(null);

let nextToastId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState<Toast[]>([]);
  const [queue, setQueue] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  const dismiss = useCallback((id: string) => {
    setVisible((current) => current.filter((toast) => toast.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  useEffect(() => {
    if (visible.length >= MAX_VISIBLE_TOASTS || queue.length === 0) return;
    const [next, ...rest] = queue;
    setQueue(rest);
    setVisible((current) => [...current, next]);
  }, [visible.length, queue]);

  useEffect(() => {
    visible.forEach((toast) => {
      if (timersRef.current.has(toast.id)) return;
      const timer = setTimeout(() => dismiss(toast.id), AUTO_DISMISS_MS);
      timersRef.current.set(toast.id, timer);
    });
  }, [visible, dismiss]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  const showToast = useCallback((tone: ToastTone, message: string) => {
    nextToastId += 1;
    const toast: Toast = { id: `toast-${nextToastId}`, tone, message };
    setVisible((current) => {
      if (current.length >= MAX_VISIBLE_TOASTS) {
        setQueue((currentQueue) => [...currentQueue, toast]);
        return current;
      }
      return [...current, toast];
    });
  }, []);

  return (
    <ToastContext.Provider value={{ toasts: visible, showToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast deve ser usado dentro de um ToastProvider.');
  }
  return context;
}
