import React, { useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { Category, Product } from '../../types';
import { ProductCard } from './ProductCard';
import { getCategoryColor } from './categoryColors';

const PRODUCT_GRID_LIMIT = 60;
const JUST_ADDED_DURATION_MS = 450;

interface ProductPickerProps {
  products: Product[];
  categories: Category[];
  permitirEstoqueNegativo: boolean;
  onAddProduct: (product: Product) => void;
}

export function ProductPicker({
  products,
  categories,
  permitirEstoqueNegativo,
  onAddProduct,
}: ProductPickerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tudo');
  const [justAddedId, setJustAddedId] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const justAddedTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const categoryOptions = useMemo(
    () => categories.map((c) => c.name).filter((n) => n !== 'Ingredientes'),
    [categories],
  );

  const filteredProducts = useMemo(
    () =>
      products.filter((prod) => {
        const matchesSearch = prod.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
        const matchesCategory =
          selectedCategory === 'Tudo' || prod.category === selectedCategory;
        return matchesSearch && matchesCategory;
      }),
    [products, searchTerm, selectedCategory],
  );

  const visibleProducts = searchTerm
    ? filteredProducts
    : filteredProducts.slice(0, PRODUCT_GRID_LIMIT);
  const hiddenProductsCount = filteredProducts.length - visibleProducts.length;

  const isOutOfStock = (product: Product) =>
    !product.isComposite && product.stock <= 0 && !permitirEstoqueNegativo;

  const flashJustAdded = (productId: string) => {
    setJustAddedId(productId);
    if (justAddedTimeout.current) clearTimeout(justAddedTimeout.current);
    justAddedTimeout.current = setTimeout(
      () => setJustAddedId(null),
      JUST_ADDED_DURATION_MS,
    );
  };

  const handleAdd = (product: Product) => {
    if (isOutOfStock(product)) return;
    flashJustAdded(product.id);
    onAddProduct(product);
  };

  const handleSearchKeyDown = (event: React.KeyboardEvent) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    const firstMatch = visibleProducts[0];
    if (firstMatch) handleAdd(firstMatch);
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-counter-900 p-4">
      <div className="relative mb-3 shrink-0">
        <Search
          size={26}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-500"
        />
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Ex: Skol"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          className="w-full rounded-lg border-2 border-counter-700 bg-counter-950 py-4 pl-12 pr-4 text-lg font-bold text-cream-100 placeholder:text-cream-400/50 outline-none transition-colors focus:border-gold-500"
          autoComplete="off"
          autoFocus
          data-testid="pos-product-search"
        />
      </div>

      <div className="scrollbar-hide mb-3 flex shrink-0 gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setSelectedCategory('Tudo')}
          className={`shrink-0 rounded-full border px-4 py-2 text-sm font-bold transition ${
            selectedCategory === 'Tudo'
              ? 'border-gold-500 bg-gold-500 text-counter-950'
              : 'border-counter-700 bg-counter-800 text-cream-300 hover:border-gold-500/50'
          }`}
        >
          Tudo
        </button>
        {categoryOptions.map((cat) => {
          const color = getCategoryColor(cat);
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm font-bold transition ${
                isActive
                  ? `${color.bar} border-transparent text-counter-950`
                  : `border-counter-700 bg-counter-800 ${color.text} hover:border-current`
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      <div className="grid flex-1 auto-rows-min grid-cols-[repeat(auto-fill,minmax(155px,1fr))] gap-3 overflow-y-auto pr-1">
        {visibleProducts.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            disabled={isOutOfStock(p)}
            justAdded={justAddedId === p.id}
            onAdd={handleAdd}
          />
        ))}
        {visibleProducts.length === 0 && (
          <p className="col-span-full py-10 text-center text-base text-cream-400">
            Nenhum produto encontrado.
          </p>
        )}
      </div>

      {hiddenProductsCount > 0 && (
        <p className="shrink-0 pt-3 text-center text-xs text-cream-400">
          Mostrando {visibleProducts.length} de {filteredProducts.length}{' '}
          produtos — digite para buscar os outros {hiddenProductsCount}.
        </p>
      )}
    </div>
  );
}
