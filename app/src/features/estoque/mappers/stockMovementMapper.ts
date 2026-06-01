import type { StockMovement } from '../../../types';
import { toNumber } from '../../shared/utils/toNumber';
import type { ApiStockMovement } from '../types';

export function mapStockMovement(movement: ApiStockMovement): StockMovement {
  return {
    id: String(movement.id),
    productId: String(movement.produtoId),
    type:
      movement.tipo === 'ENTRADA'
        ? 'entrada'
        : movement.tipo === 'AJUSTE'
          ? 'ajuste'
          : 'saida',
    quantity: toNumber(movement.quantidade),
    date: movement.criadoEm,
    origin: movement.origem,
    note: movement.observacao || undefined,
    previousBalance: toNumber(movement.estoqueAntes),
    newBalance: toNumber(movement.estoqueDepois),
  };
}
