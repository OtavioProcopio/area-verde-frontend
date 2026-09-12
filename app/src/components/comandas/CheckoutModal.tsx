import React, { useState } from 'react';
import { UserPlus, X } from 'lucide-react';
import { Comanda, Customer } from '../../types';
import { formatCurrency } from '../../features/shared/utils/formatCurrency';
import { getComandaTotals } from './comandaCalculations';

type PaymentMethod = 'dinheiro' | 'pix' | 'cartao' | 'fiado';

const PAYMENT_METHODS: { id: PaymentMethod; label: string }[] = [
  { id: 'dinheiro', label: '💵 Dinheiro' },
  { id: 'pix', label: '⚡ Pix manual' },
  { id: 'cartao', label: '💳 Cartão' },
  { id: 'fiado', label: '📓 Fiado (caderno de pendências)' },
];

interface CheckoutModalProps {
  comanda: Comanda;
  customers: Customer[];
  initialMethod: PaymentMethod;
  onAddCustomer: (c: { name: string; phone: string }) => unknown;
  onConfirm: (
    metodo: PaymentMethod,
    customerId: string | null,
  ) => Promise<{ success: boolean; msg: string }>;
  onSuccess: (paidComanda: Comanda) => void;
  onClose: () => void;
}

export function CheckoutModal({
  comanda,
  customers,
  initialMethod,
  onAddCustomer,
  onConfirm,
  onSuccess,
  onClose,
}: CheckoutModalProps) {
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>(initialMethod);
  const [customerId, setCustomerId] = useState(comanda.customerId || '');
  const [error, setError] = useState<string | null>(null);
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');

  const totals = getComandaTotals(comanda);

  const handleQuickAddClient = (event: React.FormEvent) => {
    event.preventDefault();
    if (newClientName.trim() === '') return;
    onAddCustomer({ name: newClientName, phone: newClientPhone });
    setNewClientName('');
    setNewClientPhone('');
    setShowNewClientForm(false);
  };

  const handleConfirm = async () => {
    if (paymentMethod === 'fiado' && !customerId) {
      setError('Selecione um cliente para lançar no caderno.');
      return;
    }

    const res = await onConfirm(
      paymentMethod,
      paymentMethod === 'fiado' ? customerId : null,
    );

    if (!res.success) {
      setError(res.msg);
      return;
    }

    onSuccess({
      ...comanda,
      status: 'paid',
      discount: 0,
      addition: 0,
      paymentMethod,
      customerId: paymentMethod === 'fiado' ? customerId : comanda.customerId,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-lg rounded-2xl border-2 border-counter-700 bg-counter-900 p-5 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-cream-400 hover:text-cream-100"
        >
          <X size={22} />
        </button>

        <h3 className="mb-1 font-display text-lg font-bold text-cream-100">
          Finalização do balcão
        </h3>
        <p className="mb-3 font-mono text-xs text-cream-400">
          Comanda: {comanda.code}
        </p>

        <div className="mb-4 grid grid-cols-1 gap-4 border-y border-counter-700 py-3 md:grid-cols-12">
          <div className="space-y-2 md:col-span-6">
            <span className="block text-xs font-bold text-cream-400">
              Forma de pagamento
            </span>
            <div className="grid grid-cols-1 gap-1.5">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setPaymentMethod(m.id);
                    setError(null);
                  }}
                  className={`rounded-lg border px-3 py-2 text-left text-sm font-bold transition ${
                    paymentMethod === m.id
                      ? 'border-gold-500 bg-gold-500/10 text-gold-300 shadow-2xs'
                      : 'border-counter-700 bg-counter-800 text-cream-300 hover:bg-counter-700'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col justify-between md:col-span-6">
            <div>
              <span className="mb-2 block text-xs font-bold text-cream-400">
                Resumo da conta
              </span>
              <div className="space-y-1 rounded-lg border border-counter-700 bg-counter-950 p-3 font-mono text-xs">
                <div className="flex justify-between text-cream-400">
                  <span>Itens:</span>
                  <span>{formatCurrency(totals.subtotal)}</span>
                </div>
                <div className="mt-1.5 flex justify-between border-t border-counter-700 pt-1.5 text-sm font-bold text-cream-100">
                  <span>Total:</span>
                  <span className="text-gold-400">
                    {formatCurrency(totals.total)}
                  </span>
                </div>
              </div>
            </div>

            {paymentMethod === 'fiado' && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-rose-400">
                    Vincular cliente do caderno
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowNewClientForm(!showNewClientForm)}
                    className="inline-flex items-center gap-0.5 text-[11px] font-bold text-gold-400 hover:underline"
                  >
                    <UserPlus size={12} /> Novo
                  </button>
                </div>

                {!showNewClientForm ? (
                  <select
                    value={customerId}
                    onChange={(e) => {
                      setCustomerId(e.target.value);
                      setError(null);
                    }}
                    className="w-full rounded-lg border border-counter-700 bg-counter-950 px-2.5 py-1.5 text-xs text-cream-200 outline-none"
                    data-testid="checkout-cliente-select"
                    required
                  >
                    <option value="">-- Escolha o cliente --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} (dev: {formatCurrency(c.balance)})
                      </option>
                    ))}
                  </select>
                ) : (
                  <form
                    onSubmit={handleQuickAddClient}
                    className="space-y-1.5 rounded border border-counter-700 bg-counter-950 p-2.5 text-left"
                  >
                    <input
                      type="text"
                      placeholder="Nome completo"
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                      className="w-full rounded border border-counter-700 bg-counter-800 px-1.5 py-1 text-[11px] text-cream-100"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Telefone"
                      value={newClientPhone}
                      onChange={(e) => setNewClientPhone(e.target.value)}
                      className="w-full rounded border border-counter-700 bg-counter-800 px-1.5 py-1 text-[11px] text-cream-100"
                    />
                    <button
                      type="submit"
                      className="w-full rounded bg-gold-500 py-1 text-[11px] font-bold text-counter-950 hover:bg-gold-400"
                    >
                      Salvar
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-center text-xs font-semibold text-rose-300">
            {error}
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-counter-700 bg-counter-800 py-3 text-sm font-semibold text-cream-200 transition hover:bg-counter-700"
          >
            Cancelar
          </button>
          <button
            type="button"
            id="btn-confirm-pos-payment"
            onClick={handleConfirm}
            className="flex-1 rounded-xl bg-gold-500 py-3 text-sm font-bold text-counter-950 shadow-md shadow-gold-500/20 transition hover:bg-gold-400"
          >
            Confirmar pagamento
          </button>
        </div>
      </div>
    </div>
  );
}
