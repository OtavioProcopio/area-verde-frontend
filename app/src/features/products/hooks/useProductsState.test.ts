import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProductsState } from './useProductsState';
import * as productsService from '../services/productsService';
import type { Category, Product } from '../../../types';

vi.mock('../services/productsService');

const CATEGORIES: Category[] = [{ id: '1', name: 'Bebidas', active: true }];

const PRODUCT: Product = {
  id: '1',
  name: 'Cerveja',
  category: 'Bebidas',
  price: 10,
  costPrice: 5,
  stock: 50,
  minStock: 5,
  active: true,
  unit: 'un',
  isComposite: false,
};

describe('useProductsState', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('addProduct retorna sucesso e adiciona o produto retornado pela API', async () => {
    vi.mocked(productsService.createProduct).mockResolvedValue(PRODUCT);
    const { result } = renderHook(() => useProductsState(CATEGORIES));

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
    expect(result.current.products).toEqual([PRODUCT]);
  });

  it('addProduct retorna erro tratado em vez de lançar quando a API falha', async () => {
    vi.mocked(productsService.createProduct).mockRejectedValue(
      new Error('Categoria inválida'),
    );
    const { result } = renderHook(() => useProductsState(CATEGORIES));

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
    expect(result.current.products).toEqual([]);
  });

  it('deleteProduct retorna erro tratado quando a API falha', async () => {
    vi.mocked(productsService.inactivateProduct).mockRejectedValue(
      new Error('erro ao inativar'),
    );
    const { result } = renderHook(() => useProductsState(CATEGORIES));

    let response;
    await act(async () => {
      response = await result.current.deleteProduct('1');
    });

    expect(response).toEqual({ success: false, msg: 'erro ao inativar' });
  });
});
