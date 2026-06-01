import {apiRequest} from '../../../lib/api';
import type {Comanda, TabItem} from '../../../types';
import {toApiPaymentMethod} from '../../shared/mappers/apiValueMappers';
import {mapComanda} from '../mappers/comandaMapper';
import type {ApiComandaDetail, ApiComandaSummary, ApiPagamento} from '../types';

export async function fetchComandas(): Promise<Comanda[]> {
  const comandas = await apiRequest<ApiComandaSummary[]>('/comandas');
  const detailedComandas = await Promise.all(
    comandas.map(async (comanda) => {
      const [detail, payments] = await Promise.all([
        apiRequest<ApiComandaDetail>(`/comandas/${comanda.id}`),
        comanda.status === 'FECHADA' || comanda.status === 'PENDENTE'
          ? apiRequest<ApiPagamento[]>(`/comandas/${comanda.id}/pagamentos`)
          : Promise.resolve([]),
      ]);
      return mapComanda(detail, payments);
    }),
  );

  return detailedComandas;
}

export async function createComanda(
  code: string,
  customerId: string | null = null,
): Promise<Comanda> {
  const created = await apiRequest<ApiComandaDetail>('/comandas', {
    method: 'POST',
    body: {
      nomeCliente: code,
      clienteId: customerId ? Number(customerId) : undefined,
    },
  });

  return mapComanda(created, []);
}

export async function linkCustomerToComanda(
  comandaId: string,
  customerId: string,
) {
  await apiRequest(`/comandas/${comandaId}/cliente`, {
    method: 'PATCH',
    body: {
      clienteId: Number(customerId),
    },
  });
}

export async function cancelComanda(comandaId: string) {
  await apiRequest(`/comandas/${comandaId}/cancelar`, {
    method: 'PATCH',
    body: {},
  });
}

export async function addItemToComanda(
  comandaId: string,
  item: Omit<TabItem, 'id'>,
) {
  await apiRequest(`/comandas/${comandaId}/itens`, {
    method: 'POST',
    body: {
      produtoId: Number(item.productId),
      quantidade: item.quantity,
    },
  });
}

export async function deleteComandaItem(comandaId: string, itemId: string) {
  await apiRequest(`/comandas/${comandaId}/itens/${itemId}`, {
    method: 'DELETE',
  });
}

export async function incrementComandaItem(
  comandaId: string,
  itemId: string,
  quantidade: number,
) {
  await apiRequest(`/comandas/${comandaId}/itens/${itemId}/incrementar`, {
    method: 'PATCH',
    body: {quantidade},
  });
}

export async function decrementComandaItem(
  comandaId: string,
  itemId: string,
  quantidade: number,
) {
  await apiRequest(`/comandas/${comandaId}/itens/${itemId}/diminuir`, {
    method: 'PATCH',
    body: {quantidade},
  });
}

export async function markComandaAsFiado(
  comandaId: string,
  customerId: string,
) {
  await apiRequest(`/comandas/${comandaId}/fiado`, {
    method: 'POST',
    body: {
      clienteId: Number(customerId),
    },
  });
}

export async function closeComanda(
  comandaId: string,
  metodo: 'dinheiro' | 'pix' | 'cartao' | 'fiado',
  valorPago: number,
) {
  await apiRequest(`/comandas/${comandaId}/fechar`, {
    method: 'POST',
    body: {
      formaPagamento: toApiPaymentMethod(metodo),
      valorPago,
    },
  });
}
