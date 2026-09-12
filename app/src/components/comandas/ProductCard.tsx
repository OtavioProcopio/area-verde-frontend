import { Product } from '../../types';
import { formatCurrency } from '../../features/shared/utils/formatCurrency';
import { getCategoryColor } from './categoryColors';

interface ProductCardProps {
  product: Product;
  disabled: boolean;
  justAdded: boolean;
  onAdd: (product: Product) => void;
}

export function ProductCard({
  product,
  disabled,
  justAdded,
  onAdd,
}: ProductCardProps) {
  const color = getCategoryColor(product.category);

  return (
    <button
      type="button"
      onClick={() => !disabled && onAdd(product)}
      disabled={disabled}
      className={`group relative flex h-24 flex-col justify-between overflow-hidden rounded-lg border p-3 pl-4 text-left transition-all duration-150 ${
        disabled
          ? 'cursor-not-allowed border-counter-700/60 bg-counter-900/60 opacity-40'
          : justAdded
            ? 'scale-[1.02] border-gold-400 bg-counter-700 shadow-[0_0_0_3px_rgba(209,160,74,0.35)]'
            : 'cursor-pointer border-counter-700 bg-counter-800 hover:border-gold-500/70 hover:bg-counter-700'
      }`}
    >
      <span className={`absolute inset-y-0 left-0 w-1.5 ${color.bar}`} />

      <span className="line-clamp-2 text-base font-bold leading-tight text-cream-100">
        {product.name}
      </span>

      <div className="flex items-end justify-between gap-2">
        <span className="font-mono text-xl font-black tracking-tight text-gold-400">
          {formatCurrency(product.price)}
        </span>
        <span className="shrink-0 rounded bg-counter-950/60 px-1.5 py-0.5 font-mono text-[11px] font-bold text-cream-400">
          {product.isComposite
            ? 'PREP'
            : `${product.stock} ${product.unit.toUpperCase()}`}
        </span>
      </div>
    </button>
  );
}
