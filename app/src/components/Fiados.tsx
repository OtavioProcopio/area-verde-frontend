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
    <div className="space-y-5 pb-10">
      {/* DASHBOARD CARDS */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Total em aberto */}
        <div className="flex flex-col items-start justify-between rounded-2xl border border-counter-700 bg-counter-900 p-5">
          <div className="mb-3 flex w-full items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-counter-700 bg-counter-800">
              <Wallet className="text-cream-300" size={22} />
            </div>
            <span className="text-xs font-bold uppercase text-cream-400">
              Total
            </span>
          </div>
          <div>
            <p className="mb-1 text-xs font-bold uppercase text-cream-400">
              Valor em Aberto
            </p>
            <h3 className="font-mono text-2xl font-black text-cream-100">
              {fmt(totalEmAberto)}
            </h3>
          </div>
        </div>

        {/* Quantidade pendente */}
        <div className="flex flex-col items-start justify-between rounded-2xl border border-counter-700 bg-counter-900 p-5">
          <div className="mb-3 flex w-full items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-gold-500/30 bg-gold-500/10">
              <FileText className="text-gold-400" size={22} />
            </div>
            <span className="text-xs font-bold uppercase text-gold-400">
              Volume
            </span>
          </div>
          <div>
            <p className="mb-1 text-xs font-bold uppercase text-gold-300/80">
              Pendências
            </p>
            <h3 className="font-mono text-2xl font-black text-gold-400">
              {countAbertos} abertas
            </h3>
          </div>
        </div>

        {/* Vencidos */}
        <div className="flex flex-col items-start justify-between rounded-2xl border border-rose-400/30 bg-rose-400/10 p-5">
          <div className="mb-3 flex w-full items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-rose-400/30 bg-counter-900">
              <AlertOctagon className="text-rose-400" size={22} />
            </div>
            <span className="text-xs font-bold uppercase text-rose-400">
              Alerta
            </span>
          </div>
          <div>
            <p className="mb-1 text-xs font-bold uppercase text-rose-300/80">
              Dívidas Vencidas
            </p>
            <h3 className="font-mono text-2xl font-black text-rose-400">
              {fmt(totalVencidos)}
            </h3>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-counter-700 bg-counter-900 p-4 sm:flex-row">
        <div className="relative w-full sm:w-1/2 md:w-1/3">
          <Search
            size={19}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-cream-400"
          />
          <input
            type="text"
            placeholder="Busca por cliente ou comanda..."
            className="w-full rounded-xl border border-counter-700 bg-counter-950 py-2.5 pl-9 pr-3 text-sm text-cream-100 outline-none focus:border-gold-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-auto">
          <select
            className="w-full cursor-pointer rounded-xl border border-counter-700 bg-counter-950 px-3 py-2.5 text-sm font-bold text-cream-200 outline-none focus:border-gold-500"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
          >
            <option value="Abertos">Pendências em Aberto</option>
            <option value="Vencidos">Apenas Vencidos</option>
            <option value="Quitados">Histórico de Quitados</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-counter-700 bg-counter-900">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-counter-700 bg-counter-950 text-xs font-bold uppercase tracking-wide text-cream-400">
                <th className="px-5 py-3">Cliente</th>
                <th className="px-4 py-3">Referência</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Valores</th>
                <th className="px-4 py-3 text-right">Saldo Restante</th>
                <th className="px-5 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-counter-800">
              {filteredFiados.map((f) => {
                const c = customers.find((cust) => cust.id === f.customerId);
                const isOverdue =
                  new Date(f.dueDate) < now && f.status === 'aberto';
                const isQuitado = f.status === 'quitado';

                return (
                  <tr
                    key={f.id}
                    className={`transition hover:bg-counter-800 ${isOverdue ? 'bg-rose-400/5' : ''}`}
                  >
                    <td className="px-5 py-3.5">
                      <span className="block text-sm font-bold text-cream-100">
                        {c ? c.name : 'Desconhecido'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-mono text-xs font-bold text-cream-300">
                          {f.comandaId || 'Ajuste Manual'}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-cream-400">
                          <Clock size={12} />{' '}
                          {new Date(f.date).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {isQuitado ? (
                        <span className="rounded border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-xs font-bold uppercase text-emerald-400">
                          QUITADO
                        </span>
                      ) : isOverdue ? (
                        <span className="rounded border border-rose-400/30 bg-rose-400/10 px-2 py-0.5 text-xs font-bold uppercase text-rose-400">
                          VENCIDO
                        </span>
                      ) : (
                        <span className="rounded border border-gold-500/30 bg-gold-500/10 px-2 py-0.5 text-xs font-bold uppercase text-gold-400">
                          ABERTO
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="font-mono text-xs">
                        <div className="text-cream-400">
                          Orig: {fmt(f.originalValue)}
                        </div>
                        <div className="font-bold text-emerald-400">
                          Pago: {fmt(f.paidValue)}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span
                        className={`font-mono text-sm font-black ${isQuitado ? 'text-cream-400' : isOverdue ? 'text-rose-400' : 'text-gold-400'}`}
                      >
                        {fmt(f.remainingValue)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <button
                          onClick={() =>
                            alert(
                              `Comanda ID: ${f.comandaId}\nFuncionalidade em desenvolvimento.`,
                            )
                          }
                          className="flex items-center gap-1 rounded border border-counter-700 bg-counter-800 px-2.5 py-1.5 text-xs font-bold uppercase text-cream-300 transition hover:border-gold-500/50 hover:text-gold-300"
                          title="Ver Comanda"
                        >
                          <Eye size={16} /> Comanda
                        </button>
                        {!isQuitado && (
                          <button
                            onClick={() => openQuitar(f)}
                            className="flex items-center gap-1 rounded border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1.5 text-xs font-bold uppercase text-emerald-400 transition hover:bg-emerald-400/20"
                            title="Quitar Valor"
                          >
                            <CheckCircle size={16} /> Quitar
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
                    className="bg-counter-950/40 py-12 text-center text-sm italic text-cream-400"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-sm rounded-2xl border-2 border-emerald-400/30 bg-counter-900 p-5 shadow-2xl">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="absolute right-4 top-4 text-cream-400 hover:text-cream-100"
            >
              <X size={22} />
            </button>
            <h3 className="mb-1 flex items-center gap-2 font-display text-lg font-bold text-emerald-300">
              <CheckCircle className="text-emerald-400" size={24} />
              Quitar Pagamento
            </h3>
            <p className="mb-4 block text-xs font-bold uppercase text-emerald-400">
              Resumo da Dívida Atual: {fmt(selectedFiado.remainingValue)}
            </p>

            <form onSubmit={handleQuitar} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-cream-400">
                  Valor a Pagar (R$) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full rounded-lg border border-counter-700 bg-counter-950 px-3 py-2.5 font-mono text-xl font-black text-emerald-300 outline-none focus:border-emerald-400"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold text-cream-400">
                  Forma de Pagamento <span className="text-rose-400">*</span>
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
                      className={`rounded border px-2 py-2 text-xs font-bold transition ${
                        payMethod === item.id
                          ? 'border-emerald-400 bg-emerald-500 text-white shadow-xs'
                          : 'border-emerald-400/30 bg-counter-950 text-emerald-300 hover:bg-emerald-400/10'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-cream-400">
                  Motivo / Observação
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full rounded-lg border border-counter-700 bg-counter-950 px-3 py-2 text-sm text-cream-100 outline-none focus:border-emerald-400"
                  placeholder="Ex: Pagou parte em dinheiro"
                />
              </div>

              {/* Simulated resulting balance limit warning */}
              <div className="mt-4 rounded-xl border border-counter-700 bg-counter-800 p-3">
                <div className="flex items-center justify-between text-xs font-bold text-cream-400">
                  <span>Restará de saldo devedor:</span>
                  <span className="font-mono text-cream-100">
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
                className="mt-2 w-full rounded-xl bg-emerald-500 py-3 text-xs font-black text-white shadow-md transition hover:bg-emerald-400"
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
