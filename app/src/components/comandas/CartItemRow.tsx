import { Minus, Plus, Trash2 } from 'lucide-react';
import { Product, TabItem } from '../../types';
import { formatCurrency } from '../../features/shared/utils/formatCurrency';

interface CartItemRowProps {
  item: TabItem;
  product?: Product;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
}

export function CartItemRow({
  item,
  product,
  onIncrement,
  onDecrement,
  onRemove,
}: CartItemRowProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-counter-700 bg-counter-800 p-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h4 className="truncate text-lg font-bold text-cream-100">
            {item.productName}
          </h4>
          {product?.isComposite && (
            <span className="shrink-0 rounded border border-sky-400/30 bg-sky-400/15 px-1.5 py-0.5 text-[11px] font-bold text-sky-300">
              Preparo
            </span>
          )}
        </div>
        <div className="mt-0.5 font-mono text-sm text-cream-400">
          {formatCurrency(item.price)} un.
        </div>
      </div>

      <div className="flex shrink-0 items-center rounded-lg border border-counter-700 bg-counter-950">
        <button
          type="button"
          onClick={onDecrement}
          aria-label="Diminuir quantidade"
          className="flex h-12 w-12 items-center justify-center rounded-l-lg text-cream-300 transition hover:bg-counter-700 hover:text-rose-400"
        >
          <Minus size={24} />
        </button>
        <span className="w-10 text-center font-mono text-lg font-bold text-cream-100">
          {item.quantity}
        </span>
        <button
          type="button"
          onClick={onIncrement}
          aria-label="Aumentar quantidade"
          className="flex h-12 w-12 items-center justify-center rounded-r-lg text-cream-300 transition hover:bg-counter-700 hover:text-gold-400"
        >
          <Plus size={24} />
        </button>
      </div>

      <div className="min-w-[90px] shrink-0 text-right font-mono text-lg font-black text-gold-400">
        {formatCurrency(item.price * item.quantity)}
      </div>

      <button
        type="button"
        onClick={onRemove}
        aria-label="Remover item"
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-cream-400 transition hover:bg-rose-500/15 hover:text-rose-400"
      >
        <Trash2 size={22} />
      </button>
    </div>
  );
}
