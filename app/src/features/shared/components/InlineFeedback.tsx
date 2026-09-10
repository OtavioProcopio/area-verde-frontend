import React from 'react';

interface InlineFeedbackProps {
  tone: 'success' | 'error' | 'info';
  message: string;
}

const TONE_CLASSES: Record<InlineFeedbackProps['tone'], string> = {
  success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  error: 'bg-rose-50 border-rose-200 text-rose-700',
  info: 'bg-slate-100 border-slate-200 text-slate-600',
};

export function InlineFeedback({ tone, message }: InlineFeedbackProps) {
  return (
    <div
      className={`rounded-lg border p-3 text-xs font-semibold ${TONE_CLASSES[tone]}`}
    >
      {message}
    </div>
  );
}
