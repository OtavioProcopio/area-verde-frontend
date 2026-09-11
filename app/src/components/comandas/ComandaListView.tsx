import { useState } from 'react';
import { PlusCircle, Receipt, Search, User } from 'lucide-react';
import { Comanda, Customer } from '../../types';
import { formatCurrency } from '../../features/shared/utils/formatCurrency';
import { getComandaTotals } from './comandaCalculations';

type StatusFilter = 'all' | 'active' | 'paid' | 'cancelled' | 'fiado';

const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'Todas' },
  { id: 'active', label: 'Abertas' },
  { id: 'fiado', label: 'Pendente / fiado' },
  { id: 'paid', label: 'Fechadas / pagas' },
  { id: 'cancelled', label: 'Canceladas' },
];

interface ComandaListViewProps {
  comandas: Comanda[];
  customers: Customer[];
  onOpenComanda: (id: string) => void;
  onRequestCancelComanda: (id: string, code: string) => void;
  onNewComanda: () => void;
}

function getStatusMeta(comanda: Comanda) {
  if (comanda.status === 'active') {
    return {
      label: 'Aberta',
      edge: 'bg-gold-500',
      pill: 'bg-gold-500/15 text-gold-300 border border-gold-500/30',
    };
  }
  if (comanda.status === 'cancelled') {
    return {
      label: 'Cancelada',
      edge: 'bg-cream-400/40',
      pill: 'bg-cream-400/10 text-cream-300 border border-cream-400/20',
    };
  }
  if (comanda.paymentMethod === 'fiado') {
    return {
      label: 'Pendente (fiado)',
      edge: 'bg-rose-400',
      pill: 'bg-rose-400/15 text-rose-300 border border-rose-400/30',
    };
  }
  return {
    label: 'Paga',
    edge: 'bg-emerald-400',
    pill: 'bg-emerald-400/15 text-emerald-300 border border-emerald-400/30',
  };
}

export function ComandaListView({
  comandas,
  customers,
  onOpenComanda,
  onRequestCancelComanda,
  onNewComanda,
}: ComandaListViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const filteredComandas = comandas
    .filter((c) => {
      const term = searchTerm.toLowerCase();
      const customer = customers.find((cu) => cu.id === c.customerId);
      const matchesSearch =
        !term ||
        c.code.toLowerCase().includes(term) ||
        c.id.toLowerCase().includes(term) ||
        Boolean(customer?.name.toLowerCase().includes(term));
      if (!matchesSearch) return false;

      if (statusFilter === 'active') return c.status === 'active';
      if (statusFilter === 'paid')
        return c.status === 'paid' && c.paymentMethod !== 'fiado';
      if (statusFilter === 'cancelled') return c.status === 'cancelled';
      if (statusFilter === 'fiado') return c.paymentMethod === 'fiado';
      return true;
    })
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

  return (
    <div className="overflow-hidden rounded-2xl border-2 border-counter-700 bg-counter-950">
      <div className="flex flex-col items-start justify-between gap-3 border-b-2 border-counter-700 bg-counter-900 p-5 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-counter-950 text-gold-400">
            <Receipt size={26} />
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-cream-100">
              Comandas
            </h2>
            <p className="text-sm text-cream-400">
              Tickets ativos, fechados e pendências de fiado.
            </p>
          </div>
        </div>
        <button
          type="button"
          id="btn-spawn-comanda-list"
          onClick={onNewComanda}
          className="flex items-center gap-2 rounded-xl bg-gold-500 px-5 py-3 text-sm font-bold text-counter-950 shadow-md transition hover:bg-gold-400"
        >
          <PlusCircle size={22} />
          Nova comanda
        </button>
      </div>

      <div className="flex flex-col items-stretch justify-between gap-3 border-b-2 border-counter-700 bg-counter-900/60 p-4 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search
            size={22}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cream-400"
          />
          <input
            type="text"
            placeholder="Buscar por nome, id ou cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-counter-700 bg-counter-950 py-2.5 pl-10 pr-3 text-sm text-cream-100 outline-none placeholder:text-cream-400/50 focus:border-gold-500"
          />
        </div>

        <div className="flex w-full gap-1.5 overflow-x-auto sm:w-auto">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setStatusFilter(f.id)}
              className={`shrink-0 rounded-lg px-3.5 py-2 text-sm font-semibold transition ${
                statusFilter === f.id
                  ? 'bg-gold-500 text-counter-950'
                  : 'border border-counter-700 bg-counter-800 text-cream-300 hover:border-gold-500/50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4 p-5">
        {filteredComandas.map((c) => {
          const totals = getComandaTotals(c);
          const boundCustomer = customers.find((cu) => cu.id === c.customerId);
          const status = getStatusMeta(c);

          return (
            <div
              key={c.id}
              data-testid="comanda-card"
              className="relative flex flex-col overflow-hidden rounded-lg border border-counter-700 bg-counter-900"
            >
              <span
                className={`absolute inset-x-0 top-0 h-1.5 ${status.edge}`}
              />

              <div className="flex items-start justify-between gap-2 p-4 pb-3 pt-5">
                <div className="min-w-0">
                  <div className="truncate font-display text-lg font-bold text-cream-100">
                    {c.code}
                  </div>
                  <div className="mt-0.5 font-mono text-xs text-cream-400">
                    {new Date(c.createdAt).toLocaleTimeString('pt-BR')}
                  </div>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${status.pill}`}
                >
                  {status.label}
                </span>
              </div>

              <div className="px-4 pb-3">
                {boundCustomer ? (
                  <span className="inline-flex items-center gap-1.5 rounded bg-counter-800 px-2.5 py-1 text-sm font-semibold text-cream-200">
                    <User size={16} /> {boundCustomer.name}
                  </span>
                ) : (
                  <span className="text-sm italic text-cream-400">Avulso</span>
                )}
              </div>

              <div className="mt-auto border-t border-counter-700 bg-counter-950 p-4">
                <div className="flex items-end justify-between">
                  <div>
                    <span className="block text-[11px] font-bold uppercase text-cream-400">
                      {totals.restante > 0 ? 'Restante' : 'Total'}
                    </span>
                    <span className="font-mono text-xl font-black text-gold-400">
                      {formatCurrency(
                        totals.restante > 0 ? totals.restante : totals.total,
                      )}
                    </span>
                  </div>
                  {totals.pago > 0 && (
                    <span className="font-mono text-xs font-bold text-emerald-400">
                      pago {formatCurrency(totals.pago)}
                    </span>
                  )}
                </div>

                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenComanda(c.id)}
                    className="flex-1 rounded-lg border border-counter-700 bg-counter-800 py-2 text-xs font-bold text-cream-200 transition hover:border-gold-500 hover:text-gold-300"
                  >
                    Abrir
                  </button>
                  {c.status === 'active' && (
                    <button
                      type="button"
                      onClick={() => onRequestCancelComanda(c.id, c.code)}
                      className="flex-1 rounded-lg border border-rose-500/30 bg-rose-500/10 py-2 text-xs font-bold text-rose-300 transition hover:bg-rose-500/20"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {filteredComandas.length === 0 && (
          <p className="col-span-full py-14 text-center text-sm italic text-cream-400">
            Nenhuma comanda encontrada para os filtros selecionados.
          </p>
        )}
      </div>
    </div>
  );
}
