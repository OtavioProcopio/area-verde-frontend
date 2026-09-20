import { describe, expect, it } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ToastProvider, useToast } from '../contexts/ToastContext';
import { ToastStack } from './ToastStack';

function Trigger({
  tone,
  message,
}: {
  tone: 'success' | 'error' | 'info';
  message: string;
}) {
  const { showToast } = useToast();
  return <button onClick={() => showToast(tone, message)}>Disparar</button>;
}

describe('ToastStack', () => {
  it('renderiza um toast de sucesso com a mensagem e o tom corretos', () => {
    render(
      <ToastProvider>
        <Trigger tone="success" message="Produto cadastrado com sucesso." />
        <ToastStack />
      </ToastProvider>,
    );

    act(() => {
      screen.getByText('Disparar').click();
    });

    const toast = screen.getByText('Produto cadastrado com sucesso.');
    expect(toast).toBeInTheDocument();
  });

  it('renderiza um toast de erro com a mensagem correta', () => {
    render(
      <ToastProvider>
        <Trigger tone="error" message="Não foi possível salvar." />
        <ToastStack />
      </ToastProvider>,
    );

    act(() => {
      screen.getByText('Disparar').click();
    });

    expect(screen.getByText('Não foi possível salvar.')).toBeInTheDocument();
  });

  it('não renderiza nada quando não há toast', () => {
    render(
      <ToastProvider>
        <ToastStack />
      </ToastProvider>,
    );

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
