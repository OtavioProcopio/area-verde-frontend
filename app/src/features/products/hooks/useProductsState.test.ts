import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProductsState } from './useProductsState';
import * as productsService from '../services/productsService';
import type { Category } from '../../../types';

vi.mock('../services/productsService');

const CATEGORIES: Category[] = [{ id: '1', name: 'Bebidas', active: true }];

describe('useProductsState', () => {
  const refreshRef = { current: vi.fn().mockResolvedValue(undefined) };

  beforeEach(() => {
    vi.resetAllMocks();
    refreshRef.current = vi.fn().mockResolvedValue(undefined);
  });

  it('addProduct retorna sucesso quando a API funciona', async () => {
    vi.mocked(productsService.createProduct).mockResolvedValue(
      undefined as never,
    );
    const { result } = renderHook(() =>
      useProductsState(CATEGORIES, refreshRef),
    );

    let response;
    await act(async () => {
      response = await result.current.addProduct({
        name: 'Cerveja',
        category: 'Bebidas',
        price: 10,
        costPrice: 5,
        stock: 50,
        minStock: 5,
        active: true,
        unit: 'un',
        isComposite: false,
      });
    });

    expect(response).toEqual({
      success: true,
      msg: 'Produto cadastrado com sucesso.',
    });
    expect(refreshRef.current).toHaveBeenCalledTimes(1);
  });

  it('addProduct retorna erro tratado em vez de lançar quando a API falha', async () => {
    vi.mocked(productsService.createProduct).mockRejectedValue(
      new Error('Categoria inválida'),
    );
    const { result } = renderHook(() =>
      useProductsState(CATEGORIES, refreshRef),
    );

    let response;
    await act(async () => {
      response = await result.current.addProduct({
        name: 'Cerveja',
        category: 'Bebidas',
        price: 10,
        costPrice: 5,
        stock: 50,
        minStock: 5,
        active: true,
        unit: 'un',
        isComposite: false,
      });
    });

    expect(response).toEqual({
      success: false,
      msg: 'Categoria inválida',
    });
    expect(refreshRef.current).not.toHaveBeenCalled();
  });

  it('deleteProduct retorna erro tratado quando a API falha', async () => {
    vi.mocked(productsService.inactivateProduct).mockRejectedValue(
      new Error('erro ao inativar'),
    );
    const { result } = renderHook(() =>
      useProductsState(CATEGORIES, refreshRef),
    );

    let response;
    await act(async () => {
      response = await result.current.deleteProduct('1');
    });

    expect(response).toEqual({ success: false, msg: 'erro ao inativar' });
  });
});
