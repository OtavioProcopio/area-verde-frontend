import { AlertTriangle, HelpCircle } from 'lucide-react';

export interface ConfirmDialogRequest {
  title: string;
  message: string;
  tone?: 'danger' | 'default';
  confirmLabel?: string;
  onConfirm: () => void;
}

interface ConfirmDialogProps {
  request: ConfirmDialogRequest | null;
  onClose: () => void;
}

export function ConfirmDialog({ request, onClose }: ConfirmDialogProps) {
  if (!request) return null;

  const isDanger = request.tone === 'danger';

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <div className="w-full max-w-sm rounded-2xl border-2 border-counter-700 bg-counter-900 p-5 shadow-2xl">
        <div className="flex items-start gap-3">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
              isDanger
                ? 'bg-rose-500/15 text-rose-400'
                : 'bg-gold-500/15 text-gold-400'
            }`}
          >
            {isDanger ? <AlertTriangle size={26} /> : <HelpCircle size={26} />}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-lg font-bold text-cream-100">
              {request.title}
            </h3>
            <p className="mt-1 text-sm text-cream-300">{request.message}</p>
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            autoFocus
            onClick={onClose}
            className="flex-1 rounded-xl border border-counter-700 bg-counter-800 py-3 text-sm font-semibold text-cream-200 transition hover:bg-counter-700"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
              request.onConfirm();
              onClose();
            }}
            className={`flex-1 rounded-xl py-3 text-sm font-bold transition ${
              isDanger
                ? 'bg-rose-500 text-white hover:bg-rose-400'
                : 'bg-gold-500 text-counter-950 hover:bg-gold-400'
            }`}
          >
            {request.confirmLabel ?? 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
}
