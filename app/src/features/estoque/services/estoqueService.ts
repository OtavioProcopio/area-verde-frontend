import { apiRequest } from '../../../lib/api';
import type { StockMovement } from '../../../types';
import { mapStockMovement } from '../mappers/stockMovementMapper';
import type { ApiStockMovement } from '../types';

export async function fetchStockMovements(
  productId: string,
): Promise<StockMovement[]> {
  const movements = await apiRequest<ApiStockMovement[]>(
    `/estoque/produtos/${productId}/movimentos`,
  );

  return movements.map(mapStockMovement);
}

export async function createStockEntry(
  productId: string,
  quantidade: number,
  observacao?: string,
) {
  await apiRequest(`/estoque/produtos/${productId}/entrada`, {
    method: 'POST',
    body: {
      quantidade,
      observacao,
    },
  });
}

export async function createStockAdjustment(
  productId: string,
  novoEstoque: number,
  observacao?: string,
) {
  await apiRequest(`/estoque/produtos/${productId}/ajuste`, {
    method: 'POST',
    body: {
      novoEstoque,
      observacao,
    },
  });
}
