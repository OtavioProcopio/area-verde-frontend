/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Product, Customer, Comanda, Cashier } from '../types';
import { 
  DollarSign, 
  Users, 
  ClipboardList, 
  AlertTriangle, 
  TrendingUp, 
  PlusCircle, 
  ArrowUpRight, 
  ArrowDownRight,
  Sparkles,
  Calendar,
  Lock,
  Unlock,
  PackageOpen,
  XCircle,
  HelpCircle,
  Clock,
  ChevronRight,
  Gauge
} from 'lucide-react';

interface DashboardProps {
  products: Product[];
  customers: Customer[];
  comandas: Comanda[];
  caixa: Cashier;
  onChangeTab: (tab: string) => void;
  onOpenCaixaTrigger: () => void;
}

export default function Dashboard({ 
  products, 
  customers, 
  comandas, 
  caixa, 
  onChangeTab,
  onOpenCaixaTrigger
}: DashboardProps) {
  
  // Calculate active statistics
  const activeComandas = comandas.filter(c => c.status === 'active');
  const activeComandasSum = activeComandas.reduce((sum, c) => {
    const itemsTotal = c.items.reduce((itemSum, item) => itemSum + (item.price * item.quantity), 0);
    return sum + (itemsTotal - c.discount + c.addition);
  }, 0);

  const totalFiado = customers.reduce((sum, c) => sum + c.balance, 0);

  // Stock alerts (segregating negative from low stock)
  const negativeStockProducts = products.filter(p => !p.isComposite && p.stock < 0);
  const lowStockProducts = products.filter(p => !p.isComposite && p.stock >= 0 && p.stock <= p.minStock);

  // Sales Today computed from cashier logs
  const salesToday = caixa.logs
    .filter(log => log.type === 'venda' || log.type === 'recebimento_fiado')
    .reduce((sum, log) => sum + log.amount, 0);

  // Dynamically calculate best seller quantities based on items in comandas
  const productSalesMap: Record<string, { id: string; name: string; category: string; quantity: number; revenue: number }> = {};
  
  // Seed with solid initial data so that the dashboard doesn't start blank before first comanda payment
  const defaultBestSellers = [
    { id: 'cerveja-heineken-ln', name: 'Heineken Long Neck', category: 'Cervejas', quantity: 24, revenue: 288.00 },
    { id: 'porcao-batata-frita', name: 'Batata Frita Especial', category: 'Porções', quantity: 12, revenue: 456.00 },
    { id: 'cerveja-skol-litrao', name: 'Skol Litrão', category: 'Cervejas', quantity: 18, revenue: 198.00 },
    { id: 'dose-caipirinha', name: 'Caipirinha Tradicional', category: 'Destilados', quantity: 15, revenue: 240.00 },
    { id: 'salgado-pastel-carne', name: 'Pastel de Carne de Feira', category: 'Salgados', quantity: 14, revenue: 112.00 }
  ];

  comandas.forEach(c => {
    c.items.forEach(item => {
      if (!productSalesMap[item.productId]) {
        productSalesMap[item.productId] = {
          id: item.productId,
          name: item.productName,
          category: products.find(p => p.id === item.productId)?.category || 'Vendas',
          quantity: 0,
          revenue: 0
        };
      }
      productSalesMap[item.productId].quantity += item.quantity;
      productSalesMap[item.productId].revenue += (item.price * item.quantity);
    });
  });

  const sortedActualSellers = Object.values(productSalesMap).sort((a, b) => b.quantity - a.quantity);
  const bestSellersList = sortedActualSellers.length > 0 ? sortedActualSellers.slice(0, 5) : defaultBestSellers;

  // Format currency
  const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div id="dashboard-module" className="space-y-6 animate-fade-in text-slate-200">
      
      {/* Dynamic Header Badge Block */}
      <div id="dashboard-header-block" className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-slate-500 text-xs font-mono mb-1.5 font-bold">
            <Calendar size={13} className="text-emerald-500 animate-pulse" />
            <span>Sábado, 30 de Maio de 2026</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-950/400"></span>
            <span className="text-emerald-400 uppercase tracking-wider text-[9px] font-extrabold">Operação de Balcão</span>
          </div>
          <h2 className="text-3xl font-display font-bold text-slate-50 tracking-tight">
            Dashboard <span className="text-emerald-500">Operacional</span>
          </h2>
        </div>

        {/* Real-time cashier dynamic fast status */}
        <div id="dashboard-cashier-widget" className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-[10px] uppercase font-mono text-slate-500 block font-bold mb-1">Status do Caixa</span>
            {caixa.isOpen ? (
              <span id="badge-caixa-aberto" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-950/40 border border-emerald-250 text-emerald-755 text-xs font-bold font-mono">
                <Unlock size={12} className="text-emerald-500" />
                ABERTO • Gaveta: {fmt(caixa.currentCashInMoney)}
              </span>
            ) : (
              <button 
                id="btn-trigger-quick-open"
                onClick={onOpenCaixaTrigger}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-rose-600 hover:bg-rose-950/400 text-white text-xs font-bold shadow-lg shadow-rose-500/15 cursor-pointer transition-all duration-150 animate-pulse"
              >
                <Lock size={12} />
                CAIXA FECHADO - ABRIR S.O.
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bento Grid: 6 Key Operational Cards (Caixa status, Total sales, Comandas, Outstanding fiados, Low stock, Negative stock) */}
      <div id="dashboard-kpi-bento-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        
        {/* Card 1: Status do Caixa */}
        <div id="kpi-card-caixa-status" className="bg-slate-900 rounded-2xl border border-slate-800 p-4.5 flex flex-col justify-between shadow-xs">
          <div className="flex justify-between items-start mb-3">
            <div className={`p-2.5 rounded-xl border ${caixa.isOpen ? 'bg-emerald-950/40 border-emerald-900 text-emerald-500' : 'bg-rose-950/40 border-rose-900 text-rose-500'}`}>
              <DollarSign size={18} />
            </div>
            <span className={`text-[9px] font-mono font-extrabold uppercase px-1.5 py-0.5 rounded ${
              caixa.isOpen ? 'bg-emerald-950/40 border border-emerald-800/60 text-emerald-400' : 'bg-rose-950/40 border border-rose-800/60 text-rose-500'
            }`}>
              {caixa.isOpen ? 'Aberto' : 'Fechado'}
            </span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Caixa Dinheiro</p>
            <h3 className="text-xl font-bold text-slate-850 font-mono tracking-tight leading-none">
              {fmt(caixa.isOpen ? caixa.currentCashInMoney : 0)}
            </h3>
            <p className="text-[9px] text-slate-500 mt-1.5 leading-normal">Total na gaveta física de troco.</p>
          </div>
        </div>

        {/* Card 2: Total Vendido Hoje */}
        <div id="kpi-card-vendas-hoje" className="bg-slate-900 rounded-2xl border border-slate-800 p-4.5 flex flex-col justify-between shadow-xs">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 bg-blue-950/40 border border-blue-105 rounded-xl text-blue-500">
              <TrendingUp size={18} />
            </div>
            <button 
              id="kpi-link-relatorios"
              onClick={() => onChangeTab('relatorios')}
              className="text-[10px] font-bold font-mono text-blue-500 hover:underline inline-flex items-center gap-0.5 cursor-pointer"
            >
              Filtro <ArrowUpRight size={10} />
            </button>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Faturamento Hoje</p>
            <h3 className="text-xl font-bold text-slate-850 font-mono tracking-tight leading-none">
              {fmt(salesToday)}
            </h3>
            <p className="text-[9px] text-slate-500 mt-1.5 leading-normal">Comandas liquidadas no balcão.</p>
          </div>
        </div>

        {/* Card 3: Comandas Abertas */}
        <div id="kpi-card-comandas-ativas" className="bg-slate-900 rounded-2xl border border-slate-800 p-4.5 flex flex-col justify-between shadow-xs">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 bg-amber-950/40 border border-amber-105 rounded-xl text-amber-500">
              <ClipboardList size={18} />
            </div>
            <span className="text-[9px] font-mono font-extrabold text-amber-400 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-800/60">
              {activeComandas.length} Ativas
            </span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Contas Balcão</p>
            <h3 className="text-xl font-bold text-slate-850 font-mono tracking-tight leading-none">
              {fmt(activeComandasSum)}
            </h3>
            <p className="text-[9px] text-slate-500 mt-1.5 leading-normal">Consumo estimado em andamento.</p>
          </div>
        </div>

        {/* Card 4: Fiados em Aberto */}
        <div id="kpi-card-fiado-pendente" className="bg-slate-900 rounded-2xl border border-slate-800 p-4.5 flex flex-col justify-between shadow-xs">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 bg-rose-950/40 border border-rose-105 rounded-xl text-rose-500">
              <Users size={18} />
            </div>
            <button 
              id="kpi-link-clientes-fiado"
              onClick={() => onChangeTab('clientes')}
              className="text-[10px] font-bold font-mono text-rose-500 hover:underline inline-flex items-center gap-0.5 cursor-pointer"
            >
              Caderno <ArrowUpRight size={10} />
            </button>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Fiados (Caderno)</p>
            <h3 className="text-xl font-bold text-slate-855 font-mono tracking-tight leading-none">
              {fmt(totalFiado)}
            </h3>
            <p className="text-[9px] text-rose-500 font-semibold mt-1.5 leading-normal">Total acumulado de devedores.</p>
          </div>
        </div>

        {/* Card 5: Estoque Baixo */}
        <div id="kpi-card-estoque-baixo" className="bg-slate-900 rounded-2xl border border-slate-800 p-4.5 flex flex-col justify-between shadow-xs">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 bg-amber-950/40 border border-amber-105 rounded-xl text-amber-550">
              <AlertTriangle size={18} />
            </div>
            <span className={`text-[9px] font-mono font-extrabold uppercase px-1.5 py-0.5 rounded ${
              lowStockProducts.length > 0 ? 'bg-amber-900/50 text-amber-800 border border-amber-800/60' : 'bg-slate-800 text-slate-500'
            }`}>
              {lowStockProducts.length} Alertas
            </span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Estoque Baixo</p>
            <h3 className="text-xl font-bold text-slate-850 font-mono tracking-tight leading-none">
              {lowStockProducts.length} <span className="text-xs font-normal text-slate-500">itens</span>
            </h3>
            <p className="text-[9px] text-slate-500 mt-1.5 leading-normal">Abaixo do estoque de segurança.</p>
          </div>
        </div>

        {/* Card 6: Estoque Negativo */}
        <div id="kpi-card-estoque-negativo" className="bg-slate-900 rounded-2xl border border-slate-205 p-4.5 flex flex-col justify-between shadow-xs">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 bg-rose-950/40 border border-rose-105 rounded-xl text-rose-500">
              <XCircle size={18} />
            </div>
            <span className={`text-[9px] font-mono font-extrabold uppercase px-1.5 py-0.5 rounded ${
              negativeStockProducts.length > 0 ? 'bg-rose-900/50 text-rose-400 border border-rose-800/60' : 'bg-slate-800 text-slate-500'
            }`}>
              {negativeStockProducts.length} Crítico
            </span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Estoque Negativo</p>
            <h3 className={`text-xl font-bold font-mono tracking-tight leading-none ${
              negativeStockProducts.length > 0 ? 'text-rose-500' : 'text-slate-850'
            }`}>
              {negativeStockProducts.length} <span className="text-xs font-normal text-slate-500">itens</span>
            </h3>
            <p className="text-[9px] text-slate-500 mt-1.5 leading-normal">Saídas forçadas sem reabastecer.</p>
          </div>
        </div>

      </div>

      {/* Actions Grid: Grandes e de fácil acionamento rápido no tablet/notebook */}
      <div id="dashboard-quick-actions-panel" className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xs">
        <h3 className="text-sm font-display font-semibold font-mono text-slate-500 uppercase tracking-wider mb-3.5 flex items-center gap-1.5">
          <Gauge size={14} className="text-emerald-500" /> Atalhos Principais do Balcoista
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          
          <button 
            id="quick-nav-abrir-caixa"
            onClick={() => onChangeTab('caixa')}
            className="p-4 rounded-xl bg-slate-800/50 hover:bg-emerald-950/40 border border-slate-800 hover:border-emerald-300 transition duration-150 cursor-pointer flex flex-col items-center text-center gap-2"
          >
            <Unlock size={22} className="text-emerald-500" />
            <span className="text-xs font-bold text-slate-750 block">Abrir Caixa</span>
          </button>

          <button 
            id="quick-nav-nova-comanda"
            onClick={() => onChangeTab('comandas')}
            className="p-4 rounded-xl bg-slate-800/50 hover:bg-emerald-900/50/50 border border-emerald-150 transition-all cursor-pointer flex flex-col items-center text-center gap-2"
          >
            <PlusCircle size={22} className="text-emerald-400 font-extrabold animate-pulse" />
            <span className="text-xs font-black text-emerald-300 block">Nova Comanda</span>
          </button>

          <button 
            id="quick-nav-ver-comandas"
            onClick={() => onChangeTab('comandas')}
            className="p-4 rounded-xl bg-slate-800/50 hover:bg-emerald-950/40 border border-slate-800 hover:border-emerald-300 transition duration-150 cursor-pointer flex flex-col items-center text-center gap-2"
          >
            <ClipboardList size={22} className="text-amber-500" />
            <span className="text-xs font-bold text-slate-750 block">Comandas Ativas</span>
          </button>

          <button 
            id="quick-nav-lancar-estoque"
            onClick={() => onChangeTab('produtos')}
            className="p-4 rounded-xl bg-slate-800/50 hover:bg-emerald-950/40 border border-slate-800 hover:border-emerald-300 transition duration-150 cursor-pointer flex flex-col items-center text-center gap-2"
          >
            <PackageOpen size={22} className="text-sky-600" />
            <span className="text-xs font-bold text-slate-750 block">Lançar Estoque</span>
          </button>

          <button 
            id="quick-nav-ver-fiados"
            onClick={() => onChangeTab('clientes')}
            className="p-4 rounded-xl bg-slate-800/50 hover:bg-emerald-950/40 border border-slate-800 hover:border-emerald-300 transition duration-150 cursor-pointer flex flex-col items-center text-center gap-2"
          >
            <Users size={22} className="text-rose-505" />
            <span className="text-xs font-bold text-slate-750 block">Ver Fiados</span>
          </button>

          <button 
            id="quick-nav-ver-relatorios"
            onClick={() => onChangeTab('relatorios')}
            className="p-4 rounded-xl bg-slate-800/50 hover:bg-emerald-950/40 border border-slate-800 hover:border-emerald-300 transition duration-150 cursor-pointer flex flex-col items-center text-center gap-2"
          >
            <TrendingUp size={22} className="text-blue-500" />
            <span className="text-xs font-bold text-slate-755 block">Ver Relatórios</span>
          </button>

        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Comandas e Produtos mais vendidos (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* List of recent open comandas */}
          <div id="dashboard-ultimas-comandas" className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xs">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-base font-display font-bold text-slate-50 tracking-tight flex items-center gap-2">
                <Clock size={16} className="text-amber-550 animate-bounce-slow" />
                Últimas Comandas Executadas / Em Consumo
              </h4>
              <button 
                id="btn-link-comandas"
                onClick={() => onChangeTab('comandas')}
                className="text-xs text-emerald-500 hover:underline cursor-pointer font-bold font-mono"
              >
                Gerir Comandas
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-500 leading-normal border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] uppercase font-mono tracking-wider text-slate-500 bg-slate-800/50">
                    <th className="px-4 py-3">Identificação</th>
                    <th className="px-4 py-3 text-center">Itens Consumidos</th>
                    <th className="px-4 py-3 text-right">Preço Total</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {comandas.slice(0, 5).map((c) => {
                    const comSum = c.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                    const totalCom = Math.max(0, comSum - c.discount + c.addition);
                    const bindedCust = customers.find(cust => cust.id === c.customerId);

                    return (
                      <tr key={c.id} className="hover:bg-slate-800/50/60 duration-100">
                        <td className="px-4 py-3">
                          <div>
                            <span className="font-bold text-slate-200 block">{c.code}</span>
                            {bindedCust ? (
                              <span className="text-[10px] text-emerald-400 font-semibold">👤 {bindedCust.name}</span>
                            ) : (
                              <span className="text-[9px] text-slate-500 tracking-tight font-mono font-bold uppercase">Consumo Geral</span>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3 text-center font-mono">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-bold">
                            {c.items.length} {c.items.length === 1 ? 'item' : 'itens'}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-right font-bold font-mono text-slate-200">
                          {fmt(totalCom)}
                        </td>

                        <td className="px-4 py-3 text-center">
                          {c.status === 'active' ? (
                            <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-amber-950/40 border border-amber-800/60 text-amber-705 font-mono">
                              Consumindo
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-emerald-950/40 border border-emerald-800/60 text-emerald-400 font-mono">
                              Paga
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3 text-right">
                          <button
                            id={`btn-open-comanda-row-${c.id}`}
                            onClick={() => {
                              onChangeTab('comandas');
                            }}
                            className="px-2.5 py-1 rounded bg-slate-800/50 hover:bg-emerald-950/40 text-slate-500 hover:text-emerald-400 border border-slate-800 hover:border-emerald-300 font-mono text-[10px] uppercase font-bold duration-150 cursor-pointer"
                          >
                            Abrir
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {comandas.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-10 text-slate-405 italic">
                        Nenhuma comanda aberta ou finalizada no sistema.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Ranked list of products sold the most (Diferenciação produtos mais vendidos x estoque consumido) */}
          <div id="dashboard-produtos-mais-vendidos" className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xs">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h4 className="text-base font-display font-bold text-slate-50 tracking-tight flex items-center gap-1.5">
                  <Sparkles size={16} className="text-emerald-500" />
                  Ranking de Vendas (Produtos Mais Vendidos)
                </h4>
                <p className="text-[10px] text-slate-500 leading-tight block mt-0.5">
                  Faturamento bruto acumulado por saídas de prateleira e doses servidas no balcão hoje.
                </p>
              </div>
              <button 
                id="btn-link-estoque-relatorios"
                onClick={() => onChangeTab('relatorios')}
                className="text-xs text-emerald-500 hover:underline cursor-pointer font-bold font-mono"
              >
                Relatórios
              </button>
            </div>

            <div className="space-y-3 pt-1.5">
              {bestSellersList.map((item, idx) => {
                // Find potential max to size proportional percentage bar
                const maxQty = bestSellersList[0]?.quantity || 1;
                const widthPercent = Math.max(10, Math.min(100, (item.quantity / maxQty) * 100));

                return (
                  <div key={item.id} className="p-3 bg-slate-800/50/50 border border-slate-700 rounded-xl space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-emerald-950 font-mono text-emerald-400 text-[10px] font-extrabold flex items-center justify-center">
                          #{idx + 1}
                        </span>
                        <div>
                          <span className="text-xs font-bold text-slate-200 block">{item.name}</span>
                          <span className="text-[9px] uppercase tracking-wider text-slate-500 font-mono font-bold leading-none">{item.category}</span>
                        </div>
                      </div>
                      
                      <div className="text-right font-mono">
                        <span className="text-xs font-extrabold text-slate-805 block">{item.quantity} saídas</span>
                        <span className="text-[9px] text-emerald-400 font-semibold">{fmt(item.revenue)} total</span>
                      </div>
                    </div>

                    {/* Proportional styled status horizontal track bar */}
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
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

        {/* Right Column: Alertas Operacionais (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          <div id="dashboard-alertas-operacionais" className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xs h-full flex flex-col justify-between">
            
            <div>
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle size={18} className="text-amber-550 shrink-0" />
                <h4 className="text-base font-display font-bold text-slate-850">Alertas Operacionais</h4>
              </div>

              <div className="space-y-3.5 max-h-[460px] overflow-y-auto pr-1">
                
                {/* 1. Cashier status alarm */}
                {!caixa.isOpen && (
                  <div id="alert-box-caixa-fechado" className="p-3.5 bg-rose-950/40 border border-rose-150 rounded-xl gap-2.5 flex items-start text-xs text-rose-400 font-medium">
                    <Lock size={16} className="text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-rose-800 block mb-0.5">Caixa Fechado</span>
                      Você não poderá processar recebimentos de comandas nem lançamentos financeiros até abrir o caixa.
                    </div>
                  </div>
                )}

                {/* 2. Negative stock critical alerts */}
                {negativeStockProducts.length > 0 && (
                  <div id="alert-box-negative-stock" className="p-3.5 bg-rose-950/40 border border-rose-150 rounded-xl gap-2.5 flex items-start text-xs text-rose-400 font-medium">
                    <AlertTriangle size={16} className="text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-rose-850 block mb-0.5">Estoque Negativo Grave!</span>
                      Há <strong className="font-mono">{negativeStockProducts.length}</strong> produto(s) com saldos negativos no balcão. Reabra fichas e faça entradas de estoque.
                    </div>
                  </div>
                )}

                {/* 3. Mild stock warning */}
                {lowStockProducts.length > 0 && (
                  <div id="alert-box-low-stock" className="p-3.5 bg-amber-950/40/50 border border-amber-800/60 rounded-xl gap-2.5 flex items-start text-xs text-amber-800 font-medium">
                    <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-amber-850 block mb-0.5">Estoque de Segurança Baixo</span>
                      <strong className="font-mono">{lowStockProducts.length}</strong> item(ns) estão com volumes reduzidos nas prateleiras ou na geladeira de refrigerados.
                    </div>
                  </div>
                )}

                {/* 4. Tips & recommendations */}
                <div id="info-box-tip-vincular" className="p-3.5 bg-emerald-950/40 border border-emerald-150 rounded-xl gap-2.5 flex items-start text-xs text-emerald-805 leading-relaxed">
                  <HelpCircle size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-emerald-300 block mb-0.5">Dica de Atendimento</span>
                    Vincule o cadastro dos fregueses nas comandas na hora de abrir a mesa ou balcão. Isso torna o trâmite de assinar o faturamento fiado no fim do consumo muito mais prático e seguro!
                  </div>
                </div>

                {/* 5. Minimal rules checklist for bar operator safety */}
                <div className="bg-slate-800/50 border border-slate-800 p-4 rounded-xl space-y-2.5 text-xs text-slate-550 font-mono">
                  <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block">Boas práticas do balcão:</span>
                  <ul className="space-y-1.5 text-[10px] text-slate-500 leading-tight">
                    <li className="flex gap-1.5">
                      <span className="text-emerald-500 font-bold">•</span>
                      <span>Contar cédulas da gaveta antes de fechar o dia físico.</span>
                    </li>
                    <li className="flex gap-1.5">
                      <span className="text-emerald-500 font-bold">•</span>
                      <span>Cadastrar o telefone do fiador no caderno virtual.</span>
                    </li>
                    <li className="flex gap-1.5">
                      <span className="text-emerald-500 font-bold">•</span>
                      <span>Evitar dar descontos excessivos sem autorização familiar.</span>
                    </li>
                  </ul>
                </div>

              </div>
            </div>

            <button 
              id="btn-navigate-to-stock-from-alerts"
              onClick={() => onChangeTab('produtos')}
              className="mt-6 w-full py-2.5 rounded-xl border border-slate-800 hover:border-emerald-600 bg-slate-800/50 hover:bg-emerald-950/40 text-[11px] font-bold text-slate-500 hover:text-emerald-400 cursor-pointer transition-all uppercase tracking-wider font-mono text-center block"
            >
              Controlar Estoque Completo ➔
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}
