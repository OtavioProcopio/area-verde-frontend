import type { Comanda, TabItem } from '../../../types';
import {
  mapComandaStatus,
  mapPaymentMethod,
} from '../../shared/mappers/apiValueMappers';
import { toNumber } from '../../shared/utils/toNumber';
import type { ApiComandaDetail, ApiPagamento } from '../types';

export function mapComanda(
  detail: ApiComandaDetail,
  payments: ApiPagamento[],
): Comanda {
  const paymentMethod =
    detail.status === 'PENDENTE'
      ? 'fiado'
      : mapPaymentMethod(payments[0]?.formaPagamento);

  return {
    id: String(detail.id),
    code: detail.nomeClienteSnapshot || detail.nomeCliente,
    customerId:
      detail.clienteId === null || detail.clienteId === undefined
        ? null
        : String(detail.clienteId),
    items: detail.itens.map(
      (item): TabItem => ({
        id: String(item.id),
        productId: item.produtoId
          ? String(item.produtoId)
          : `custom-${item.id}`,
        productName: item.nomeProduto,
        quantity: toNumber(item.quantidade),
        price: toNumber(item.precoUnitario),
      }),
    ),
    status: mapComandaStatus(detail.status),
    createdAt: detail.abertaEm,
    paidAt: detail.fechadaEm || undefined,
    discount: 0,
    addition: 0,
    paymentMethod,
  };
}
