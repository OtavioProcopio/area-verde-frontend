import type {Customer, CustomerHistoryEntry} from '../../../types';
import {toNumber} from '../../shared/utils/toNumber';
import type {ApiCustomerDetail, ApiCustomerPendencias} from '../types';

export function mapCustomer(
  detail: ApiCustomerDetail,
  pendencias: ApiCustomerPendencias,
): Customer {
  const history: CustomerHistoryEntry[] = pendencias.pendencias.map((pendencia) => ({
    id: `hist-${pendencia.comandaId}`,
    type: 'sale',
    amount: toNumber(pendencia.total),
    description: `Fiado da comanda #${pendencia.comandaId}`,
    timestamp: pendencia.pendenteEm || pendencia.abertaEm,
  }));

  return {
    id: String(detail.id),
    name: detail.nome,
    nickname: detail.apelido || undefined,
    phone: detail.telefone || '',
    balance: toNumber(pendencias.totalPendente),
    history,
    notes: detail.observacao || undefined,
    active: detail.ativo,
  };
}
