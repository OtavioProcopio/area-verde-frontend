import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useComandasState } from './useComandasState';
import * as comandasService from '../services/comandasService';
import type { Comanda } from '../../../types';

vi.mock('../services/comandasService');

const COMANDA_COM_ITEM: Comanda = {
  id: '1',
  code: 'Comanda 1',
  customerId: null,
  items: [
    {
      id: 'item-1',
      productId: '10',
      productName: 'Cerveja',
      quantity: 1,
      price: 10,
    },
  ],
  status: 'active',
  createdAt: '2026-01-01T00:00:00Z',
  discount: 0,
  addition: 0,
};

describe('useComandasState', () => {
  const refreshRef = { current: vi.fn().mockResolvedValue(undefined) };

  beforeEach(() => {
    vi.resetAllMocks();
    refreshRef.current = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  it('addComanda retorna a comanda criada quando a API funciona', async () => {
    vi.mocked(comandasService.createComanda).mockResolvedValue(
      COMANDA_COM_ITEM,
    );
    const { result } = renderHook(() => useComandasState(refreshRef));

    let response;
    await act(async () => {
      response = await result.current.addComanda('Comanda 1', null);
    });

    expect(response).toEqual({
      comanda: COMANDA_COM_ITEM,
      success: true,
      msg: 'Comanda criada com sucesso.',
    });
    expect(refreshRef.current).toHaveBeenCalledTimes(1);
  });

  it('addComanda retorna erro tratado em vez de lançar (ex: caixa fechado)', async () => {
    vi.mocked(comandasService.createComanda).mockRejectedValue(
      new Error('Nenhum caixa aberto encontrado'),
    );
    const { result } = renderHook(() => useComandasState(refreshRef));

    let response;
    await act(async () => {
      response = await result.current.addComanda('Comanda 1', null);
    });

    expect(response).toEqual({
      comanda: null,
      success: false,
      msg: 'Nenhum caixa aberto encontrado',
    });
  });

  it('cancelarComanda retorna erro tratado quando a API falha', async () => {
    vi.mocked(comandasService.cancelComanda).mockRejectedValue(
      new Error('Comanda já fechada'),
    );
    const { result } = renderHook(() => useComandasState(refreshRef));

    let response;
    await act(async () => {
      response = await result.current.cancelarComanda('1');
    });

    expect(response).toEqual({ success: false, msg: 'Comanda já fechada' });
  });

  it('addItemToComanda avisa com alert e retorna erro tratado quando a API falha', async () => {
    vi.mocked(comandasService.addItemToComanda).mockRejectedValue(
      new Error('Produto sem estoque'),
    );
    const { result } = renderHook(() => useComandasState(refreshRef));

    let response;
    await act(async () => {
      response = await result.current.addItemToComanda('1', {
        productId: '10',
        productName: 'Cerveja',
        quantity: 1,
        price: 10,
      });
    });

    expect(response).toEqual({ success: false, msg: 'Produto sem estoque' });
    expect(window.alert).toHaveBeenCalledWith('Produto sem estoque');
  });

  it('pagarComanda (dinheiro/pix/cartão) retorna erro tratado quando a API falha', async () => {
    vi.mocked(comandasService.closeComanda).mockRejectedValue(
      new Error('Comanda sem consumo para fechamento'),
    );
    const { result } = renderHook(() => useComandasState(refreshRef));

    act(() => {
      result.current.setComandas([COMANDA_COM_ITEM]);
    });

    let response;
    await act(async () => {
      response = await result.current.pagarComanda('1', 'dinheiro', 0, 0);
    });

    expect(response).toEqual({
      success: false,
      msg: 'Comanda sem consumo para fechamento',
    });
  });

  it('pagarComanda (fiado) retorna erro tratado quando a API falha', async () => {
    vi.mocked(comandasService.markComandaAsFiado).mockRejectedValue(
      new Error('Cliente inválido'),
    );
    const { result } = renderHook(() => useComandasState(refreshRef));

    act(() => {
      result.current.setComandas([COMANDA_COM_ITEM]);
    });

    let response;
    await act(async () => {
      response = await result.current.pagarComanda(
        '1',
        'fiado',
        0,
        0,
        'cliente-1',
      );
    });

    expect(response).toEqual({ success: false, msg: 'Cliente inválido' });
  });
});
