/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Product, Customer, Comanda, Cashier } from '../types';
import { useDashboardMetrics } from '../features/dashboard/hooks/useDashboardMetrics';
import {
  DollarSign,
  Users,
  ClipboardList,
  AlertTriangle,
  TrendingUp,
  PlusCircle,
  ArrowUpRight,
  Sparkles,
  Calendar,
  Lock,
  Unlock,
  PackageOpen,
  XCircle,
  HelpCircle,
  Clock,
  Gauge,
  RefreshCw,
} from 'lucide-react';

interface DashboardProps {
  products: Product[];
  customers: Customer[];
  comandas: Comanda[];
  caixa: Cashier;
  onChangeTab: (tab: string) => void;
  onOpenCaixaTrigger: () => void;
}

function formatCurrency(value: number) {
  return `R$ ${value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function LoadingValue() {
  return (
    <span className="text-sm font-mono text-slate-500">Carregando...</span>
  );
}

export default function Dashboard({
  products,
  customers,
  comandas,
  caixa,
  onChangeTab,
  onOpenCaixaTrigger,
}: DashboardProps) {
  const { metrics, isLoading, error, reload } = useDashboardMetrics();

  const operationDate = metrics?.dailyReport?.date
    ? new Date(`${metrics.dailyReport.date}T12:00:00`)
    : new Date();

  const salesToday = metrics?.dailyReport?.totalReceived ?? 0;
  const totalFiado = metrics?.dailyReport?.fiados.pendentesAtuais ?? 0;
  const activeComandasCount = metrics?.openCommandasCount ?? 0;
  const activeComandasSum = metrics?.openCommandasTotal ?? 0;
  const lowStockProducts = metrics?.lowStockItems ?? [];
  const negativeStockProducts = metrics?.negativeStockItems ?? [];
  const bestSellersList = metrics?.bestSellers ?? [];

  const renderMetric = (content: React.ReactNode) => {
    if (isLoading) return <LoadingValue />;
    if (error)
      return (
        <span className="text-sm font-mono text-rose-500">Indisponível</span>
      );
    return content;
  };

  const recentComandas = comandas.slice(0, 5);

  return (
    <div
      id="dashboard-module"
      className="space-y-6 animate-fade-in text-slate-200"
    >
      <div
        id="dashboard-header-block"
        className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xs sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <div className="mb-1.5 flex items-center gap-2 text-xs font-bold font-mono text-slate-500">
            <Calendar size={13} className="animate-pulse text-emerald-500" />
            <span>
              {operationDate.toLocaleDateString('pt-BR', {
                weekday: 'long',
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-950/40" />
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-400">
              Operação de Balcão
            </span>
          </div>
          <h2 className="text-3xl font-display font-bold tracking-tight text-slate-50">
            Dashboard <span className="text-emerald-500">Operacional</span>
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {error && (
            <div className="rounded-xl border border-rose-800/60 bg-rose-950/40 px-3 py-2 text-[10px] font-mono text-rose-500">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={() => void reload()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-800/50 px-3 py-2 text-[10px] font-bold font-mono uppercase text-slate-400 transition hover:bg-slate-800 hover:text-emerald-400"
          >
            <RefreshCw size={12} />
            Atualizar
          </button>

          <div
            id="dashboard-cashier-widget"
            className="flex items-center gap-4"
          >
            <div className="text-right">
              <span className="mb-1 block text-[10px] font-bold font-mono uppercase text-slate-500">
                Status do Caixa
              </span>
              {caixa.isOpen ? (
                <span
                  id="badge-caixa-aberto"
                  className="inline-flex items-center gap-1.5 rounded-full border border-emerald-800/60 bg-emerald-950/40 px-3 py-1.5 text-xs font-bold font-mono text-emerald-400"
                >
                  <Unlock size={12} className="text-emerald-500" />
                  ABERTO • Gaveta: {formatCurrency(caixa.currentCashInMoney)}
                </span>
              ) : (
                <button
                  id="btn-trigger-quick-open"
                  onClick={onOpenCaixaTrigger}
                  className="inline-flex animate-pulse items-center gap-1.5 rounded-full bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-rose-500/15 transition-all duration-150 hover:bg-rose-950/40"
                >
                  <Lock size={12} />
                  CAIXA FECHADO - ABRIR S.O.
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div
        id="dashboard-kpi-bento-grid"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
      >
        <div
          id="kpi-card-caixa-status"
          className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900 p-4.5 shadow-xs"
        >
          <div className="mb-3 flex items-start justify-between">
            <div
              className={`rounded-xl border p-2.5 ${
                caixa.isOpen
                  ? 'border-emerald-900 bg-emerald-950/40 text-emerald-500'
                  : 'border-rose-900 bg-rose-950/40 text-rose-500'
              }`}
            >
              <DollarSign size={18} />
            </div>
            <span
              className={`rounded px-1.5 py-0.5 text-[9px] font-extrabold font-mono uppercase ${
                caixa.isOpen
                  ? 'border border-emerald-800/60 bg-emerald-950/40 text-emerald-400'
                  : 'border border-rose-800/60 bg-rose-950/40 text-rose-500'
              }`}
            >
              {caixa.isOpen ? 'Aberto' : 'Fechado'}
            </span>
          </div>
          <div>
            <p className="mb-1 text-[10px] font-bold font-mono uppercase tracking-wider text-slate-500">
              Caixa Dinheiro
            </p>
            <h3 className="text-xl font-bold font-mono leading-none tracking-tight text-slate-50">
              {formatCurrency(caixa.isOpen ? caixa.currentCashInMoney : 0)}
            </h3>
            <p className="mt-1.5 text-[9px] leading-normal text-slate-500">
              Total na gaveta física de troco.
            </p>
          </div>
        </div>

        <div
          id="kpi-card-vendas-hoje"
          className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900 p-4.5 shadow-xs"
        >
          <div className="mb-3 flex items-start justify-between">
            <div className="rounded-xl border border-blue-900 bg-blue-950/40 p-2.5 text-blue-500">
              <TrendingUp size={18} />
            </div>
            <button
              id="kpi-link-relatorios"
              onClick={() => onChangeTab('relatorios')}
              className="inline-flex items-center gap-0.5 text-[10px] font-bold font-mono text-blue-500 hover:underline"
            >
              Filtro <ArrowUpRight size={10} />
            </button>
          </div>
          <div>
            <p className="mb-1 text-[10px] font-bold font-mono uppercase tracking-wider text-slate-500">
              Faturamento Hoje
            </p>
            <h3 className="text-xl font-bold font-mono leading-none tracking-tight text-slate-50">
              {renderMetric(formatCurrency(salesToday))}
            </h3>
            <p className="mt-1.5 text-[9px] leading-normal text-slate-500">
              Recebimentos consolidados pela API no dia.
            </p>
          </div>
        </div>

        <div
          id="kpi-card-comandas-ativas"
          className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900 p-4.5 shadow-xs"
        >
          <div className="mb-3 flex items-start justify-between">
            <div className="rounded-xl border border-amber-900 bg-amber-950/40 p-2.5 text-amber-500">
              <ClipboardList size={18} />
            </div>
            <span className="rounded border border-amber-800/60 bg-amber-950/40 px-1.5 py-0.5 text-[9px] font-extrabold font-mono text-amber-400">
              {renderMetric(`${activeComandasCount} Ativas`)}
            </span>
          </div>
          <div>
            <p className="mb-1 text-[10px] font-bold font-mono uppercase tracking-wider text-slate-500">
              Contas Balcão
            </p>
            <h3 className="text-xl font-bold font-mono leading-none tracking-tight text-slate-50">
              {renderMetric(formatCurrency(activeComandasSum))}
            </h3>
            <p className="mt-1.5 text-[9px] leading-normal text-slate-500">
              Total aberto em comandas segundo relatório da API.
            </p>
          </div>
        </div>

        <div
          id="kpi-card-fiado-pendente"
          className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900 p-4.5 shadow-xs"
        >
          <div className="mb-3 flex items-start justify-between">
            <div className="rounded-xl border border-rose-900 bg-rose-950/40 p-2.5 text-rose-500">
              <Users size={18} />
            </div>
            <button
              id="kpi-link-clientes-fiado"
              onClick={() => onChangeTab('clientes')}
              className="inline-flex items-center gap-0.5 text-[10px] font-bold font-mono text-rose-500 hover:underline"
            >
              Caderno <ArrowUpRight size={10} />
            </button>
          </div>
          <div>
            <p className="mb-1 text-[10px] font-bold font-mono uppercase tracking-wider text-slate-500">
              Fiados (Caderno)
            </p>
            <h3 className="text-xl font-bold font-mono leading-none tracking-tight text-slate-50">
              {renderMetric(formatCurrency(totalFiado))}
            </h3>
            <p className="mt-1.5 text-[9px] font-semibold leading-normal text-rose-500">
              Saldo pendente atual consolidado pela API.
            </p>
          </div>
        </div>

        <div
          id="kpi-card-estoque-baixo"
          className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900 p-4.5 shadow-xs"
        >
          <div className="mb-3 flex items-start justify-between">
            <div className="rounded-xl border border-amber-900 bg-amber-950/40 p-2.5 text-amber-500">
              <AlertTriangle size={18} />
            </div>
            <span
              className={`rounded px-1.5 py-0.5 text-[9px] font-extrabold font-mono uppercase ${
                lowStockProducts.length > 0
                  ? 'border border-amber-800/60 bg-amber-900/50 text-amber-400'
                  : 'bg-slate-800 text-slate-500'
              }`}
            >
              {renderMetric(`${lowStockProducts.length} Alertas`)}
            </span>
          </div>
          <div>
            <p className="mb-1 text-[10px] font-bold font-mono uppercase tracking-wider text-slate-500">
              Estoque Baixo
            </p>
            <h3 className="text-xl font-bold font-mono leading-none tracking-tight text-slate-50">
              {renderMetric(
                <>
                  {lowStockProducts.length}{' '}
                  <span className="text-xs font-normal text-slate-500">
                    itens
                  </span>
                </>,
              )}
            </h3>
            <p className="mt-1.5 text-[9px] leading-normal text-slate-500">
              Abaixo do estoque de segurança.
            </p>
          </div>
        </div>

        <div
          id="kpi-card-estoque-negativo"
          className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900 p-4.5 shadow-xs"
        >
          <div className="mb-3 flex items-start justify-between">
            <div className="rounded-xl border border-rose-900 bg-rose-950/40 p-2.5 text-rose-500">
              <XCircle size={18} />
            </div>
            <span
              className={`rounded px-1.5 py-0.5 text-[9px] font-extrabold font-mono uppercase ${
                negativeStockProducts.length > 0
                  ? 'border border-rose-800/60 bg-rose-900/50 text-rose-400'
                  : 'bg-slate-800 text-slate-500'
              }`}
            >
              {renderMetric(`${negativeStockProducts.length} Crítico`)}
            </span>
          </div>
          <div>
            <p className="mb-1 text-[10px] font-bold font-mono uppercase tracking-wider text-slate-500">
              Estoque Negativo
            </p>
            <h3
              className={`text-xl font-bold font-mono leading-none tracking-tight ${
                negativeStockProducts.length > 0
                  ? 'text-rose-500'
                  : 'text-slate-50'
              }`}
            >
              {renderMetric(
                <>
                  {negativeStockProducts.length}{' '}
                  <span className="text-xs font-normal text-slate-500">
                    itens
                  </span>
                </>,
              )}
            </h3>
            <p className="mt-1.5 text-[9px] leading-normal text-slate-500">
              Saídas forçadas sem reabastecer.
            </p>
          </div>
        </div>
      </div>

      <div
        id="dashboard-quick-actions-panel"
        className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xs"
      >
        <h3 className="mb-3.5 flex items-center gap-1.5 text-sm font-semibold font-mono uppercase tracking-wider text-slate-500">
          <Gauge size={14} className="text-emerald-500" /> Atalhos Principais do
          Balcoista
        </h3>
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-6">
          <button
            id="quick-nav-abrir-caixa"
            onClick={() => onChangeTab('caixa')}
            className="flex flex-col items-center gap-2 rounded-xl border border-slate-800 bg-slate-800/50 p-4 text-center transition duration-150 hover:border-emerald-300 hover:bg-emerald-950/40"
          >
            <Unlock size={22} className="text-emerald-500" />
            <span className="block text-xs font-bold text-slate-300">
              Abrir Caixa
            </span>
          </button>

          <button
            id="quick-nav-nova-comanda"
            onClick={() => onChangeTab('comandas')}
            className="flex flex-col items-center gap-2 rounded-xl border border-emerald-900 bg-slate-800/50 p-4 text-center transition-all hover:bg-emerald-900/25"
          >
            <PlusCircle size={22} className="animate-pulse text-emerald-400" />
            <span className="block text-xs font-black text-emerald-300">
              Nova Comanda
            </span>
          </button>

          <button
            id="quick-nav-ver-comandas"
            onClick={() => onChangeTab('comandas')}
            className="flex flex-col items-center gap-2 rounded-xl border border-slate-800 bg-slate-800/50 p-4 text-center transition duration-150 hover:border-emerald-300 hover:bg-emerald-950/40"
          >
            <ClipboardList size={22} className="text-amber-500" />
            <span className="block text-xs font-bold text-slate-300">
              Comandas Ativas
            </span>
          </button>

          <button
            id="quick-nav-lancar-estoque"
            onClick={() => onChangeTab('produtos')}
            className="flex flex-col items-center gap-2 rounded-xl border border-slate-800 bg-slate-800/50 p-4 text-center transition duration-150 hover:border-emerald-300 hover:bg-emerald-950/40"
          >
            <PackageOpen size={22} className="text-sky-500" />
            <span className="block text-xs font-bold text-slate-300">
              Lançar Estoque
            </span>
          </button>

          <button
            id="quick-nav-ver-fiados"
            onClick={() => onChangeTab('clientes')}
            className="flex flex-col items-center gap-2 rounded-xl border border-slate-800 bg-slate-800/50 p-4 text-center transition duration-150 hover:border-emerald-300 hover:bg-emerald-950/40"
          >
            <Users size={22} className="text-rose-500" />
            <span className="block text-xs font-bold text-slate-300">
              Ver Fiados
            </span>
          </button>

          <button
            id="quick-nav-ver-relatorios"
            onClick={() => onChangeTab('relatorios')}
            className="flex flex-col items-center gap-2 rounded-xl border border-slate-800 bg-slate-800/50 p-4 text-center transition duration-150 hover:border-emerald-300 hover:bg-emerald-950/40"
          >
            <TrendingUp size={22} className="text-blue-500" />
            <span className="block text-xs font-bold text-slate-300">
              Ver Relatórios
            </span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <div
            id="dashboard-ultimas-comandas"
            className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xs"
          >
            <div className="mb-4 flex items-center justify-between">
              <h4 className="flex items-center gap-2 text-base font-display font-bold tracking-tight text-slate-50">
                <Clock size={16} className="text-amber-500" />
                Últimas Comandas Executadas / Em Consumo
              </h4>
              <button
                id="btn-link-comandas"
                onClick={() => onChangeTab('comandas')}
                className="text-xs font-bold font-mono text-emerald-500 hover:underline"
              >
                Gerir Comandas
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs leading-normal text-slate-500">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-800/50 text-[10px] font-mono uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-3">Identificação</th>
                    <th className="px-4 py-3 text-center">Itens Consumidos</th>
                    <th className="px-4 py-3 text-right">Preço Total</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentComandas.map((comanda) => {
                    const comandaTotal = comanda.items.reduce(
                      (sum, item) => sum + item.price * item.quantity,
                      0,
                    );
                    const linkedCustomer = customers.find(
                      (customer) => customer.id === comanda.customerId,
                    );

                    return (
                      <tr
                        key={comanda.id}
                        className="duration-100 hover:bg-slate-800/40"
                      >
                        <td className="px-4 py-3">
                          <div>
                            <span className="block font-bold text-slate-200">
                              {comanda.code}
                            </span>
                            {linkedCustomer ? (
                              <span className="text-[10px] font-semibold text-emerald-400">
                                Cliente: {linkedCustomer.name}
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold font-mono uppercase tracking-tight text-slate-500">
                                Consumo Geral
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center font-mono">
                          <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-300">
                            {comanda.items.length}{' '}
                            {comanda.items.length === 1 ? 'item' : 'itens'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-bold font-mono text-slate-200">
                          {formatCurrency(comandaTotal)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {comanda.status === 'active' ? (
                            <span className="rounded border border-amber-800/60 bg-amber-950/40 px-2 py-0.5 text-[9px] font-extrabold font-mono uppercase text-amber-400">
                              Consumindo
                            </span>
                          ) : (
                            <span className="rounded border border-emerald-800/60 bg-emerald-950/40 px-2 py-0.5 text-[9px] font-extrabold font-mono uppercase text-emerald-400">
                              Paga
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            id={`btn-open-comanda-row-${comanda.id}`}
                            onClick={() => onChangeTab('comandas')}
                            className="rounded border border-slate-800 bg-slate-800/50 px-2.5 py-1 text-[10px] font-bold font-mono uppercase text-slate-400 transition hover:border-emerald-300 hover:bg-emerald-950/40 hover:text-emerald-400"
                          >
                            Abrir
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {recentComandas.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-10 text-center italic text-slate-500"
                      >
                        Nenhuma comanda aberta ou finalizada no sistema.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div
            id="dashboard-produtos-mais-vendidos"
            className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xs"
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h4 className="flex items-center gap-1.5 text-base font-display font-bold tracking-tight text-slate-50">
                  <Sparkles size={16} className="text-emerald-500" />
                  Ranking de Vendas (Produtos Mais Vendidos)
                </h4>
                <p className="mt-0.5 block text-[10px] leading-tight text-slate-500">
                  Produtos mais vendidos consolidados pelo backend para o dia
                  atual.
                </p>
              </div>
              <button
                id="btn-link-estoque-relatorios"
                onClick={() => onChangeTab('relatorios')}
                className="text-xs font-bold font-mono text-emerald-500 hover:underline"
              >
                Relatórios
              </button>
            </div>

            <div className="space-y-3 pt-1.5">
              {isLoading && (
                <div className="rounded-xl border border-slate-800 bg-slate-800/50 p-4 text-xs text-slate-500">
                  Carregando ranking de vendas...
                </div>
              )}

              {!isLoading && !error && bestSellersList.length === 0 && (
                <div className="rounded-xl border border-slate-800 bg-slate-800/50 p-4 text-xs text-slate-500">
                  Nenhuma venda consolidada pela API para o dia atual.
                </div>
              )}

              {!isLoading &&
                !error &&
                bestSellersList.map((item, index) => {
                  const maxQty = bestSellersList[0]?.quantity || 1;
                  const widthPercent = Math.max(
                    10,
                    Math.min(100, (item.quantity / maxQty) * 100),
                  );

                  return (
                    <div
                      key={item.id}
                      className="space-y-2 rounded-xl border border-slate-700 bg-slate-800/50 p-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-950 text-[10px] font-extrabold font-mono text-emerald-400">
                            #{index + 1}
                          </span>
                          <div>
                            <span className="block text-xs font-bold text-slate-200">
                              {item.name}
                            </span>
                            <span className="text-[9px] font-bold font-mono uppercase tracking-wider text-slate-500">
                              {item.category}
                            </span>
                          </div>
                        </div>

                        <div className="text-right font-mono">
                          <span className="block text-xs font-extrabold text-slate-100">
                            {item.quantity} saídas
                          </span>
                          <span className="text-[9px] font-semibold text-emerald-400">
                            {formatCurrency(item.total)} total
                          </span>
                        </div>
                      </div>

                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                        <div
                          className="h-full rounded-full bg-emerald-600 transition-all duration-300"
                          style={{ width: `${widthPercent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-4">
          <div
            id="dashboard-alertas-operacionais"
            className="flex h-full flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xs"
          >
            <div>
              <div className="mb-4 flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-500 shrink-0" />
                <h4 className="text-base font-display font-bold text-slate-50">
                  Alertas Operacionais
                </h4>
              </div>

              <div className="max-h-[460px] space-y-3.5 overflow-y-auto pr-1">
                {!caixa.isOpen && (
                  <div
                    id="alert-box-caixa-fechado"
                    className="flex items-start gap-2.5 rounded-xl border border-rose-800/60 bg-rose-950/40 p-3.5 text-xs font-medium text-rose-400"
                  >
                    <Lock size={16} className="mt-0.5 shrink-0 text-rose-500" />
                    <div>
                      <span className="mb-0.5 block font-bold text-rose-300">
                        Caixa Fechado
                      </span>
                      Você não poderá processar recebimentos de comandas nem
                      lançamentos financeiros até abrir o caixa.
                    </div>
                  </div>
                )}

                {negativeStockProducts.length > 0 && (
                  <div
                    id="alert-box-negative-stock"
                    className="flex items-start gap-2.5 rounded-xl border border-rose-800/60 bg-rose-950/40 p-3.5 text-xs font-medium text-rose-400"
                  >
                    <AlertTriangle
                      size={16}
                      className="mt-0.5 shrink-0 text-rose-500"
                    />
                    <div>
                      <span className="mb-0.5 block font-bold text-rose-300">
                        Estoque Negativo Grave!
                      </span>
                      Há{' '}
                      <strong className="font-mono">
                        {negativeStockProducts.length}
                      </strong>{' '}
                      produto(s) com saldo negativo segundo a API.
                    </div>
                  </div>
                )}

                {lowStockProducts.length > 0 && (
                  <div
                    id="alert-box-low-stock"
                    className="flex items-start gap-2.5 rounded-xl border border-amber-800/60 bg-amber-950/40 p-3.5 text-xs font-medium text-amber-400"
                  >
                    <AlertTriangle
                      size={16}
                      className="mt-0.5 shrink-0 text-amber-500"
                    />
                    <div>
                      <span className="mb-0.5 block font-bold text-amber-300">
                        Estoque de Segurança Baixo
                      </span>
                      <strong className="font-mono">
                        {lowStockProducts.length}
                      </strong>{' '}
                      item(ns) aparecem em alerta de estoque baixo na API.
                    </div>
                  </div>
                )}

                <div
                  id="info-box-tip-vincular"
                  className="flex items-start gap-2.5 rounded-xl border border-emerald-800/60 bg-emerald-950/40 p-3.5 text-xs leading-relaxed text-emerald-300"
                >
                  <HelpCircle
                    size={16}
                    className="mt-0.5 shrink-0 text-emerald-500"
                  />
                  <div>
                    <span className="mb-0.5 block font-bold text-emerald-200">
                      Dica de Atendimento
                    </span>
                    Vincule o cadastro dos fregueses nas comandas para facilitar
                    o fechamento em fiado no fim do consumo.
                  </div>
                </div>

                <div className="space-y-2.5 rounded-xl border border-slate-800 bg-slate-800/50 p-4 text-xs font-mono text-slate-500">
                  <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    Boas práticas do balcão:
                  </span>
                  <ul className="space-y-1.5 text-[10px] leading-tight">
                    <li className="flex gap-1.5">
                      <span className="font-bold text-emerald-500">•</span>
                      <span>
                        Contar cédulas da gaveta antes de fechar o dia físico.
                      </span>
                    </li>
                    <li className="flex gap-1.5">
                      <span className="font-bold text-emerald-500">•</span>
                      <span>
                        Cadastrar o telefone do fiador no caderno virtual.
                      </span>
                    </li>
                    <li className="flex gap-1.5">
                      <span className="font-bold text-emerald-500">•</span>
                      <span>
                        Evitar dar descontos excessivos sem autorização
                        familiar.
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <button
              id="btn-navigate-to-stock-from-alerts"
              onClick={() => onChangeTab('estoque')}
              className="mt-6 block w-full rounded-xl border border-slate-800 bg-slate-800/50 py-2.5 text-center text-[11px] font-bold font-mono uppercase tracking-wider text-slate-400 transition-all hover:border-emerald-600 hover:bg-emerald-950/40 hover:text-emerald-400"
            >
              Controlar Estoque Completo →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
