import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCaixaState } from '@/features/caixa/hooks/useCaixaState';
import * as caixaService from '@/features/caixa/services/caixaService';
import { EMPTY_CASHIER } from '@/features/caixa/mappers/caixaMapper';
import type { Cashier } from '@/types';

vi.mock('@/features/caixa/services/caixaService');

const CAIXA_ABERTO: Cashier = {
  ...EMPTY_CASHIER,
  id: '1',
  isOpen: true,
  currentCashInMoney: 200,
};

describe('useCaixaState', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('abrirCaixa retorna sucesso e atualiza o caixa com a resposta da API', async () => {
    vi.mocked(caixaService.openCaixa).mockResolvedValue(CAIXA_ABERTO);
    const { result } = renderHook(() => useCaixaState());

    let response;
    await act(async () => {
      response = await result.current.abrirCaixa(200, 'fundo de troco');
    });

    expect(response).toEqual({
      success: true,
      msg: 'Caixa aberto com sucesso.',
    });
    expect(result.current.caixa).toEqual(CAIXA_ABERTO);
  });

  it('abrirCaixa retorna erro tratado em vez de lançar quando a API falha', async () => {
    vi.mocked(caixaService.openCaixa).mockRejectedValue(
      new Error('Falha de rede'),
    );
    const { result } = renderHook(() => useCaixaState());

    let response;
    await act(async () => {
      response = await result.current.abrirCaixa(200);
    });

    expect(response).toEqual({ success: false, msg: 'Falha de rede' });
  });

  it('fecharCaixa retorna erro tratado quando a API rejeita (ex: comanda aberta)', async () => {
    vi.mocked(caixaService.closeCaixa).mockRejectedValue(
      new Error('Não é possível fechar o caixa com comandas abertas'),
    );
    const { result } = renderHook(() => useCaixaState());

    act(() => {
      result.current.setCaixa({
        ...EMPTY_CASHIER,
        id: '1',
        isOpen: true,
        currentCashInMoney: 50,
      });
    });

    let response;
    await act(async () => {
      response = await result.current.fecharCaixa();
    });

    expect(response).toEqual({
      success: false,
      msg: 'Não é possível fechar o caixa com comandas abertas',
    });
  });

  it('adicionarSuprimento e realizarSangria retornam erro tratado quando a API falha', async () => {
    vi.mocked(caixaService.createReforco).mockRejectedValue(
      new Error('erro reforço'),
    );
    vi.mocked(caixaService.createSangria).mockRejectedValue(
      new Error('erro sangria'),
    );
    const { result } = renderHook(() => useCaixaState());

    act(() => {
      result.current.setCaixa({
        ...EMPTY_CASHIER,
        id: '1',
        isOpen: true,
        currentCashInMoney: 50,
      });
    });

    let suprimento;
    let sangria;
    await act(async () => {
      suprimento = await result.current.adicionarSuprimento(10, 'desc');
      sangria = await result.current.realizarSangria(10, 'desc');
    });

    expect(suprimento).toEqual({ success: false, msg: 'erro reforço' });
    expect(sangria).toEqual({ success: false, msg: 'erro sangria' });
  });
});
