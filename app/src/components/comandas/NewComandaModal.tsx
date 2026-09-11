import React, { useState } from 'react';
import { PlusCircle, X } from 'lucide-react';
import { Customer } from '../../types';
import { InlineFeedback } from '../../features/shared/components/InlineFeedback';
import { formatCurrency } from '../../features/shared/utils/formatCurrency';

interface NewComandaModalProps {
  customers: Customer[];
  error: string | null;
  onClose: () => void;
  onSubmit: (name: string, customerId: string | null) => void;
}

export function NewComandaModal({
  customers,
  error,
  onClose,
  onSubmit,
}: NewComandaModalProps) {
  const [name, setName] = useState('');
  const [customerId, setCustomerId] = useState('');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (name.trim() === '') return;
    onSubmit(name, customerId === '' ? null : customerId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-md rounded-2xl border-2 border-counter-700 bg-counter-900 p-5 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-cream-400 hover:text-cream-100"
        >
          <X size={22} />
        </button>

        <h3 className="mb-3 flex items-center gap-1.5 font-display text-lg font-bold text-cream-100">
          <PlusCircle className="text-gold-400" size={22} />
          Abrir nova comanda
        </h3>

        {error && (
          <div className="mb-3">
            <InlineFeedback tone="error" message={error} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-bold text-cream-400">
              Identificação (ex: Mesa 4, Balcão João)
            </label>
            <input
              type="text"
              placeholder="Ex: Balcão canto, Mesa 4 orelha"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-counter-700 bg-counter-950 px-3 py-2.5 text-sm text-cream-100 outline-none focus:border-gold-500"
              data-testid="comanda-nome-input"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-cream-400">
              Vincular cliente cadastrado (opcional)
            </label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full rounded-lg border border-counter-700 bg-counter-950 px-3 py-2 text-sm text-cream-200 outline-none focus:border-gold-500"
            >
              <option value="">Não vincular (consumo imediato)</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.balance > 0
                    ? ` (dívida: ${formatCurrency(c.balance)})`
                    : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-counter-700 bg-counter-800 py-2.5 text-sm font-semibold text-cream-200 hover:bg-counter-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 rounded-lg bg-gold-500 py-2.5 text-sm font-bold text-counter-950 shadow-xs transition hover:bg-gold-400"
            >
              Abrir comanda
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
