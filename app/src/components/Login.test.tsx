import {fireEvent, render, screen} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import Login from './Login';

describe('Login', () => {
  it('habilita o envio quando uma senha e informada', () => {
    render(<Login onLogin={vi.fn(() => true)} />);

    const input = screen.getByPlaceholderText('****');
    const button = screen.getByRole('button', {name: 'Entrar'});

    expect(button).toBeDisabled();

    fireEvent.change(input, {target: {value: '1234'}});

    expect(button).not.toBeDisabled();
  });
});
