import { apiRequest } from '../../../lib/api';
import type { Comanda, TabItem } from '../../../types';
import { toApiPaymentMethod } from '../../shared/mappers/apiValueMappers';
import { mapComanda } from '../mappers/comandaMapper';
import type {
  ApiComandaDetail,
  ApiComandaSummary,
  ApiPagamento,
} from '../types';

async function fetchComandaPayments(
  comandaId: string | number,
  status: ApiComandaSummary['status'],
): Promise<ApiPagamento[]> {
  return status === 'FECHADA' || status === 'PENDENTE'
    ? apiRequest<ApiPagamento[]>(`/comandas/${comandaId}/pagamentos`)
    : [];
}

export async function fetchComandas(): Promise<Comanda[]> {
  const comandas = await apiRequest<ApiComandaSummary[]>('/comandas');
  const detailedComandas = await Promise.all(
    comandas.map(async (comanda) => {
      const [detail, payments] = await Promise.all([
        apiRequest<ApiComandaDetail>(`/comandas/${comanda.id}`),
        fetchComandaPayments(comanda.id, comanda.status),
      ]);
      return mapComanda(detail, payments);
    }),
  );

  return detailedComandas;
}

export async function fetchComandaById(comandaId: string): Promise<Comanda> {
  const detail = await apiRequest<ApiComandaDetail>(`/comandas/${comandaId}`);
  const payments = await fetchComandaPayments(comandaId, detail.status);
  return mapComanda(detail, payments);
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

// As mutações de comanda abaixo (cliente, cancelar, itens) já retornam o
// ComandaDetalheResponse completo e atualizado — mapeamos direto da
// resposta, sem precisar de um refetch (nem da comanda, nem do sistema).

export async function linkCustomerToComanda(
  comandaId: string,
  customerId: string,
): Promise<Comanda> {
  const detail = await apiRequest<ApiComandaDetail>(
    `/comandas/${comandaId}/cliente`,
    {
      method: 'PATCH',
      body: {
        clienteId: Number(customerId),
      },
    },
  );
  return mapComanda(
    detail,
    await fetchComandaPayments(comandaId, detail.status),
  );
}

export async function cancelComanda(comandaId: string): Promise<Comanda> {
  const detail = await apiRequest<ApiComandaDetail>(
    `/comandas/${comandaId}/cancelar`,
    {
      method: 'PATCH',
      body: {},
    },
  );
  return mapComanda(detail, []);
}

export async function addItemToComanda(
  comandaId: string,
  item: Omit<TabItem, 'id'>,
): Promise<Comanda> {
  const detail = await apiRequest<ApiComandaDetail>(
    `/comandas/${comandaId}/itens`,
    {
      method: 'POST',
      body: {
        produtoId: Number(item.productId),
        quantidade: item.quantity,
      },
    },
  );
  return mapComanda(detail, []);
}

export async function deleteComandaItem(
  comandaId: string,
  itemId: string,
): Promise<Comanda> {
  const detail = await apiRequest<ApiComandaDetail>(
    `/comandas/${comandaId}/itens/${itemId}`,
    { method: 'DELETE' },
  );
  return mapComanda(detail, []);
}

export async function incrementComandaItem(
  comandaId: string,
  itemId: string,
  quantidade: number,
): Promise<Comanda> {
  const detail = await apiRequest<ApiComandaDetail>(
    `/comandas/${comandaId}/itens/${itemId}/incrementar`,
    {
      method: 'PATCH',
      body: { quantidade },
    },
  );
  return mapComanda(detail, []);
}

export async function decrementComandaItem(
  comandaId: string,
  itemId: string,
  quantidade: number,
): Promise<Comanda> {
  const detail = await apiRequest<ApiComandaDetail>(
    `/comandas/${comandaId}/itens/${itemId}/diminuir`,
    {
      method: 'PATCH',
      body: { quantidade },
    },
  );
  return mapComanda(detail, []);
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
