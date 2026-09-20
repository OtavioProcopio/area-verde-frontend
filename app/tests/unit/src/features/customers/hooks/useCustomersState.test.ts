import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCustomersState } from '@/features/customers/hooks/useCustomersState';
import * as customersService from '@/features/customers/services/customersService';
import type { Customer } from '@/types';

vi.mock('@/features/customers/services/customersService');

const CUSTOMER: Customer = {
  id: '1',
  name: 'João',
  phone: '11999998888',
  balance: 0,
  history: [],
  active: true,
};

describe('useCustomersState', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('addCustomer retorna sucesso e adiciona o cliente retornado pela API', async () => {
    vi.mocked(customersService.createCustomer).mockResolvedValue(CUSTOMER);
    const { result } = renderHook(() => useCustomersState());

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
    expect(result.current.customers).toEqual([CUSTOMER]);
  });

  it('addCustomer retorna erro tratado em vez de lançar quando a API falha', async () => {
    vi.mocked(customersService.createCustomer).mockRejectedValue(
      new Error('Telefone inválido'),
    );
    const { result } = renderHook(() => useCustomersState());

    let response;
    await act(async () => {
      response = await result.current.addCustomer({
        name: 'João',
        phone: 'abc',
      });
    });

    expect(response).toEqual({ success: false, msg: 'Telefone inválido' });
    expect(result.current.customers).toEqual([]);
  });

  it('deleteCustomer retorna erro tratado quando a API falha', async () => {
    vi.mocked(customersService.inactivateCustomer).mockRejectedValue(
      new Error('erro ao inativar'),
    );
    const { result } = renderHook(() => useCustomersState());

    let response;
    await act(async () => {
      response = await result.current.deleteCustomer('1');
    });

    expect(response).toEqual({ success: false, msg: 'erro ao inativar' });
  });
});
