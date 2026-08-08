import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCaixaState } from './useCaixaState';
import * as caixaService from '../services/caixaService';
import { EMPTY_CASHIER } from '../mappers/caixaMapper';

vi.mock('../services/caixaService');

describe('useCaixaState', () => {
  const refreshRef = { current: vi.fn().mockResolvedValue(undefined) };

  beforeEach(() => {
    vi.resetAllMocks();
    refreshRef.current = vi.fn().mockResolvedValue(undefined);
  });

  it('abrirCaixa retorna sucesso e atualiza o sistema quando a API funciona', async () => {
    vi.mocked(caixaService.openCaixa).mockResolvedValue(undefined as never);
    const { result } = renderHook(() => useCaixaState(refreshRef));

    let response;
    await act(async () => {
      response = await result.current.abrirCaixa(200, 'fundo de troco');
    });

    expect(response).toEqual({
      success: true,
      msg: 'Caixa aberto com sucesso.',
    });
    expect(refreshRef.current).toHaveBeenCalledTimes(1);
  });

  it('abrirCaixa retorna erro tratado em vez de lançar quando a API falha', async () => {
    vi.mocked(caixaService.openCaixa).mockRejectedValue(
      new Error('Falha de rede'),
    );
    const { result } = renderHook(() => useCaixaState(refreshRef));

    let response;
    await act(async () => {
      response = await result.current.abrirCaixa(200);
    });

    expect(response).toEqual({ success: false, msg: 'Falha de rede' });
    expect(refreshRef.current).not.toHaveBeenCalled();
  });

  it('fecharCaixa retorna erro tratado quando a API rejeita (ex: comanda aberta)', async () => {
    vi.mocked(caixaService.closeCaixa).mockRejectedValue(
      new Error('Não é possível fechar o caixa com comandas abertas'),
    );
    const { result } = renderHook(() => useCaixaState(refreshRef));

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
    const { result } = renderHook(() => useCaixaState(refreshRef));

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
