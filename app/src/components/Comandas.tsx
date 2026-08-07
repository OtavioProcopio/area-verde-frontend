/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Comanda, Product, Customer, TabItem, Category } from '../types';
import { InlineFeedback } from '../features/shared/components/InlineFeedback';
import {
  Plus,
  Minus,
  Trash2,
  Search,
  DollarSign,
  Printer,
  UserPlus,
  X,
  UserCheck,
  Receipt,
  BadgePercent,
  PlusCircle,
  Sparkles,
  ShoppingBag,
  Flame,
  UtensilsCrossed,
  Hourglass,
} from 'lucide-react';

interface ComandasProps {
  comandas: Comanda[];
  products: Product[];
  categories: Category[];
  customers: Customer[];
  caixaIsOpen: boolean;
  onAddComanda: (
    code: string,
    customerId: string | null,
  ) => Promise<{ comanda: Comanda | null; success: boolean; msg: string }>;
  onUpdateComanda: (
    id: string,
    updates: Partial<Comanda>,
  ) => void | Promise<void>;
  onAddItemToComanda: (
    comandaId: string,
    item: Omit<TabItem, 'id'>,
  ) => void | Promise<void>;
  onUpdateComandaItemQty: (
    comandaId: string,
    itemId: string,
    qty: number,
  ) => void | Promise<void>;
  onRemoveItemFromComanda: (
    comandaId: string,
    itemId: string,
  ) => void | Promise<void>;
  onCancelarComanda: (comandaId: string) => void | Promise<void>;
  onPagarComanda: (
    comandaId: string,
    metodo: 'dinheiro' | 'pix' | 'cartao' | 'fiado',
    desconto: number,
    acrescimo: number,
    clienteIdParaFiado: string | null,
  ) => Promise<{ success: boolean; msg: string }>;
  onAddCustomer: (c: {
    name: string;
    phone: string;
    notes?: string;
  }) => void | Promise<void>;
}

