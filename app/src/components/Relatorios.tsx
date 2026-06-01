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

interface RelatoriosProps {
  products: Product[];
  comandas: Comanda[];
  customers: Customer[];
  caixa: Cashier;
}

type TabType =
  | 'diario'
  | 'produtos'
  | 'fiados'
  | 'estoque'
  | 'consumido'
  | 'comandas';

export default function Relatorios({
  products,
  comandas,
  customers,
  caixa,
}: RelatoriosProps) {
  const [activeTab, setActiveTab] = useState<TabType>('diario');
  const [period, setPeriod] = useState<string>('hoje');

  // States for API data
  const [loading, setLoading] = useState(false);
  const [dailyReport, setDailyReport] = useState<DailyReport | null>(null);
  const [bestSelling, setBestSelling] = useState<BestSellingProduct[]>([]);
  const [fiados, setFiados] = useState<FiadoReportItem[]>([]);
  const [stock, setStock] = useState<StockReportItem[]>([]);
  const [consumedStock, setConsumedStock] = useState<ConsumedStockReportItem[]>([]);
  const [commandasReport, setCommandasReport] = useState<CommandaReportItem[]>([]);

  // Helper formatting
  const fmt = (v: number | undefined | null) =>
    `R$ ${(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const renderEmptyState = (message: string) => (
    <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-2xl shadow-sm">
      <AlertOctagon size={40} className="mx-auto text-slate-300 mb-4" />
      <h3 className="text-sm font-bold text-slate-300">Relatório Vazio</h3>
      <p className="text-xs text-slate-500 mt-1">{message}</p>
    </div>
  );

  const getPeriodFilter = () => {
    const today = new Date();
    let dataInicio: string | undefined = undefined;
    let dataFim: string | undefined = undefined;
    let data: string | undefined = undefined;

    const formatDate = (d: Date) => {
      const offset = d.getTimezoneOffset();
      const adjusted = new Date(d.getTime() - (offset*60*1000));
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
        console.error('Failed to load report data', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [activeTab, period]);
  
  // 1. DIÁRIO
  const renderDiario = () => {
    if (loading) return <div className="text-slate-400">Carregando...</div>;
    if (!dailyReport) return renderEmptyState('Não há dados para a data informada.');

    const tableData = [
      { label: 'Vendas Brutas (Din + Pix + Cartão)', value: (dailyReport.payments.dinheiro || 0) + (dailyReport.payments.pix || 0) + (dailyReport.payments.cartao || 0) },
      { label: 'Fiado Gerado', value: dailyReport.totalFiadoGenerated || 0 },
      { label: 'Dinheiro', value: dailyReport.payments.dinheiro || 0 },
      { label: 'Pix', value: dailyReport.payments.pix || 0 },
      { label: 'Cartão', value: dailyReport.payments.cartao || 0 },
    ];

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-emerald-950/40 border border-emerald-800/60 p-5 rounded-2xl shadow-sm">
            <div className="text-[10px] uppercase font-mono font-bold text-emerald-500">
              Total Vendido
            </div>
            <div className="text-2xl font-black font-mono text-emerald-400 mt-1">
              {fmt(dailyReport.totalSold)}
            </div>
          </div>
          <div className="bg-blue-950/40 border border-blue-800/60 p-5 rounded-2xl shadow-sm">
            <div className="text-[10px] uppercase font-mono font-bold text-blue-500">
              Total Recebido
            </div>
            <div className="text-2xl font-black font-mono text-blue-400 mt-1">
              {fmt(dailyReport.totalReceived)}
            </div>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/50 border-b border-slate-800 uppercase font-mono text-[10px] tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3">Indicador</th>
                <th className="px-5 py-3 text-right">Valor R$</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tableData.map((m, i) => (
                <tr key={i} className="hover:bg-slate-800/50">
                  <td className="px-5 py-3 font-bold text-slate-300">
                    {m.label}
                  </td>
                  <td className="px-5 py-3 text-right font-mono font-bold text-slate-50">
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
    if (loading) return <div className="text-slate-400">Carregando...</div>;
    if (bestSelling.length === 0)
      return renderEmptyState('Nenhum produto foi vendido no período selecionado.');

    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-800/50 border-b border-slate-800 uppercase font-mono text-[10px] tracking-wider text-slate-500">
            <tr>
              <th className="px-5 py-3">Produto</th>
              <th className="px-5 py-3">Categoria</th>
              <th className="px-5 py-3 text-right">Qtd. Vendida</th>
              <th className="px-5 py-3 text-right">Valor Gerado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {bestSelling.map((p, i) => (
              <tr key={i} className="hover:bg-slate-800/50">
                <td className="px-5 py-3 font-bold text-slate-200">{p.name}</td>
                <td className="px-5 py-3 uppercase text-[10px] text-slate-500 font-mono">
                  {p.category || "---"}
                </td>
                <td className="px-5 py-3 text-right font-mono font-black text-emerald-400">
                  {p.quantity}
                </td>
                <td className="px-5 py-3 text-right font-mono text-slate-500 font-bold">
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
    if (loading) return <div className="text-slate-400">Carregando...</div>;
    if (fiados.length === 0)
      return renderEmptyState('Não há fiados para exibir neste período.');

    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-800/50 border-b border-slate-800 uppercase font-mono text-[10px] tracking-wider text-slate-500">
            <tr>
              <th className="px-5 py-3">Data</th>
              <th className="px-5 py-3">Cliente</th>
              <th className="px-5 py-3 text-center">Status</th>
              <th className="px-5 py-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {fiados.map((c, i) => (
              <tr key={i} className="hover:bg-slate-800/50">
                <td className="px-5 py-3 font-mono text-[10px] text-slate-400">
                  {new Date(c.openedAt).toLocaleDateString()}
                </td>
                <td className="px-5 py-3 font-bold text-slate-200">
                  {c.customerName || 'Não identificado'}
                </td>
                <td className="px-5 py-3 gap-1 flex items-center justify-center">
                  <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold font-mono border ${c.status === 'FECHADA' ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60' : 'bg-amber-950/40 text-amber-400 border-amber-800/60'}`}>
                    {c.status}
                  </span>
                  {c.overdue && <span className="px-2 py-0.5 rounded text-[9px] uppercase font-bold font-mono border bg-rose-950/40 text-rose-400 border-rose-800/60">Vencido</span>}
                </td>
                <td className="px-5 py-3 text-right font-mono font-black text-rose-500">
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
    if (loading) return <div className="text-slate-400">Carregando...</div>;
    if (stock.length === 0)
      return renderEmptyState('Todos os produtos estão com estoque normal e acima do mínimo.');

    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-800/50 border-b border-slate-800 uppercase font-mono text-[10px] tracking-wider text-slate-500">
            <tr>
              <th className="px-5 py-3">Insumo / Físico</th>
              <th className="px-5 py-3 text-center">Unidade</th>
              <th className="px-5 py-3 text-center">Mínimo</th>
              <th className="px-5 py-3 text-right">Saldo Atual</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {stock.map((p, i) => (
              <tr key={i} className="hover:bg-slate-800/50 bg-amber-950/40/20">
                <td className="px-5 py-3 font-bold text-slate-200">{p.productName}</td>
                <td className="px-5 py-3 text-center font-mono text-slate-500 uppercase">{p.unit}</td>
                <td className="px-5 py-3 text-center font-mono text-slate-500">{p.minStock}</td>
                <td className="px-5 py-3 text-right font-mono font-black text-rose-500">{p.stock}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // 6. ESTOQUE CONSUMIDO
  const renderEstoqueConsumido = () => {
    if (loading) return <div className="text-slate-400">Carregando...</div>;
    if (consumedStock.length === 0)
      return renderEmptyState('Nenhum item consumido do estoque físico no período.');

    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-800/50 border-b border-slate-800 uppercase font-mono text-[10px] tracking-wider text-slate-500">
            <tr>
              <th className="px-5 py-3">Insumo Físico Baixado</th>
              <th className="px-5 py-3 text-center">Unidade</th>
              <th className="px-5 py-3 text-right">Qtd Consumida (Soma)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {consumedStock.map((entry, i) => (
              <tr key={i} className="hover:bg-slate-800/50">
                <td className="px-5 py-3 font-bold text-slate-200">{entry.productName}</td>
                <td className="px-5 py-3 text-center font-mono text-slate-500 uppercase">{entry.unit}</td>
                <td className="px-5 py-3 text-right font-mono font-black text-rose-500">{entry.consumed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // 7. COMANDAS
  const renderComandas = () => {
    if (loading) return <div className="text-slate-400">Carregando...</div>;
    if (commandasReport.length === 0)
      return renderEmptyState('Nenhuma comanda encontrada no período.');

    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-800/50 border-b border-slate-800 uppercase font-mono text-[10px] tracking-wider text-slate-500">
            <tr>
              <th className="px-5 py-3 text-center">Status</th>
              <th className="px-5 py-3 text-center">Quantidade</th>
              <th className="px-5 py-3 text-right">Total Fechado (R$)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {commandasReport.map((c, i) => {
              let badge = '';
              if (c.status === 'ABERTA')
                badge = 'bg-amber-950/40 text-amber-400 border-amber-800/60';
              if (c.status === 'FECHADA')
                badge = 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60';
              if (c.status === 'CANCELADA')
                badge = 'bg-rose-950/40 text-rose-400 border-rose-800/60';
              if (c.status === 'PENDENTE')
                badge = 'bg-blue-950/40 text-blue-400 border-blue-800/60';

              return (
                <tr key={i} className="hover:bg-slate-800/50">
                  <td className="px-5 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold font-mono border ${badge}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-center text-slate-500 font-bold">
                    {c.quantity}
                  </td>
                  <td className="px-5 py-3 text-right font-mono font-bold text-slate-200">
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
    <div id="relatorios-module" className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest font-mono text-blue-500 font-bold block mb-1">
            Módulo Gerencial
          </span>
          <h2 className="text-3xl font-display font-bold text-slate-50 tracking-tight">
            Relatórios <span className="text-blue-500">& Gestão</span>
          </h2>
        </div>

        <div className="w-full sm:w-auto flex items-center bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="px-3 text-slate-500 bg-slate-800/50 h-full flex items-center border-r border-slate-800 text-[10px] font-mono font-bold uppercase">
            Período:
          </div>
          <select
            className="px-3 py-2 text-xs font-bold text-slate-300 bg-slate-900 outline-none cursor-pointer"
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
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${activeTab === t.id ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-900 border border-slate-800 text-slate-500 hover:bg-slate-800/50'}`}
          >
            <t.icon size={14} />
            {t.label}
          </button>
        ))}
      </div>

      <div className="pt-2">
        {activeTab === 'diario' && renderDiario()}
        {activeTab === 'produtos' && renderProdutos()}
        {activeTab === 'fiados' && renderFiados()}
        {activeTab === 'estoque' && renderEstoque()}
        {activeTab === 'consumido' && renderEstoqueConsumido()}
        {activeTab === 'comandas' && renderComandas()}
      </div>
    </div>
  );
}
