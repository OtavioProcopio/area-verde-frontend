import React from 'react';

interface InlineFeedbackProps {
  tone: 'success' | 'error' | 'info';
  message: string;
}

const TONE_CLASSES: Record<InlineFeedbackProps['tone'], string> = {
  success: 'bg-emerald-950/40 border-emerald-800/60 text-emerald-400',
  error: 'bg-rose-950/40 border-rose-800/60 text-rose-400',
  info: 'bg-slate-800/70 border-slate-700 text-slate-300',
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
