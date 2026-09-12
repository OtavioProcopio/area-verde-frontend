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
    <span className="font-mono text-sm text-cream-400">Carregando...</span>
  );
}

export default function Dashboard({
  products: _products,
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
        <span className="font-mono text-sm text-rose-400">Indisponível</span>
      );
    return content;
  };

  const recentComandas = comandas.slice(0, 5);

  return (
    <div id="dashboard-module" className="space-y-5">
      <div
        id="dashboard-header-block"
        className="flex flex-col gap-4 rounded-2xl border border-counter-700 bg-counter-900 p-5 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <div className="mb-1.5 flex items-center gap-2 text-sm font-bold text-cream-400">
            <Calendar size={19} className="text-gold-400" />
            <span>
              {operationDate.toLocaleDateString('pt-BR', {
                weekday: 'long',
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-gold-500" />
            <span className="text-xs font-extrabold uppercase tracking-wider text-gold-400">
              Operação de Balcão
            </span>
          </div>
          <h2 className="font-display text-3xl font-bold tracking-tight text-cream-100">
            Dashboard <span className="text-gold-400">Operacional</span>
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {error && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 font-mono text-xs text-rose-400">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={() => void reload()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-counter-700 bg-counter-800 px-3 py-2.5 text-xs font-bold uppercase text-cream-300 transition hover:bg-counter-700 hover:text-gold-300"
          >
            <RefreshCw size={17} />
            Atualizar
          </button>

          <div
            id="dashboard-cashier-widget"
            className="flex items-center gap-4"
          >
            <div className="text-right">
              <span className="mb-1 block text-xs font-bold uppercase text-cream-400">
                Status do Caixa
              </span>
              {caixa.isOpen ? (
                <span
                  id="badge-caixa-aberto"
                  className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-sm font-bold text-emerald-400"
                >
                  <Unlock size={17} />
                  Aberto • Gaveta: {formatCurrency(caixa.currentCashInMoney)}
                </span>
              ) : (
                <button
                  id="btn-trigger-quick-open"
                  onClick={onOpenCaixaTrigger}
                  className="inline-flex animate-pulse items-center gap-1.5 rounded-full bg-rose-500 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-rose-500/20 transition-all duration-150 hover:bg-rose-400"
                >
                  <Lock size={17} />
                  Caixa fechado — abrir
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
          className="flex flex-col justify-between rounded-2xl border border-counter-700 bg-counter-900 p-4"
        >
          <div className="mb-3 flex items-start justify-between">
            <div
              className={`rounded-xl border p-2.5 ${
                caixa.isOpen
                  ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-400'
                  : 'border-rose-400/30 bg-rose-400/10 text-rose-400'
              }`}
            >
              <DollarSign size={24} />
            </div>
            <span
              className={`rounded px-2 py-1 text-xs font-extrabold uppercase ${
                caixa.isOpen
                  ? 'border border-emerald-400/30 bg-emerald-400/10 text-emerald-400'
                  : 'border border-rose-400/30 bg-rose-400/10 text-rose-400'
              }`}
            >
              {caixa.isOpen ? 'Aberto' : 'Fechado'}
            </span>
          </div>
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-wide text-cream-400">
              Caixa Dinheiro
            </p>
            <h3 className="font-mono text-2xl font-bold leading-none tracking-tight text-cream-100">
              {formatCurrency(caixa.isOpen ? caixa.currentCashInMoney : 0)}
            </h3>
            <p className="mt-1.5 text-xs leading-normal text-cream-400">
              Total na gaveta física de troco.
            </p>
          </div>
        </div>

        <div
          id="kpi-card-vendas-hoje"
          className="flex flex-col justify-between rounded-2xl border border-counter-700 bg-counter-900 p-4"
        >
          <div className="mb-3 flex items-start justify-between">
            <div className="rounded-xl border border-sky-400/30 bg-sky-400/10 p-2.5 text-sky-400">
              <TrendingUp size={24} />
            </div>
            <button
              id="kpi-link-relatorios"
              onClick={() => onChangeTab('relatorios')}
              className="inline-flex items-center gap-0.5 text-xs font-bold text-sky-400 hover:underline"
            >
              Filtro <ArrowUpRight size={14} />
            </button>
          </div>
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-wide text-cream-400">
              Faturamento Hoje
            </p>
            <h3 className="font-mono text-2xl font-bold leading-none tracking-tight text-cream-100">
              {renderMetric(formatCurrency(salesToday))}
            </h3>
            <p className="mt-1.5 text-xs leading-normal text-cream-400">
              Recebimentos consolidados pela API no dia.
            </p>
          </div>
        </div>

        <div
          id="kpi-card-comandas-ativas"
          className="flex flex-col justify-between rounded-2xl border border-counter-700 bg-counter-900 p-4"
        >
          <div className="mb-3 flex items-start justify-between">
            <div className="rounded-xl border border-gold-500/30 bg-gold-500/10 p-2.5 text-gold-400">
              <ClipboardList size={24} />
            </div>
            <span className="rounded border border-gold-500/30 bg-gold-500/10 px-2 py-1 text-xs font-extrabold text-gold-400">
              {renderMetric(`${activeComandasCount} Ativas`)}
            </span>
          </div>
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-wide text-cream-400">
              Contas Balcão
            </p>
            <h3 className="font-mono text-2xl font-bold leading-none tracking-tight text-cream-100">
              {renderMetric(formatCurrency(activeComandasSum))}
            </h3>
            <p className="mt-1.5 text-xs leading-normal text-cream-400">
              Total aberto em comandas segundo relatório da API.
            </p>
          </div>
        </div>

        <div
          id="kpi-card-fiado-pendente"
          className="flex flex-col justify-between rounded-2xl border border-counter-700 bg-counter-900 p-4"
        >
          <div className="mb-3 flex items-start justify-between">
            <div className="rounded-xl border border-rose-400/30 bg-rose-400/10 p-2.5 text-rose-400">
              <Users size={24} />
            </div>
            <button
              id="kpi-link-clientes-fiado"
              onClick={() => onChangeTab('clientes')}
              className="inline-flex items-center gap-0.5 text-xs font-bold text-rose-400 hover:underline"
            >
              Caderno <ArrowUpRight size={14} />
            </button>
          </div>
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-wide text-cream-400">
              Fiados (Caderno)
            </p>
            <h3 className="font-mono text-2xl font-bold leading-none tracking-tight text-cream-100">
              {renderMetric(formatCurrency(totalFiado))}
            </h3>
            <p className="mt-1.5 text-xs font-semibold leading-normal text-rose-400">
              Saldo pendente atual consolidado pela API.
            </p>
          </div>
        </div>

        <div
          id="kpi-card-estoque-baixo"
          className="flex flex-col justify-between rounded-2xl border border-counter-700 bg-counter-900 p-4"
        >
          <div className="mb-3 flex items-start justify-between">
            <div className="rounded-xl border border-gold-500/30 bg-gold-500/10 p-2.5 text-gold-400">
              <AlertTriangle size={24} />
            </div>
            <span
              className={`rounded px-2 py-1 text-xs font-extrabold uppercase ${
                lowStockProducts.length > 0
                  ? 'border border-gold-500/30 bg-gold-500/10 text-gold-400'
                  : 'bg-counter-800 text-cream-400'
              }`}
            >
              {renderMetric(`${lowStockProducts.length} Alertas`)}
            </span>
          </div>
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-wide text-cream-400">
              Estoque Baixo
            </p>
            <h3 className="font-mono text-2xl font-bold leading-none tracking-tight text-cream-100">
              {renderMetric(
                <>
                  {lowStockProducts.length}{' '}
                  <span className="text-sm font-normal text-cream-400">
                    itens
                  </span>
                </>,
              )}
            </h3>
            <p className="mt-1.5 text-xs leading-normal text-cream-400">
              Abaixo do estoque de segurança.
            </p>
          </div>
        </div>

        <div
          id="kpi-card-estoque-negativo"
          className="flex flex-col justify-between rounded-2xl border border-counter-700 bg-counter-900 p-4"
        >
          <div className="mb-3 flex items-start justify-between">
            <div className="rounded-xl border border-rose-400/30 bg-rose-400/10 p-2.5 text-rose-400">
              <XCircle size={24} />
            </div>
            <span
              className={`rounded px-2 py-1 text-xs font-extrabold uppercase ${
                negativeStockProducts.length > 0
                  ? 'border border-rose-400/30 bg-rose-400/10 text-rose-400'
                  : 'bg-counter-800 text-cream-400'
              }`}
            >
              {renderMetric(`${negativeStockProducts.length} Crítico`)}
            </span>
          </div>
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-wide text-cream-400">
              Estoque Negativo
            </p>
            <h3
              className={`font-mono text-2xl font-bold leading-none tracking-tight ${
                negativeStockProducts.length > 0
                  ? 'text-rose-400'
                  : 'text-cream-100'
              }`}
            >
              {renderMetric(
                <>
                  {negativeStockProducts.length}{' '}
                  <span className="text-sm font-normal text-cream-400">
                    itens
                  </span>
                </>,
              )}
            </h3>
            <p className="mt-1.5 text-xs leading-normal text-cream-400">
              Saídas forçadas sem reabastecer.
            </p>
          </div>
        </div>
      </div>

      <div
        id="dashboard-quick-actions-panel"
        className="rounded-2xl border border-counter-700 bg-counter-900 p-5"
      >
        <h3 className="mb-3.5 flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide text-cream-400">
          <Gauge size={19} className="text-gold-400" /> Atalhos Principais do
          Balcoista
        </h3>
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-6">
          <button
            id="quick-nav-abrir-caixa"
            onClick={() => onChangeTab('caixa')}
            className="flex flex-col items-center gap-2 rounded-xl border border-counter-700 bg-counter-800 p-4 text-center transition duration-150 hover:border-gold-500/50 hover:bg-counter-700"
          >
            <Unlock size={29} className="text-gold-400" />
            <span className="block text-sm font-bold text-cream-200">
              Abrir Caixa
            </span>
          </button>

          <button
            id="quick-nav-nova-comanda"
            onClick={() => onChangeTab('comandas')}
            className="flex flex-col items-center gap-2 rounded-xl border border-gold-500/40 bg-gold-500/10 p-4 text-center transition-all hover:bg-gold-500/20"
          >
            <PlusCircle size={29} className="text-gold-400" />
            <span className="block text-sm font-black text-gold-300">
              Nova Comanda
            </span>
          </button>

          <button
            id="quick-nav-ver-comandas"
            onClick={() => onChangeTab('comandas')}
            className="flex flex-col items-center gap-2 rounded-xl border border-counter-700 bg-counter-800 p-4 text-center transition duration-150 hover:border-gold-500/50 hover:bg-counter-700"
          >
            <ClipboardList size={29} className="text-orange-400" />
            <span className="block text-sm font-bold text-cream-200">
              Comandas Ativas
            </span>
          </button>

          <button
            id="quick-nav-lancar-estoque"
            onClick={() => onChangeTab('produtos')}
            className="flex flex-col items-center gap-2 rounded-xl border border-counter-700 bg-counter-800 p-4 text-center transition duration-150 hover:border-gold-500/50 hover:bg-counter-700"
          >
            <PackageOpen size={29} className="text-sky-400" />
            <span className="block text-sm font-bold text-cream-200">
              Lançar Estoque
            </span>
          </button>

          <button
            id="quick-nav-ver-fiados"
            onClick={() => onChangeTab('clientes')}
            className="flex flex-col items-center gap-2 rounded-xl border border-counter-700 bg-counter-800 p-4 text-center transition duration-150 hover:border-gold-500/50 hover:bg-counter-700"
          >
            <Users size={29} className="text-rose-400" />
            <span className="block text-sm font-bold text-cream-200">
              Ver Fiados
            </span>
          </button>

          <button
            id="quick-nav-ver-relatorios"
            onClick={() => onChangeTab('relatorios')}
            className="flex flex-col items-center gap-2 rounded-xl border border-counter-700 bg-counter-800 p-4 text-center transition duration-150 hover:border-gold-500/50 hover:bg-counter-700"
          >
            <TrendingUp size={29} className="text-sky-400" />
            <span className="block text-sm font-bold text-cream-200">
              Ver Relatórios
            </span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="space-y-5 lg:col-span-8">
          <div
            id="dashboard-ultimas-comandas"
            className="rounded-2xl border border-counter-700 bg-counter-900 p-5"
          >
            <div className="mb-4 flex items-center justify-between">
              <h4 className="flex items-center gap-2 font-display text-lg font-bold tracking-tight text-cream-100">
                <Clock size={22} className="text-gold-400" />
                Últimas Comandas
              </h4>
              <button
                id="btn-link-comandas"
                onClick={() => onChangeTab('comandas')}
                className="text-sm font-bold text-gold-400 hover:underline"
              >
                Gerir Comandas
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-counter-700 bg-counter-950 text-xs font-bold uppercase tracking-wide text-cream-400">
                    <th className="px-4 py-3">Identificação</th>
                    <th className="px-4 py-3 text-center">Itens</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-counter-800">
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
                        className="duration-100 hover:bg-counter-800"
                      >
                        <td className="px-4 py-3.5">
                          <div>
                            <span className="block text-sm font-bold text-cream-100">
                              {comanda.code}
                            </span>
                            {linkedCustomer ? (
                              <span className="text-xs font-semibold text-gold-400">
                                Cliente: {linkedCustomer.name}
                              </span>
                            ) : (
                              <span className="text-xs font-bold uppercase tracking-tight text-cream-400">
                                Consumo Geral
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className="rounded bg-counter-800 px-2 py-0.5 font-mono text-xs font-bold text-cream-200">
                            {comanda.items.length}{' '}
                            {comanda.items.length === 1 ? 'item' : 'itens'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono text-sm font-bold text-cream-100">
                          {formatCurrency(comandaTotal)}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          {comanda.status === 'active' ? (
                            <span className="rounded border border-gold-500/30 bg-gold-500/10 px-2 py-0.5 text-xs font-extrabold uppercase text-gold-400">
                              Consumindo
                            </span>
                          ) : (
                            <span className="rounded border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-xs font-extrabold uppercase text-emerald-400">
                              Paga
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <button
                            id={`btn-open-comanda-row-${comanda.id}`}
                            onClick={() => onChangeTab('comandas')}
                            className="rounded border border-counter-700 bg-counter-800 px-3 py-1.5 text-xs font-bold uppercase text-cream-300 transition hover:border-gold-500/50 hover:text-gold-300"
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
                        className="py-10 text-center italic text-cream-400"
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
            className="rounded-2xl border border-counter-700 bg-counter-900 p-5"
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h4 className="flex items-center gap-1.5 font-display text-lg font-bold tracking-tight text-cream-100">
                  <Sparkles size={22} className="text-gold-400" />
                  Ranking de Vendas
                </h4>
                <p className="mt-0.5 block text-xs leading-tight text-cream-400">
                  Produtos mais vendidos consolidados pelo backend para o dia
                  atual.
                </p>
              </div>
              <button
                id="btn-link-estoque-relatorios"
                onClick={() => onChangeTab('relatorios')}
                className="text-sm font-bold text-gold-400 hover:underline"
              >
                Relatórios
              </button>
            </div>

            <div className="space-y-3 pt-1.5">
              {isLoading && (
                <div className="rounded-xl border border-counter-700 bg-counter-800 p-4 text-sm text-cream-400">
                  Carregando ranking de vendas...
                </div>
              )}

              {!isLoading && !error && bestSellersList.length === 0 && (
                <div className="rounded-xl border border-counter-700 bg-counter-800 p-4 text-sm text-cream-400">
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
                      className="space-y-2 rounded-xl border border-counter-700 bg-counter-800 p-3.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gold-500/15 text-xs font-extrabold text-gold-400">
                            #{index + 1}
                          </span>
                          <div>
                            <span className="block text-sm font-bold text-cream-100">
                              {item.name}
                            </span>
                            <span className="text-xs font-bold uppercase tracking-wide text-cream-400">
                              {item.category}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="block font-mono text-sm font-extrabold text-cream-100">
                            {item.quantity} saídas
                          </span>
                          <span className="font-mono text-xs font-semibold text-gold-400">
                            {formatCurrency(item.total)} total
                          </span>
                        </div>
                      </div>

                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-counter-950">
                        <div
                          className="h-full rounded-full bg-gold-500 transition-all duration-300"
                          style={{ width: `${widthPercent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        <div className="space-y-5 lg:col-span-4">
          <div
            id="dashboard-alertas-operacionais"
            className="flex h-full flex-col justify-between rounded-2xl border border-counter-700 bg-counter-900 p-5"
          >
            <div>
              <div className="mb-4 flex items-center gap-2">
                <AlertTriangle size={24} className="shrink-0 text-gold-400" />
                <h4 className="font-display text-lg font-bold text-cream-100">
                  Alertas Operacionais
                </h4>
              </div>

              <div className="max-h-[460px] space-y-3 overflow-y-auto pr-1">
                {!caixa.isOpen && (
                  <div
                    id="alert-box-caixa-fechado"
                    className="flex items-start gap-2.5 rounded-xl border border-rose-400/30 bg-rose-400/10 p-3.5 text-sm font-medium text-rose-300"
                  >
                    <Lock size={22} className="mt-0.5 shrink-0 text-rose-400" />
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
                    className="flex items-start gap-2.5 rounded-xl border border-rose-400/30 bg-rose-400/10 p-3.5 text-sm font-medium text-rose-300"
                  >
                    <AlertTriangle
                      size={22}
                      className="mt-0.5 shrink-0 text-rose-400"
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
                    className="flex items-start gap-2.5 rounded-xl border border-gold-500/30 bg-gold-500/10 p-3.5 text-sm font-medium text-gold-300"
                  >
                    <AlertTriangle
                      size={22}
                      className="mt-0.5 shrink-0 text-gold-400"
                    />
                    <div>
                      <span className="mb-0.5 block font-bold text-gold-300">
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
                  className="flex items-start gap-2.5 rounded-xl border border-gold-500/30 bg-gold-500/10 p-3.5 text-sm leading-relaxed text-gold-300"
                >
                  <HelpCircle
                    size={22}
                    className="mt-0.5 shrink-0 text-gold-400"
                  />
                  <div>
                    <span className="mb-0.5 block font-bold text-gold-200">
                      Dica de Atendimento
                    </span>
                    Vincule o cadastro dos fregueses nas comandas para facilitar
                    o fechamento em fiado no fim do consumo.
                  </div>
                </div>

                <div className="space-y-2.5 rounded-xl border border-counter-700 bg-counter-800 p-4">
                  <span className="block text-xs font-bold uppercase tracking-wide text-cream-400">
                    Boas práticas do balcão:
                  </span>
                  <ul className="space-y-1.5 text-sm leading-tight text-cream-300">
                    <li className="flex gap-1.5">
                      <span className="font-bold text-gold-400">•</span>
                      <span>
                        Contar cédulas da gaveta antes de fechar o dia físico.
                      </span>
                    </li>
                    <li className="flex gap-1.5">
                      <span className="font-bold text-gold-400">•</span>
                      <span>
                        Cadastrar o telefone do fiador no caderno virtual.
                      </span>
                    </li>
                    <li className="flex gap-1.5">
                      <span className="font-bold text-gold-400">•</span>
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
              onClick={() => onChangeTab('produtos')}
              className="mt-5 block w-full rounded-xl border border-counter-700 bg-counter-800 py-3 text-center text-sm font-bold uppercase tracking-wide text-cream-300 transition-all hover:border-gold-500/50 hover:text-gold-300"
            >
              Controlar Estoque Completo →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