export default function Comandas({
  comandas,
  products,
  categories,
  customers,
  caixaIsOpen,
  onAddComanda,
  onUpdateComanda,
  onAddItemToComanda,
  onUpdateComandaItemQty,
  onRemoveItemFromComanda,
  onCancelarComanda,
  onPagarComanda,
  onAddCustomer,
}: ComandasProps) {
  // Main view toggle
  const [viewMode, setViewMode] = useState<'list' | 'pos'>('list');

  // List View Filters
  const [listSearchTerm, setListSearchTerm] = useState('');
  const [listStatusFilter, setListStatusFilter] = useState<
    'all' | 'active' | 'paid' | 'cancelled' | 'fiado'
  >('all');

  // Active comanda selected
  const [selectedComandaId, setSelectedComandaId] = useState<string | null>(
    comandas.filter((c) => c.status === 'active')[0]?.id || null,
  );

  // Search and Category filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Cervejas');

  // Spawning new Comanda
  const [showNewComandaModal, setShowNewComandaModal] = useState(false);
  const [newComandaName, setNewComandaName] = useState('');
  const [newComandaCustomerId, setNewComandaCustomerId] = useState<string>('');
  const [newComandaError, setNewComandaError] = useState<string | null>(null);

  // Manual Custom item fields
  // Checkout payment modal
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState<
    'dinheiro' | 'pix' | 'cartao' | 'fiado'
  >('dinheiro');
  const [checkoutCustomerId, setCheckoutCustomerId] = useState<string>('');
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Quick custom client additions inside POS
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');

  // Print Receipt preview modal
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptComanda, setReceiptComanda] = useState<Comanda | null>(null);

  const activeComandas = comandas.filter((c) => c.status === 'active');
  const selectedComanda = comandas.find((c) => c.id === selectedComandaId);

  // Products search filter
  const filteredProducts = products.filter((prod) => {
    const matchesSearch = prod.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCat =
      prod.category === selectedCategory || selectedCategory === 'Tudo';
    return matchesSearch && matchesCat;
  });

  // Calculate totals of selected comanda
  const subtotalSelected = selectedComanda
    ? selectedComanda.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      )
    : 0;

  const totalSelected = Math.max(0, subtotalSelected);

  // Spawning Comanda Submit
  const handleCreateComanda = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newComandaName.trim() === '') return;

    const mappedCustId =
      newComandaCustomerId === '' ? null : newComandaCustomerId;
    setNewComandaError(null);
    const res = await onAddComanda(newComandaName, mappedCustId);

    if (!res.success || !res.comanda) {
      setNewComandaError(res.msg);
      return;
    }

    setSelectedComandaId(res.comanda.id);
    setViewMode('pos');
    setNewComandaName('');
    setNewComandaCustomerId('');
    setShowNewComandaModal(false);
  };

  // Add standard product to Comanda
  const handleAddProductToComanda = (p: Product) => {
    if (!selectedComandaId) {
      alert('Favor selecionar ou abrir uma comanda ativa primeiro!');
      return;
    }
    // Prevent draft adding if stock is 0
    if (!p.isComposite && p.stock <= 0) {
      if (
        !window.confirm(
          `Atenção: '${p.name}' está com estoque zerado! Deseja registrar a saída mesmo assim?`,
        )
      ) {
        return;
      }
    }

    onAddItemToComanda(selectedComandaId, {
      productId: p.id,
      productName: p.name,
      quantity: 1,
      price: p.price,
    });
  };

  // Quick customer inside checkout/POS
  const handleQuickAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (newClientName.trim() === '') return;

    onAddCustomer({
      name: newClientName,
      phone: newClientPhone,
    });

    setNewClientName('');
    setNewClientPhone('');
    setShowNewClientForm(false);
  };

  // Trigger Finalize Checkout
  const handleLaunchCheckout = (metodo: 'dinheiro' | 'fiado' = 'dinheiro') => {
    if (!selectedComanda) return;
    if (selectedComanda.items.length === 0) {
      alert('Impossível fechar uma comanda vazia!');
      return;
    }
    if (!caixaIsOpen) {
      alert(
        'Atenção: O caixa diário está FECHADO! Abra o caixa primeiro na aba "Controle de Caixa".',
      );
      return;
    }

    // Attempt default customer selection from comanda bindings
    setCheckoutCustomerId(selectedComanda.customerId || '');
    setCheckoutPaymentMethod(metodo);
    setCheckoutError(null);
    setShowCheckoutModal(true);
  };

  const handleConfirmCheckout = async () => {
    if (!selectedComanda) return;

    const res = await onPagarComanda(
      selectedComanda.id,
      checkoutPaymentMethod,
      0,
      0,
      checkoutPaymentMethod === 'fiado' ? checkoutCustomerId : null,
    );

    if (res.success) {
      // Setup print receipt state
      const completedComanda: Comanda = {
        ...selectedComanda,
        items: [...selectedComanda.items],
        status: 'paid',
        discount: 0,
        addition: 0,
        paymentMethod: checkoutPaymentMethod,
        customerId:
          checkoutPaymentMethod === 'fiado'
            ? checkoutCustomerId
            : selectedComanda.customerId,
      };

      setReceiptComanda(completedComanda);
      setShowCheckoutModal(false);
      setShowReceiptModal(true);

      // Clean inputs
      // Auto select next active comanda if any
      const remaining = comandas.filter(
        (c) => c.status === 'active' && c.id !== selectedComanda.id,
      );
      if (remaining.length > 0) {
        setSelectedComandaId(remaining[0].id);
      } else {
        setSelectedComandaId(null);
      }
    } else {
      setCheckoutError(res.msg);
    }
  };

  // List filtering logic
  const filteredListComandas = comandas
    .filter((c) => {
      const term = listSearchTerm.toLowerCase();
      const cust = customers.find((cu) => cu.id === c.customerId);
      const matchesSearch =
        c.code.toLowerCase().includes(term) ||
        c.id.toLowerCase().includes(term) ||
        (cust && cust.name.toLowerCase().includes(term));
      if (listSearchTerm && !matchesSearch) return false;

      if (listStatusFilter === 'active' && c.status !== 'active') return false;
      if (
        listStatusFilter === 'paid' &&
        (c.status !== 'paid' || c.paymentMethod === 'fiado')
      )
        return false;
      if (listStatusFilter === 'cancelled' && c.status !== 'cancelled')
        return false;
      if (listStatusFilter === 'fiado' && c.paymentMethod !== 'fiado')
        return false;

      return true;
    })
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

  const fmt = (v: number) =>
    `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div id="comandas-module" className="animate-fade-in space-y-6">
      {/* VIEW: LISTA GERAL DE COMANDAS */}
      {viewMode === 'list' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-xl font-display font-bold text-slate-50 tracking-tight flex items-center gap-2">
                <Receipt className="text-emerald-500" size={24} />
                Lista de Comandas
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Visão geral de tickets ativos, fechados e pendências de fiado.
              </p>
            </div>
            <button
              id="btn-spawn-comanda-list"
              onClick={() => {
                setCheckoutError(null);
                setNewComandaError(null);
                setShowNewComandaModal(true);
              }}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-950/400 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md transition"
            >
              <PlusCircle size={16} />
              Nova Comanda
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-700 flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-800/50">
              <div className="relative w-full sm:max-w-xs">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  type="text"
                  placeholder="Buscar por nome, id ou cliente..."
                  value={listSearchTerm}
                  onChange={(e) => setListSearchTerm(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 pl-9 pr-3 text-xs outline-none focus:border-emerald-600"
                />
              </div>

              <div className="flex gap-1 overflow-x-auto w-full sm:w-auto">
                {[
                  { id: 'all', label: 'Todas' },
                  { id: 'active', label: 'Abertas' },
                  { id: 'fiado', label: 'Pendente/Fiado' },
                  { id: 'paid', label: 'Fechadas/Pagas' },
                  { id: 'cancelled', label: 'Canceladas' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setListStatusFilter(f.id as any)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg shrink-0 transition ${
                      listStatusFilter === f.id
                        ? 'bg-slate-800 text-white shadow-xs'
                        : 'bg-slate-900 text-slate-500 border border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-500 border-collapse">
                <thead>
                  <tr className="bg-slate-800/50 border-b border-slate-800 text-[10px] uppercase font-mono text-slate-500 font-bold">
                    <th className="px-4 py-3">Num / Identificação</th>
                    <th className="px-4 py-3">Cliente (Vínculo)</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 font-mono text-right">Total</th>
                    <th className="px-4 py-3 font-mono text-right">Pago</th>
                    <th className="px-4 py-3 font-mono text-right">Restante</th>
                    <th className="px-4 py-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredListComandas.map((c) => {
                    const comSum = c.items.reduce(
                      (sum, item) => sum + item.price * item.quantity,
                      0,
                    );
                    const totalCom = Math.max(0, comSum);
                    const bindedCust = customers.find(
                      (cu) => cu.id === c.customerId,
                    );

                    let pago = 0;
                    let restante = 0;
                    if (c.status === 'paid' && c.paymentMethod !== 'fiado') {
                      pago = totalCom;
                    } else if (
                      c.status === 'paid' &&
                      c.paymentMethod === 'fiado'
                    ) {
                      pago = 0;
                      restante = totalCom;
                    } else if (c.status === 'active') {
                      pago = 0;
                      restante = totalCom;
                    }

                    const isAberta = c.status === 'active';
                    const isFiado =
                      c.status === 'paid' && c.paymentMethod === 'fiado';

                    return (
                      <tr
                        key={c.id}
                        className={`hover:bg-slate-800/50 transition duration-150 ${isAberta ? 'bg-emerald-950/40/20' : ''}`}
                      >
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-slate-200 text-sm truncate max-w-[150px]">
                            {c.code}
                          </div>
                          <div
                            className="text-[9px] text-slate-500 font-mono mt-0.5"
                            title={new Date(c.createdAt).toLocaleString(
                              'pt-BR',
                            )}
                          >
                            {new Date(c.createdAt).toLocaleTimeString('pt-BR')}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          {bindedCust ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-800">
                              👤 {bindedCust.name}
                            </span>
                          ) : (
                            <span className="text-slate-500 italic">
                              Avulso
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          {c.status === 'active' && (
                            <span className="inline-flex text-[10px] uppercase font-bold font-mono px-2 py-0.5 rounded-full bg-amber-900/50 text-amber-400 border border-amber-800/60">
                              ABERTA
                            </span>
                          )}
                          {c.status === 'cancelled' && (
                            <span className="inline-flex text-[10px] uppercase font-bold font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-500 border border-slate-800">
                              CANCELADA
                            </span>
                          )}
                          {isFiado && (
                            <span className="inline-flex text-[10px] uppercase font-bold font-mono px-2 py-0.5 rounded-full bg-rose-900/50 text-rose-400 border border-rose-800/60">
                              PENDENTE (FIADO)
                            </span>
                          )}
                          {c.status === 'paid' && !isFiado && (
                            <span className="inline-flex text-[10px] uppercase font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-900/50 text-emerald-400 border border-emerald-800/60">
                              PAGA
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-right font-bold text-slate-200">
                          {fmt(totalCom)}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-right text-emerald-500 font-bold">
                          {fmt(pago)}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-right text-rose-500 font-bold">
                          {restante > 0 ? fmt(restante) : '-'}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedComandaId(c.id);
                                setViewMode('pos');
                              }}
                              className="px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-emerald-500 hover:text-emerald-400 text-slate-500 text-[10px] font-bold rounded-lg uppercase tracking-wide transition shadow-2xs"
                            >
                              Abrir
                            </button>
                            {c.status === 'active' && (
                              <button
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      `Tem certeza que deseja cancelar a comanda ${c.code}?`,
                                    )
                                  ) {
                                    onCancelarComanda(c.id);
                                  }
                                }}
                                className="px-3 py-1.5 bg-slate-900 border border-rose-800/60 hover:bg-rose-950/40 text-rose-500 text-[10px] font-bold rounded-lg uppercase tracking-wide transition shadow-2xs"
                              >
                                Cancelar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredListComandas.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-10 text-center text-slate-500 italic"
                      >
                        Nenhuma comanda encontrada para os filtros selecionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: POS (ATENDIMENTO) */}
      {viewMode === 'pos' &&
        (() => {
          const activeComanda = comandas.find(
            (c) => c.id === selectedComandaId,
          );

          return (
            <div className="space-y-4 animate-fade-in">
              {/* Header / Active Selector */}
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-3 shadow-sm flex items-center justify-between gap-4">
                <div className="flex gap-2 items-center overflow-x-auto pb-1 flex-1">
                  <button
                    onClick={() => setViewMode('list')}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg transition mr-2 shrink-0 flex items-center gap-1"
                  >
                    &larr; Voltar
                  </button>
                  {activeComandas.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setSelectedComandaId(c.id);
                      }}
                      className={`px-4 py-2 text-xs font-bold rounded-lg border shrink-0 transition ${
                        c.id === selectedComandaId
                          ? 'bg-emerald-600 border-emerald-500 text-white shadow-md'
                          : 'bg-slate-900 border-slate-800 text-slate-500 hover:bg-slate-800/50'
                      }`}
                    >
                      {c.code}
                    </button>
                  ))}
                  {activeComandas.length === 0 && (
                    <div className="text-xs text-slate-500 italic font-medium px-2">
                      Nenhuma comanda aberta na sua sessão
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    setCheckoutError(null);
                    setShowNewComandaModal(true);
                  }}
                  className="px-4 py-2 bg-emerald-900/50 hover:bg-emerald-200 text-emerald-300 font-bold rounded-lg text-xs flex items-center gap-1 shrink-0 transition"
                >
                  <PlusCircle size={14} /> Nova Comanda
                </button>
              </div>

              {!activeComanda ? (
                <div className="flex-1 flex flex-col justify-center items-center text-center p-12 bg-slate-900 rounded-xl border border-slate-800 text-slate-500">
                  <ShoppingBag size={48} className="text-slate-250 mb-3" />
                  <h5 className="font-display font-bold text-slate-300 mb-1">
                    Nenhuma comanda em atendimento
                  </h5>
                  <p className="text-xs max-w-xs text-slate-500">
                    Abra uma nova ou selecione ao lado.
                  </p>
                </div>
              ) : (
                (() => {
                  const comSum = activeComanda.items.reduce(
                    (sum, item) => sum + item.price * item.quantity,
                    0,
                  );
                  const totalCom = Math.max(0, comSum);
                  const bindedCust = customers.find(
                    (cu) => cu.id === activeComanda.customerId,
                  );

                  let pago = 0;
                  let restante = 0;
                  if (
                    activeComanda.status === 'paid' &&
                    activeComanda.paymentMethod !== 'fiado'
                  ) {
                    pago = totalCom;
                  } else if (
                    activeComanda.status === 'paid' &&
                    activeComanda.paymentMethod === 'fiado'
                  ) {
                    pago = 0;
                    restante = totalCom;
                  } else if (activeComanda.status === 'active') {
                    pago = 0;
                    restante = totalCom;
                  }

                  return (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start min-h-[600px] h-auto lg:h-[calc(100vh-140px)]">
                      {/* COLUNA ESQUERDA: DETALHE DA COMANDA (CARRINHO E RESUMO) = 7 cols */}
                      <div className="col-span-1 lg:col-span-6 xl:col-span-7 bg-slate-900 rounded-xl border border-slate-800 shadow-sm flex flex-col h-full overflow-hidden">
                        {/* Header da Comanda */}
                        <div className="bg-slate-800 text-white p-4 flex justify-between items-center shrink-0">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h2 className="text-2xl font-display font-black tracking-tight">
                                {activeComanda.code}
                              </h2>
                              <span className="text-[10px] uppercase font-mono font-bold bg-amber-950/400 text-slate-50 px-1.5 py-0.5 rounded">
                                {activeComanda.status === 'active'
                                  ? 'ABERTA'
                                  : activeComanda.status === 'paid' &&
                                      activeComanda.paymentMethod === 'fiado'
                                    ? 'FIADO'
                                    : activeComanda.status === 'paid'
                                      ? 'PAGOU'
                                      : 'CANCELADA'}
                              </span>
                            </div>
                            <div className="text-xs text-slate-300 flex items-center gap-1.5 font-mono">
                              <UserCheck size={12} />
                              {bindedCust ? (
                                <span className="font-bold text-emerald-300">
                                  Cliente: {bindedCust.name}
                                </span>
                              ) : (
                                <span className="opacity-80">Avulso</span>
                              )}
                              <div className="relative ml-2 flex items-center">
                                <select
                                  className="text-[9px] bg-slate-700 text-white font-bold tracking-wider py-1 pl-2 pr-4 rounded uppercase outline-none appearance-none cursor-pointer"
                                  value={activeComanda.customerId || ''}
                                  onChange={(e) =>
                                    onUpdateComanda(activeComanda.id, {
                                      customerId: e.target.value || null,
                                    })
                                  }
                                >
                                  <option value="">Vincular...</option>
                                  {customers.map((c) => (
                                    <option key={c.id} value={c.id}>
                                      {c.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>

                          <div className="text-right flex flex-col items-end">
                            {activeComanda.status === 'active' && (
                              <button
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      `Cancelar definitivamente a comanda ${activeComanda.code}?`,
                                    )
                                  ) {
                                    onCancelarComanda(activeComanda.id);
                                    setViewMode('list');
                                  }
                                }}
                                className="text-xs font-bold text-rose-300 hover:text-rose-100 bg-rose-900/30 hover:bg-rose-900/50 px-3 py-1.5 rounded-lg border border-transparent hover:border-rose-800 transition shadow-xs cursor-pointer"
                              >
                                CANCELAR CONTA
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Lista de Itens */}
                        <div className="flex-1 overflow-y-auto p-4 bg-slate-800/50 space-y-2">
                          {activeComanda.items.map((item) => {
                            const product = products.find(
                              (p) => p.name === item.productName,
                            );
                            return (
                              <div
                                key={item.id}
                                className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex shadow-2xs items-center gap-3"
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <h4 className="text-sm font-bold text-slate-200 truncate">
                                      {item.productName}
                                    </h4>
                                    {product?.isComposite ? (
                                      <span className="text-[9px] bg-blue-950/40 text-blue-400 font-mono font-bold px-1.5 py-0.5 rounded border border-blue-800/60">
                                        COMPOSTO
                                      </span>
                                    ) : (
                                      <span className="text-[9px] bg-slate-800 text-slate-500 font-mono font-bold px-1.5 py-0.5 rounded border border-slate-800">
                                        SIMPLES
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                                    {fmt(item.price)} un.
                                  </div>
                                </div>

                                <div className="flex items-center bg-slate-800/50 border border-slate-800 rounded-lg shrink-0">
                                  <button
                                    onClick={() => {
                                      if (item.quantity === 1) {
                                        if (
                                          window.confirm(
                                            `Remover ${item.productName}?`,
                                          )
                                        )
                                          onRemoveItemFromComanda(
                                            activeComanda.id,
                                            item.id,
                                          );
                                      } else {
                                        onUpdateComandaItemQty(
                                          activeComanda.id,
                                          item.id,
                                          item.quantity - 1,
                                        );
                                      }
                                    }}
                                    className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-rose-500 hover:bg-slate-800 rounded-l-lg transition cursor-pointer"
                                  >
                                    <Minus size={14} />
                                  </button>
                                  <span className="w-8 text-center text-xs font-bold text-slate-300 font-mono">
                                    {item.quantity}
                                  </span>
                                  <button
                                    onClick={() =>
                                      onUpdateComandaItemQty(
                                        activeComanda.id,
                                        item.id,
                                        item.quantity + 1,
                                      )
                                    }
                                    className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-emerald-500 hover:bg-slate-800 rounded-r-lg transition cursor-pointer"
                                  >
                                    <Plus size={14} />
                                  </button>
                                </div>

                                <div className="text-right min-w-[70px] shrink-0">
                                  <div className="text-sm font-black text-slate-200 font-mono">
                                    {fmt(item.price * item.quantity)}
                                  </div>
                                </div>

                                <button
                                  onClick={() => {
                                    if (
                                      window.confirm(
                                        'Excluir item inteiramente?',
                                      )
                                    )
                                      onRemoveItemFromComanda(
                                        activeComanda.id,
                                        item.id,
                                      );
                                  }}
                                  className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-rose-500 hover:bg-rose-950/40 rounded-lg shrink-0 transition"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            );
                          })}
                          {activeComanda.items.length === 0 && (
                            <div className="text-center py-10 text-slate-500 text-xs italic flex flex-col items-center">
                              <ShoppingBag
                                size={24}
                                className="mb-2 opacity-50"
                              />
                              Nenhum item lançado.
                              <br />
                              Busque e adicione no painel lateral.
                            </div>
                          )}
                        </div>

                        {/* Resumo Fixo & Pagamento */}
                        <div className="bg-slate-900 border-t border-slate-800 p-4 shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
                          <div className="text-xs font-mono text-slate-400 mb-3 bg-slate-800/50 border border-slate-800 rounded-lg px-3 py-2">
                            Fechamento pela API usa o total exato dos itens.
                            Desconto, acréscimo e taxa de serviço não estão
                            disponíveis neste fluxo.
                          </div>

                          {/* Totals Box Horizontal */}
                          <div className="bg-slate-800 rounded-xl p-4 flex justify-between items-center mb-3 text-white">
                            <div className="text-center">
                              <span className="text-[9px] uppercase font-bold text-slate-500 block mb-0.5 tracking-widest">
                                Valor Recebido
                              </span>
                              <span className="text-lg font-mono font-bold text-emerald-400">
                                {fmt(pago)}
                              </span>
                            </div>
                            <div className="w-px h-10 bg-slate-600/50"></div>
                            <div className="text-center">
                              <span className="text-[9px] uppercase font-bold text-slate-500 block mb-0.5 tracking-widest">
                                Módulo Restante
                              </span>
                              <span className="text-lg font-display font-black text-rose-400">
                                {fmt(restante)}
                              </span>
                            </div>
                            <div className="w-px h-10 bg-slate-600/50"></div>
                            <div className="text-right">
                              <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5 tracking-widest">
                                Total da Conta
                              </span>
                              <span className="text-3xl font-mono font-black text-white">
                                {fmt(totalCom)}
                              </span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          {activeComanda.status === 'active' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleLaunchCheckout('fiado')}
                                className="flex-[1] bg-amber-950/40 rounded-xl border border-amber-800/60 hover:bg-amber-900/50 text-amber-400 font-bold text-[11px] py-4 flex flex-col items-center justify-center transition shadow-2xs leading-tight cursor-pointer"
                              >
                                LANÇAR NO
                                <span className="text-sm">CADERNO</span>
                              </button>
                              <button
                                onClick={() => handleLaunchCheckout('dinheiro')}
                                className="flex-[2] bg-emerald-600 text-white rounded-xl hover:bg-emerald-950/400 font-bold text-sm py-4 flex flex-col items-center justify-center transition shadow-md shadow-emerald-500/20 leading-tight cursor-pointer"
                              >
                                PAGAMENTO & FECHAMENTO
                                <span className="text-[11px] font-normal text-emerald-100">
                                  Dinheiro, Pix ou Cartão
                                </span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* COLUNA DIREITA: BUSCA & INCLUSÃO = 5 cols */}
                      <div className="col-span-1 lg:col-span-6 xl:col-span-5 bg-slate-900 rounded-xl border border-slate-800 shadow-sm flex flex-col h-full overflow-hidden p-4">
                        <div className="text-xs uppercase font-mono font-bold text-slate-500 mb-3 tracking-widest flex items-center gap-2">
                          <PlusCircle size={14} /> Adicionar Produtos
                        </div>

                        {/* Search Input Large */}
                        <div className="relative mb-3 shrink-0">
                          <Search
                            size={20}
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-500"
                          />
                          <input
                            type="text"
                            placeholder="Ex: Skol"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-800/50 border border-slate-800 rounded-xl py-3.5 pl-11 pr-4 text-[13px] text-slate-200 outline-none focus:bg-slate-900 focus:border-emerald-600 transition-all font-sans font-bold shadow-2xs"
                            autoComplete="off"
                          />
                        </div>
                        <div className="flex gap-1.5 overflow-x-auto pb-2 shrink-0 mb-3 scrollbar-hide">
                          {[
                            'Tudo',
                            ...categories
                              .map((c) => c.name)
                              .filter((n) => n !== 'Ingredientes'),
                          ].map((cat) => (
                            <button
                              key={cat}
                              onClick={() => setSelectedCategory(cat)}
                              className={`px-3 py-1.5 rounded-lg text-[10px] uppercase font-mono font-semibold cursor-pointer shrink-0 transition ${
                                selectedCategory === cat
                                  ? 'bg-slate-800 text-white shadow-xs'
                                  : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
                              }`}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>

                        {/* Grid de Produtos Rápido */}
                        <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-2 pr-1 content-start">
                          {filteredProducts.map((p) => {
                            const outOfStock = !p.isComposite && p.stock <= 0;
                            return (
                              <button
                                key={p.id}
                                onClick={() =>
                                  !outOfStock && handleAddProductToComanda(p)
                                }
                                disabled={outOfStock}
                                className={`p-3 bg-slate-900 border border-slate-800 rounded-xl text-left flex flex-col justify-between h-[90px] shadow-sm transition ${
                                  outOfStock
                                    ? 'opacity-40 cursor-not-allowed'
                                    : 'hover:border-emerald-500 hover:shadow-md cursor-pointer'
                                }`}
                              >
                                <div>
                                  <span className="text-[9px] uppercase text-slate-500 font-mono font-bold block mb-0.5 truncate">
                                    {p.category}
                                  </span>
                                  <span className="text-xs font-bold text-slate-200 leading-tight line-clamp-2">
                                    {p.name}
                                  </span>
                                </div>
                                <div className="flex justify-between items-end w-full">
                                  <span className="text-[13px] font-mono font-black text-emerald-400">
                                    {fmt(p.price)}
                                  </span>
                                  <span className="text-[9px] text-slate-500 font-mono font-bold bg-slate-800 px-1 rounded">
                                    {p.isComposite
                                      ? 'CMP'
                                      : `${p.stock} ${p.unit.toUpperCase()}`}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        <div className="mt-4 border-t border-slate-800 pt-4 shrink-0 bg-slate-800/50/50 -mx-4 -mb-4 p-4 rounded-b-xl border-dashed">
                          <span className="text-[10px] text-slate-500 uppercase font-mono font-bold block mb-2 flex items-center gap-1">
                            <Plus size={12} /> Lançamentos avulsos
                          </span>
                          <p className="text-xs text-slate-400 leading-relaxed">
                            A API atual só permite adicionar itens previamente
                            cadastrados em produtos. Para venda eventual,
                            cadastre o item no catálogo e lance por aqui.
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}
            </div>
          );
        })()}

      {/* MODAL 1: Create New Comanda */}
      {showNewComandaModal && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-xs">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
            <button
              onClick={() => setShowNewComandaModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-200 cursor-pointer"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-display font-bold text-slate-850 mb-4 flex items-center gap-1.5">
              <PlusCircle className="text-emerald-500" size={18} />
              Abrir Nova Comanda
            </h3>

            {newComandaError && (
              <div className="mb-4">
                <InlineFeedback tone="error" message={newComandaError} />
              </div>
            )}

            <form onSubmit={handleCreateComanda} className="space-y-4">
              <div>
                <label className="block text-xs uppercase font-mono text-slate-505 mb-1 font-bold">
                  Identificação / Nome (Ex: Comanda 15, Balcão João):
                </label>
                <input
                  type="text"
                  placeholder="Ex: Balcão Canto, Mesa 4 orelha"
                  value={newComandaName}
                  onChange={(e) => setNewComandaName(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-800 px-3 py-2.5 rounded-lg text-xs text-slate-200 outline-none focus:bg-slate-900 focus:border-emerald-600"
                  data-testid="comanda-nome-input"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs uppercase font-mono text-slate-505 mb-1 font-bold">
                  Vincular Cliente Registrado (Opcional):
                </label>
                <select
                  value={newComandaCustomerId}
                  onChange={(e) => setNewComandaCustomerId(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-800 px-3 py-2 text-xs text-slate-300 rounded-lg outline-none focus:bg-slate-900 focus:border-emerald-605"
                >
                  <option value="">Não vincular (Consumo imediato)</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}{' '}
                      {c.balance > 0 ? `(Dívida: ${fmt(c.balance)})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewComandaModal(false)}
                  className="flex-1 py-2 text-xs font-semibold bg-slate-800/50 text-slate-500 border border-slate-800 rounded-lg hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-950/400 text-white rounded-lg cursor-pointer transition shadow-xs"
                >
                  Abrir Comanda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Checkout / Payment Details */}
      {showCheckoutModal && selectedComanda && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-xs">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
            <button
              onClick={() => setShowCheckoutModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-200 cursor-pointer"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-display font-bold text-slate-850 mb-1">
              Finalização Balcão
            </h3>
            <p className="text-xs text-slate-500 font-mono mb-4">
              Comanda: {selectedComanda.code}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mb-5 border-y border-slate-700 py-4">
              {/* Payment selection */}
              <div className="md:col-span-6 space-y-2.5">
                <label className="block text-xs uppercase font-mono text-slate-500 font-bold">
                  Forma de Pagamento:
                </label>
                <div className="grid grid-cols-1 gap-1.5">
                  {[
                    { id: 'dinheiro', label: '💵 Dinheiro' },
                    { id: 'pix', label: '⚡ Pix Manual' },
                    { id: 'cartao', label: '💳 Cartão' },
                    { id: 'fiado', label: '📓 Fiado (Caderno de Pendências)' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setCheckoutPaymentMethod(m.id as any);
                        setCheckoutError(null);
                      }}
                      className={`px-3 py-2 text-xs font-bold rounded-lg text-left border cursor-pointer transition ${
                        checkoutPaymentMethod === m.id
                          ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300 shadow-2xs'
                          : 'bg-slate-800/50 border-slate-205 text-slate-655 hover:bg-slate-800'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action summary & selection of client */}
              <div className="md:col-span-6 flex flex-col justify-between">
                <div>
                  <span className="text-xs uppercase font-mono text-slate-500 block mb-2 font-bold">
                    Resumo da Conta:
                  </span>
                  <div className="space-y-1 bg-slate-800/50 p-3 rounded-lg border border-slate-800 text-xs font-mono">
                    <div className="flex justify-between text-slate-500">
                      <span>Itens:</span>
                      <span>{fmt(subtotalSelected)}</span>
                    </div>
                    <div className="flex justify-between text-slate-200 font-bold border-t border-slate-800 pt-1.5 mt-1.5 text-sm">
                      <span>Total:</span>
                      <span className="text-emerald-400">
                        {fmt(totalSelected)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Fiado specific customer mapping binder */}
                {checkoutPaymentMethod === 'fiado' && (
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="block text-[10px] uppercase font-mono text-rose-750 font-bold">
                        Vincular Cliente do Caderno:
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowNewClientForm(!showNewClientForm)}
                        className="text-[10px] text-emerald-500 hover:underline inline-flex items-center gap-0.5 cursor-pointer font-bold"
                      >
                        <UserPlus size={10} /> + Novo
                      </button>
                    </div>

                    {!showNewClientForm ? (
                      <select
                        value={checkoutCustomerId}
                        onChange={(e) => {
                          setCheckoutCustomerId(e.target.value);
                          setCheckoutError(null);
                        }}
                        className="w-full bg-slate-800/50 border border-slate-800 px-2.5 py-1.5 text-xs text-slate-200 rounded-lg outline-none"
                        data-testid="checkout-cliente-select"
                        required
                      >
                        <option value="">-- Escolha o Cliente --</option>
                        {customers.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} (Dev: {fmt(c.balance)})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <form
                        onSubmit={handleQuickAddClient}
                        className="bg-slate-800/50 p-2.5 rounded border border-slate-800 space-y-1.5 text-left"
                      >
                        <input
                          type="text"
                          placeholder="Nome Completo"
                          value={newClientName}
                          onChange={(e) => setNewClientName(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-250 py-1 px-1.5 text-[10px] rounded text-slate-200"
                          required
                        />
                        <input
                          type="text"
                          placeholder="Telefone"
                          value={newClientPhone}
                          onChange={(e) => setNewClientPhone(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-250 py-1 px-1.5 text-[10px] rounded text-slate-200"
                        />
                        <button
                          type="submit"
                          className="w-full bg-emerald-600 hover:bg-emerald-950/400 font-bold text-[10px] rounded text-white cursor-pointer py-1"
                        >
                          Salvar
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>
            </div>

            {checkoutError && (
              <div className="p-3 bg-rose-950/40 border border-rose-150 rounded-xl text-rose-500 text-xs font-semibold mb-4 text-center">
                ⚠️ {checkoutError}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCheckoutModal(false)}
                className="flex-1 py-3 font-semibold text-xs rounded-xl bg-slate-800/50 border border-slate-800 text-slate-500 hover:bg-slate-800 duration-150 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="btn-confirm-pos-payment"
                onClick={handleConfirmCheckout}
                className="flex-1 py-3 font-bold text-xs rounded-xl bg-emerald-600 hover:bg-emerald-950/400 text-white transition cursor-pointer shadow-md shadow-emerald-500/10"
              >
                Confirmar Pagamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Receipt Preview Cupom Balcão */}
      {showReceiptModal && receiptComanda && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-xs">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
            <button
              onClick={() => setShowReceiptModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-200 cursor-pointer animate-pulse"
            >
              <X size={18} />
            </button>

            {/* Recibo Mini Thermal printer style */}
            <div className="bg-stone-50 text-stone-900 font-mono text-[11px] p-5 rounded-lg border border-slate-250 space-y-3.5 shadow-inner leading-normal">
              <div className="text-center font-bold">
                <p className="text-sm tracking-tight font-sans font-extrabold text-slate-850">
                  BAR AREA VERDE
                </p>
                <p className="text-[9px] font-normal tracking-wide">
                  AMIGOS E FAMILIA LTDA
                </p>
                <p className="text-[8px] font-normal text-stone-500 border-b border-dashed border-stone-300 pb-2">
                  AV. DA AMIZADE, 1800 - BALCÃO
                </p>
              </div>

              <div>
                <p className="font-bold uppercase tracking-wider text-center text-[10px] text-stone-605">
                  ** CUPOM OPERACIONAL **
                </p>
                <div className="grid grid-cols-2 mt-2 gap-y-0.5 text-[9px] text-stone-650">
                  <span>Comanda/ID:</span>
                  <span className="text-right font-bold">
                    {receiptComanda.code}
                  </span>
                  <span>Data:</span>
                  <span className="text-right">
                    {new Date(receiptComanda.paidAt || '').toLocaleDateString(
                      'pt-BR',
                    )}
                  </span>
                  <span>Hora:</span>
                  <span className="text-right">
                    {new Date(receiptComanda.paidAt || '').toLocaleTimeString(
                      'pt-BR',
                    )}
                  </span>
                  <span>Pagamento:</span>
                  <span className="text-right font-bold text-emerald-300">
                    {(receiptComanda.paymentMethod || 'DINHEIRO').toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Items Table */}
              <div className="border-t border-b border-dashed border-stone-300 py-2 space-y-1 select-none text-[9px]">
                <div className="grid grid-cols-12 font-bold text-stone-500 mb-1">
                  <span className="col-span-6 animate-pulse">
                    PRODUCT DESCRIPTION
                  </span>
                  <span className="col-span-2 text-right">QTD</span>
                  <span className="col-span-4 text-right">VALOR</span>
                </div>
                {receiptComanda.items.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-12 text-stone-800"
                  >
                    <span className="col-span-6 truncate font-medium">
                      {item.productName}
                    </span>
                    <span className="col-span-2 text-right font-medium">
                      {item.quantity}
                    </span>
                    <span className="col-span-4 text-right font-bold font-mono">
                      {(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="space-y-0.5 text-right text-[10px] text-stone-700">
                <p className="flex justify-between">
                  <span>SUBTOTAL:</span>
                  <span>
                    {receiptComanda.items
                      .reduce(
                        (sum, item) => sum + item.price * item.quantity,
                        0,
                      )
                      .toFixed(2)}
                  </span>
                </p>
                {receiptComanda.discount > 0 && (
                  <p className="flex justify-between text-rose-400 font-bold font-mono">
                    <span>DESCONTO (-):</span>
                    <span>{receiptComanda.discount.toFixed(2)}</span>
                  </p>
                )}
                {receiptComanda.addition > 0 && (
                  <p className="flex justify-between font-bold font-mono">
                    <span>SERVIÇO (+):</span>
                    <span>{receiptComanda.addition.toFixed(2)}</span>
                  </p>
                )}
                <p className="flex justify-between font-bold text-xs pt-1.5 border-t border-dashed border-stone-300 mt-1 text-slate-50">
                  <span>TOTAL PAGO:</span>
                  <span className="text-sm font-sans font-extrabold text-emerald-805">
                    R${' '}
                    {(
                      receiptComanda.items.reduce(
                        (sum, item) => sum + item.price * item.quantity,
                        0,
                      ) -
                      receiptComanda.discount +
                      receiptComanda.addition
                    ).toFixed(2)}
                  </span>
                </p>
              </div>

              <div className="text-center text-[8px] text-stone-450 pt-3 border-t border-dashed border-stone-300 space-y-0.5">
                <p>Obrigado pela preferência e respeito.</p>
                <p>Volte sempre à Area Verde!</p>
                <p className="font-mono mt-1 text-[7px] text-stone-400">
                  Sistema Area Verde - POS Balcão
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowReceiptModal(false)}
              className="mt-6 w-full py-2.5 bg-emerald-600 hover:bg-emerald-950/400 font-bold rounded-xl text-xs text-white transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Printer size={14} /> Fechar e Prosseguir
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
