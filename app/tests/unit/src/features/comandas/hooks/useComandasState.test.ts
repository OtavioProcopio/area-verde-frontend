import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useComandasState } from '@/features/comandas/hooks/useComandasState';
import * as comandasService from '@/features/comandas/services/comandasService';
import type { Comanda } from '@/types';

vi.mock('@/features/comandas/services/comandasService');

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
  const refreshCaixa = vi.fn().mockResolvedValue(undefined);
  const refreshFiados = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.resetAllMocks();
    refreshCaixa.mockResolvedValue(undefined);
    refreshFiados.mockResolvedValue(undefined);
  });

  it('addComanda retorna a comanda criada quando a API funciona', async () => {
    vi.mocked(comandasService.createComanda).mockResolvedValue(
      COMANDA_COM_ITEM,
    );
    const { result } = renderHook(() =>
      useComandasState(refreshCaixa, refreshFiados),
    );

    let response;
    await act(async () => {
      response = await result.current.addComanda('Comanda 1', null);
    });

    expect(response).toEqual({
      comanda: COMANDA_COM_ITEM,
      success: true,
      msg: 'Comanda criada com sucesso.',
    });
    expect(result.current.comandas).toEqual([COMANDA_COM_ITEM]);
  });

  it('addComanda retorna erro tratado em vez de lançar (ex: caixa fechado)', async () => {
    vi.mocked(comandasService.createComanda).mockRejectedValue(
      new Error('Nenhum caixa aberto encontrado'),
    );
    const { result } = renderHook(() =>
      useComandasState(refreshCaixa, refreshFiados),
    );

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
    const { result } = renderHook(() =>
      useComandasState(refreshCaixa, refreshFiados),
    );

    let response;
    await act(async () => {
      response = await result.current.cancelarComanda('1');
    });

    expect(response).toEqual({ success: false, msg: 'Comanda já fechada' });
  });

  it('addItemToComanda retorna erro tratado quando a API falha', async () => {
    vi.mocked(comandasService.addItemToComanda).mockRejectedValue(
      new Error('Produto sem estoque'),
    );
    const { result } = renderHook(() =>
      useComandasState(refreshCaixa, refreshFiados),
    );

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
  });

  it('addItemToComanda atualiza só a comanda afetada com a resposta da API (sem refresh global)', async () => {
    const COMANDA_ATUALIZADA: Comanda = {
      ...COMANDA_COM_ITEM,
      items: [
        ...COMANDA_COM_ITEM.items,
        {
          id: 'item-2',
          productId: '11',
          productName: 'Água',
          quantity: 1,
          price: 5,
        },
      ],
    };
    vi.mocked(comandasService.addItemToComanda).mockResolvedValue(
      COMANDA_ATUALIZADA,
    );
    const { result } = renderHook(() =>
      useComandasState(refreshCaixa, refreshFiados),
    );

    act(() => {
      result.current.setComandas([COMANDA_COM_ITEM]);
    });

    let response;
    await act(async () => {
      response = await result.current.addItemToComanda('1', {
        productId: '11',
        productName: 'Água',
        quantity: 1,
        price: 5,
      });
    });

    expect(response).toEqual({
      success: true,
      msg: 'Item adicionado com sucesso.',
    });
    expect(result.current.comandas).toEqual([COMANDA_ATUALIZADA]);
    expect(refreshCaixa).not.toHaveBeenCalled();
    expect(refreshFiados).not.toHaveBeenCalled();
  });

  it('addItemToComanda retorna erro tratado quando o item é manual (sem productId numérico)', async () => {
    const { result } = renderHook(() =>
      useComandasState(refreshCaixa, refreshFiados),
    );

    let response;
    await act(async () => {
      response = await result.current.addItemToComanda('1', {
        productId: 'manual',
        productName: 'Item manual',
        quantity: 1,
        price: 10,
      });
    });

    expect(response).toEqual({
      success: false,
      msg: 'Item manual não suportado.',
    });
    expect(comandasService.addItemToComanda).not.toHaveBeenCalled();
  });

  it('reativarComanda retorna erro tratado, sem lançar', async () => {
    const { result } = renderHook(() =>
      useComandasState(refreshCaixa, refreshFiados),
    );

    const response = await result.current.reativarComanda();

    expect(response).toEqual({
      success: false,
      msg: 'Reabrir comanda não é suportado pela API atual.',
    });
  });

  it('pagarComanda (dinheiro/pix/cartão) retorna erro tratado quando a API falha', async () => {
    vi.mocked(comandasService.closeComanda).mockRejectedValue(
      new Error('Comanda sem consumo para fechamento'),
    );
    const { result } = renderHook(() =>
      useComandasState(refreshCaixa, refreshFiados),
    );

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
    expect(refreshCaixa).not.toHaveBeenCalled();
  });

  it('pagarComanda (dinheiro/pix/cartão) atualiza a comanda e o caixa quando a API funciona', async () => {
    vi.mocked(comandasService.closeComanda).mockResolvedValue(undefined);
    vi.mocked(comandasService.fetchComandaById).mockResolvedValue({
      ...COMANDA_COM_ITEM,
      status: 'paid',
    });
    const { result } = renderHook(() =>
      useComandasState(refreshCaixa, refreshFiados),
    );

    act(() => {
      result.current.setComandas([COMANDA_COM_ITEM]);
    });

    let response;
    await act(async () => {
      response = await result.current.pagarComanda('1', 'dinheiro', 0, 0);
    });

    expect(response).toEqual({
      success: true,
      msg: 'Comanda finalizada com sucesso.',
    });
    expect(refreshCaixa).toHaveBeenCalledTimes(1);
    expect(result.current.comandas[0].status).toBe('paid');
  });

  it('pagarComanda (fiado) retorna erro tratado quando a API falha', async () => {
    vi.mocked(comandasService.markComandaAsFiado).mockRejectedValue(
      new Error('Cliente inválido'),
    );
    const { result } = renderHook(() =>
      useComandasState(refreshCaixa, refreshFiados),
    );

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
    expect(refreshFiados).not.toHaveBeenCalled();
  });

  it('pagarComanda (fiado) atualiza a comanda e os fiados quando a API funciona', async () => {
    vi.mocked(comandasService.markComandaAsFiado).mockResolvedValue(undefined);
    vi.mocked(comandasService.fetchComandaById).mockResolvedValue({
      ...COMANDA_COM_ITEM,
      status: 'paid',
      paymentMethod: 'fiado',
    });
    const { result } = renderHook(() =>
      useComandasState(refreshCaixa, refreshFiados),
    );

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

    expect(response).toEqual({
      success: true,
      msg: 'Comanda marcada como fiado.',
    });
    expect(refreshFiados).toHaveBeenCalledTimes(1);
    expect(result.current.comandas[0].paymentMethod).toBe('fiado');
  });
});
