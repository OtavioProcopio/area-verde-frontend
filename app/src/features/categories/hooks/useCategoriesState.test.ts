import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCategoriesState } from './useCategoriesState';
import * as categoriesService from '../services/categoriesService';
import type { Category } from '../../../types';

vi.mock('../services/categoriesService');

const CATEGORIA: Category = { id: '1', name: 'Bebidas', active: true };

describe('useCategoriesState', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('addCategory retorna sucesso e adiciona a categoria retornada pela API', async () => {
    vi.mocked(categoriesService.createCategory).mockResolvedValue(CATEGORIA);
    const { result } = renderHook(() => useCategoriesState());

    let response;
    await act(async () => {
      response = await result.current.addCategory('Bebidas');
    });

    expect(response).toEqual({
      success: true,
      msg: 'Categoria cadastrada com sucesso.',
    });
    expect(result.current.categories).toEqual([CATEGORIA]);
  });

  it('addCategory retorna erro tratado em vez de lançar (ex: nome duplicado)', async () => {
    vi.mocked(categoriesService.createCategory).mockRejectedValue(
      new Error('Já existe uma categoria ativa com esse nome'),
    );
    const { result } = renderHook(() => useCategoriesState());

    let response;
    await act(async () => {
      response = await result.current.addCategory('Bebidas');
    });

    expect(response).toEqual({
      success: false,
      msg: 'Já existe uma categoria ativa com esse nome',
    });
    expect(result.current.categories).toEqual([]);
  });
});
