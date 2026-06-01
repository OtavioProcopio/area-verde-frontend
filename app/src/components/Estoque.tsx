import React, { useState } from 'react';
import { Product, Category, StockMovement } from '../types';
import {
  createStockAdjustment,
  createStockEntry,
  fetchStockMovements,
} from '../features/estoque/services/estoqueService';
import { 
  Package, 
  ArrowDownToLine, 
  Settings2, 
  TrendingDown, 
  TrendingUp, 
  AlertTriangle,
  History,
  CheckCircle2,
  X,
  Search
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
  onUpdateProduct,
  onRefreshState,
}: EstoqueProps) {
  const [movements, setMovements] = useState<StockMovement[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'Tudo' | 'Baixo' | 'Negativo' | 'Normal'>('Tudo');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tudo');

  // Modals state
  const [activeModal, setActiveModal] = useState<'entrada' | 'ajuste' | 'history' | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Form state
  const [qty, setQty] = useState('');
  const [note, setNote] = useState('');

  const controlledProducts = products.filter(p => !p.isComposite);

  const filteredProducts = controlledProducts.filter(p => {
    if (searchTerm && !p.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (selectedCategory !== 'Tudo' && p.category !== selectedCategory) return false;
    
    if (filterType === 'Baixo') return p.stock <= p.minStock && p.stock > 0;
    if (filterType === 'Negativo') return p.stock <= 0;
    if (filterType === 'Normal') return p.stock > p.minStock;
    
    return true;
  });

  const getStockStatus = (p: Product) => {
    if (p.stock <= 0) return { label: 'Negativo/Zerado', color: 'bg-rose-950/40 text-rose-400 border-rose-800/60' };
    if (p.stock <= p.minStock) return { label: 'Baixo', color: 'bg-amber-950/40 text-amber-400 border-amber-800/60' };
    return { label: 'Normal', color: 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60' };
  };

  const openEntrada = (p: Product) => {
    setSelectedProduct(p);
    setQty('');
    setNote('');
    setActiveModal('entrada');
  };

  const openAjuste = (p: Product) => {
    setSelectedProduct(p);
    setQty(p.stock.toString());
    setNote('');
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

    await createStockEntry(selectedProduct.id, parsedQty, note || undefined);
    await onRefreshState();
    setActiveModal(null);
  };

  const handleSaveAjuste = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    const parsedNewBalance = parseFloat(qty);
    if (isNaN(parsedNewBalance)) return;

    if (!window.confirm("Confirmar o ajuste de estoque?")) return;

    await createStockAdjustment(
      selectedProduct.id,
      parsedNewBalance,
      note || undefined,
    );
    await onRefreshState();
    setActiveModal(null);
  };

  const productMovements = selectedProduct ? movements.filter(m => m.productId === selectedProduct.id) : [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest font-mono text-blue-500 font-semibold block mb-1">Controle de Inventário</span>
          <h2 className="text-3xl font-display font-bold text-slate-50 tracking-tight">
            Gestão de <span className="text-blue-500 font-bold">Estoque</span>
          </h2>
        </div>
      </div>

      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-sm flex flex-col xl:flex-row gap-4 justify-between">
        <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text" 
              placeholder="Buscar produto..." 
              className="w-full pl-9 pr-3 py-2 bg-slate-800/50 border border-slate-800 rounded-xl text-xs outline-none focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select 
            className="w-full px-3 py-2 bg-slate-800/50 border border-slate-800 rounded-xl text-xs outline-none focus:border-blue-500 cursor-pointer appearance-none text-slate-300 font-bold"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
          >
            <option value="Tudo">Todos os Status</option>
            <option value="Normal">Estoque Normal</option>
            <option value="Baixo">Estoque Baixo</option>
            <option value="Negativo">Zerado ou Negativo</option>
          </select>
          
          <select 
             className="w-full px-3 py-2 bg-slate-800/50 border border-slate-800 rounded-xl text-xs outline-none focus:border-blue-500 cursor-pointer appearance-none text-slate-300"
             value={selectedCategory}
             onChange={(e) => setSelectedCategory(e.target.value)}
           >
             <option value="Tudo">Todas as Categorias</option>
             {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
           </select>
        </div>
      </div>

      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse leading-normal text-xs text-slate-300">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] uppercase font-mono tracking-wider text-slate-500 bg-slate-800/50">
                <th className="px-5 py-3">Produto</th>
                <th className="px-4 py-3 text-center">Unidade</th>
                <th className="px-5 py-3 text-right">Saldo Atual</th>
                <th className="px-4 py-3 text-center">Mínimo</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-5 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((p) => {
                const status = getStockStatus(p);
                return (
                  <tr key={p.id} className="hover:bg-slate-800/50/80 transition duration-150">
                    <td className="px-5 py-3">
                      <span className="font-bold text-slate-200 block">{p.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono uppercase">{p.category}</span>
                    </td>
                    <td className="px-4 py-3 text-center font-mono font-bold text-slate-500 bg-slate-800/50/30">
                      {p.unit.toUpperCase()}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className={`font-mono text-sm font-black ${p.stock <= p.minStock ? 'text-rose-500' : 'text-slate-200'}`}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-slate-500">
                      {p.minStock}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold font-mono border ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5 inline-flex">
                        <button
                          onClick={() => openEntrada(p)}
                          className="px-2 py-1 flex items-center gap-1 bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-400 border border-emerald-800/60 rounded transition cursor-pointer font-bold text-[10px] uppercase"
                          title="Dar Entrada"
                        >
                          <ArrowDownToLine size={12} /> Entrar
                        </button>
                        <button
                          onClick={() => openAjuste(p)}
                          className="px-2 py-1 flex items-center gap-1 bg-slate-800/50 hover:bg-slate-800 text-slate-500 border border-slate-800 rounded transition cursor-pointer font-bold text-[10px] uppercase"
                          title="Ajuste Manual"
                        >
                          <Settings2 size={12} /> Ajst
                        </button>
                        <button
                          onClick={() => openHistory(p)}
                          className="px-2 py-1 flex items-center gap-1 bg-blue-950/40 hover:bg-blue-900/50 text-blue-400 border border-blue-800/60 rounded transition cursor-pointer font-bold text-[10px] uppercase"
                          title="Histórico"
                        >
                          <History size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500 italic text-xs bg-slate-800/50/30">
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
         <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-xs">
            <div className="w-full max-w-sm bg-slate-900 border border-emerald-800/60 rounded-2xl p-6 shadow-2xl relative">
              <button type="button" onClick={() => setActiveModal(null)} className="absolute top-4 right-4 text-slate-500 hover:text-slate-200 cursor-pointer">
                <X size={18} />
              </button>
              <h3 className="text-lg font-display font-bold text-slate-200 flex items-center gap-2 mb-4">
                 <ArrowDownToLine className="text-emerald-500" size={20} />
                 Entrada de Estoque
              </h3>
              
              <div className="mb-4 p-3 bg-emerald-950/40 border border-emerald-900 rounded-xl">
                 <div className="font-bold text-emerald-200">{selectedProduct.name}</div>
                 <div className="text-[10px] font-mono text-emerald-400 mt-1 uppercase">Saldo atual: {selectedProduct.stock} {selectedProduct.unit}</div>
              </div>
              
              <form onSubmit={handleSaveEntrada} className="space-y-4">
                 <div>
                    <label className="block text-[10px] uppercase font-mono text-slate-500 mb-1">
                       Quantidade a adicionar <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex relative">
                       <input
                         type="number"
                         step="0.001"
                         min="0.001"
                         value={qty}
                         onChange={e => setQty(e.target.value)}
                         className="w-full bg-slate-800/50 border border-slate-800 px-3 py-2 pr-12 text-sm text-slate-200 font-mono rounded-lg outline-none focus:border-emerald-600 focus:bg-slate-900 font-bold"
                         placeholder="Ex: 10"
                         required
                       />
                       <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] uppercase font-mono font-bold text-slate-500">
                          {selectedProduct.unit}
                       </span>
                    </div>
                 </div>

                 <div>
                    <label className="block text-[10px] uppercase font-mono text-slate-500 mb-1">
                       Motivo / Observação
                    </label>
                    <input
                      type="text"
                      value={note}
                      onChange={e => setNote(e.target.value)}
                      className="w-full bg-slate-800/50 border border-slate-800 px-3 py-2 text-xs text-slate-200 rounded-lg outline-none focus:border-emerald-600 focus:bg-slate-900"
                      placeholder="Ex: Nota fiscal 1234"
                    />
                 </div>

                 <button type="submit" className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-950/400 text-white font-bold rounded-xl text-xs transition cursor-pointer">
                   Confirmar Entrada
                 </button>
              </form>
            </div>
         </div>
      )}

      {/* MODAL: Ajuste */}
      {activeModal === 'ajuste' && selectedProduct && (
         <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-xs">
            <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
              <button type="button" onClick={() => setActiveModal(null)} className="absolute top-4 right-4 text-slate-500 hover:text-slate-200 cursor-pointer">
                <X size={18} />
              </button>
              <h3 className="text-lg font-display font-bold text-slate-200 flex items-center gap-2 mb-4">
                 <Settings2 className="text-slate-500" size={20} />
                 Ajuste Manual
              </h3>
              
              <div className="mb-4 p-3 bg-slate-800/50 border border-slate-800 rounded-xl">
                 <div className="font-bold text-slate-50">{selectedProduct.name}</div>
                 <div className="text-[10px] font-mono text-slate-500 mt-1 uppercase">Pode ser para mais ou para menos.</div>
              </div>
              
              <form onSubmit={handleSaveAjuste} className="space-y-4">
                 <div>
                    <label className="block text-[10px] uppercase font-mono text-slate-500 mb-1">
                       Novo Saldo Correto <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex relative">
                       <input
                         type="number"
                         step="0.001"
                         value={qty}
                         onChange={e => setQty(e.target.value)}
                         className="w-full bg-slate-800/50 border border-slate-800 px-3 py-2 pr-12 text-sm text-slate-200 font-mono rounded-lg outline-none focus:border-blue-600 focus:bg-slate-900 font-bold"
                         required
                       />
                       <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] uppercase font-mono font-bold text-slate-500">
                          {selectedProduct.unit}
                       </span>
                    </div>
                 </div>

                 <div>
                    <label className="block text-[10px] uppercase font-mono text-slate-500 mb-1">
                       Motivo <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={note}
                      onChange={e => setNote(e.target.value)}
                      className="w-full bg-slate-800/50 border border-slate-800 px-3 py-2 text-xs text-slate-200 rounded-lg outline-none focus:border-blue-600 focus:bg-slate-900"
                      placeholder="Ex: Quebra, Vencimento, Contagem"
                      required
                    />
                 </div>

                 <button type="submit" className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition cursor-pointer">
                   Salvar Ajuste
                 </button>
              </form>
            </div>
         </div>
      )}

      {/* MODAL: History */}
      {activeModal === 'history' && selectedProduct && (
         <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-xs">
            <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
              <div className="flex justify-between items-start mb-4 shrink-0 border-b border-slate-800 pb-4">
                 <div>
                   <h3 className="text-xl font-display font-bold text-slate-200 flex items-center gap-2">
                     <History className="text-blue-500" size={20} />
                     Extrato de Estoque
                   </h3>
                   <p className="text-xs font-mono text-slate-500 mt-1">{selectedProduct.name}</p>
                 </div>
                 <button type="button" onClick={() => setActiveModal(null)} className="text-slate-500 hover:text-slate-200 bg-slate-800/50 p-2 rounded-lg cursor-pointer">
                   <X size={18} />
                 </button>
              </div>
              
              <div className="flex-1 overflow-y-auto pr-2">
                 {productMovements.length === 0 ? (
                    <div className="text-center py-10 text-slate-500 text-xs">
                       Nenhum movimento registrado (dados temporários da sessão).
                    </div>
                 ) : (
                    <div className="space-y-3">
                       {productMovements.map(m => (
                          <div key={m.id} className="flex flex-wrap items-center justify-between p-3 border border-slate-700 rounded-xl bg-slate-800/50">
                             <div className="flex items-center gap-3">
                                {m.type === 'entrada' && <ArrowDownToLine size={16} className="text-emerald-500" />}
                                {m.type === 'saida' && <TrendingDown size={16} className="text-rose-500" />}
                                {m.type === 'ajuste' && <Settings2 size={16} className="text-slate-500" />}
                                
                                <div>
                                   <div className="font-bold text-xs font-mono capitalize">{m.type}</div>
                                   <div className="text-[10px] text-slate-500">{new Date(m.date).toLocaleString('pt-BR')}</div>
                                   {m.note && <div className="text-[10px] text-slate-500 mt-0.5">Motivo: {m.note}</div>}
                                </div>
                             </div>
                             
                             <div className="text-right">
                                <div className={`font-mono text-sm font-bold ${m.quantity > 0 ? 'text-emerald-500' : 'text-slate-300'}`}>
                                   {m.quantity > 0 ? '+' : ''}{m.quantity} {selectedProduct.unit}
                                </div>
                                <div className="text-[9px] font-mono text-slate-500">
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
