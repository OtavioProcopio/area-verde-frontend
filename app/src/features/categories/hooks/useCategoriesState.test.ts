import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCategoriesState } from './useCategoriesState';
import * as categoriesService from '../services/categoriesService';

vi.mock('../services/categoriesService');

describe('useCategoriesState', () => {
  const refreshRef = { current: vi.fn().mockResolvedValue(undefined) };

  beforeEach(() => {
    vi.resetAllMocks();
    refreshRef.current = vi.fn().mockResolvedValue(undefined);
  });

  it('addCategory retorna sucesso quando a API funciona', async () => {
    vi.mocked(categoriesService.createCategory).mockResolvedValue(
      undefined as never,
    );
    const { result } = renderHook(() => useCategoriesState(refreshRef));

    let response;
    await act(async () => {
      response = await result.current.addCategory('Bebidas');
    });

    expect(response).toEqual({
      success: true,
      msg: 'Categoria cadastrada com sucesso.',
    });
    expect(refreshRef.current).toHaveBeenCalledTimes(1);
  });

  it('addCategory retorna erro tratado em vez de lançar (ex: nome duplicado)', async () => {
    vi.mocked(categoriesService.createCategory).mockRejectedValue(
      new Error('Já existe uma categoria ativa com esse nome'),
    );
    const { result } = renderHook(() => useCategoriesState(refreshRef));

    let response;
    await act(async () => {
      response = await result.current.addCategory('Bebidas');
    });

    expect(response).toEqual({
      success: false,
      msg: 'Já existe uma categoria ativa com esse nome',
    });
    expect(refreshRef.current).not.toHaveBeenCalled();
  });
});
