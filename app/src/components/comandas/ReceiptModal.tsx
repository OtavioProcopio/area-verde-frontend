import { Printer, X } from 'lucide-react';
import { Comanda } from '../../types';
import { getComandaTotals } from './comandaCalculations';

interface ReceiptModalProps {
  comanda: Comanda;
  onClose: () => void;
}

export function ReceiptModal({ comanda, onClose }: ReceiptModalProps) {
  const totals = getComandaTotals(comanda);
  const paidAt = comanda.paidAt ? new Date(comanda.paidAt) : new Date();
  const totalPago = totals.subtotal - comanda.discount + comanda.addition;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-sm rounded-2xl border-2 border-counter-700 bg-counter-900 p-5 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-cream-400 hover:text-cream-100"
        >
          <X size={22} />
        </button>

        <div className="space-y-3.5 rounded-lg border border-slate-200 bg-stone-50 p-5 font-mono text-xs leading-normal text-stone-900 shadow-inner">
          <div className="text-center font-bold">
            <p className="font-sans text-sm font-extrabold tracking-tight text-slate-900">
              BAR AREA VERDE
            </p>
            <p className="text-[11px] font-normal tracking-wide">
              AMIGOS E FAMÍLIA LTDA
            </p>
            <p className="border-b border-dashed border-stone-300 pb-2 text-[10px] font-normal text-stone-500">
              AV. DA AMIZADE, 1800 — BALCÃO
            </p>
          </div>

          <div>
            <p className="text-center text-[11px] font-bold uppercase tracking-wider text-stone-600">
              Cupom operacional
            </p>
            <div className="mt-2 grid grid-cols-2 gap-y-0.5 text-[11px] text-stone-600">
              <span>Comanda/ID:</span>
              <span className="text-right font-bold">{comanda.code}</span>
              <span>Data:</span>
              <span className="text-right">
                {paidAt.toLocaleDateString('pt-BR')}
              </span>
              <span>Hora:</span>
              <span className="text-right">
                {paidAt.toLocaleTimeString('pt-BR')}
              </span>
              <span>Pagamento:</span>
              <span className="text-right font-bold text-gold-700">
                {(comanda.paymentMethod || 'dinheiro').toUpperCase()}
              </span>
            </div>
          </div>

          <div className="select-none space-y-1 border-b border-t border-dashed border-stone-300 py-2 text-[11px]">
            <div className="mb-1 grid grid-cols-12 font-bold text-stone-500">
              <span className="col-span-6">Descrição</span>
              <span className="col-span-2 text-right">Qtd</span>
              <span className="col-span-4 text-right">Valor</span>
            </div>
            {comanda.items.map((item) => (
              <div key={item.id} className="grid grid-cols-12 text-stone-800">
                <span className="col-span-6 truncate font-medium">
                  {item.productName}
                </span>
                <span className="col-span-2 text-right font-medium">
                  {item.quantity}
                </span>
                <span className="col-span-4 text-right font-bold">
                  {(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-0.5 text-right text-[11px] text-stone-700">
            <p className="flex justify-between">
              <span>Subtotal:</span>
              <span>{totals.subtotal.toFixed(2)}</span>
            </p>
            {comanda.discount > 0 && (
              <p className="flex justify-between font-bold text-rose-700">
                <span>Desconto (-):</span>
                <span>{comanda.discount.toFixed(2)}</span>
              </p>
            )}
            {comanda.addition > 0 && (
              <p className="flex justify-between font-bold">
                <span>Serviço (+):</span>
                <span>{comanda.addition.toFixed(2)}</span>
              </p>
            )}
            <p className="mt-1 flex justify-between border-t border-dashed border-stone-300 pt-1.5 text-xs font-bold text-slate-900">
              <span>Total pago:</span>
              <span className="font-sans text-sm font-extrabold text-gold-700">
                R$ {totalPago.toFixed(2)}
              </span>
            </p>
          </div>

          <div className="space-y-0.5 border-t border-dashed border-stone-300 pt-3 text-center text-[10px] text-stone-400">
            <p>Obrigado pela preferência e respeito.</p>
            <p>Volte sempre à Área Verde!</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl bg-gold-500 py-3 text-sm font-bold text-counter-950 shadow-xs transition hover:bg-gold-400"
        >
          <Printer size={17} /> Fechar e prosseguir
        </button>
      </div>
    </div>
  );
}
