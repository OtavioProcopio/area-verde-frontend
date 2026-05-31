import React, { useState } from 'react';
import { Customer, CustomerHistoryEntry } from '../types';
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
  Coins
} from 'lucide-react';

interface ClientesProps {
  customers: Customer[];
  caixaIsOpen: boolean;
  onAddCustomer: (c: { name: string; nickname?: string; phone: string; notes?: string; active: boolean }) => void | Promise<void>;
  onUpdateCustomer: (c: Customer) => void | Promise<void>;
  onDeleteCustomer: (id: string) => void | Promise<void>;
  onPagarFiado: (customerId: string, amount: number, method: 'dinheiro' | 'pix' | 'cartao') => Promise<{ success: boolean; msg: string }>;
}

export default function Clientes({
  customers,
  caixaIsOpen,
  onAddCustomer,
  onUpdateCustomer,
  onPagarFiado
}: ClientesProps) {
  
  const [viewState, setViewState] = useState<'list' | 'detail'>('list');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<'Todos' | 'Ativos' | 'Inativos'>('Todos');
  
  // Form modal state
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');

  // Customer form fields
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [active, setActive] = useState(true);

  // Payment fields
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<'dinheiro' | 'pix' | 'cartao'>('dinheiro');

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  // Filtered List
  const filteredCustomers = customers.filter(c => {
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
    setFormMode('create');
    setName('');
    setNickname('');
    setPhone('');
    setNotes('');
    setActive(true);
    setShowForm(true);
  };

  const handleEditTrigger = (c: Customer) => {
    setFormMode('edit');
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

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() === '') return;

    if (formMode === 'create') {
      onAddCustomer({ name, nickname, phone, notes, active });
    } else if (formMode === 'edit' && selectedCustomer) {
      onUpdateCustomer({
        ...selectedCustomer,
        name,
        nickname,
        phone,
        notes,
        active
      });
      // also if selectedCustomerId is same, it updates via context map.
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
      alert("Atenção: O caixa do bar está FECHADO! Abra o caixa para receber pagamentos em dinheiro.");
      return;
    }

    const result = await onPagarFiado(selectedCustomerId, amountVal, payMethod);
    setPayAmount('');
    alert(result.msg);
  };

  const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div id="clientes-module" className="space-y-6 animate-fade-in pb-10">
      
      {viewState === 'list' && (
        <>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="text-xs uppercase tracking-widest font-mono text-emerald-500 font-bold block mb-1">Caderneta de Contas</span>
              <h2 className="text-3xl font-display font-bold text-slate-50 tracking-tight">
                Controle de <span className="text-emerald-500">Clientes</span>
              </h2>
            </div>
            <button
              onClick={handleAddNewTrigger}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-950/400 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition"
            >
              <UserPlus size={14} /> Novo Cliente
            </button>
          </div>

          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:w-1/2 md:w-1/3">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input 
                type="text" 
                placeholder="Busca por nome, apelido, telefone..." 
                className="w-full pl-9 pr-3 py-2 bg-slate-800/50 border border-slate-800 rounded-xl text-xs outline-none focus:border-emerald-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-auto">
              <select 
                className="w-full px-3 py-2 bg-slate-800/50 border border-slate-800 rounded-xl text-xs outline-none focus:border-emerald-500 cursor-pointer text-slate-300 font-bold"
                value={filterActive}
                onChange={(e) => setFilterActive(e.target.value as any)}
              >
                <option value="Todos">Todos (Ativos + Inativos)</option>
                <option value="Ativos">Apenas Ativos</option>
                <option value="Inativos">Apenas Inativos</option>
              </select>
            </div>
          </div>

          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs text-slate-300">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] uppercase font-mono tracking-wider text-slate-500 bg-slate-800/50">
                    <th className="px-5 py-3">Cliente</th>
                    <th className="px-4 py-3">Contato</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right">Saldo Devedor / Fiado</th>
                    <th className="px-5 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCustomers.map(c => {
                    const pendencyCount = c.history.filter(h => h.amount > 0 && h.type !== 'payment').length; // Basic inference
                    const isAct = c.active ?? true;
                    return (
                      <tr key={c.id} className={`hover:bg-slate-800/50/80 transition ${!isAct ? 'opacity-60 bg-slate-800/50' : ''} ${c.balance > 0 ? 'bg-rose-950/40/10' : ''}`}>
                        <td className="px-5 py-3">
                          <span className="font-bold text-slate-200 block text-xs truncate max-w-[200px]">{c.name}</span>
                          {c.nickname && <span className="text-[10px] text-slate-500 mt-0.5 inline-flex font-mono bg-slate-800 px-1.5 py-0.5 rounded uppercase">{c.nickname}</span>}
                        </td>
                        <td className="px-4 py-3 font-mono text-[10px] text-slate-500">
                          {c.phone || '--'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {isAct ? (
                            <span className="px-2 py-0.5 rounded text-[9px] uppercase font-bold font-mono border bg-emerald-950/40 text-emerald-400 border-emerald-800/60">ATIVO</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[9px] uppercase font-bold font-mono border bg-slate-800/50 text-slate-500 border-slate-800">INATIVO</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {c.balance > 0 ? (
                             <div>
                               <span className="font-mono text-sm font-black text-rose-500 block">{fmt(c.balance)}</span>
                               {pendencyCount > 0 && <span className="text-[9px] text-rose-400 font-bold uppercase">{pendencyCount} pendências</span>}
                             </div>
                          ) : (
                             <span className="font-mono text-xs font-bold text-slate-300">Quitado</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5 inline-flex">
                            <button
                              onClick={() => viewDetails(c)}
                              className="w-7 h-7 flex items-center justify-center bg-slate-800/50 hover:bg-emerald-950/40 border border-slate-800 hover:border-emerald-800/60 text-slate-500 hover:text-emerald-400 rounded transition cursor-pointer"
                              title="Ver Detalhes"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              onClick={() => handleEditTrigger(c)}
                              className="w-7 h-7 flex items-center justify-center bg-slate-800/50 hover:bg-slate-800 border border-slate-800 text-slate-500 rounded transition cursor-pointer"
                              title="Editar"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(c)}
                              className={`w-7 h-7 flex items-center justify-center border rounded transition cursor-pointer ${
                                isAct ? 'bg-rose-950/40 border-rose-800/60 text-rose-500 hover:bg-rose-900/50' : 'bg-emerald-950/40 border-emerald-800/60 text-emerald-500 hover:bg-emerald-900/50'
                              }`}
                              title={isAct ? 'Inativar' : 'Ativar'}
                            >
                              {isAct ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredCustomers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-slate-500 italic text-xs bg-slate-800/50/30">
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
      {viewState === 'detail' && selectedCustomer && (
        <div className="animate-fade-in space-y-4">
           {/* Detail header */}
           <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                 <button onClick={() => setViewState('list')} className="text-[10px] uppercase font-mono font-bold text-slate-500 hover:text-slate-200 transition block mb-2 cursor-pointer flex items-center gap-1">
                   <ArrowLeft size={12} /> Voltar para lista
                 </button>
                 <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-display font-bold text-slate-50">{selectedCustomer.name}</h2>
                    {selectedCustomer.nickname && (
                      <span className="text-[10px] font-mono text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full uppercase border border-slate-800">{selectedCustomer.nickname}</span>
                    )}
                 </div>
                 <div className="text-xs text-slate-500 mt-1 flex gap-4">
                    <span>Telefone: {selectedCustomer.phone || '--'}</span>
                    <span className={`font-mono uppercase text-[10px] items-center flex gap-1 font-bold ${(selectedCustomer.active ?? true) ? 'text-emerald-500' : 'text-slate-500'}`}>
                       {(selectedCustomer.active ?? true) ? '• Ativo' : '• Inativo'}
                    </span>
                 </div>
              </div>

              <div className="flex gap-2 w-full md:w-auto">
                 <button
                   onClick={() => handleEditTrigger(selectedCustomer)}
                   className="flex-1 md:flex-initial px-4 py-2 border border-slate-800 bg-slate-800/50 hover:bg-slate-800 text-xs font-bold text-slate-300 rounded-xl cursor-pointer transition text-center"
                 >
                   Editar Cadastro
                 </button>
              </div>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              
              {/* Financial panel */}
              <div className="lg:col-span-5 flex flex-col gap-5">
                 
                 {/* Balance & Info */}
                 <div className="bg-slate-800/50 border border-slate-800 p-5 rounded-2xl shadow-sm">
                    <h3 className="text-xs uppercase font-mono font-bold text-slate-500 mb-3 block">Dados Financeiros / Fiado</h3>
                    
                    <div className="flex justify-between items-end border-b border-slate-800 pb-3 mb-3">
                       <span className="text-sm font-bold text-slate-300">Saldo Pendente (Dívida)</span>
                       <span className={`text-2xl font-mono font-black ${selectedCustomer.balance > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                         {fmt(selectedCustomer.balance)}
                       </span>
                    </div>

                    <div className="text-xs text-slate-500">
                       A API atual não trabalha com limite de crédito por cliente. O controle disponível aqui é o saldo pendente real das comandas em fiado.
                    </div>

                    <div className="mt-5 p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs">
                       <span className="block text-[10px] uppercase font-mono text-slate-500 mb-1">Anotações</span>
                       <p className="text-slate-300 italic">
                         {selectedCustomer.notes || 'Nenhuma anotação registrada para o cliente.'}
                       </p>
                    </div>
                 </div>

                 {/* Payment Action */}
                 <div className="bg-emerald-950/40 border border-emerald-800/60 p-5 rounded-2xl shadow-sm">
                    <h4 className="text-sm font-display font-bold text-emerald-200 mb-2 flex items-center gap-1.5">
                      <Coins size={16} /> Registrar Pagamento de Fiado
                    </h4>
                    <p className="text-[10px] text-emerald-400/80 mb-4 leading-relaxed">
                      Abata o saldo devedor recebendo o valor do cliente agora. Se em dinheiro, garanta que o Caixa esteja aberto.
                    </p>

                    <form onSubmit={handleRegisterPayment} className="space-y-3">
                       <input
                         type="number"
                         step="0.01"
                         min="0.01"
                         className="w-full bg-slate-900 border border-emerald-800/60 py-2 px-3 text-sm font-mono text-emerald-200 rounded-lg outline-none focus:border-emerald-600 font-bold"
                         placeholder="Quantia (R$)"
                         value={payAmount}
                         onChange={(e) => setPayAmount(e.target.value)}
                         required
                       />
                       
                       <div className="grid grid-cols-2 gap-2">
                         {[
                           { id: 'dinheiro', label: '💵 Dinheiro' },
                           { id: 'pix', label: '⚡ Pix' },
                           { id: 'cartao', label: '💳 Cartão' }
                         ].map((item) => (
                           <button
                             key={item.id}
                             type="button"
                             onClick={() => setPayMethod(item.id as any)}
                             className={`px-2 py-1.5 text-[10px] rounded font-bold border transition cursor-pointer ${
                               payMethod === item.id 
                                 ? 'bg-emerald-600 border-emerald-700 text-white shadow-xs' 
                                 : 'bg-slate-900 border-emerald-800/60 text-emerald-400 hover:bg-emerald-900/50'
                             }`}
                           >
                             {item.label}
                           </button>
                         ))}
                       </div>

                       <button
                         type="submit"
                         disabled={selectedCustomer.balance <= 0}
                         className="w-full text-center py-2.5 text-xs font-bold rounded-lg transition duration-150 bg-emerald-700 hover:bg-emerald-600 text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                       >
                         Lançar Pagamento
                       </button>
                    </form>
                 </div>
              </div>

              {/* History / Transactions Panel */}
              <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col h-[550px]">
                 <h3 className="text-sm font-display font-bold text-slate-200 mb-4 border-b border-slate-800 pb-3 flex items-center gap-2">
                    <FileText size={16} className="text-slate-500" /> Histórico de Fiados e Pendências
                 </h3>
                 
                 <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                    {selectedCustomer.history.map((hist) => {
                      const isCharge = hist.amount > 0;
                      return (
                        <div key={hist.id} className={`p-3 border rounded-xl flex justify-between items-start text-xs ${isCharge ? 'bg-amber-950/40/30 border-amber-900' : 'bg-emerald-950/40/50 border-emerald-900'}`}>
                          <div>
                            <span className="font-bold text-slate-200 block text-sm">{hist.description}</span>
                            <span className="text-[10px] text-slate-500 font-mono mt-1 opacity-80 block">
                              {new Date(hist.timestamp).toLocaleString('pt-BR')}  • Tipo: {hist.type === 'sale' ? 'Comanda Vendida' : hist.type === 'payment' ? 'Pagamento' : 'Ajuste Manual'}
                            </span>
                          </div>

                          <div className={`font-mono font-black text-right shrink-0 ${isCharge ? 'text-amber-500' : 'text-emerald-500'}`}>
                            {isCharge ? '+' : ''} {fmt(hist.amount)}
                          </div>
                        </div>
                      );
                    })}

                    {selectedCustomer.history.length === 0 && (
                      <div className="text-center py-20 text-slate-500 text-xs italic flex flex-col items-center">
                        <AlertOctagon size={32} className="text-slate-200 mb-3" />
                        <p>Ainda não há nenhum histórico financeiro ou fiado cadastrado.</p>
                      </div>
                    )}
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* FORM MODAL: Create/Edit Customer */}
      {showForm && (
         <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-xs">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
              <button type="button" onClick={() => setShowForm(false)} className="absolute top-4 right-4 text-slate-500 hover:text-slate-200 cursor-pointer">
                <X size={18} />
              </button>
              <h3 className="text-lg font-display font-bold text-slate-200 mb-1 flex items-center gap-2">
                 <Users className="text-emerald-500" size={20} />
                 {formMode === 'create' ? 'Novo Cliente' : 'Editar Cliente'}
              </h3>
              <p className="text-[10px] font-mono text-slate-500 mb-4 block">Cadastro operacional de clientes e acompanhamento de pendências.</p>
              
              <form onSubmit={handleSaveCustomer} className="space-y-4">
                 
                 <div className="grid grid-cols-2 gap-3">
                   <div className="col-span-2 sm:col-span-1">
                      <label className="block text-[10px] uppercase font-mono text-slate-500 mb-1">Nome Completo <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full bg-slate-800/50 border border-slate-800 px-3 py-2 text-sm text-slate-200 rounded-lg outline-none focus:border-emerald-600 focus:bg-slate-900 font-bold"
                        required
                        placeholder="Ex: João Silva"
                      />
                   </div>
                   <div className="col-span-2 sm:col-span-1">
                      <label className="block text-[10px] uppercase font-mono text-slate-500 mb-1">Apelido</label>
                      <input
                        type="text"
                        value={nickname}
                        onChange={e => setNickname(e.target.value)}
                        className="w-full bg-slate-800/50 border border-slate-800 px-3 py-2 text-sm text-slate-200 rounded-lg outline-none focus:border-emerald-600 focus:bg-slate-900"
                        placeholder="Ex: Joãozinho"
                      />
                   </div>
                 </div>

                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                   <div>
                      <label className="block text-[10px] uppercase font-mono text-slate-500 mb-1">Telefone</label>
                      <input
                        type="text"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        className="w-full bg-slate-800/50 border border-slate-800 px-3 py-2 text-xs text-slate-200 rounded-lg outline-none focus:border-emerald-600 focus:bg-slate-900 font-mono"
                        placeholder="(31) 90000-0000"
                      />
                   </div>
                 </div>

                 <div>
                    <label className="block text-[10px] uppercase font-mono text-slate-500 mb-1">Motivo / Observação</label>
                    <textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      className="w-full bg-slate-800/50 border border-slate-800 px-3 py-2 text-xs text-slate-200 rounded-lg outline-none focus:border-emerald-600 focus:bg-slate-900 resize-none h-16"
                      placeholder="Alguma nota sobre o cliente ou restrição..."
                    />
                 </div>

                 <div className="flex items-center gap-3 p-3 bg-slate-800/50 border border-slate-800 rounded-xl">
                    <p className="text-[10px] font-mono font-bold text-slate-500 uppercase flex-1">Status do Cliente</p>
                    <select
                      value={active ? 'true' : 'false'}
                      onChange={e => setActive(e.target.value === 'true')}
                      className="text-xs bg-slate-900 border border-slate-600 rounded px-2 py-1 outline-none text-slate-300 font-bold"
                    >
                      <option value="true">ATIVO</option>
                      <option value="false">INATIVO</option>
                    </select>
                 </div>

                 <button type="submit" className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-950/400 text-white font-bold rounded-xl text-xs transition cursor-pointer mt-2 shadow-md">
                   Salvar Cliente
                 </button>
              </form>
            </div>
         </div>
      )}

    </div>
  );
}
