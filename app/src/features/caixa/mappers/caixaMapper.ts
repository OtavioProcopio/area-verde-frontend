import {ApiError} from '../../../lib/api';
import type {Cashier, CashierLog, ClosedCashier} from '../../../types';
import {mapPaymentMethod} from '../../shared/mappers/apiValueMappers';
import {toNumber} from '../../shared/utils/toNumber';
import type {ApiCaixaDetail, ApiCaixaSummary} from '../types';

export const EMPTY_CASHIER: Cashier = {
  isOpen: false,
  openedAt: null,
  closedAt: null,
  initialCash: 0,
  currentCashInMoney: 0,
  logs: [],
};

export function isCaixaNaoEncontrado(error: unknown) {
  return (
    error instanceof ApiError &&
    typeof error.payload === 'object' &&
    error.payload !== null &&
    'code' in error.payload &&
    error.payload.code === 'caixa_aberto_nao_encontrado'
  );
}

export function mapCaixa(detail: ApiCaixaDetail): Cashier {
  const logs: CashierLog[] = [
    ...detail.movimentos.map<CashierLog>((movement) => ({
      id: `mov-${movement.id}`,
      type:
        movement.tipo === 'ABERTURA'
          ? 'abertura'
          : movement.tipo === 'REFORCO'
            ? 'suprimento'
            : 'sangria',
      amount: toNumber(movement.valor),
      paymentMethod: 'dinheiro',
      description: movement.observacao || movement.tipo,
      timestamp: movement.criadoEm,
    })),
    ...detail.pagamentos.map<CashierLog>((payment) => ({
      id: `pag-${payment.id}`,
      type: payment.formaPagamento === 'FIADO' ? 'recebimento_fiado' : 'venda',
      amount: toNumber(payment.valor),
      paymentMethod: mapPaymentMethod(payment.formaPagamento) || 'dinheiro',
      description: `Pagamento da comanda #${payment.comandaId}`,
      timestamp: payment.criadoEm,
    })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return {
    id: String(detail.id),
    isOpen: detail.status === 'ABERTO',
    openedAt: detail.abertoEm,
    closedAt: detail.fechadoEm || null,
    initialCash: toNumber(detail.valorInicial),
    currentCashInMoney: toNumber(detail.dinheiroEsperado),
    logs,
    notes: logs[0]?.description,
  };
}

export function mapClosedCaixa(summary: ApiCaixaSummary): ClosedCashier {
  return {
    id: String(summary.id),
    openedAt: summary.abertoEm,
    closedAt: summary.fechadoEm || summary.abertoEm,
    initialCash: toNumber(summary.valorInicial),
    totalVendido: 0,
    totalReforcos: 0,
    totalSangrias: 0,
    finalCashInMoney: toNumber(summary.dinheiroEsperado),
    status: 'fechado',
  };
}
