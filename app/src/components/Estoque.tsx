import React, { useState } from 'react';
import { Product, Category, StockMovement } from '../types';
import {
  createStockAdjustment,
  createStockEntry,
  fetchStockMovements,
} from '../features/estoque/services/estoqueService';
import { getApiErrorMessage } from '../features/shared/utils/getApiErrorMessage';
import { InlineFeedback } from '../features/shared/components/InlineFeedback';
import {
  ArrowDownToLine,
  Settings2,
  TrendingDown,
  History,
  X,
  Search,
} from 'lucide-react';

interface EstoqueProps {
  products: Product[];
  categories: Category[];
  onUpdateProduct: (p: Product) => void;
  onRefreshState: () => Promise<void>;
}

export default function Estoque({
  products,
  categories,
  onUpdateProduct: _onUpdateProduct,
  onRefreshState,
}: EstoqueProps) {
  const [movements, setMovements] = useState<StockMovement[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<
    'Tudo' | 'Baixo' | 'Negativo' | 'Normal'
  >('Tudo');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tudo');

  // Modals state
  const [activeModal, setActiveModal] = useState<
    'entrada' | 'ajuste' | 'history' | null
  >(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Form state
  const [qty, setQty] = useState('');
  const [note, setNote] = useState('');

  const controlledProducts = products.filter((p) => !p.isComposite);

  const filteredProducts = controlledProducts.filter((p) => {
    if (searchTerm && !p.name.toLowerCase().includes(searchTerm.toLowerCase()))
      return false;
    if (selectedCategory !== 'Tudo' && p.category !== selectedCategory)
      return false;

    if (filterType === 'Baixo') return p.stock <= p.minStock && p.stock > 0;
    if (filterType === 'Negativo') return p.stock <= 0;
    if (filterType === 'Normal') return p.stock > p.minStock;

    return true;
  });

  const getStockStatus = (p: Product) => {
    if (p.stock <= 0)
      return {
        label: 'Negativo/Zerado',
        color: 'border-rose-400/30 bg-rose-400/10 text-rose-400',
      };
    if (p.stock <= p.minStock)
      return {
        label: 'Baixo',
        color: 'border-gold-500/30 bg-gold-500/10 text-gold-300',
      };
    return {
      label: 'Normal',
      color: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-400',
    };
  };

  const [formError, setFormError] = useState<string | null>(null);

  const openEntrada = (p: Product) => {
    setSelectedProduct(p);
    setQty('');
    setNote('');
    setFormError(null);
    setActiveModal('entrada');
  };

  const openAjuste = (p: Product) => {
    setSelectedProduct(p);
    setQty(p.stock.toString());
    setNote('');
    setFormError(null);
    setActiveModal('ajuste');
  };

  const openHistory = async (p: Product) => {
    setSelectedProduct(p);
    const loadedMovements = await fetchStockMovements(p.id);
    setMovements(loadedMovements);
    setActiveModal('history');
  };

  const handleSaveEntrada = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    const parsedQty = parseFloat(qty);
    if (isNaN(parsedQty) || parsedQty <= 0) return;

    setFormError(null);
    try {
      await createStockEntry(selectedProduct.id, parsedQty, note || undefined);
      await onRefreshState();
      setActiveModal(null);
    } catch (error) {
      setFormError(
        getApiErrorMessage(error, 'Não foi possível registrar a entrada.'),
      );
    }
  };

  const handleSaveAjuste = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    const parsedNewBalance = parseFloat(qty);
    if (isNaN(parsedNewBalance)) return;

    if (!window.confirm('Confirmar o ajuste de estoque?')) return;

    setFormError(null);
    try {
      await createStockAdjustment(
        selectedProduct.id,
        parsedNewBalance,
        note || undefined,
      );
      await onRefreshState();
      setActiveModal(null);
    } catch (error) {
      setFormError(
        getApiErrorMessage(error, 'Não foi possível salvar o ajuste.'),
      );
    }
  };

  const productMovements = selectedProduct
    ? movements.filter((m) => m.productId === selectedProduct.id)
    : [];

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-counter-700 bg-counter-900 p-4 xl:flex-row">
        <div className="grid w-full flex-1 grid-cols-1 gap-3 md:grid-cols-3">
          <div className="relative">
            <Search
              size={19}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-cream-400"
            />
            <input
              type="text"
              placeholder="Buscar produto..."
              className="w-full rounded-xl border border-counter-700 bg-counter-950 py-2.5 pl-9 pr-3 text-sm text-cream-100 outline-none focus:border-sky-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="w-full cursor-pointer appearance-none rounded-xl border border-counter-700 bg-counter-950 px-3 py-2.5 text-sm font-bold text-cream-200 outline-none focus:border-sky-400"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
          >
            <option value="Tudo">Todos os Status</option>
            <option value="Normal">Estoque Normal</option>
            <option value="Baixo">Estoque Baixo</option>
            <option value="Negativo">Zerado ou Negativo</option>
          </select>

          <select
            className="w-full cursor-pointer appearance-none rounded-xl border border-counter-700 bg-counter-950 px-3 py-2.5 text-sm text-cream-200 outline-none focus:border-sky-400"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="Tudo">Todas as Categorias</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-counter-700 bg-counter-900">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left leading-normal">
            <thead>
              <tr className="border-b border-counter-700 bg-counter-950 text-xs font-bold uppercase tracking-wide text-cream-400">
                <th className="px-5 py-3">Produto</th>
                <th className="px-4 py-3 text-center">Unidade</th>
                <th className="px-5 py-3 text-right">Saldo Atual</th>
                <th className="px-4 py-3 text-center">Mínimo</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-5 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-counter-800">
              {filteredProducts.map((p) => {
                const status = getStockStatus(p);
                return (
                  <tr
                    key={p.id}
                    className="transition duration-150 hover:bg-counter-800"
                  >
                    <td className="px-5 py-3.5">
                      <span className="block text-sm font-bold text-cream-100">
                        {p.name}
                      </span>
                      <span className="text-xs uppercase tracking-wide text-cream-400">
                        {p.category}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center font-mono text-xs font-bold text-cream-300">
                      {p.unit.toUpperCase()}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span
                        className={`font-mono text-base font-black ${p.stock <= p.minStock ? 'text-rose-400' : 'text-cream-100'}`}
                      >
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center font-mono text-cream-400">
                      {p.minStock}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={`rounded border px-2 py-0.5 text-xs font-bold uppercase ${status.color}`}
                      >
                        {status.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEntrada(p)}
                          className="flex items-center gap-1 rounded border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1.5 text-xs font-bold uppercase text-emerald-400 transition hover:bg-emerald-400/20"
                          title="Dar Entrada"
                        >
                          <ArrowDownToLine size={16} /> Entrar
                        </button>
                        <button
                          onClick={() => openAjuste(p)}
                          className="flex items-center gap-1 rounded border border-counter-700 bg-counter-800 px-2.5 py-1.5 text-xs font-bold uppercase text-cream-300 transition hover:bg-counter-700"
                          title="Ajuste Manual"
                        >
                          <Settings2 size={16} /> Ajst
                        </button>
                        <button
                          onClick={() => openHistory(p)}
                          className="flex items-center gap-1 rounded border border-sky-400/30 bg-sky-400/10 px-2.5 py-1.5 text-xs font-bold uppercase text-sky-400 transition hover:bg-sky-400/20"
                          title="Histórico"
                        >
                          <History size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredProducts.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="bg-counter-950/40 py-12 text-center text-sm italic text-cream-400"
                  >
                    Nenhum produto atende aos filtros atuais.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Entrada */}
      {activeModal === 'entrada' && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-sm rounded-2xl border-2 border-emerald-400/30 bg-counter-900 p-5 shadow-2xl">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="absolute right-4 top-4 text-cream-400 hover:text-cream-100"
            >
              <X size={22} />
            </button>
            <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-cream-100">
              <ArrowDownToLine className="text-emerald-400" size={24} />
              Entrada de Estoque
            </h3>

            <div className="mb-4 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-3">
              <div className="font-bold text-emerald-300">
                {selectedProduct.name}
              </div>
              <div className="mt-1 text-xs uppercase text-emerald-400">
                Saldo atual: {selectedProduct.stock} {selectedProduct.unit}
              </div>
            </div>

            {formError && (
              <div className="mb-4">
                <InlineFeedback tone="error" message={formError} />
              </div>
            )}

            <form onSubmit={handleSaveEntrada} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-cream-400">
                  Quantidade a adicionar{' '}
                  <span className="text-rose-400">*</span>
                </label>
                <div className="relative flex">
                  <input
                    type="number"
                    step="0.001"
                    min="0.001"
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    className="w-full rounded-lg border border-counter-700 bg-counter-950 px-3 py-2 pr-12 font-mono text-sm font-bold text-cream-100 outline-none focus:border-emerald-400"
                    placeholder="Ex: 10"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-xs font-bold uppercase text-cream-400">
                    {selectedProduct.unit}
                  </span>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-cream-400">
                  Motivo / Observação
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full rounded-lg border border-counter-700 bg-counter-950 px-3 py-2 text-sm text-cream-100 outline-none focus:border-emerald-400"
                  placeholder="Ex: Nota fiscal 1234"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-emerald-500 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-400"
              >
                Confirmar Entrada
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Ajuste */}
      {activeModal === 'ajuste' && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-sm rounded-2xl border-2 border-counter-700 bg-counter-900 p-5 shadow-2xl">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="absolute right-4 top-4 text-cream-400 hover:text-cream-100"
            >
              <X size={22} />
            </button>
            <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-cream-100">
              <Settings2 className="text-cream-300" size={24} />
              Ajuste Manual
            </h3>

            <div className="mb-4 rounded-xl border border-counter-700 bg-counter-800 p-3">
              <div className="font-bold text-cream-100">
                {selectedProduct.name}
              </div>
              <div className="mt-1 text-xs uppercase text-cream-400">
                Pode ser para mais ou para menos.
              </div>
            </div>

            {formError && (
              <div className="mb-4">
                <InlineFeedback tone="error" message={formError} />
              </div>
            )}

            <form onSubmit={handleSaveAjuste} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-cream-400">
                  Novo Saldo Correto <span className="text-rose-400">*</span>
                </label>
                <div className="relative flex">
                  <input
                    type="number"
                    step="0.001"
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    className="w-full rounded-lg border border-counter-700 bg-counter-950 px-3 py-2 pr-12 font-mono text-sm font-bold text-cream-100 outline-none focus:border-sky-400"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-xs font-bold uppercase text-cream-400">
                    {selectedProduct.unit}
                  </span>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-cream-400">
                  Motivo <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full rounded-lg border border-counter-700 bg-counter-950 px-3 py-2 text-sm text-cream-100 outline-none focus:border-sky-400"
                  placeholder="Ex: Quebra, Vencimento, Contagem"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-gold-500 py-2.5 text-sm font-bold text-counter-950 transition hover:bg-gold-400"
              >
                Salvar Ajuste
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: History */}
      {activeModal === 'history' && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border-2 border-counter-700 bg-counter-900 p-5 shadow-2xl">
            <div className="mb-4 flex shrink-0 items-start justify-between border-b border-counter-700 pb-4">
              <div>
                <h3 className="flex items-center gap-2 font-display text-xl font-bold text-cream-100">
                  <History className="text-sky-400" size={24} />
                  Extrato de Estoque
                </h3>
                <p className="mt-1 font-mono text-xs text-cream-400">
                  {selectedProduct.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="rounded-lg bg-counter-800 p-2 text-cream-300 hover:text-cream-100"
              >
                <X size={22} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2">
              {productMovements.length === 0 ? (
                <div className="py-10 text-center text-sm text-cream-400">
                  Nenhum movimento registrado (dados temporários da sessão).
                </div>
              ) : (
                <div className="space-y-3">
                  {productMovements.map((m) => (
                    <div
                      key={m.id}
                      className="flex flex-wrap items-center justify-between rounded-xl border border-counter-700 bg-counter-800 p-3.5"
                    >
                      <div className="flex items-center gap-3">
                        {m.type === 'entrada' && (
                          <ArrowDownToLine
                            size={22}
                            className="text-emerald-400"
                          />
                        )}
                        {m.type === 'saida' && (
                          <TrendingDown size={22} className="text-rose-400" />
                        )}
                        {m.type === 'ajuste' && (
                          <Settings2 size={22} className="text-cream-300" />
                        )}

                        <div>
                          <div className="font-mono text-xs font-bold capitalize text-cream-100">
                            {m.type}
                          </div>
                          <div className="text-xs text-cream-400">
                            {new Date(m.date).toLocaleString('pt-BR')}
                          </div>
                          {m.note && (
                            <div className="mt-0.5 text-xs text-cream-400">
                              Motivo: {m.note}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <div
                          className={`font-mono text-sm font-bold ${m.quantity > 0 ? 'text-emerald-400' : 'text-cream-200'}`}
                        >
                          {m.quantity > 0 ? '+' : ''}
                          {m.quantity} {selectedProduct.unit}
                        </div>
                        <div className="font-mono text-xs text-cream-400">
                          Saldo: {m.newBalance} {selectedProduct.unit}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
