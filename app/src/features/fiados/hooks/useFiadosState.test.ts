import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFiadosState } from './useFiadosState';
import * as fiadosService from '../services/fiadosService';
import type { Fiado } from '../../../types';

vi.mock('../services/fiadosService');

const PENDENCIA: Fiado = {
  id: 'fiado-1',
  customerId: 'cust-1',
  comandaId: '1',
  originalValue: 20,
  paidValue: 0,
  remainingValue: 20,
  date: '2026-01-01T00:00:00Z',
  dueDate: '2026-01-01T00:00:00Z',
  status: 'aberto',
};

describe('useFiadosState', () => {
  const refreshRef = { current: vi.fn().mockResolvedValue(undefined) };

  beforeEach(() => {
    vi.resetAllMocks();
    refreshRef.current = vi.fn().mockResolvedValue(undefined);
  });

  it('pagarFiado retorna sucesso quando settleFiado funciona', async () => {
    vi.mocked(fiadosService.settleFiado).mockResolvedValue(undefined as never);
    const { result } = renderHook(() => useFiadosState(refreshRef));

    act(() => {
      result.current.setFiados([PENDENCIA]);
    });

    let response;
    await act(async () => {
      response = await result.current.pagarFiado('cust-1', 20, 'dinheiro');
    });

    expect(response).toEqual({
      success: true,
      msg: 'Fiado quitado com sucesso.',
    });
  });

  it('pagarFiado retorna erro tratado em vez de lançar quando settleFiado falha no meio do loop', async () => {
    // Regressão: settleFiado é chamado dentro de um for-loop sem try/catch
    // era o bug original — uma rejeição da API virava uma exception não
    // tratada em vez de {success:false, msg}.
    vi.mocked(fiadosService.settleFiado).mockRejectedValue(
      new Error('Nenhum caixa aberto encontrado'),
    );
    const { result } = renderHook(() => useFiadosState(refreshRef));

    act(() => {
      result.current.setFiados([PENDENCIA]);
    });

    let response;
    await act(async () => {
      response = await result.current.pagarFiado('cust-1', 20, 'dinheiro');
    });

    expect(response).toEqual({
      success: false,
      msg: 'Nenhum caixa aberto encontrado',
    });
  });

  it('pagarFiado retorna erro sem chamar a API quando o valor não é exato (pagamento parcial)', async () => {
    const { result } = renderHook(() => useFiadosState(refreshRef));

    act(() => {
      result.current.setFiados([PENDENCIA]);
    });

    let response;
    await act(async () => {
      response = await result.current.pagarFiado('cust-1', 10, 'dinheiro');
    });

    expect(response.success).toBe(false);
    expect(response.msg).toContain('parcial');
    expect(fiadosService.settleFiado).not.toHaveBeenCalled();
  });
});
