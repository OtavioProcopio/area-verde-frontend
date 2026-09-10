import React, { useMemo, useState } from 'react';
import { Customer, Fiado } from '../types';
import {
  Wallet,
  Search,
  CheckCircle,
  X,
  FileText,
  AlertOctagon,
  Clock,
  Eye,
} from 'lucide-react';

interface FiadosProps {
  fiados: Fiado[];
  customers: Customer[];
  caixaIsOpen: boolean;
  onPagarFiado: (
    customerId: string,
    amount: number,
    method: 'dinheiro' | 'pix' | 'cartao',
  ) => Promise<{ success: boolean; msg: string }>;
}

export default function Fiados({
  fiados,
  customers,
  caixaIsOpen,
  onPagarFiado,
}: FiadosProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<
    'Abertos' | 'Vencidos' | 'Quitados'
  >('Abertos');

  // Modal state
  const [activeModal, setActiveModal] = useState<
    'quitar' | 'ver_comanda' | null
  >(null);
  const [selectedFiado, setSelectedFiado] = useState<Fiado | null>(null);

  // Payment fields
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<'dinheiro' | 'pix' | 'cartao'>(
    'dinheiro',
  );
  const [note, setNote] = useState('');

  // Filtering
  const now = new Date();
  const filteredFiados = useMemo(
    () =>
      fiados.filter((f) => {
        if (filterStatus === 'Abertos') {
          if (f.status !== 'aberto') return false;
        } else if (filterStatus === 'Vencidos') {
          if (f.status !== 'aberto') return false;
          if (new Date(f.dueDate) > now) return false;
        } else if (filterStatus === 'Quitados') {
          if (f.status !== 'quitado') return false;
        }

        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          const cust = customers.find((c) => c.id === f.customerId);
          const name = cust ? cust.name.toLowerCase() : '';
          const nick = cust?.nickname ? cust.nickname.toLowerCase() : '';
          if (
            !name.includes(term) &&
            !nick.includes(term) &&
            !f.comandaId?.toLowerCase().includes(term)
          ) {
            return false;
          }
        }
        return true;
      }),
    [customers, fiados, filterStatus, now, searchTerm],
  );

  const totalEmAberto = fiados
    .filter((f) => f.status === 'aberto')
    .reduce((acc, f) => acc + f.remainingValue, 0);
  const totalVencidos = fiados
    .filter((f) => f.status === 'aberto' && new Date(f.dueDate) < now)
    .reduce((acc, f) => acc + f.remainingValue, 0);
  const countAbertos = fiados.filter((f) => f.status === 'aberto').length;

  const openQuitar = (f: Fiado) => {
    setSelectedFiado(f);
    setPayAmount(f.remainingValue.toFixed(2));
    setPayMethod('dinheiro');
    setNote('');
    setActiveModal('quitar');
  };

  const handleQuitar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFiado) return;
    const amountVal = parseFloat(payAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      alert('Valor inválido.');
      return;
    }

    if (amountVal > selectedFiado.remainingValue) {
      alert(
        'Valor não pode ser maior que o saldo devedor ($' +
          selectedFiado.remainingValue +
          ')',
      );
      return;
    }

    if (!caixaIsOpen && payMethod === 'dinheiro') {
      alert(
        'Atenção: O caixa do bar está FECHADO! Abra o caixa para receber pagamentos em dinheiro.',
      );
      return;
    }

    if (!window.confirm(`Confirmar o pagamento de $${amountVal.toFixed(2)}?`))
      return;

    const result = await onPagarFiado(
      selectedFiado.customerId,
      amountVal,
      payMethod,
    );
    alert(result.msg);
    if (result.success) {
      setActiveModal(null);
    }
  };

  const fmt = (v: number) =>
    `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* DASHBOARD CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total em aberto */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between items-start hover:shadow-md transition">
          <div className="flex justify-between items-center w-full mb-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
              <Wallet className="text-slate-500" size={18} />
            </div>
            <span className="text-[11px] font-mono text-slate-500 font-bold uppercase">
              Total
            </span>
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase mb-1">
              Valor em Aberto
            </p>
            <h3 className="text-2xl font-black font-mono text-slate-700">
              {fmt(totalEmAberto)}
            </h3>
          </div>
        </div>

        {/* Quantidade pendente */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between items-start hover:shadow-md transition">
          <div className="flex justify-between items-center w-full mb-3">
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center border border-amber-200">
              <FileText className="text-amber-600" size={18} />
            </div>
            <span className="text-[11px] font-mono text-amber-700 font-bold uppercase">
              Volume
            </span>
          </div>
          <div>
            <p className="text-xs text-amber-600/80 font-bold uppercase mb-1">
              Pendências
            </p>
            <h3 className="text-2xl font-black font-mono text-amber-600">
              {countAbertos} abertas
            </h3>
          </div>
        </div>

        {/* Vencidos */}
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between items-start hover:shadow-md transition">
          <div className="flex justify-between items-center w-full mb-3">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-rose-200">
              <AlertOctagon className="text-rose-600" size={18} />
            </div>
            <span className="text-[11px] font-mono text-rose-700 font-bold uppercase">
              Alerta
            </span>
          </div>
          <div>
            <p className="text-xs text-rose-600/80 font-bold uppercase mb-1">
              Dívidas Vencidas
            </p>
            <h3 className="text-2xl font-black font-mono text-rose-600">
              {fmt(totalVencidos)}
            </h3>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-1/2 md:w-1/3">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            type="text"
            placeholder="Busca por cliente ou comanda..."
            className="w-full pl-9 pr-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs outline-none focus:border-amber-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-auto">
          <select
            className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs outline-none focus:border-amber-400 cursor-pointer text-slate-600 font-bold"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
          >
            <option value="Abertos">Pendências em Aberto</option>
            <option value="Vencidos">Apenas Vencidos</option>
            <option value="Quitados">Histórico de Quitados</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs text-slate-600">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] uppercase font-mono tracking-wider text-slate-500 bg-slate-100">
                <th className="px-5 py-3">Cliente</th>
                <th className="px-4 py-3">Referência</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Valores</th>
                <th className="px-4 py-3 text-right">Saldo Restante</th>
                <th className="px-5 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredFiados.map((f) => {
                const c = customers.find((cust) => cust.id === f.customerId);
                const isOverdue =
                  new Date(f.dueDate) < now && f.status === 'aberto';
                const isQuitado = f.status === 'quitado';

                return (
                  <tr
                    key={f.id}
                    className={`hover:bg-slate-100/80 transition ${isOverdue ? 'bg-rose-50/20' : ''}`}
                  >
                    <td className="px-5 py-3">
                      <span className="font-bold text-slate-700 block text-sm">
                        {c ? c.name : 'Desconhecido'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-mono text-slate-500 font-bold text-xs">
                          {f.comandaId || 'Ajuste Manual'}
                        </span>
                        <span className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Clock size={10} />{' '}
                          {new Date(f.date).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {isQuitado ? (
                        <span className="px-2 py-0.5 rounded text-[11px] uppercase font-bold font-mono border bg-emerald-50 text-emerald-700 border-emerald-200">
                          QUITADO
                        </span>
                      ) : isOverdue ? (
                        <span className="px-2 py-0.5 rounded text-[11px] uppercase font-bold font-mono border bg-rose-50 text-rose-700 border-rose-200">
                          VENCIDO
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[11px] uppercase font-bold font-mono border bg-amber-50 text-amber-700 border-amber-200">
                          ABERTO
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="text-[11px] font-mono">
                        <div className="text-slate-500">
                          Orig: {fmt(f.originalValue)}
                        </div>
                        <div className="text-emerald-600 font-bold">
                          Pago: {fmt(f.paidValue)}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`font-mono text-sm font-black ${isQuitado ? 'text-slate-500' : isOverdue ? 'text-rose-600' : 'text-amber-600'}`}
                      >
                        {fmt(f.remainingValue)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5 inline-flex">
                        <button
                          onClick={() =>
                            alert(
                              `Comanda ID: ${f.comandaId}\nFuncionalidade em desenvolvimento.`,
                            )
                          }
                          className="px-2 py-1 flex items-center gap-1 bg-slate-100 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 text-slate-500 hover:text-emerald-700 rounded transition cursor-pointer font-bold text-[11px] uppercase"
                          title="Ver Comanda"
                        >
                          <Eye size={12} /> Comanda
                        </button>
                        {!isQuitado && (
                          <button
                            onClick={() => openQuitar(f)}
                            className="px-2 py-1 flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded transition cursor-pointer font-bold text-[11px] uppercase"
                            title="Quitar Valor"
                          >
                            <CheckCircle size={12} /> Quitar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredFiados.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-12 text-slate-500 italic text-xs bg-slate-100/30"
                  >
                    Nenhuma pendência encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: QUITAR */}
      {activeModal === 'quitar' && selectedFiado && (
        <div className="fixed inset-0 bg-slate-50 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white border border-emerald-200 rounded-2xl p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-900 cursor-pointer"
            >
              <X size={18} />
            </button>
            <h3 className="text-lg font-display font-bold text-emerald-700 mb-1 flex items-center gap-2">
              <CheckCircle className="text-emerald-600" size={20} />
              Quitar Pagamento
            </h3>
            <p className="text-[11px] font-mono text-emerald-600 mb-4 block uppercase font-bold">
              Resumo da Dívida Atual: {fmt(selectedFiado.remainingValue)}
            </p>

            <form onSubmit={handleQuitar} className="space-y-4">
              <div>
                <label className="block text-[11px] uppercase font-mono text-slate-500 mb-1">
                  Valor a Pagar (R$) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full bg-slate-100 border border-slate-200 px-3 py-2 text-xl text-slate-700 font-mono font-black rounded-lg outline-none focus:border-emerald-500 focus:bg-white text-emerald-700"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase font-mono text-slate-500 mb-2">
                  Forma de Pagamento <span className="text-rose-600">*</span>
                </label>
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
                      className={`px-2 py-1.5 text-[11px] rounded font-bold border transition cursor-pointer ${
                        payMethod === item.id
                          ? 'bg-emerald-600 border-emerald-300 text-white shadow-xs'
                          : 'bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase font-mono text-slate-500 mb-1">
                  Motivo / Observação
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full bg-slate-100 border border-slate-200 px-3 py-2 text-xs text-slate-700 rounded-lg outline-none focus:border-emerald-500 focus:bg-white"
                  placeholder="Ex: Pagou parte em dinheiro"
                />
              </div>

              {/* Simulated resulting balance limit warning */}
              <div className="bg-slate-100 border border-slate-200 p-3 rounded-xl mt-4">
                <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                  <span>Restará de saldo devedor:</span>
                  <span className="font-mono text-slate-900">
                    {fmt(
                      Math.max(
                        0,
                        selectedFiado.remainingValue -
                          (parseFloat(payAmount) || 0),
                      ),
                    )}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs transition cursor-pointer mt-2 shadow-md"
              >
                COMFIRMAR PAGAMENTO
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
