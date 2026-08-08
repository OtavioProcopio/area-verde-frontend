import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCustomersState } from './useCustomersState';
import * as customersService from '../services/customersService';

vi.mock('../services/customersService');

describe('useCustomersState', () => {
  const refreshRef = { current: vi.fn().mockResolvedValue(undefined) };

  beforeEach(() => {
    vi.resetAllMocks();
    refreshRef.current = vi.fn().mockResolvedValue(undefined);
  });

  it('addCustomer retorna sucesso quando a API funciona', async () => {
    vi.mocked(customersService.createCustomer).mockResolvedValue(
      undefined as never,
    );
    const { result } = renderHook(() => useCustomersState(refreshRef));

    let response;
    await act(async () => {
      response = await result.current.addCustomer({
        name: 'João',
        phone: '11999998888',
      });
    });

    expect(response).toEqual({
      success: true,
      msg: 'Cliente cadastrado com sucesso.',
    });
    expect(refreshRef.current).toHaveBeenCalledTimes(1);
  });

  it('addCustomer retorna erro tratado em vez de lançar quando a API falha', async () => {
    vi.mocked(customersService.createCustomer).mockRejectedValue(
      new Error('Telefone inválido'),
    );
    const { result } = renderHook(() => useCustomersState(refreshRef));

    let response;
    await act(async () => {
      response = await result.current.addCustomer({
        name: 'João',
        phone: 'abc',
      });
    });

    expect(response).toEqual({ success: false, msg: 'Telefone inválido' });
    expect(refreshRef.current).not.toHaveBeenCalled();
  });

  it('deleteCustomer retorna erro tratado quando a API falha', async () => {
    vi.mocked(customersService.inactivateCustomer).mockRejectedValue(
      new Error('erro ao inativar'),
    );
    const { result } = renderHook(() => useCustomersState(refreshRef));

    let response;
    await act(async () => {
      response = await result.current.deleteCustomer('1');
    });

    expect(response).toEqual({ success: false, msg: 'erro ao inativar' });
  });
});
