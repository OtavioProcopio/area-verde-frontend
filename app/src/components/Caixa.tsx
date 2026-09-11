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
    <div id="caixa-diario-module" className="space-y-5">
      {/* Title block */}
      <div
        id="caixa-header-container"
        className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-counter-700 bg-counter-900 p-5 sm:flex-row sm:items-center"
      >
        <div>
          <span className="mb-1 block text-xs font-bold text-gold-400">
            Tesouraria e Operação
          </span>
          <h2 className="font-display text-3xl font-bold tracking-tight text-cream-100">
            Caixa <span className="text-gold-400">Diário</span> Balcão
          </h2>
          <p className="mt-1 text-sm leading-normal text-cream-400">
            Controle de abertura física, suprimento de troco, sangrias para
            compras rápidas e fechamento fiscal de mesa.
          </p>
        </div>

        <div>
          {caixa.isOpen ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-sm font-bold text-emerald-400">
              <Unlock size={19} />
              Caixa aberto
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-400/30 bg-rose-400/10 px-3 py-1.5 text-sm font-bold text-rose-400">
              <Lock size={19} />
              Fechado
            </span>
          )}
        </div>
      </div>

      {/* 1. SEM CAIXA ABERTO STATE CARD */}
      {!caixa.isOpen && (
        <div
          id="state-caixa-fechado-card"
          className="flex flex-col items-center justify-center rounded-2xl border border-counter-700 bg-counter-900 p-8 text-center"
        >
          <div className="mb-5 rounded-2xl border border-rose-400/30 bg-rose-400/10 p-4 text-rose-400">
            <Lock size={48} className="stroke-[1.5]" />
          </div>
          <h3 className="mb-2 font-display text-xl font-black text-cream-100">
            Nenhum Caixa Aberto
          </h3>
          <p className="mb-6 max-w-lg text-sm leading-relaxed text-cream-400">
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
            className="flex items-center gap-2 rounded-xl bg-gold-500 px-6 py-3.5 text-base font-bold text-counter-950 shadow-md shadow-gold-500/15 transition-all hover:bg-gold-400"
          >
            <Unlock size={22} />
            Abrir Caixa Agora
          </button>
        </div>
      )}

      {/* 2. CAIXA ABERTO STATE DASHBOARD */}
      {caixa.isOpen && (
        <div id="state-caixa-aberto-container" className="space-y-5">
          {/* Header metadata row */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4 text-sm">
            <div className="flex items-center gap-2 font-bold text-emerald-400">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400"></span>
              <span>Caixa de Atendimento Ativo</span>
            </div>
            <div className="font-mono text-cream-400">
              Abertura oficial em:{' '}
              <strong className="text-cream-200">
                {new Date(caixa.openedAt || '').toLocaleString('pt-BR')}
              </strong>
            </div>
          </div>

          {/* KPI Cards Strip */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-2xl border border-counter-700 bg-counter-900 p-4">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-cream-400">
                Fundo Inicial
              </span>
              <h4 className="font-mono text-lg font-bold text-cream-100">
                {fmt(caixa.initialCash)}
              </h4>
              <p className="mt-1 text-xs text-cream-400">
                Lançamento de abertura
              </p>
            </div>

            <div className="rounded-2xl border border-counter-700 bg-counter-900 p-4">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-cream-400">
                Total Recebido (Dinheiro)
              </span>
              <h4 className="font-mono text-lg font-bold text-emerald-400">
                +{fmt(totalRecebidoHoje)}
              </h4>
              <p className="mt-1 text-xs text-cream-400">
                Comandas e fiados pagos
              </p>
            </div>

            <div className="rounded-2xl border border-counter-700 bg-counter-900 p-4">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-cream-400">
                Total Reforços
              </span>
              <h4 className="font-mono text-lg font-bold text-sky-400">
                +{fmt(totalReforcos)}
              </h4>
              <p className="mt-1 text-xs text-cream-400">
                Adicionados à gaveta
              </p>
            </div>

            <div className="rounded-2xl border border-counter-700 bg-counter-900 p-4">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-cream-400">
                Total Sangrias
              </span>
              <h4 className="font-mono text-lg font-bold text-rose-400">
                -{fmt(totalSangrias)}
              </h4>
              <p className="mt-1 text-xs text-cream-400">
                Retiradas emergenciais
              </p>
            </div>

            <div className="rounded-2xl border border-gold-500/30 bg-gold-500/10 p-4">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-gold-300">
                Saldo Esperado (Físico)
              </span>
              <h4 className="font-mono text-xl font-black text-gold-400">
                {fmt(caixa.currentCashInMoney)}
              </h4>
              <p className="mt-1 text-xs text-gold-300/80">
                Estoque vivo na gaveta
              </p>
            </div>
          </div>

          {/* Action Triggers Row */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-counter-700 bg-counter-900 p-4">
            <div className="flex gap-2.5">
              <button
                id="btn-reforco-trigger"
                onClick={() => {
                  setFormError(null);
                  setIsReforcoModalOpen(true);
                }}
                className="flex items-center gap-1.5 rounded-xl border border-counter-700 bg-counter-800 px-4 py-2.5 text-sm font-bold text-cream-200 transition hover:border-sky-400/50 hover:text-sky-300"
              >
                <Plus size={19} className="text-sky-400" />
                Registrar Reforço
              </button>

              <button
                id="btn-sangria-trigger"
                onClick={() => {
                  setFormError(null);
                  setIsSangriaModalOpen(true);
                }}
                className="flex items-center gap-1.5 rounded-xl border border-counter-700 bg-counter-800 px-4 py-2.5 text-sm font-bold text-cream-200 transition hover:border-rose-400/50 hover:text-rose-300"
              >
                <Minus size={19} className="text-rose-400" />
                Registrar Sangria
              </button>
            </div>

            <button
              id="btn-fechar-trigger"
              onClick={() => {
                setFormError(null);
                setIsFecharModalOpen(true);
              }}
              className="flex items-center gap-1.5 rounded-xl bg-rose-500 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-rose-500/15 transition hover:bg-rose-400"
            >
              <Lock size={18} />
              Fechar Caixa do Dia
            </button>
          </div>

          {/* Main area: Logs & Other Payment totals */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            {/* Logs List - Left Column (8 cols) */}
            <div className="rounded-2xl border border-counter-700 bg-counter-900 p-5 lg:col-span-8">
              <div className="mb-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                <h4 className="flex items-center gap-2 font-display text-base font-bold text-cream-100">
                  <Coins size={22} className="text-gold-400" />
                  Movimentações do Balcão
                </h4>

                {/* Filter list */}
                <div className="flex gap-1 rounded-lg border border-counter-700 bg-counter-950 p-1">
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
                          className={`rounded px-2.5 py-1.5 text-xs font-bold ${
                            logFilter === opt
                              ? 'bg-gold-500 text-counter-950'
                              : 'text-cream-300 hover:text-cream-100'
                          }`}
                        >
                          {labels[opt]}
                        </button>
                      );
                    },
                  )}
                </div>
              </div>

              <div className="max-h-[350px] space-y-2.5 overflow-y-auto pr-1">
                {filteredLogs.map((log) => {
                  const isPositive =
                    log.type === 'venda' ||
                    log.type === 'suprimento' ||
                    log.type === 'recebimento_fiado' ||
                    log.type === 'abertura';
                  return (
                    <div
                      key={log.id}
                      className="flex items-center justify-between rounded-xl border border-counter-700 bg-counter-800 p-3.5 text-sm"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 font-bold text-cream-100">
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${isPositive ? 'bg-emerald-400' : 'bg-rose-400'}`}
                          />
                          <span>{log.description}</span>
                        </div>
                        <div className="font-mono text-xs text-cream-400">
                          {new Date(log.timestamp).toLocaleTimeString('pt-BR')}{' '}
                          - {log.type.toUpperCase()}
                          {log.paymentMethod &&
                            ` [${log.paymentMethod.toUpperCase()}]`}
                        </div>
                      </div>
                      <span
                        className={`font-mono text-base font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}
                      >
                        {isPositive ? '+' : '-'} {fmt(log.amount)}
                      </span>
                    </div>
                  );
                })}

                {filteredLogs.length === 0 && (
                  <div className="py-12 text-center italic text-cream-400">
                    Nenhuma movimentação registrada nessa categoria hoje.
                  </div>
                )}
              </div>
            </div>

            {/* Other totals summary widget - Right Column (4 cols) */}
            <div className="space-y-5 lg:col-span-4">
              {/* Other Payment Channels Today info */}
              <div className="rounded-2xl border border-counter-700 bg-counter-900 p-5">
                <h4 className="mb-3.5 block text-xs font-extrabold uppercase tracking-wide text-cream-400">
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
                        className="flex items-center justify-between rounded-xl border border-counter-700 bg-counter-800 p-3"
                      >
                        <div>
                          <span className="block text-sm font-semibold text-cream-100">
                            {m.label}
                          </span>
                          <span className="text-xs uppercase tracking-wide text-cream-400">
                            Lançamentos
                          </span>
                        </div>
                        <span className="font-mono font-bold text-cream-200">
                          {fmt(soma)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 flex justify-between border-t border-counter-700 pt-3 text-sm">
                  <span className="font-bold text-cream-400">
                    Subtotal Somas:
                  </span>
                  <span className="font-mono font-black text-cream-100">
                    {fmt(OUTROS_MEIOS_SOMA)}
                  </span>
                </div>
              </div>

              {/* Opened notes indicator */}
              {caixa.notes && (
                <div className="rounded-2xl border border-gold-500/30 bg-gold-500/10 p-4 text-sm text-gold-300">
                  <span className="mb-0.5 block text-xs font-semibold uppercase text-gold-400">
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
        className="rounded-2xl border border-counter-700 bg-counter-900 p-5"
      >
        <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-bold tracking-tight text-cream-100">
          <History size={22} className="text-cream-400" />
          Histórico de Caixas Anteriores (Fechados)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-counter-700 bg-counter-950 text-xs font-bold uppercase text-cream-400">
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
            <tbody className="divide-y divide-counter-800">
              {caixasHistory.map((s) => (
                <tr key={s.id} className="duration-100 hover:bg-counter-800">
                  <td className="px-4 py-3.5 font-mono text-xs leading-tight text-cream-300">
                    {new Date(s.openedAt).toLocaleString('pt-BR')}
                  </td>
                  <td className="px-4 py-3.5 font-mono text-xs leading-tight text-cream-400">
                    {new Date(s.closedAt).toLocaleString('pt-BR')}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="rounded-full border border-counter-700 bg-counter-800 px-2 py-0.5 text-xs font-extrabold uppercase text-cream-300">
                      {s.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono text-cream-200">
                    {fmt(s.initialCash)}
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono text-sky-400">
                    +{fmt(s.totalReforcos)}
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono text-rose-400">
                    -{fmt(s.totalSangrias)}
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono font-bold text-cream-200">
                    {fmt(s.totalVendido)}
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono font-black text-gold-400">
                    {fmt(s.finalCashInMoney)}
                  </td>
                </tr>
              ))}

              {caixasHistory.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="py-10 text-center italic text-cream-400"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-md rounded-2xl border-2 border-counter-700 bg-counter-900 p-5 shadow-2xl">
            <button
              onClick={() => setIsAbrirModalOpen(false)}
              className="absolute right-4 top-4 text-cream-400 hover:text-cream-100"
            >
              <X size={22} />
            </button>

            <div className="mb-4 flex items-center gap-3.5">
              <div className="rounded-xl bg-gold-500/15 p-2 text-gold-400">
                <Unlock size={24} />
              </div>
              <div>
                <h3 className="font-display text-lg font-black text-cream-100">
                  Iniciar Nova Operação
                </h3>
                <p className="mt-0.5 text-xs text-cream-400">
                  Processo de abertura — Área Verde
                </p>
              </div>
            </div>

            {formError && (
              <div className="mb-4">
                <InlineFeedback tone="error" message={formError} />
              </div>
            )}

            <form onSubmit={handleAberturaSubmit} className="space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-cream-400">
                  Valor Inicial (Fundo de Troco em cédulas/moedas):
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-cream-400">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={aberturaValor}
                    onChange={(e) => setAberturaValor(e.target.value)}
                    className="w-full rounded-xl border border-counter-700 bg-counter-950 py-2.5 pl-9 pr-3 font-mono text-base text-cream-100 outline-none transition focus:border-gold-500"
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
                      className={`rounded border px-2.5 py-1.5 font-mono text-xs transition ${
                        parseFloat(aberturaValor) === flt
                          ? 'border-gold-500 bg-gold-500 text-counter-950'
                          : 'border-counter-700 bg-counter-800 text-cream-300 hover:bg-counter-700'
                      }`}
                    >
                      {fmt(flt)}
                    </button>
                  );
                })}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-cream-400">
                  Observações de Abertura:
                </label>
                <textarea
                  value={aberturaObs}
                  onChange={(e) => setAberturaObs(e.target.value)}
                  placeholder="Ex: Cédulas de troco pegas com o gerente para o sábado de sol"
                  className="h-20 w-full resize-none rounded-xl border border-counter-700 bg-counter-950 p-2.5 text-sm text-cream-100 outline-none transition focus:border-gold-500"
                />
              </div>

              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAbrirModalOpen(false)}
                  className="flex-1 rounded-xl border border-counter-700 bg-counter-800 py-2.5 text-center text-sm font-bold text-cream-200 transition hover:bg-counter-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-gold-500 py-2.5 text-center text-sm font-bold text-counter-950 shadow-md shadow-gold-500/10 transition hover:bg-gold-400"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-sm rounded-2xl border-2 border-counter-700 bg-counter-900 p-5 shadow-2xl">
            <button
              onClick={() => setIsReforcoModalOpen(false)}
              className="absolute right-4 top-4 text-cream-400 hover:text-cream-100"
            >
              <X size={22} />
            </button>

            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-xl bg-sky-400/15 p-2 text-sky-400">
                <Plus size={22} />
              </div>
              <div>
                <h3 className="font-display text-base font-black text-cream-100">
                  Registrar Reforço
                </h3>
                <p className="text-xs text-cream-400">
                  Suprimento de fluxo de troco
                </p>
              </div>
            </div>

            {formError && (
              <div className="mb-4">
                <InlineFeedback tone="error" message={formError} />
              </div>
            )}

            <form onSubmit={handleReforcoSubmit} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-cream-400">
                  Valor Entrando R$:
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-cream-400">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    value={reforcoValor}
                    onChange={(e) => setReforcoValor(e.target.value)}
                    className="w-full rounded-lg border border-counter-700 bg-counter-950 py-2 pl-9 pr-3 font-mono text-sm text-cream-100 outline-none transition focus:border-sky-400"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-cream-400">
                  Descrição / Origem:
                </label>
                <input
                  type="text"
                  placeholder="Ex: Peguei R$ 50 em moedas na padaria"
                  value={reforcoDesc}
                  onChange={(e) => setReforcoDesc(e.target.value)}
                  className="w-full rounded-lg border border-counter-700 bg-counter-950 px-3 py-2 text-sm text-cream-100 outline-none transition focus:border-sky-400"
                  required
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsReforcoModalOpen(false)}
                  className="flex-1 rounded-lg border border-counter-700 bg-counter-800 py-2 text-center text-sm font-bold text-cream-200 hover:bg-counter-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-gold-500 py-2 text-center text-sm font-bold text-counter-950 hover:bg-gold-400"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-sm rounded-2xl border-2 border-counter-700 bg-counter-900 p-5 shadow-2xl">
            <button
              onClick={() => setIsSangriaModalOpen(false)}
              className="absolute right-4 top-4 text-cream-400 hover:text-cream-100"
            >
              <X size={22} />
            </button>

            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-xl bg-rose-400/15 p-2 text-rose-400">
                <Minus size={22} />
              </div>
              <div>
                <h3 className="font-display text-base font-black text-cream-100">
                  Registrar Sangria
                </h3>
                <p className="text-xs text-cream-400">
                  Retirada rápida de dinheiro
                </p>
              </div>
            </div>

            {formError && (
              <div className="mb-4">
                <InlineFeedback tone="error" message={formError} />
              </div>
            )}

            <form onSubmit={handleSangriaSubmit} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-cream-400">
                  Valor Retirado R$:
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-cream-400">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    value={sangriaValor}
                    onChange={(e) => setSangriaValor(e.target.value)}
                    className="w-full rounded-lg border border-counter-700 bg-counter-950 py-2 pl-9 pr-3 font-mono text-sm text-cream-100 outline-none transition focus:border-rose-400"
                    required
                  />
                </div>
                <p className="mt-1 text-xs text-cream-400">
                  Disponível em dinheiro físico:{' '}
                  <strong className="text-cream-200">
                    {fmt(caixa.currentCashInMoney)}
                  </strong>
                </p>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-cream-400">
                  Descrição / Pago a quem? / Motivo:
                </label>
                <input
                  type="text"
                  placeholder="Ex: Compra de saco de gelo / pagar Seu Adilson"
                  value={sangriaDesc}
                  onChange={(e) => setSangriaDesc(e.target.value)}
                  className="w-full rounded-lg border border-counter-700 bg-counter-950 px-3 py-2 text-sm text-cream-100 outline-none transition focus:border-rose-400"
                  required
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsSangriaModalOpen(false)}
                  className="flex-1 rounded-lg border border-counter-700 bg-counter-800 py-2 text-center text-sm font-bold text-cream-200 hover:bg-counter-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-rose-500 py-2 text-center text-sm font-bold text-white hover:bg-rose-400"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-md rounded-2xl border-2 border-counter-700 bg-counter-900 p-5 shadow-2xl">
            <button
              onClick={() => setIsFecharModalOpen(false)}
              className="absolute right-4 top-4 text-cream-400 hover:text-cream-100"
            >
              <X size={22} />
            </button>

            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-xl bg-rose-400/15 p-2 text-rose-400">
                <Lock size={22} />
              </div>
              <div>
                <h3 className="font-display text-base font-black text-cream-100">
                  Fechar Caixa Diário
                </h3>
                <p className="text-xs text-cream-400">
                  Consolidação de dados de balcão
                </p>
              </div>
            </div>

            {formError && (
              <div className="mb-4">
                <InlineFeedback tone="error" message={formError} />
              </div>
            )}

            <form onSubmit={handleFechamentoConfirm} className="space-y-3">
              <div className="space-y-2 rounded-xl border border-counter-700 bg-counter-950 p-3.5 text-sm">
                <span className="block text-xs font-bold uppercase tracking-wide text-cream-400">
                  Resumo Consolidado Interno:
                </span>

                <div className="flex justify-between">
                  <span className="text-cream-400">
                    Fundo de Troco Inicial:
                  </span>
                  <span className="font-mono font-bold text-cream-200">
                    {fmt(caixa.initialCash)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-cream-400">
                    Faturamento Vendas (Dinheiro):
                  </span>
                  <span className="font-mono font-bold text-emerald-400">
                    +{fmt(totalRecebidoHoje)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-cream-400">Reforços de Caixa:</span>
                  <span className="font-mono font-bold text-sky-400">
                    +{fmt(totalReforcos)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-cream-400">Sangrias Totais:</span>
                  <span className="font-mono font-bold text-rose-400">
                    -{fmt(totalSangrias)}
                  </span>
                </div>

                <div className="my-1 flex justify-between border-t border-counter-700 pt-1.5 font-bold text-cream-100">
                  <span>Saldo Final em Dinheiro:</span>
                  <span className="font-mono text-base font-black text-gold-400">
                    {fmt(saldoEsperadoGaveta)}
                  </span>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-cream-400">
                  Observações / Notas Finais:
                </label>
                <textarea
                  value={fechamentoObs}
                  onChange={(e) => setFechamentoObs(e.target.value)}
                  placeholder="Ex: Tudo bateu 100% no balcão hoje. Sobraram algumas moedas de R$ 0,25 para troco de segunda."
                  className="h-16 w-full resize-none rounded-lg border border-counter-700 bg-counter-950 p-2 text-sm text-cream-100 outline-none transition focus:border-rose-400"
                />
              </div>

              <div className="flex items-start gap-2 rounded-lg border border-gold-500/30 bg-gold-500/10 p-3 text-xs leading-normal text-gold-300">
                <AlertTriangle
                  size={19}
                  className="mt-0.5 shrink-0 text-gold-400"
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
                  className="flex-1 rounded-lg border border-counter-700 bg-counter-800 py-2 text-center text-sm font-bold text-cream-200 hover:bg-counter-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-rose-500 py-2 text-center text-sm font-bold text-white hover:bg-rose-400"
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
