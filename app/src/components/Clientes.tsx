import React, { useState } from 'react';
import { Customer, Fiado } from '../types';
import Fiados from './Fiados';
import {
  Users,
  Search,
  UserPlus,
  Edit3,
  ToggleLeft,
  ToggleRight,
  Eye,
  X,
  FileText,
  AlertOctagon,
  ArrowLeft,
  Coins,
} from 'lucide-react';
import { InlineFeedback } from '../features/shared/components/InlineFeedback';

type OperationResult = { success: boolean; msg: string };

interface ClientesProps {
  customers: Customer[];
  fiados: Fiado[];
  caixaIsOpen: boolean;
  onAddCustomer: (c: {
    name: string;
    nickname?: string;
    phone: string;
    notes?: string;
    active: boolean;
  }) => Promise<OperationResult>;
  onUpdateCustomer: (c: Customer) => Promise<OperationResult>;
  onDeleteCustomer: (id: string) => unknown;
  onPagarFiado: (
    customerId: string,
    amount: number,
    method: 'dinheiro' | 'pix' | 'cartao',
  ) => Promise<{ success: boolean; msg: string }>;
}

export default function Clientes({
  customers,
  fiados,
  caixaIsOpen,
  onAddCustomer,
  onUpdateCustomer,
  onPagarFiado,
}: ClientesProps) {
  const [mainTab, setMainTab] = useState<'cadastro' | 'fiados'>('cadastro');
  const [viewState, setViewState] = useState<'list' | 'detail'>('list');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    null,
  );

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<
    'Todos' | 'Ativos' | 'Inativos'
  >('Todos');

  // Form modal state
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(
    null,
  );
  const [customerFormError, setCustomerFormError] = useState<string | null>(
    null,
  );

  // Customer form fields
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [active, setActive] = useState(true);

  // Payment fields
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<'dinheiro' | 'pix' | 'cartao'>(
    'dinheiro',
  );

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  // Filtered List
  const filteredCustomers = customers.filter((c) => {
    const isAct = c.active ?? true;
    if (filterActive === 'Ativos' && !isAct) return false;
    if (filterActive === 'Inativos' && isAct) return false;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const n = (c.name || '').toLowerCase();
      const nick = (c.nickname || '').toLowerCase();
      const p = c.phone || '';
      return n.includes(term) || nick.includes(term) || p.includes(term);
    }
    return true;
  });

  const handleAddNewTrigger = () => {
    setCustomerFormError(null);
    setFormMode('create');
    setEditingCustomerId(null);
    setName('');
    setNickname('');
    setPhone('');
    setNotes('');
    setActive(true);
    setShowForm(true);
  };

  const handleEditTrigger = (c: Customer) => {
    setCustomerFormError(null);
    setFormMode('edit');
    setEditingCustomerId(c.id);
    setName(c.name);
    setNickname(c.nickname || '');
    setPhone(c.phone);
    setNotes(c.notes || '');
    setActive(c.active ?? true);
    setShowForm(true);
  };

  const handleToggleStatus = (c: Customer) => {
    onUpdateCustomer({ ...c, active: !(c.active ?? true) });
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() === '') return;

    const editingCustomer = customers.find((c) => c.id === editingCustomerId);

    setCustomerFormError(null);
    const res =
      formMode === 'create'
        ? await onAddCustomer({ name, nickname, phone, notes, active })
        : editingCustomer
          ? await onUpdateCustomer({
              ...editingCustomer,
              name,
              nickname,
              phone,
              notes,
              active,
            })
          : null;

    if (res && !res.success) {
      setCustomerFormError(res.msg);
      return;
    }
    setShowForm(false);
  };

  const viewDetails = (c: Customer) => {
    setSelectedCustomerId(c.id);
    setViewState('detail');
    setPayAmount('');
  };

  const handleRegisterPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) return;
    const amountVal = parseFloat(payAmount);
    if (isNaN(amountVal) || amountVal <= 0) return;

    if (!caixaIsOpen && payMethod === 'dinheiro') {
      alert(
        'Atenção: O caixa do bar está FECHADO! Abra o caixa para receber pagamentos em dinheiro.',
      );
      return;
    }

    const result = await onPagarFiado(selectedCustomerId, amountVal, payMethod);
    setPayAmount('');
    alert(result.msg);
  };

  const fmt = (v: number) =>
    `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div id="clientes-module" className="space-y-5 pb-10">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <span className="mb-1 block text-xs font-bold text-gold-400">
            Caderneta de Contas
          </span>
          <h2 className="font-display text-3xl font-bold tracking-tight text-cream-100">
            Clientes & <span className="text-gold-400">Fiado</span>
          </h2>
        </div>

        <div className="flex items-center gap-3">
          {mainTab === 'cadastro' && viewState === 'list' && (
            <button
              onClick={handleAddNewTrigger}
              className="flex items-center gap-1.5 rounded-xl bg-gold-500 px-4 py-2.5 text-sm font-bold text-counter-950 shadow-md transition hover:bg-gold-400"
            >
              <UserPlus size={19} /> Novo Cliente
            </button>
          )}

          <div className="flex rounded-xl border border-counter-700 bg-counter-900 p-1">
            <button
              id="clientes-subtab-cadastro"
              onClick={() => setMainTab('cadastro')}
              className={`rounded-lg px-4 py-2.5 text-sm font-bold transition-all ${mainTab === 'cadastro' ? 'bg-gold-500 text-counter-950' : 'text-cream-300 hover:text-cream-100'}`}
            >
              Cadastro
            </button>
            <button
              id="clientes-subtab-fiados"
              onClick={() => setMainTab('fiados')}
              className={`rounded-lg px-4 py-2.5 text-sm font-bold transition-all ${mainTab === 'fiados' ? 'bg-gold-500 text-counter-950' : 'text-cream-300 hover:text-cream-100'}`}
            >
              Fiado &amp; Pendências
            </button>
          </div>
        </div>
      </div>

      {mainTab === 'fiados' && (
        <Fiados
          fiados={fiados}
          customers={customers}
          caixaIsOpen={caixaIsOpen}
          onPagarFiado={onPagarFiado}
        />
      )}

      {mainTab === 'cadastro' && viewState === 'list' && (
        <>
          <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-counter-700 bg-counter-900 p-4 sm:flex-row">
            <div className="relative w-full sm:w-1/2 md:w-1/3">
              <Search
                size={19}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-cream-400"
              />
              <input
                type="text"
                placeholder="Busca por nome, apelido, telefone..."
                className="w-full rounded-xl border border-counter-700 bg-counter-950 py-2.5 pl-9 pr-3 text-sm text-cream-100 outline-none focus:border-gold-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-auto">
              <select
                className="w-full cursor-pointer rounded-xl border border-counter-700 bg-counter-950 px-3 py-2.5 text-sm font-bold text-cream-200 outline-none focus:border-gold-500"
                value={filterActive}
                onChange={(e) => setFilterActive(e.target.value as any)}
              >
                <option value="Todos">Todos (Ativos + Inativos)</option>
                <option value="Ativos">Apenas Ativos</option>
                <option value="Inativos">Apenas Inativos</option>
              </select>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-counter-700 bg-counter-900">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-counter-700 bg-counter-950 text-xs font-bold uppercase tracking-wide text-cream-400">
                    <th className="px-5 py-3.5">Cliente</th>
                    <th className="px-4 py-3.5">Contato</th>
                    <th className="px-4 py-3.5 text-center">Status</th>
                    <th className="px-4 py-3.5 text-right">
                      Saldo Devedor / Fiado
                    </th>
                    <th className="px-5 py-3.5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-counter-800">
                  {filteredCustomers.map((c) => {
                    const pendencyCount = c.history.filter(
                      (h) => h.amount > 0 && h.type !== 'payment',
                    ).length; // Basic inference
                    const isAct = c.active ?? true;
                    return (
                      <tr
                        key={c.id}
                        className={`transition hover:bg-counter-800 ${!isAct ? 'bg-counter-950/60 opacity-60' : ''} ${c.balance > 0 ? 'bg-rose-400/5' : ''}`}
                      >
                        <td className="px-5 py-3.5">
                          <span className="block max-w-[200px] truncate text-sm font-bold text-cream-100">
                            {c.name}
                          </span>
                          {c.nickname && (
                            <span className="mt-0.5 inline-flex rounded bg-counter-800 px-1.5 py-0.5 font-mono text-xs uppercase text-cream-300">
                              {c.nickname}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-xs text-cream-400">
                          {c.phone || '--'}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          {isAct ? (
                            <span className="rounded border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-xs font-bold uppercase text-emerald-400">
                              ATIVO
                            </span>
                          ) : (
                            <span className="rounded border border-counter-700 bg-counter-800 px-2 py-0.5 text-xs font-bold uppercase text-cream-400">
                              INATIVO
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          {c.balance > 0 ? (
                            <div>
                              <span className="block font-mono text-sm font-black text-rose-400">
                                {fmt(c.balance)}
                              </span>
                              {pendencyCount > 0 && (
                                <span className="text-xs font-bold uppercase text-rose-400">
                                  {pendencyCount} pendências
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="font-mono text-sm font-bold text-cream-300">
                              Quitado
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => viewDetails(c)}
                              className="flex h-8 w-8 items-center justify-center rounded border border-counter-700 bg-counter-800 text-cream-300 transition hover:border-gold-500/50 hover:text-gold-300"
                              title="Ver Detalhes"
                            >
                              <Eye size={17} />
                            </button>
                            <button
                              onClick={() => handleEditTrigger(c)}
                              className="flex h-8 w-8 items-center justify-center rounded border border-counter-700 bg-counter-800 text-cream-300 transition hover:bg-counter-700"
                              title="Editar"
                            >
                              <Edit3 size={17} />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(c)}
                              className={`flex h-8 w-8 items-center justify-center rounded border transition ${
                                isAct
                                  ? 'border-rose-400/30 bg-rose-400/10 text-rose-400 hover:bg-rose-400/20'
                                  : 'border-emerald-400/30 bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20'
                              }`}
                              title={isAct ? 'Inativar' : 'Ativar'}
                            >
                              {isAct ? (
                                <ToggleRight size={17} />
                              ) : (
                                <ToggleLeft size={17} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredCustomers.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="bg-counter-950/40 py-12 text-center text-sm italic text-cream-400"
                      >
                        Nenhum cliente atende aos critérios de busca.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* DETALHES DO CLIENTE VIEW */}
      {mainTab === 'cadastro' && viewState === 'detail' && selectedCustomer && (
        <div className="space-y-4">
          {/* Detail header */}
          <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-counter-700 bg-counter-900 p-5 md:flex-row md:items-center">
            <div>
              <button
                onClick={() => setViewState('list')}
                className="mb-2 flex items-center gap-1 text-xs font-bold uppercase text-cream-400 transition hover:text-cream-100"
              >
                <ArrowLeft size={14} /> Voltar para lista
              </button>
              <div className="flex items-center gap-3">
                <h2 className="font-display text-2xl font-bold text-cream-100">
                  {selectedCustomer.name}
                </h2>
                {selectedCustomer.nickname && (
                  <span className="rounded-full border border-counter-700 bg-counter-800 px-2 py-0.5 text-xs uppercase text-cream-300">
                    {selectedCustomer.nickname}
                  </span>
                )}
              </div>
              <div className="mt-1 flex gap-4 text-sm text-cream-400">
                <span>Telefone: {selectedCustomer.phone || '--'}</span>
                <span
                  className={`flex items-center gap-1 text-xs font-bold uppercase ${(selectedCustomer.active ?? true) ? 'text-emerald-400' : 'text-cream-400'}`}
                >
                  {(selectedCustomer.active ?? true) ? '• Ativo' : '• Inativo'}
                </span>
              </div>
            </div>

            <div className="flex w-full gap-2 md:w-auto">
              <button
                onClick={() => handleEditTrigger(selectedCustomer)}
                className="flex-1 rounded-xl border border-counter-700 bg-counter-800 px-4 py-2.5 text-center text-sm font-bold text-cream-200 transition hover:bg-counter-700 md:flex-initial"
              >
                Editar Cadastro
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            {/* Financial panel */}
            <div className="flex flex-col gap-5 lg:col-span-5">
              {/* Balance & Info */}
              <div className="rounded-2xl border border-counter-700 bg-counter-900 p-5">
                <h3 className="mb-3 block text-xs font-bold uppercase text-cream-400">
                  Dados Financeiros / Fiado
                </h3>

                <div className="mb-3 flex items-end justify-between border-b border-counter-700 pb-3">
                  <span className="text-sm font-bold text-cream-200">
                    Saldo Pendente (Dívida)
                  </span>
                  <span
                    className={`font-mono text-2xl font-black ${selectedCustomer.balance > 0 ? 'text-rose-400' : 'text-emerald-400'}`}
                  >
                    {fmt(selectedCustomer.balance)}
                  </span>
                </div>

                <div className="text-sm text-cream-400">
                  A API atual não trabalha com limite de crédito por cliente. O
                  controle disponível aqui é o saldo pendente real das comandas
                  em fiado.
                </div>

                <div className="mt-5 rounded-lg border border-counter-700 bg-counter-800 p-3">
                  <span className="mb-1 block text-xs font-bold uppercase text-cream-400">
                    Anotações
                  </span>
                  <p className="text-sm italic text-cream-300">
                    {selectedCustomer.notes ||
                      'Nenhuma anotação registrada para o cliente.'}
                  </p>
                </div>
              </div>

              {/* Payment Action */}
              <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-5">
                <h4 className="mb-2 flex items-center gap-1.5 font-display text-base font-bold text-emerald-300">
                  <Coins size={22} /> Registrar Pagamento de Fiado
                </h4>
                <p className="mb-4 text-sm leading-relaxed text-emerald-300/80">
                  Abata o saldo devedor recebendo o valor do cliente agora. Se
                  em dinheiro, garanta que o Caixa esteja aberto.
                </p>

                <form onSubmit={handleRegisterPayment} className="space-y-3">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="w-full rounded-lg border border-emerald-400/30 bg-counter-950 px-3 py-2.5 font-mono text-sm font-bold text-emerald-200 outline-none focus:border-emerald-400"
                    placeholder="Quantia (R$)"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    required
                  />

                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'dinheiro', label: '💵 Dinheiro' },
                      { id: 'pix', label: '⚡ Pix' },
                      { id: 'cartao', label: '💳 Cartão' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setPayMethod(item.id as any)}
                        className={`rounded border px-2 py-2 text-xs font-bold transition ${
                          payMethod === item.id
                            ? 'border-emerald-400 bg-emerald-500 text-white shadow-xs'
                            : 'border-emerald-400/30 bg-counter-950 text-emerald-300 hover:bg-emerald-400/10'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={selectedCustomer.balance <= 0}
                    className="w-full rounded-lg bg-emerald-500 py-2.5 text-center text-sm font-bold text-white shadow-md transition duration-150 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Lançar Pagamento
                  </button>
                </form>
              </div>
            </div>

            {/* History / Transactions Panel */}
            <div className="flex h-[550px] flex-col rounded-2xl border border-counter-700 bg-counter-900 p-5 lg:col-span-7">
              <h3 className="mb-4 flex items-center gap-2 border-b border-counter-700 pb-3 font-display text-base font-bold text-cream-100">
                <FileText size={22} className="text-cream-400" /> Histórico de
                Fiados e Pendências
              </h3>

              <div className="flex-1 space-y-3 overflow-y-auto pr-2">
                {selectedCustomer.history.map((hist) => {
                  const isCharge = hist.amount > 0;
                  return (
                    <div
                      key={hist.id}
                      className={`flex items-start justify-between rounded-xl border p-3.5 ${isCharge ? 'border-gold-500/30 bg-gold-500/10' : 'border-emerald-400/30 bg-emerald-400/10'}`}
                    >
                      <div>
                        <span className="block text-sm font-bold text-cream-100">
                          {hist.description}
                        </span>
                        <span className="mt-1 block font-mono text-xs text-cream-400">
                          {new Date(hist.timestamp).toLocaleString('pt-BR')} •
                          Tipo:{' '}
                          {hist.type === 'sale'
                            ? 'Comanda Vendida'
                            : hist.type === 'payment'
                              ? 'Pagamento'
                              : 'Ajuste Manual'}
                        </span>
                      </div>

                      <div
                        className={`shrink-0 text-right font-mono font-black ${isCharge ? 'text-gold-400' : 'text-emerald-400'}`}
                      >
                        {isCharge ? '+' : ''} {fmt(hist.amount)}
                      </div>
                    </div>
                  );
                })}

                {selectedCustomer.history.length === 0 && (
                  <div className="flex flex-col items-center py-20 text-center text-sm italic text-cream-400">
                    <AlertOctagon size={38} className="mb-3 text-cream-400" />
                    <p>
                      Ainda não há nenhum histórico financeiro ou fiado
                      cadastrado.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FORM MODAL: Create/Edit Customer */}
      {mainTab === 'cadastro' && showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-md rounded-2xl border-2 border-counter-700 bg-counter-900 p-5 shadow-2xl">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="absolute right-4 top-4 text-cream-400 hover:text-cream-100"
            >
              <X size={22} />
            </button>
            <h3 className="mb-1 flex items-center gap-2 font-display text-lg font-bold text-cream-100">
              <Users className="text-gold-400" size={24} />
              {formMode === 'create' ? 'Novo Cliente' : 'Editar Cliente'}
            </h3>
            <p className="mb-4 block text-xs text-cream-400">
              Cadastro operacional de clientes e acompanhamento de pendências.
            </p>

            {customerFormError && (
              <div className="mb-4">
                <InlineFeedback tone="error" message={customerFormError} />
              </div>
            )}

            <form onSubmit={handleSaveCustomer} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="mb-1 block text-xs font-bold text-cream-400">
                    Nome Completo <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-counter-700 bg-counter-950 px-3 py-2.5 text-sm font-bold text-cream-100 outline-none focus:border-gold-500"
                    required
                    placeholder="Ex: João Silva"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="mb-1 block text-xs font-bold text-cream-400">
                    Apelido
                  </label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="w-full rounded-lg border border-counter-700 bg-counter-950 px-3 py-2.5 text-sm text-cream-100 outline-none focus:border-gold-500"
                    placeholder="Ex: Joãozinho"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold text-cream-400">
                    Telefone
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-lg border border-counter-700 bg-counter-950 px-3 py-2.5 font-mono text-sm text-cream-100 outline-none focus:border-gold-500"
                    placeholder="(31) 90000-0000"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-cream-400">
                  Motivo / Observação
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="h-16 w-full resize-none rounded-lg border border-counter-700 bg-counter-950 px-3 py-2 text-sm text-cream-100 outline-none focus:border-gold-500"
                  placeholder="Alguma nota sobre o cliente ou restrição..."
                />
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-counter-700 bg-counter-800 p-3">
                <p className="flex-1 text-xs font-bold uppercase text-cream-300">
                  Status do Cliente
                </p>
                <select
                  value={active ? 'true' : 'false'}
                  onChange={(e) => setActive(e.target.value === 'true')}
                  className="rounded border border-counter-700 bg-counter-950 px-2 py-1.5 text-xs font-bold text-cream-100 outline-none"
                >
                  <option value="true">ATIVO</option>
                  <option value="false">INATIVO</option>
                </select>
              </div>

              <button
                type="submit"
                className="mt-2 w-full rounded-xl bg-gold-500 py-2.5 text-sm font-bold text-counter-950 shadow-md transition hover:bg-gold-400"
              >
                Salvar Cliente
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
