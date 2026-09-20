import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { useToast, type ToastTone } from '../contexts/ToastContext';

const TONE_CLASSES: Record<ToastTone, string> = {
  success: 'border-emerald-500/60 bg-emerald-950/95 text-emerald-100',
  error: 'border-rose-500/60 bg-rose-950/95 text-rose-100',
  info: 'border-gold-600 bg-counter-900 text-gold-300',
};

const TONE_ICONS: Record<ToastTone, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertTriangle,
  info: Info,
};

export function ToastStack() {
  const { toasts } = useToast();

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex flex-col items-center gap-2 px-4">
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = TONE_ICONS[toast.tone];
          return (
            <motion.div
              key={toast.id}
              role="status"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className={`pointer-events-auto flex items-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-semibold shadow-lg ${TONE_CLASSES[toast.tone]}`}
            >
              <Icon size={19} className="shrink-0" />
              {toast.message}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
