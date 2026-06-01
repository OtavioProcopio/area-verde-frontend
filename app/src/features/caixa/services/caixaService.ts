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

export async function openCaixa(valorInicial: number, observacao?: string) {
  await apiRequest('/caixas/abrir', {
    method: 'POST',
    body: {
      valorInicial,
      observacao,
    },
  });
}

export async function closeCaixa(
  caixaId: string,
  dinheiroInformado: number,
  observacao?: string,
) {
  await apiRequest(`/caixas/${caixaId}/fechar`, {
    method: 'POST',
    body: {
      dinheiroInformado,
      observacao,
    },
  });
}

export async function createReforco(
  caixaId: string,
  valor: number,
  observacao: string,
) {
  await apiRequest(`/caixas/${caixaId}/reforcos`, {
    method: 'POST',
    body: {
      valor,
      observacao,
    },
  });
}

export async function createSangria(
  caixaId: string,
  valor: number,
  observacao: string,
) {
  await apiRequest(`/caixas/${caixaId}/sangrias`, {
    method: 'POST',
    body: {
      valor,
      observacao,
    },
  });
}
