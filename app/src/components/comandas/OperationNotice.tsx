import { AlertTriangle } from 'lucide-react';

interface OperationNoticeProps {
  message: string | null;
}

export function OperationNotice({ message }: OperationNoticeProps) {
  if (!message) return null;

  return (
    <div className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <div className="flex items-center gap-2 rounded-xl border-2 border-gold-600 bg-counter-900 px-4 py-3 text-sm font-semibold text-gold-300 shadow-lg">
        <AlertTriangle size={19} className="shrink-0 text-gold-400" />
        {message}
      </div>
    </div>
  );
}
