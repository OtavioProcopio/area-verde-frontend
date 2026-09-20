import type { Cashier, ClosedCashier } from '../../../types';
import { apiRequest } from '../../../lib/api';
import {
  EMPTY_CASHIER,
  isCaixaNaoEncontrado,
  mapCaixa,
  mapClosedCaixa,
} from '../mappers/caixaMapper';
import type { ApiCaixaDetail, ApiCaixaSummary } from '../types';

export async function fetchCaixaAtual(): Promise<Cashier> {
  try {
    const caixa = await apiRequest<ApiCaixaDetail>('/caixas/aberto');
    return mapCaixa(caixa);
  } catch (error) {
    if (isCaixaNaoEncontrado(error)) {
      return EMPTY_CASHIER;
    }

    throw error;
  }
}

export async function fetchCaixasHistory(): Promise<ClosedCashier[]> {
  const caixas = await apiRequest<ApiCaixaSummary[]>('/caixas?status=FECHADO');
  return caixas.map(mapClosedCaixa);
}

// As mutações abaixo já retornam o CaixaDetalheResponse completo e
// atualizado — mapeamos direto da resposta, sem precisar de refetch.

export async function openCaixa(
  valorInicial: number,
  observacao?: string,
): Promise<Cashier> {
  const caixa = await apiRequest<ApiCaixaDetail>('/caixas/abrir', {
    method: 'POST',
    body: {
      valorInicial,
      observacao,
    },
  });
  return mapCaixa(caixa);
}

export async function closeCaixa(
  caixaId: string,
  dinheiroInformado: number,
  observacao?: string,
): Promise<Cashier> {
  const caixa = await apiRequest<ApiCaixaDetail>(`/caixas/${caixaId}/fechar`, {
    method: 'POST',
    body: {
      dinheiroInformado,
      observacao,
    },
  });
  return mapCaixa(caixa);
}

export async function createReforco(
  caixaId: string,
  valor: number,
  observacao: string,
): Promise<Cashier> {
  const caixa = await apiRequest<ApiCaixaDetail>(
    `/caixas/${caixaId}/reforcos`,
    {
      method: 'POST',
      body: {
        valor,
        observacao,
      },
    },
  );
  return mapCaixa(caixa);
}

export async function createSangria(
  caixaId: string,
  valor: number,
  observacao: string,
): Promise<Cashier> {
  const caixa = await apiRequest<ApiCaixaDetail>(
    `/caixas/${caixaId}/sangrias`,
    {
      method: 'POST',
      body: {
        valor,
        observacao,
      },
    },
  );
  return mapCaixa(caixa);
}
