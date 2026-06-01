import type { ApiProduct } from '../products/types';

export type ApiStockMovement = {
  id: number;
  produtoId: number;
  produtoNome: string;
  tipo: 'ENTRADA' | 'SAIDA_VENDA' | 'DEVOLUCAO_CANCELAMENTO' | 'AJUSTE';
  origem: 'COMANDA' | 'ENTRADA_MANUAL' | 'AJUSTE_MANUAL' | 'CANCELAMENTO';
  quantidade: number | string;
  estoqueAntes: number | string;
  estoqueDepois: number | string;
  observacao?: string | null;
  criadoEm: string;
};

export type ApiStockProduct = ApiProduct;
