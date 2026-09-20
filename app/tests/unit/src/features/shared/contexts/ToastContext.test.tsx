import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import {
  ToastProvider,
  useToast,
} from '@/features/shared/contexts/ToastContext';

const wrapper = ({ children }: { children: ReactNode }) => (
  <ToastProvider>{children}</ToastProvider>
);

describe('ToastContext', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('showToast adiciona um toast visível com o tom e a mensagem informados', () => {
    const { result } = renderHook(() => useToast(), { wrapper });

    act(() => {
      result.current.showToast('success', 'Produto cadastrado com sucesso.');
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]).toMatchObject({
      tone: 'success',
      message: 'Produto cadastrado com sucesso.',
    });
  });

  it('toast some sozinho depois de 5 segundos, sem ação do usuário', () => {
    const { result } = renderHook(() => useToast(), { wrapper });

    act(() => {
      result.current.showToast('error', 'Não foi possível salvar.');
    });
    expect(result.current.toasts).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.toasts).toHaveLength(0);
  });

  it('mantém no máximo 3 toasts visíveis e mostra o 4º só quando o mais antigo some', () => {
    const { result } = renderHook(() => useToast(), { wrapper });

    act(() => {
      result.current.showToast('success', 'Primeiro');
    });
    act(() => {
      vi.advanceTimersByTime(1000);
      result.current.showToast('success', 'Segundo');
    });
    act(() => {
      vi.advanceTimersByTime(1000);
      result.current.showToast('success', 'Terceiro');
    });
    act(() => {
      vi.advanceTimersByTime(1000);
      result.current.showToast('success', 'Quarto');
    });

    expect(result.current.toasts).toHaveLength(3);
    expect(result.current.toasts.map((t) => t.message)).toEqual([
      'Primeiro',
      'Segundo',
      'Terceiro',
    ]);

    act(() => {
      // 'Primeiro' foi criado em t=0 e some em t=5000; já se passaram 3000ms.
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.toasts).toHaveLength(3);
    expect(result.current.toasts.map((t) => t.message)).toEqual([
      'Segundo',
      'Terceiro',
      'Quarto',
    ]);
  });
});
