/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Cashier, ClosedCashier } from '../types';
import {
  Lock,
  Unlock,
  Plus,
  Minus,
  Coins,
  History,
  AlertTriangle,
  X,
} from 'lucide-react';
import { InlineFeedback } from '../features/shared/components/InlineFeedback';

type OperationResult = { success: boolean; msg: string };

interface CaixaProps {
  caixa: Cashier;
  caixasHistory?: ClosedCashier[];
  onAbrirCaixa: (
    valor: number,
    observacao?: string,
  ) => Promise<OperationResult>;
  onFecharCaixa: (observacaoFechamento?: string) => Promise<OperationResult>;
  onAdicionarSuprimento: (
    valor: number,
    desc: string,
  ) => Promise<OperationResult>;
  onRealizarSangria: (valor: number, desc: string) => Promise<OperationResult>;
}

export default function Caixa({
  caixa,
  caixasHistory = [],
  onAbrirCaixa,
  onFecharCaixa,
  onAdicionarSuprimento,
  onRealizarSangria,
}: CaixaProps) {
  // Modal toggle states
  const [isAbrirModalOpen, setIsAbrirModalOpen] = useState(false);
  const [isReforcoModalOpen, setIsReforcoModalOpen] = useState(false);
  const [isSangriaModalOpen, setIsSangriaModalOpen] = useState(false);
  const [isFecharModalOpen, setIsFecharModalOpen] = useState(false);

  // Form local values for Abertura
  const [aberturaValor, setAberturaValor] = useState('150.00');
  const [aberturaObs, setAberturaObs] = useState('');

  // Form local values for Reforço / Suprimento
  const [reforcoValor, setReforcoValor] = useState('');
  const [reforcoDesc, setReforcoDesc] = useState('');

  // Form local values for Sangria
  const [sangriaValor, setSangriaValor] = useState('');
  const [sangriaDesc, setSangriaDesc] = useState('');

  // Form local values for Fechamento
  const [fechamentoObs, setFechamentoObs] = useState('');

  // Feedback de erro do formulário atualmente aberto
  const [formError, setFormError] = useState<string | null>(null);

  // Log filter state inside cashier
  const [logFilter, setLogFilter] = useState<
    'all' | 'venda' | 'suprimento' | 'sangria'
  >('all');

  const fmt = (v: number) =>
    `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Form submissions
  const handleAberturaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(aberturaValor);
    if (!isNaN(val) && val >= 0) {
      setFormError(null);
      const res = await onAbrirCaixa(val, aberturaObs);
      if (!res.success) {
        setFormError(res.msg);
        return;
      }
      // Reset & close
      setAberturaObs('');
      setIsAbrirModalOpen(false);
    }
  };

  const handleReforcoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(reforcoValor);
    if (!isNaN(val) && val > 0 && reforcoDesc.trim() !== '') {
      setFormError(null);
      const res = await onAdicionarSuprimento(val, reforcoDesc);
      if (!res.success) {
        setFormError(res.msg);
        return;
      }
      // Reset & close
      setReforcoValor('');
      setReforcoDesc('');
      setIsReforcoModalOpen(false);
    }
  };

  const handleSangriaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(sangriaValor);
    if (!isNaN(val) && val > 0 && sangriaDesc.trim() !== '') {
      // Prevent withdrawing more than available cash physically
      if (val > caixa.currentCashInMoney) {
        alert(
          `Sangria excede o dinheiro físico disponível na gaveta (${fmt(caixa.currentCashInMoney)})!`,
        );
        return;
      }
      setFormError(null);
      const res = await onRealizarSangria(val, sangriaDesc);
      if (!res.success) {
        setFormError(res.msg);
        return;
      }
      // Reset & close
      setSangriaValor('');
      setSangriaDesc('');
      setIsSangriaModalOpen(false);
    }
  };

  const handleFechamentoConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const res = await onFecharCaixa(fechamentoObs);
    if (!res.success) {
      setFormError(res.msg);
      return;
    }
    // Reset & close
    setFechamentoObs('');
    setIsFecharModalOpen(false);
  };

  // Calculations for open state
  const totalRecebidoHoje = caixa.logs
    .filter(
      (l) =>
        (l.type === 'venda' || l.type === 'recebimento_fiado') &&
        l.paymentMethod === 'dinheiro',
    )
    .reduce((sum, l) => sum + l.amount, 0);

  const totalReforcos = caixa.logs
    .filter((l) => l.type === 'suprimento')
    .reduce((sum, l) => sum + l.amount, 0);

  const totalSangrias = caixa.logs
    .filter((l) => l.type === 'sangria')
    .reduce((sum, l) => sum + l.amount, 0);

  const OUTROS_MEIOS_SOMA = caixa.logs
    .filter(
      (l) =>
        (l.type === 'venda' || l.type === 'recebimento_fiado') &&
        l.paymentMethod !== 'dinheiro' &&
        l.paymentMethod !== 'fiado',
    )
    .reduce((sum, l) => sum + l.amount, 0);

  // Expected Cash = Initial + Received in Cash + Suprimentos - Sangrias
  const saldoEsperadoGaveta =
    caixa.initialCash + totalRecebidoHoje + totalReforcos - totalSangrias;

  // Filter cashier logs
  const filteredLogs = caixa.logs.filter((log) => {
    if (logFilter === 'all') return true;
    return log.type === logFilter;
  });

  return (
    <div
      id="caixa-diario-module"
      className="space-y-6 animate-fade-in text-slate-700"
    >
      {/* Title block */}
      <div
        id="caixa-header-container"
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs"
      >
        <div>
          <span className="text-xs uppercase tracking-widest font-mono text-emerald-600 font-bold block mb-1">
            Tesouraria e Operação
          </span>
          <h2 className="text-3xl font-display font-bold text-slate-900 tracking-tight">
            Caixa <span className="text-emerald-600">Diário</span> Balcão
          </h2>
          <p className="text-xs text-slate-500 mt-1 leading-normal">
            Controle de abertura física, suprimento de troco, sangrias para
            compras rápidas e fechamento fiscal de mesa.
          </p>
        </div>

        <div>
          {caixa.isOpen ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold font-mono">
              <Unlock size={12} className="text-emerald-600 animate-pulse" />
              STATUS: CAIXA ABERTO
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold font-mono">
              <Lock size={12} className="text-rose-600" />
              STATUS: FECHADO
            </span>
          )}
        </div>
      </div>

      {/* 1. SEM CAIXA ABERTO STATE CARD */}
      {!caixa.isOpen && (
        <div
          id="state-caixa-fechado-card"
          className="bg-white border border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-xs"
        >
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-600 mb-5 animate-pulse">
            <Lock size={40} className="stroke-[1.5]" />
          </div>
          <h3 className="text-xl font-display font-black text-slate-900 mb-2">
            Nenhum Caixa Aberto
          </h3>
          <p className="text-sm text-slate-500 max-w-lg mb-6 leading-relaxed">
            As operações diárias de comandas e recebimentos fiscais estão
            suspensas no momento. Abra o caixa informando o fundo de troco
            líquido necessário para a operação diária no balcão.
          </p>
          <button
            id="btn-open-abertura-modal"
            onClick={() => {
              setFormError(null);
              setIsAbrirModalOpen(true);
            }}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-md shadow-emerald-500/15 cursor-pointer hover:shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center gap-2"
          >
            <Unlock size={16} />
            Abrir Caixa Agora
          </button>
        </div>
      )}

      {/* 2. CAIXA ABERTO STATE DASHBOARD */}
      {caixa.isOpen && (
        <div id="state-caixa-aberto-container" className="space-y-6">
          {/* Header metadata row */}
          <div className="bg-emerald-900/5 border border-emerald-200/10 p-4 rounded-xl flex flex-wrap justify-between items-center gap-2 text-xs">
            <div className="flex items-center gap-2 text-emerald-700 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-50 animate-ping"></span>
              <span>Caixa de Atendimento Ativo</span>
            </div>
            <div className="text-slate-500 font-mono">
              Abertura oficial em:{' '}
              <strong className="text-slate-700">
                {new Date(caixa.openedAt || '').toLocaleString('pt-BR')}
              </strong>
            </div>
          </div>

          {/* KPI Cards Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4.5 shadow-xs">
              <span className="text-[11px] uppercase font-mono text-slate-500 block font-bold mb-1">
                Fundo Inicial
              </span>
              <h4 className="text-lg font-bold font-mono text-slate-700">
                {fmt(caixa.initialCash)}
              </h4>
              <p className="text-[11px] text-slate-500 mt-1">
                Lançamento de abertura
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4.5 shadow-xs">
              <span className="text-[11px] uppercase font-mono text-slate-500 block font-bold mb-1">
                Total Recebido (Dinheiro)
              </span>
              <h4 className="text-lg font-bold font-mono text-emerald-600">
                +{fmt(totalRecebidoHoje)}
              </h4>
              <p className="text-[11px] text-slate-500 mt-1">
                Comandas e fiados pagos
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4.5 shadow-xs">
              <span className="text-[11px] uppercase font-mono text-slate-500 block font-bold mb-1">
                Total Reforços
              </span>
              <h4 className="text-lg font-bold font-mono text-blue-600">
                +{fmt(totalReforcos)}
              </h4>
              <p className="text-[11px] text-slate-500 mt-1">
                Adicionados à gaveta
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4.5 shadow-xs">
              <span className="text-[11px] uppercase font-mono text-slate-500 block font-bold mb-1">
                Total Sangrias
              </span>
              <h4 className="text-lg font-bold font-mono text-rose-600">
                -{fmt(totalSangrias)}
              </h4>
              <p className="text-[11px] text-slate-500 mt-1">
                Retiradas emergenciais
              </p>
            </div>

            <div className="bg-emerald-50 border border-emerald-250 rounded-2xl p-4.5 text-emerald-800">
              <span className="text-[11px] uppercase font-mono block font-bold mb-1 text-emerald-700">
                Saldo Esperado (Físico)
              </span>
              <h4 className="text-xl font-black font-mono text-emerald-700">
                {fmt(caixa.currentCashInMoney)}
              </h4>
              <p className="text-[11px] text-emerald-700/80 mt-1">
                Estoque vivo na gaveta
              </p>
            </div>
          </div>

          {/* Action Triggers Row */}
          <div className="bg-white border border-slate-200 p-4.5 rounded-2xl shadow-xs flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-2.5">
              <button
                id="btn-reforco-trigger"
                onClick={() => {
                  setFormError(null);
                  setIsReforcoModalOpen(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus size={14} className="text-emerald-600" />
                Registrar Reforço
              </button>

              <button
                id="btn-sangria-trigger"
                onClick={() => {
                  setFormError(null);
                  setIsSangriaModalOpen(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 hover:border-rose-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Minus size={14} className="text-rose-600" />
                Registrar Sangria
              </button>
            </div>

            <button
              id="btn-fechar-trigger"
              onClick={() => {
                setFormError(null);
                setIsFecharModalOpen(true);
              }}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition cursor-pointer shadow-md shadow-rose-500/10 flex items-center gap-1.5"
            >
              <Lock size={13} />
              Fechar Caixa do Dia
            </button>
          </div>

          {/* Main area: Logs & Other Payment totals */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Logs List - Left Column (8 cols) */}
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
                <h4 className="text-sm font-bold font-display text-slate-900 flex items-center gap-2">
                  <Coins size={16} className="text-emerald-600" />
                  Movimentações Finaceiras de Balcão e Trocos
                </h4>

                {/* Filter list */}
                <div className="flex gap-1 bg-slate-100 border border-slate-200 p-1 rounded-lg">
                  {(['all', 'venda', 'suprimento', 'sangria'] as const).map(
                    (opt) => {
                      const labels: Record<string, string> = {
                        all: 'Tudo',
                        venda: 'Vendas',
                        suprimento: 'Reforços',
                        sangria: 'Sangrias',
                      };
                      return (
                        <button
                          key={opt}
                          onClick={() => setLogFilter(opt)}
                          className={`px-2 py-1 text-[11px] font-bold rounded cursor-pointer ${
                            logFilter === opt
                              ? 'bg-emerald-600 text-white font-black'
                              : 'text-slate-500 hover:text-slate-900'
                          }`}
                        >
                          {labels[opt]}
                        </button>
                      );
                    },
                  )}
                </div>
              </div>

              <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                {filteredLogs.map((log) => {
                  const isPositive =
                    log.type === 'venda' ||
                    log.type === 'suprimento' ||
                    log.type === 'recebimento_fiado' ||
                    log.type === 'abertura';
                  return (
                    <div
                      key={log.id}
                      className="p-3 bg-slate-100/70 border border-slate-300 rounded-xl flex justify-between items-center text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 font-bold text-slate-700">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${isPositive ? 'bg-emerald-50 animate-pulse' : 'bg-rose-50'}`}
                          />
                          <span>{log.description}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {new Date(log.timestamp).toLocaleTimeString('pt-BR')}{' '}
                          - {log.type.toUpperCase()}
                          {log.paymentMethod &&
                            ` [${log.paymentMethod.toUpperCase()}]`}
                        </div>
                      </div>
                      <span
                        className={`font-mono font-bold text-sm ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}
                      >
                        {isPositive ? '+' : '-'} {fmt(log.amount)}
                      </span>
                    </div>
                  );
                })}

                {filteredLogs.length === 0 && (
                  <div className="text-center py-12 text-slate-500 italic">
                    Nenhuma movimentação registrada nessa categoria hoje.
                  </div>
                )}
              </div>
            </div>

            {/* Other totals summary widget - Right Column (4 cols) */}
            <div className="lg:col-span-4 space-y-6">
              {/* Other Payment Channels Today info */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                <h4 className="text-xs uppercase font-mono text-slate-500 font-extrabold mb-3.5 tracking-wider block">
                  Outros Meios de Pagamento (Hoje)
                </h4>

                <div className="space-y-2.5">
                  {[
                    { id: 'pix', label: 'Pix Instantâneo' },
                    { id: 'cartao', label: 'Cartão' },
                    { id: 'fiado', label: 'Assinados no Caderno' },
                  ].map((m) => {
                    const soma = caixa.logs
                      .filter(
                        (l) =>
                          (l.type === 'venda' ||
                            l.type === 'recebimento_fiado') &&
                          l.paymentMethod === m.id,
                      )
                      .reduce((sum, l) => sum + l.amount, 0);

                    return (
                      <div
                        key={m.id}
                        className="p-3 bg-slate-100 border border-slate-300 rounded-xl flex justify-between items-center text-xs"
                      >
                        <div>
                          <span className="font-semibold text-slate-900 block">
                            {m.label}
                          </span>
                          <span className="text-[11px] uppercase tracking-wider text-slate-500 font-mono">
                            Lançamentos
                          </span>
                        </div>
                        <span className="font-mono font-bold text-slate-600">
                          {fmt(soma)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 flex justify-between text-xs">
                  <span className="font-bold text-slate-500">
                    Subtotal Somas:
                  </span>
                  <span className="font-mono font-black text-slate-700">
                    {fmt(OUTROS_MEIOS_SOMA)}
                  </span>
                </div>
              </div>

              {/* Opened notes indicator */}
              {caixa.notes && (
                <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-2xl text-xs text-emerald-700">
                  <span className="font-semibold block mb-0.5 font-mono text-[11px] uppercase text-emerald-700">
                    Anotação de abertura:
                  </span>
                  <p className="italic">"{caixa.notes}"</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. HISTÓRICO DE FECHAMENTOS DE CAIXA */}
      <div
        id="historico-caixas-fechados-container"
        className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs"
      >
        <h3 className="text-base font-display font-bold text-slate-900 tracking-tight flex items-center gap-2 mb-4">
          <History size={16} className="text-slate-500" />
          Histórico de Caixas Anteriores (Fechados)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-500 border-collapse">
            <thead>
              <tr className="border-b border-slate-300 text-[11px] uppercase font-mono text-slate-500 bg-slate-100">
                <th className="px-4 py-3">Abertura</th>
                <th className="px-4 py-3">Fechamento</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Fundo de Troco</th>
                <th className="px-4 py-3 text-right">Adicionais (Reforços)</th>
                <th className="px-4 py-3 text-right">Retiradas (Sangrias)</th>
                <th className="px-4 py-3 text-right">Faturamento Diário</th>
                <th className="px-4 py-3 text-right">Dinheiro Final</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {caixasHistory.map((s) => (
                <tr
                  key={s.id}
                  className="hover:bg-slate-100/80 duration-100"
                >
                  <td className="px-4 py-3 font-mono text-xs leading-tight text-slate-600">
                    {new Date(s.openedAt).toLocaleString('pt-BR')}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs leading-tight text-slate-500">
                    {new Date(s.closedAt).toLocaleString('pt-BR')}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold uppercase font-mono bg-slate-200 text-slate-500 border border-slate-200">
                      {s.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-700">
                    {fmt(s.initialCash)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-blue-600">
                    +{fmt(s.totalReforcos)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-rose-600">
                    -{fmt(s.totalSangrias)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-700 font-bold">
                    {fmt(s.totalVendido)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-emerald-700 font-black">
                    {fmt(s.finalCashInMoney)}
                  </td>
                </tr>
              ))}

              {caixasHistory.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="text-center py-10 text-slate-500 italic"
                  >
                    Nenhum registro de fechamento anterior catalogado
                    localmente.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ---- REACT MODALS & OVERLAYS ---- */}

      {/* 1. MODAL ABRIR CAIXA */}
      {isAbrirModalOpen && (
        <div className="fixed inset-0 bg-slate-50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full shadow-2xl p-6 relative animate-fade-in">
            <button
              onClick={() => setIsAbrirModalOpen(false)}
              className="absolute right-4 top-4 text-slate-500 hover:text-slate-700 cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex gap-3.5 mb-5 items-center">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <Unlock size={20} />
              </div>
              <div>
                <h3 className="text-lg font-black font-display text-slate-900">
                  Iniciar Nova Operação
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 font-mono">
                  PROCESSO DE ABERTURA - AREA VERDE
                </p>
              </div>
            </div>

            {formError && (
              <div className="mb-4">
                <InlineFeedback tone="error" message={formError} />
              </div>
            )}

            <form onSubmit={handleAberturaSubmit} className="space-y-4">
              <div>
                <label className="block text-xs uppercase font-mono text-slate-500 font-bold mb-1.5">
                  Valor Inicial (Fundo de Troco em cédulas/moedas):
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono font-bold">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={aberturaValor}
                    onChange={(e) => setAberturaValor(e.target.value)}
                    className="w-full bg-slate-100 border border-slate-200 focus:bg-white focus:border-emerald-500 py-2.5 pl-9 pr-3 rounded-xl font-mono text-base outline-none transition"
                    data-testid="caixa-valor-inicial-input"
                    required
                  />
                </div>
              </div>

              {/* Quick Presets for cashiers */}
              <div className="flex gap-2">
                {['50.00', '100.00', '150.00', '200.00'].map((p) => {
                  const flt = parseFloat(p);
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setAberturaValor(flt.toFixed(2))}
                      className={`px-2.5 py-1 text-xs font-mono rounded border transition cursor-pointer ${
                        parseFloat(aberturaValor) === flt
                          ? 'bg-emerald-600 text-white border-emerald-500'
                          : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {fmt(flt)}
                    </button>
                  );
                })}
              </div>

              <div>
                <label className="block text-xs uppercase font-mono text-slate-500 font-bold mb-1.5">
                  Observações de Abertura:
                </label>
                <textarea
                  value={aberturaObs}
                  onChange={(e) => setAberturaObs(e.target.value)}
                  placeholder="Ex: Cédulas de troco pegas com o gerente para o sábado de sol"
                  className="w-full bg-slate-100 border border-slate-200 focus:bg-white focus:border-emerald-500 p-2.5 text-xs rounded-xl h-20 outline-none resize-none transition"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAbrirModalOpen(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 border border-slate-200 text-xs font-bold transition cursor-pointer text-center"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer text-center shadow-md shadow-emerald-500/10"
                >
                  Confirmar Abertura
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. MODAL REGISTRAR REFORÇO */}
      {isReforcoModalOpen && (
        <div className="fixed inset-0 bg-slate-50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-sm w-full shadow-2xl p-6 relative animate-fade-in">
            <button
              onClick={() => setIsReforcoModalOpen(false)}
              className="absolute right-4 top-4 text-slate-500 hover:text-slate-700 cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex gap-3 mb-4 items-center">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <Plus size={18} />
              </div>
              <div>
                <h3 className="text-base font-black font-display text-slate-900">
                  Registrar Reforço
                </h3>
                <p className="text-[11px] text-slate-500 font-mono">
                  SUPRIMENTO DE FLUXO DE TROCO
                </p>
              </div>
            </div>

            {formError && (
              <div className="mb-4">
                <InlineFeedback tone="error" message={formError} />
              </div>
            )}

            <form onSubmit={handleReforcoSubmit} className="space-y-4">
              <div>
                <label className="block text-xs uppercase font-mono text-slate-500 font-bold mb-1">
                  Valor Entrando R$:
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono font-bold">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    value={reforcoValor}
                    onChange={(e) => setReforcoValor(e.target.value)}
                    className="w-full bg-slate-100 border border-slate-200 focus:bg-white focus:border-blue-500 py-2 pl-9 pr-3 rounded-lg font-mono text-sm outline-none transition"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase font-mono text-slate-500 font-bold mb-1">
                  Descrição / Origem:
                </label>
                <input
                  type="text"
                  placeholder="Ex: Peguei R$ 50 em moedas na padaria"
                  value={reforcoDesc}
                  onChange={(e) => setReforcoDesc(e.target.value)}
                  className="w-full bg-slate-100 border border-slate-200 focus:bg-white focus:border-blue-500 py-2 px-3 rounded-lg text-xs outline-none transition"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReforcoModalOpen(false)}
                  className="flex-1 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 text-xs font-bold cursor-pointer text-center"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer text-center"
                >
                  Salvar Entrada
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. MODAL REGISTRAR SANGRIA */}
      {isSangriaModalOpen && (
        <div className="fixed inset-0 bg-slate-50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-sm w-full shadow-2xl p-6 relative animate-fade-in">
            <button
              onClick={() => setIsSangriaModalOpen(false)}
              className="absolute right-4 top-4 text-slate-500 hover:text-slate-700 cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex gap-3 mb-4 items-center">
              <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                <Minus size={18} />
              </div>
              <div>
                <h3 className="text-base font-black font-display text-slate-900">
                  Registrar Sangria
                </h3>
                <p className="text-[11px] text-slate-500 font-mono">
                  RETIRADA RÁPIDA DE DINHEIRO
                </p>
              </div>
            </div>

            {formError && (
              <div className="mb-4">
                <InlineFeedback tone="error" message={formError} />
              </div>
            )}

            <form onSubmit={handleSangriaSubmit} className="space-y-4">
              <div>
                <label className="block text-xs uppercase font-mono text-slate-500 font-bold mb-1">
                  Valor Retirado R$:
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono font-bold">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    value={sangriaValor}
                    onChange={(e) => setSangriaValor(e.target.value)}
                    className="w-full bg-slate-100 border border-slate-200 focus:bg-white focus:border-rose-500 py-2 pl-9 pr-3 rounded-lg font-mono text-sm outline-none transition"
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Disponível em dinheiro físico:{' '}
                  <strong>{fmt(caixa.currentCashInMoney)}</strong>
                </p>
              </div>

              <div>
                <label className="block text-xs uppercase font-mono text-slate-500 font-bold mb-1">
                  Descrição / Pago a quem? / Motivo:
                </label>
                <input
                  type="text"
                  placeholder="Ex: Compra de saco de gelo / pagar Seu Adilson"
                  value={sangriaDesc}
                  onChange={(e) => setSangriaDesc(e.target.value)}
                  className="w-full bg-slate-100 border border-slate-200 focus:bg-white focus:border-rose-500 py-2 px-3 rounded-lg text-xs outline-none transition"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSangriaModalOpen(false)}
                  className="flex-1 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 text-xs font-bold cursor-pointer text-center"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer text-center"
                >
                  Salvar Retirada
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. MODAL FECHAR CAIXA */}
      {isFecharModalOpen && (
        <div className="fixed inset-0 bg-slate-50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full shadow-2xl p-6 relative animate-fade-in">
            <button
              onClick={() => setIsFecharModalOpen(false)}
              className="absolute right-4 top-4 text-slate-500 hover:text-slate-700 cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex gap-3 mb-4 items-center">
              <div className="p-2 bg-rose-50 text-rose-600 rounded-xl animate-pulse">
                <Lock size={18} />
              </div>
              <div>
                <h3 className="text-base font-black font-display text-slate-900">
                  Fechar Caixa Diário
                </h3>
                <p className="text-[11px] text-slate-500 font-mono">
                  CONSOLIDAÇÃO DE DADOS DE BALCÃO
                </p>
              </div>
            </div>

            {formError && (
              <div className="mb-4">
                <InlineFeedback tone="error" message={formError} />
              </div>
            )}

            <form onSubmit={handleFechamentoConfirm} className="space-y-4">
              <div className="bg-slate-100 border border-slate-300 p-3.5 rounded-xl space-y-2 text-xs">
                <span className="text-[11px] uppercase tracking-wider font-mono text-slate-500 block font-bold leading-none">
                  Resumo Consolidado Interno:
                </span>

                <div className="flex justify-between">
                  <span className="text-slate-500">
                    Fundo de Troco Inicial:
                  </span>
                  <span className="font-mono font-bold text-slate-700">
                    {fmt(caixa.initialCash)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">
                    Faturamento Vendas (Dinheiro):
                  </span>
                  <span className="font-mono font-bold text-emerald-600">
                    +{fmt(totalRecebidoHoje)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">
                    Reforços de Caixa:
                  </span>
                  <span className="font-mono font-bold text-blue-600">
                    +{fmt(totalReforcos)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">
                    Sangrias Totais:
                  </span>
                  <span className="font-mono font-bold text-rose-600">
                    -{fmt(totalSangrias)}
                  </span>
                </div>

                <div className="border-t border-slate-200 my-1 pt-1.5 flex justify-between font-bold text-slate-900">
                  <span>Saldo Final em Dinheiro:</span>
                  <span className="font-mono text-emerald-700 font-black text-sm">
                    {fmt(saldoEsperadoGaveta)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase font-mono text-slate-500 font-bold mb-1">
                  Observações / Notas Finais:
                </label>
                <textarea
                  value={fechamentoObs}
                  onChange={(e) => setFechamentoObs(e.target.value)}
                  placeholder="Ex: Tudo bateu 100% no balcão hoje. Sobraram algumas moedas de R$ 0,25 para troco de segunda."
                  className="w-full bg-slate-100 border border-slate-200 focus:bg-white focus:border-rose-500 p-2 text-xs rounded-lg h-16 outline-none resize-none transition"
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2 text-[11px] text-amber-800 leading-normal">
                <AlertTriangle
                  size={14}
                  className="text-amber-600 shrink-0 mt-0.2"
                />
                <span>
                  Esta ação fechará oficialmente o movimento. Vendas adicionais
                  exigirão iniciar um novo caixa. Confirme se as notas fiscais e
                  contagem de cédulas estão de acordo.
                </span>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsFecharModalOpen(false)}
                  className="flex-1 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 text-xs font-bold cursor-pointer text-center"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer text-center"
                >
                  Fechar Caixa Operativo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
