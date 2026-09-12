/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Product, Comanda, Customer, Cashier } from '../types';
import {
  CalendarDays,
  ClipboardList,
  Box,
  TrendingUp,
  CircleDollarSign,
  AlertOctagon,
} from 'lucide-react';
import {
  fetchDailyReport,
  fetchBestSellingProducts,
  fetchFiadosReport,
  fetchStockReport,
  fetchConsumedStockReport,
  fetchCommandasReport,
} from '../features/relatorios/services/relatoriosService';
import type {
  DailyReport,
  BestSellingProduct,
  FiadoReportItem,
  StockReportItem,
  ConsumedStockReportItem,
  CommandaReportItem,
} from '../features/relatorios/types';
import { InlineFeedback } from '../features/shared/components/InlineFeedback';
import { getApiErrorMessage } from '../features/shared/utils/getApiErrorMessage';

type TabType =
  | 'diario'
  | 'produtos'
  | 'fiados'
  | 'estoque'
  | 'consumido'
  | 'comandas';

interface RelatoriosProps {
  products: Product[];
  comandas: Comanda[];
  customers: Customer[];
  caixa: Cashier;
}

export default function Relatorios({
  products: _products,
  comandas: _comandas,
  customers: _customers,
  caixa: _caixa,
}: RelatoriosProps) {
  const [activeTab, setActiveTab] = useState<TabType>('diario');
  const [period, setPeriod] = useState<string>('hoje');

  // States for API data
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dailyReport, setDailyReport] = useState<DailyReport | null>(null);
  const [bestSelling, setBestSelling] = useState<BestSellingProduct[]>([]);
  const [fiados, setFiados] = useState<FiadoReportItem[]>([]);
  const [stock, setStock] = useState<StockReportItem[]>([]);
  const [consumedStock, setConsumedStock] = useState<ConsumedStockReportItem[]>(
    [],
  );
  const [commandasReport, setCommandasReport] = useState<CommandaReportItem[]>(
    [],
  );

  // Helper formatting
  const fmt = (v: number | undefined | null) =>
    `R$ ${(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const renderEmptyState = (message: string) => (
    <div className="rounded-2xl border border-counter-700 bg-counter-900 py-12 text-center">
      <AlertOctagon size={48} className="mx-auto mb-4 text-cream-400" />
      <h3 className="text-sm font-bold text-cream-200">Relatório Vazio</h3>
      <p className="mt-1 text-sm text-cream-400">{message}</p>
    </div>
  );

  const getPeriodFilter = () => {
    const today = new Date();
    let dataInicio: string | undefined = undefined;
    let dataFim: string | undefined = undefined;
    let data: string | undefined = undefined;

    const formatDate = (d: Date) => {
      const offset = d.getTimezoneOffset();
      const adjusted = new Date(d.getTime() - offset * 60 * 1000);
      return adjusted.toISOString().split('T')[0];
    };

    if (period === 'hoje') {
      dataInicio = formatDate(today);
      dataFim = formatDate(today);
      data = formatDate(today);
    } else if (period === 'ontem') {
      const ontem = new Date(today);
      ontem.setDate(ontem.getDate() - 1);
      dataInicio = formatDate(ontem);
      dataFim = formatDate(ontem);
      data = formatDate(ontem);
    } else if (period === '7d') {
      const start = new Date(today);
      start.setDate(start.getDate() - 7);
      dataInicio = formatDate(start);
      dataFim = formatDate(today);
    } else if (period === '30d') {
      const start = new Date(today);
      start.setDate(start.getDate() - 30);
      dataInicio = formatDate(start);
      dataFim = formatDate(today);
    }

    return { dataInicio, dataFim, data };
  };

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const { dataInicio, dataFim, data } = getPeriodFilter();

        if (activeTab === 'diario') {
          const res = await fetchDailyReport(data);
          setDailyReport(res);
        } else if (activeTab === 'produtos') {
          const res = await fetchBestSellingProducts({ dataInicio, dataFim });
          setBestSelling(res);
        } else if (activeTab === 'fiados') {
          const res = await fetchFiadosReport({ dataInicio, dataFim });
          setFiados(res);
        } else if (activeTab === 'estoque') {
          const res = await fetchStockReport();
          setStock(res);
        } else if (activeTab === 'consumido') {
          const res = await fetchConsumedStockReport({ dataInicio, dataFim });
          setConsumedStock(res);
        } else if (activeTab === 'comandas') {
          const res = await fetchCommandasReport({ dataInicio, dataFim });
          setCommandasReport(res);
        }
      } catch (e) {
        setError(
          getApiErrorMessage(e, 'Não foi possível carregar este relatório.'),
        );
      } finally {
        setLoading(false);
      }
    }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, period]);

  // 1. DIÁRIO
  const renderDiario = () => {
    if (loading) return <div className="text-cream-400">Carregando...</div>;
    if (!dailyReport)
      return renderEmptyState('Não há dados para a data informada.');

    const tableData = [
      {
        label: 'Vendas Brutas (Din + Pix + Cartão)',
        value:
          (dailyReport.payments.dinheiro || 0) +
          (dailyReport.payments.pix || 0) +
          (dailyReport.payments.cartao || 0),
      },
      { label: 'Fiado Gerado', value: dailyReport.totalFiadoGenerated || 0 },
      { label: 'Dinheiro', value: dailyReport.payments.dinheiro || 0 },
      { label: 'Pix', value: dailyReport.payments.pix || 0 },
      { label: 'Cartão', value: dailyReport.payments.cartao || 0 },
    ];

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-gold-500/30 bg-gold-500/10 p-5">
            <div className="text-xs font-bold uppercase text-gold-400">
              Total Vendido
            </div>
            <div className="mt-1 font-mono text-2xl font-black text-gold-300">
              {fmt(dailyReport.totalSold)}
            </div>
          </div>
          <div className="rounded-2xl border border-sky-400/30 bg-sky-400/10 p-5">
            <div className="text-xs font-bold uppercase text-sky-400">
              Total Recebido
            </div>
            <div className="mt-1 font-mono text-2xl font-black text-sky-300">
              {fmt(dailyReport.totalReceived)}
            </div>
          </div>
        </div>
        <div className="overflow-hidden rounded-2xl border border-counter-700 bg-counter-900">
          <table className="w-full text-left">
            <thead className="border-b border-counter-700 bg-counter-950 text-xs font-bold uppercase tracking-wide text-cream-400">
              <tr>
                <th className="px-5 py-3">Indicador</th>
                <th className="px-5 py-3 text-right">Valor R$</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-counter-800">
              {tableData.map((m, i) => (
                <tr key={i} className="hover:bg-counter-800">
                  <td className="px-5 py-3.5 font-bold text-cream-200">
                    {m.label}
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono font-bold text-cream-100">
                    {fmt(m.value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // 3. PRODUTOS (Mais Vendidos)
  const renderProdutos = () => {
    if (loading) return <div className="text-cream-400">Carregando...</div>;
    if (bestSelling.length === 0)
      return renderEmptyState(
        'Nenhum produto foi vendido no período selecionado.',
      );

    return (
      <div className="overflow-hidden rounded-2xl border border-counter-700 bg-counter-900">
        <table className="w-full text-left">
          <thead className="border-b border-counter-700 bg-counter-950 text-xs font-bold uppercase tracking-wide text-cream-400">
            <tr>
              <th className="px-5 py-3">Produto</th>
              <th className="px-5 py-3">Categoria</th>
              <th className="px-5 py-3 text-right">Qtd. Vendida</th>
              <th className="px-5 py-3 text-right">Valor Gerado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-counter-800">
            {bestSelling.map((p, i) => (
              <tr key={i} className="hover:bg-counter-800">
                <td className="px-5 py-3.5 font-bold text-cream-100">
                  {p.name}
                </td>
                <td className="px-5 py-3.5 text-xs uppercase text-cream-400">
                  {p.category || '---'}
                </td>
                <td className="px-5 py-3.5 text-right font-mono font-black text-gold-400">
                  {p.quantity}
                </td>
                <td className="px-5 py-3.5 text-right font-mono font-bold text-cream-300">
                  {fmt(p.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // 4. FIADOS (Dívidas)
  const renderFiados = () => {
    if (loading) return <div className="text-cream-400">Carregando...</div>;
    if (fiados.length === 0)
      return renderEmptyState('Não há fiados para exibir neste período.');

    return (
      <div className="overflow-hidden rounded-2xl border border-counter-700 bg-counter-900">
        <table className="w-full text-left">
          <thead className="border-b border-counter-700 bg-counter-950 text-xs font-bold uppercase tracking-wide text-cream-400">
            <tr>
              <th className="px-5 py-3">Data</th>
              <th className="px-5 py-3">Cliente</th>
              <th className="px-5 py-3 text-center">Status</th>
              <th className="px-5 py-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-counter-800">
            {fiados.map((c, i) => (
              <tr key={i} className="hover:bg-counter-800">
                <td className="px-5 py-3.5 font-mono text-xs text-cream-400">
                  {c.pendenteEm
                    ? new Date(c.pendenteEm).toLocaleDateString()
                    : '-'}
                </td>
                <td className="px-5 py-3.5 font-bold text-cream-100">
                  {c.customerName || 'Não identificado'}
                </td>
                <td className="flex items-center justify-center gap-1 px-5 py-3.5">
                  <span className="rounded border border-gold-500/30 bg-gold-500/10 px-2 py-0.5 text-xs font-bold uppercase text-gold-400">
                    PENDENTE
                  </span>
                  {c.overdue && (
                    <span className="rounded border border-rose-400/30 bg-rose-400/10 px-2 py-0.5 text-xs font-bold uppercase text-rose-400">
                      Vencido
                    </span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-right font-mono font-black text-rose-400">
                  {fmt(c.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // 5. ESTOQUE
  const renderEstoque = () => {
    if (loading) return <div className="text-cream-400">Carregando...</div>;
    if (stock.length === 0)
      return renderEmptyState(
        'Todos os produtos estão com estoque normal e acima do mínimo.',
      );

    return (
      <div className="overflow-hidden rounded-2xl border border-counter-700 bg-counter-900">
        <table className="w-full text-left">
          <thead className="border-b border-counter-700 bg-counter-950 text-xs font-bold uppercase tracking-wide text-cream-400">
            <tr>
              <th className="px-5 py-3">Insumo / Físico</th>
              <th className="px-5 py-3 text-center">Unidade</th>
              <th className="px-5 py-3 text-center">Mínimo</th>
              <th className="px-5 py-3 text-right">Saldo Atual</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-counter-800">
            {stock.map((p, i) => (
              <tr key={i} className="bg-gold-500/5 hover:bg-gold-500/10">
                <td className="px-5 py-3.5 font-bold text-cream-100">
                  {p.productName}
                </td>
                <td className="px-5 py-3.5 text-center font-mono uppercase text-cream-400">
                  {p.unit}
                </td>
                <td className="px-5 py-3.5 text-center font-mono text-cream-400">
                  {p.minStock}
                </td>
                <td className="px-5 py-3.5 text-right font-mono font-black text-rose-400">
                  {p.stock}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // 6. ESTOQUE CONSUMIDO
  const renderEstoqueConsumido = () => {
    if (loading) return <div className="text-cream-400">Carregando...</div>;
    if (consumedStock.length === 0)
      return renderEmptyState(
        'Nenhum item consumido do estoque físico no período.',
      );

    return (
      <div className="overflow-hidden rounded-2xl border border-counter-700 bg-counter-900">
        <table className="w-full text-left">
          <thead className="border-b border-counter-700 bg-counter-950 text-xs font-bold uppercase tracking-wide text-cream-400">
            <tr>
              <th className="px-5 py-3">Insumo Físico Baixado</th>
              <th className="px-5 py-3 text-center">Unidade</th>
              <th className="px-5 py-3 text-right">Qtd Consumida (Soma)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-counter-800">
            {consumedStock.map((entry, i) => (
              <tr key={i} className="hover:bg-counter-800">
                <td className="px-5 py-3.5 font-bold text-cream-100">
                  {entry.productName}
                </td>
                <td className="px-5 py-3.5 text-center font-mono uppercase text-cream-400">
                  {entry.unit}
                </td>
                <td className="px-5 py-3.5 text-right font-mono font-black text-rose-400">
                  {entry.consumed}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // 7. COMANDAS
  const renderComandas = () => {
    if (loading) return <div className="text-cream-400">Carregando...</div>;
    if (commandasReport.length === 0)
      return renderEmptyState('Nenhuma comanda encontrada no período.');

    return (
      <div className="overflow-hidden rounded-2xl border border-counter-700 bg-counter-900">
        <table className="w-full text-left">
          <thead className="border-b border-counter-700 bg-counter-950 text-xs font-bold uppercase tracking-wide text-cream-400">
            <tr>
              <th className="px-5 py-3 text-center">Status</th>
              <th className="px-5 py-3 text-center">Quantidade</th>
              <th className="px-5 py-3 text-right">Total Fechado (R$)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-counter-800">
            {commandasReport.map((c, i) => {
              let badge = '';
              if (c.status === 'ABERTA')
                badge = 'border-gold-500/30 bg-gold-500/10 text-gold-400';
              if (c.status === 'FECHADA')
                badge =
                  'border-emerald-400/30 bg-emerald-400/10 text-emerald-400';
              if (c.status === 'CANCELADA')
                badge = 'border-rose-400/30 bg-rose-400/10 text-rose-400';
              if (c.status === 'PENDENTE')
                badge = 'border-sky-400/30 bg-sky-400/10 text-sky-400';

              return (
                <tr key={i} className="hover:bg-counter-800">
                  <td className="px-5 py-3.5 text-center">
                    <span
                      className={`rounded border px-2 py-0.5 text-xs font-bold uppercase ${badge}`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-center font-bold text-cream-300">
                    {c.quantity}
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono font-bold text-cream-100">
                    {fmt(c.total)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const tabs = [
    { id: 'diario', label: 'Diário Operacional', icon: CalendarDays },
    { id: 'produtos', label: 'Produtos Vendidos', icon: TrendingUp },
    { id: 'consumido', label: 'Estoque Consumido', icon: Box },
    { id: 'fiados', label: 'Inadimplência / Fiados', icon: CircleDollarSign },
    { id: 'estoque', label: 'Alerta de Estoque', icon: AlertOctagon },
    { id: 'comandas', label: 'Comandas', icon: ClipboardList },
  ] as const;

  return (
    <div id="relatorios-module" className="space-y-5 pb-10">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <span className="mb-1 block text-xs font-bold text-gold-400">
            Módulo Gerencial
          </span>
          <h2 className="font-display text-3xl font-bold tracking-tight text-cream-100">
            Relatórios <span className="text-gold-400">& Gestão</span>
          </h2>
        </div>

        <div className="flex w-full items-center overflow-hidden rounded-xl border border-counter-700 bg-counter-900 sm:w-auto">
          <div className="flex h-full items-center border-r border-counter-700 bg-counter-950 px-3 text-xs font-bold uppercase text-cream-400">
            Período:
          </div>
          <select
            className="cursor-pointer bg-counter-900 px-3 py-2.5 text-sm font-bold text-cream-200 outline-none"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option value="hoje">Hoje</option>
            <option value="ontem">Ontem</option>
            <option value="7d">Últimos 7 Dias</option>
            <option value="30d">Últimos 30 Dias</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as TabType)}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2.5 text-sm font-bold transition ${activeTab === t.id ? 'bg-gold-500 text-counter-950 shadow-md' : 'border border-counter-700 bg-counter-900 text-cream-300 hover:bg-counter-800'}`}
          >
            <t.icon size={19} />
            {t.label}
          </button>
        ))}
      </div>

      {error && <InlineFeedback tone="error" message={error} />}

      <div className="pt-2">
        {!error && activeTab === 'diario' && renderDiario()}
        {!error && activeTab === 'produtos' && renderProdutos()}
        {!error && activeTab === 'fiados' && renderFiados()}
        {!error && activeTab === 'estoque' && renderEstoque()}
        {!error && activeTab === 'consumido' && renderEstoqueConsumido()}
        {!error && activeTab === 'comandas' && renderComandas()}
      </div>
    </div>
  );
}
