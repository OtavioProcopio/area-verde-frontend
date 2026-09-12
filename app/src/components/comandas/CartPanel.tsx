import { ShoppingBag, UserCheck } from 'lucide-react';
import { Comanda, Customer, Product } from '../../types';
import { formatCurrency } from '../../features/shared/utils/formatCurrency';
import { getComandaTotals } from './comandaCalculations';
import { CartItemRow } from './CartItemRow';

const STATUS_LABEL: Record<string, string> = {
  active: 'Aberta',
  paid_fiado: 'Fiado',
  paid: 'Paga',
  cancelled: 'Cancelada',
};

const STATUS_CLASS: Record<string, string> = {
  active: 'bg-gold-500 text-counter-950',
  paid_fiado: 'bg-gold-300/80 text-counter-950',
  paid: 'bg-emerald-400 text-counter-950',
  cancelled: 'bg-cream-400/30 text-cream-200',
};

interface CartPanelProps {
  comanda: Comanda;
  products: Product[];
  customers: Customer[];
  onUpdateComanda: (id: string, updates: Partial<Comanda>) => void;
  onUpdateComandaItemQty: (itemId: string, qty: number) => void;
  onRequestRemoveItem: (itemId: string, productName: string) => void;
  onRequestCancelComanda: () => void;
  onCheckout: (metodo: 'dinheiro' | 'fiado') => void;
}

export function CartPanel({
  comanda,
  products,
  customers,
  onUpdateComanda,
  onUpdateComandaItemQty,
  onRequestRemoveItem,
  onRequestCancelComanda,
  onCheckout,
}: CartPanelProps) {
  const totals = getComandaTotals(comanda);
  const boundCustomer = customers.find((c) => c.id === comanda.customerId);
  const statusKey =
    comanda.status === 'paid' && comanda.paymentMethod === 'fiado'
      ? 'paid_fiado'
      : comanda.status;

  return (
    <div className="flex h-full flex-col overflow-hidden bg-counter-950">
      <div className="flex shrink-0 items-start justify-between gap-3 border-b-2 border-counter-700 p-4">
        <div className="min-w-0">
          <div className="mb-1.5 flex flex-wrap items-center gap-2.5">
            <h2 className="font-display text-4xl font-black leading-none tracking-tight text-cream-100">
              {comanda.code}
            </h2>
            <span
              className={`rounded px-2 py-1 text-xs font-black uppercase tracking-wide ${STATUS_CLASS[statusKey]}`}
            >
              {STATUS_LABEL[statusKey]}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-cream-300">
            <UserCheck size={17} className="shrink-0" />
            {boundCustomer ? (
              <span className="font-bold text-gold-400">
                {boundCustomer.name}
              </span>
            ) : (
              <span className="opacity-70">Avulso</span>
            )}
            <select
              className="cursor-pointer appearance-none rounded border border-counter-700 bg-counter-800 py-1 pl-2 pr-5 text-xs font-bold text-cream-200 outline-none"
              value={comanda.customerId || ''}
              onChange={(e) =>
                onUpdateComanda(comanda.id, {
                  customerId: e.target.value || null,
                })
              }
            >
              <option value="">Vincular cliente...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {comanda.status === 'active' && (
          <button
            type="button"
            onClick={onRequestCancelComanda}
            className="shrink-0 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-300 transition hover:bg-rose-500/20"
          >
            Cancelar conta
          </button>
        )}
      </div>

      <div className="flex-1 space-y-2.5 overflow-y-auto p-4">
        {comanda.items.map((item) => (
          <CartItemRow
            key={item.id}
            item={item}
            product={products.find((p) => p.name === item.productName)}
            onIncrement={() =>
              onUpdateComandaItemQty(item.id, item.quantity + 1)
            }
            onDecrement={() => {
              if (item.quantity === 1) {
                onRequestRemoveItem(item.id, item.productName);
              } else {
                onUpdateComandaItemQty(item.id, item.quantity - 1);
              }
            }}
            onRemove={() => onRequestRemoveItem(item.id, item.productName)}
          />
        ))}
        {comanda.items.length === 0 && (
          <div className="flex flex-col items-center py-10 text-center text-cream-400">
            <ShoppingBag size={48} className="mb-3 opacity-40" />
            <p className="text-base">Nenhum item lançado.</p>
            <p className="text-sm opacity-70">
              Busque e adicione no painel ao lado.
            </p>
          </div>
        )}
      </div>

      <div className="shrink-0 border-t-2 border-counter-700 bg-counter-900 p-4">
        <div className="mb-3 flex items-stretch justify-between gap-3 rounded-lg border border-counter-700 bg-counter-950 px-4 py-3">
          <div>
            <span className="block text-[11px] font-bold uppercase tracking-wide text-cream-400">
              Recebido
            </span>
            <span className="font-mono text-xl font-bold tabular-nums text-emerald-400">
              {formatCurrency(totals.pago)}
            </span>
          </div>
          <div>
            <span className="block text-[11px] font-bold uppercase tracking-wide text-cream-400">
              Restante
            </span>
            <span className="font-mono text-xl font-bold tabular-nums text-rose-400">
              {formatCurrency(totals.restante)}
            </span>
          </div>
          <div className="text-right">
            <span className="block text-[11px] font-bold uppercase tracking-wide text-cream-400">
              Total da conta
            </span>
            <span className="font-mono text-4xl font-black tabular-nums text-gold-400">
              {formatCurrency(totals.total)}
            </span>
          </div>
        </div>

        {comanda.status === 'active' && (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => onCheckout('fiado')}
              className="flex flex-1 flex-col items-center justify-center rounded-lg border-2 border-gold-700 bg-transparent py-4 text-sm font-bold leading-tight text-gold-300 transition hover:bg-gold-700/15"
            >
              Lançar no
              <span className="text-base">caderno</span>
            </button>
            <button
              type="button"
              onClick={() => onCheckout('dinheiro')}
              className="flex flex-[2] flex-col items-center justify-center rounded-lg bg-gold-500 py-4 text-lg font-black leading-tight text-counter-950 shadow-lg shadow-gold-500/20 transition hover:bg-gold-400"
            >
              Pagamento e fechamento
              <span className="text-xs font-bold opacity-80">
                Dinheiro, Pix ou cartão
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
