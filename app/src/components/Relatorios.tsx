/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Product, Comanda, Customer, Cashier } from '../types';
import { 
  BarChart, 
  Settings2, 
  CalendarDays, 
  ClipboardList, 
  Box, 
  TrendingUp, 
  BookOpen, 
  Receipt, 
  AlertOctagon, 
  CircleDollarSign
} from 'lucide-react';

interface RelatoriosProps {
  products: Product[];
  comandas: Comanda[];
  customers: Customer[];
  caixa: Cashier;
}

type TabType = 'diario' | 'caixas' | 'produtos' | 'fiados' | 'estoque' | 'consumido' | 'comandas';

export default function Relatorios({
  products,
  comandas,
  customers,
  caixa
}: RelatoriosProps) {
  
  const [activeTab, setActiveTab] = useState<TabType>('diario');
  const [period, setPeriod] = useState<string>('hoje');

  // Helper formatting
  const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const renderEmptyState = (message: string) => (
    <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-2xl shadow-sm">
      <AlertOctagon size={40} className="mx-auto text-slate-300 mb-4" />
      <h3 className="text-sm font-bold text-slate-300">Relatório Vazio</h3>
      <p className="text-xs text-slate-500 mt-1">{message}</p>
    </div>
  );

  // --- Sub-reports logic ---
  // 1. DIÁRIO
  const renderDiario = () => {
    // Generate mock daily report
    const mockDiario = [
      { id: 1, type: 'vendas', label: 'Vendas Brutas', value: 1250.00 },
      { id: 2, type: 'recebimentos', label: 'Recebimentos (Caixa + Cartão)', value: 1100.00 },
      { id: 3, type: 'fiado', label: 'Aumento Fiado (Não recebido)', value: 150.00 },
      { id: 4, type: 'despesas', label: 'Despesas / Sangrias', value: 200.00 },
    ];
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-emerald-950/40 border border-emerald-800/60 p-5 rounded-2xl shadow-sm">
             <div className="text-[10px] uppercase font-mono font-bold text-emerald-500">Saldo Líquido Diario</div>
             <div className="text-2xl font-black font-mono text-emerald-400 mt-1">{fmt(900)}</div>
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
               {mockDiario.map(m => (
                 <tr key={m.id} className="hover:bg-slate-800/50">
                    <td className="px-5 py-3 font-bold text-slate-300">{m.label}</td>
                    <td className="px-5 py-3 text-right font-mono font-bold text-slate-50">{fmt(m.value)}</td>
                 </tr>
               ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // 2. POR CAIXA
  const renderCaixas = () => {
    // Basic mock caixas
    const mockCaixas = [
      { id: 'CX-102', data: '2026-05-30', abertura: 150, fechamento: 1200, status: 'Fechado', diferenca: 0 },
      { id: 'CX-103', data: '2026-05-31', abertura: 200, fechamento: 0, status: 'Aberto', diferenca: 0 },
    ];
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/50 border-b border-slate-800 uppercase font-mono text-[10px] tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3">ID Caixa</th>
                <th className="px-5 py-3">Data</th>
                <th className="px-5 py-3 text-right">Abertura</th>
                <th className="px-5 py-3 text-right">Fechamento</th>
                <th className="px-5 py-3 text-center">Status</th>
                <th className="px-5 py-3 text-right">Diferença/Quebra</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
               {mockCaixas.map(c => (
                 <tr key={c.id} className="hover:bg-slate-800/50">
                    <td className="px-5 py-3 font-mono font-bold text-slate-300">{c.id}</td>
                    <td className="px-5 py-3 text-slate-500">{new Date(c.data).toLocaleDateString('pt-BR')}</td>
                    <td className="px-5 py-3 text-right font-mono text-slate-300">{fmt(c.abertura)}</td>
                    <td className="px-5 py-3 text-right font-mono font-bold">{c.status === 'Fechado' ? fmt(c.fechamento) : '--'}</td>
                    <td className="px-5 py-3 text-center">
                       <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold font-mono border ${c.status === 'Fechado' ? 'bg-slate-800/50 text-slate-500 border-slate-800' : 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60'}`}>{c.status}</span>
                    </td>
                    <td className="px-5 py-3 text-right font-mono">{fmt(c.diferenca)}</td>
                 </tr>
               ))}
            </tbody>
          </table>
      </div>
    );
  };

  // 3. PRODUTOS (Mais Vendidos)
  const renderProdutos = () => {
    // Calculando do histórico real + mock
    const productSellCounts: { [key: string]: { name: string, category: string, qty: number, rev: number } } = {};
    comandas.filter(c => c.status !== 'cancelled').forEach(c => {
      c.items.forEach(item => {
        if (!productSellCounts[item.productId]) {
          const prod = products.find(p => p.id === item.productId);
          productSellCounts[item.productId] = { 
             name: item.productName, 
             category: prod?.category || 'Outros',
             qty: 0, 
             rev: 0 
          };
        }
        productSellCounts[item.productId].qty += item.quantity;
        productSellCounts[item.productId].rev += (item.price * item.quantity);
      });
    });

    const ranking = Object.values(productSellCounts).sort((a, b) => b.qty - a.qty);

    if (ranking.length === 0) return renderEmptyState("Nenhum produto foi vendido no período selecionado.");

    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/50 border-b border-slate-800 uppercase font-mono text-[10px] tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3">Produto Vendido na Comanda</th>
                <th className="px-5 py-3">Categoria</th>
                <th className="px-5 py-3 text-right">Qtd. Vendida</th>
                <th className="px-5 py-3 text-right">Valor Gerado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
               {ranking.map((p, i) => (
                 <tr key={i} className="hover:bg-slate-800/50">
                    <td className="px-5 py-3 font-bold text-slate-200">{p.name}</td>
                    <td className="px-5 py-3 uppercase text-[10px] text-slate-500 font-mono">{p.category}</td>
                    <td className="px-5 py-3 text-right font-mono font-black text-emerald-400">{p.qty} un</td>
                    <td className="px-5 py-3 text-right font-mono text-slate-500 font-bold">{fmt(p.rev)}</td>
                 </tr>
               ))}
            </tbody>
          </table>
      </div>
    );
  };

  // 4. FIADOS (Dívidas)
  const renderFiados = () => {
    // Derived from customer real balance
    const clientesDevedores = customers.filter(c => c.balance > 0).sort((a, b) => b.balance - a.balance);
    const totalDívida = clientesDevedores.reduce((acc, c) => acc + c.balance, 0);

    return (
      <div className="space-y-4">
        <div className="bg-rose-950/40 border border-rose-800/60 p-5 rounded-2xl shadow-sm w-full md:w-1/3">
           <div className="text-[10px] uppercase font-mono font-bold text-rose-500">Total a Receber na Rua</div>
           <div className="text-2xl font-black font-mono text-rose-400 mt-1">{fmt(totalDívida)}</div>
        </div>
        
        {clientesDevedores.length > 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/50 border-b border-slate-800 uppercase font-mono text-[10px] tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Cliente</th>
                    <th className="px-5 py-3 text-right">Saldo Devedor Ativo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                   {clientesDevedores.map((c, i) => (
                     <tr key={i} className="hover:bg-slate-800/50">
                        <td className="px-5 py-3 font-bold text-slate-200">{c.name}</td>
                        <td className="px-5 py-3 text-right font-mono font-black text-rose-500">{fmt(c.balance)}</td>
                     </tr>
                   ))}
                </tbody>
              </table>
          </div>
        ) : (
          renderEmptyState("Não há clientes com saldo devedor/fiado ativo no momento.")
        )}
      </div>
    );
  };

  // 5. ESTOQUE (Current positions limit warnings)
  const renderEstoque = () => {
    const controlled = products.filter(p => !p.isComposite);
    const lowStock = controlled.filter(p => p.stock <= p.minStock);

    return (
       <div className="space-y-4">
        <div className="bg-amber-950/40 border border-amber-800/60 p-5 rounded-2xl shadow-sm w-full md:w-1/3">
           <div className="text-[10px] uppercase font-mono font-bold text-amber-500">Com Alerta de Estoque</div>
           <div className="text-2xl font-black font-mono text-amber-400 mt-1">{lowStock.length} Itens</div>
        </div>
        
        {lowStock.length > 0 ? (
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
                   {lowStock.map((p, i) => (
                     <tr key={i} className="hover:bg-slate-800/50 bg-amber-950/40/20">
                        <td className="px-5 py-3 font-bold text-slate-200">{p.name}</td>
                        <td className="px-5 py-3 text-center font-mono text-slate-500 uppercase">{p.unit}</td>
                        <td className="px-5 py-3 text-center font-mono text-slate-500">{p.minStock}</td>
                        <td className="px-5 py-3 text-right font-mono font-black text-rose-500">{p.stock}</td>
                     </tr>
                   ))}
                </tbody>
              </table>
          </div>
        ) : renderEmptyState("Todos os produtos físicos estão com estoque normal e acima do mínimo.")}
      </div>
    );
  }

  // 6. ESTOQUE CONSUMIDO (What actually left the inventory)
  const renderEstoqueConsumido = () => {
    // Simulating component deductions based on sales
    // Rule: "O que saiu fisicamente do estoque?" 
    // We map every paid comanda item. If it's pure, it deduction = item qty.
    // If it's composite, we deduce its recipe factors.
    const consumeMap: { [key: string]: { name: string, unit: string, qty: number } } = {};
    
    comandas.filter(c => c.status !== 'cancelled').forEach(c => {
       c.items.forEach(item => {
          const p = products.find(prod => prod.id === item.productId);
          if (!p) return;
          if (!p.isComposite) {
             if (!consumeMap[p.id]) consumeMap[p.id] = { name: p.name, unit: p.unit, qty: 0 };
             consumeMap[p.id].qty += item.quantity;
          } else if (p.recipe) {
             p.recipe.forEach(r => {
                const subP = products.find(prod => prod.id === r.ingredientId);
                if (subP) {
                   if (!consumeMap[subP.id]) consumeMap[subP.id] = { name: subP.name, unit: subP.unit, qty: 0 };
                   consumeMap[subP.id].qty += (item.quantity * r.quantity);
                }
             });
          }
       });
    });

    const entries = Object.values(consumeMap).filter(entry => entry.qty > 0).sort((a,b) => b.qty - a.qty);

    if (entries.length === 0) return renderEmptyState("Nenhum item consumido do estoque físico no período.");

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
               {entries.map((entry, i) => (
                 <tr key={i} className="hover:bg-slate-800/50">
                    <td className="px-5 py-3 font-bold text-slate-200">{entry.name}</td>
                    <td className="px-5 py-3 text-center font-mono text-slate-500 uppercase">{entry.unit}</td>
                    <td className="px-5 py-3 text-right font-mono font-black text-rose-500">{entry.qty % 1 !== 0 ? entry.qty.toFixed(3) : entry.qty}</td>
                 </tr>
               ))}
            </tbody>
          </table>
      </div>
    );
  }

  // 7. COMANDAS
  const renderComandas = () => {
    return (
       <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/50 border-b border-slate-800 uppercase font-mono text-[10px] tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3">Código Comanda</th>
                <th className="px-5 py-3">Data</th>
                <th className="px-5 py-3">Cliente (Se houver)</th>
                <th className="px-5 py-3 text-center">Itens</th>
                <th className="px-5 py-3 text-center">Status</th>
                <th className="px-5 py-3 text-right">Total Fechado (R$)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
               {comandas.map((c, i) => {
                 const cust = customers.find(u => u.id === c.customerId);
                 const totalItems = c.items.reduce((s, item) => s + item.quantity, 0);
                 const totalRevenue = c.items.reduce((s, item) => s + (item.price * item.quantity), 0) - c.discount + c.addition;
                 
                 let badge = '';
                 if (c.status === 'active') badge = 'bg-amber-950/40 text-amber-400 border-amber-800/60';
                 if (c.status === 'paid') badge = 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60';
                 if (c.status === 'cancelled') badge = 'bg-rose-950/40 text-rose-400 border-rose-800/60';

                 return (
                 <tr key={i} className="hover:bg-slate-800/50">
                    <td className="px-5 py-3 font-mono font-bold text-slate-200">{c.code}</td>
                    <td className="px-5 py-3 text-slate-500 font-mono text-[10px]">{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-3 font-bold text-slate-500">{cust ? cust.name : '--'}</td>
                    <td className="px-5 py-3 text-center text-slate-500">{totalItems}</td>
                    <td className="px-5 py-3 text-center">
                       <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold font-mono border ${badge}`}>
                         {c.status === 'paid' ? 'Paga' : c.status === 'active' ? 'Aberta' : 'Cancel.'}
                       </span>
                    </td>
                    <td className="px-5 py-3 text-right font-mono font-bold text-slate-200 uppercase">{c.status !== 'cancelled' ? fmt(Math.max(0, totalRevenue)) : '--'}</td>
                 </tr>
                 );
               })}
            </tbody>
          </table>
      </div>
    );
  }

  const tabs = [
    { id: 'diario', label: 'Diário Operacional', icon: CalendarDays },
    { id: 'caixas', label: 'Caixas', icon: Receipt },
    { id: 'produtos', label: 'Produtos Vendidos', icon: TrendingUp },
    { id: 'consumido', label: 'Estoque Consumido', icon: Box },
    { id: 'fiados', label: 'Inadimplência / Fiados', icon: CircleDollarSign },
    { id: 'estoque', label: 'Alerta de Estoque', icon: AlertOctagon },
    { id: 'comandas', label: 'Comandas', icon: ClipboardList },
  ] as const;

  return (
    <div id="relatorios-module" className="space-y-6 animate-fade-in pb-10">
      
      {/* Title block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest font-mono text-blue-500 font-bold block mb-1">Módulo Gerencial</span>
          <h2 className="text-3xl font-display font-bold text-slate-50 tracking-tight">
            Relatórios <span className="text-blue-500">& Gestão</span>
          </h2>
        </div>

        <div className="w-full sm:w-auto flex items-center bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
           <div className="px-3 text-slate-500 bg-slate-800/50 h-full flex items-center border-r border-slate-800 text-[10px] font-mono font-bold uppercase">Período:</div>
           <select 
             className="px-3 py-2 text-xs font-bold text-slate-300 bg-slate-900 outline-none cursor-pointer"
             value={period}
             onChange={e => setPeriod(e.target.value)}
           >
              <option value="hoje">Hoje</option>
              <option value="ontem">Ontem</option>
              <option value="7d">Últimos 7 Dias</option>
              <option value="30d">Últimos 30 Dias</option>
           </select>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex flex-wrap gap-2">
         {tabs.map(t => (
            <button
               key={t.id}
               onClick={() => setActiveTab(t.id)}
               className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                 activeTab === t.id 
                 ? 'bg-blue-600 text-white shadow-md' 
                 : 'bg-slate-900 border border-slate-800 text-slate-500 hover:bg-slate-800/50'
               }`}
            >
               <t.icon size={14} />
               {t.label}
            </button>
         ))}
      </div>

      {/* Content wrapper */}
      <div className="pt-2">
         {activeTab === 'diario' && renderDiario()}
         {activeTab === 'caixas' && renderCaixas()}
         {activeTab === 'produtos' && renderProdutos()}
         {activeTab === 'fiados' && renderFiados()}
         {activeTab === 'estoque' && renderEstoque()}
         {activeTab === 'consumido' && renderEstoqueConsumido()}
         {activeTab === 'comandas' && renderComandas()}
      </div>

    </div>
  );
}

