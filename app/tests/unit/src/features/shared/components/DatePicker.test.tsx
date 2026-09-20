import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DatePicker } from '@/features/shared/components/DatePicker';
import { todayDateKey } from '@/features/shared/utils/dateKey';

describe('DatePicker', () => {
  it('exibe o valor recebido e chama onChange ao selecionar outra data', () => {
    const onChange = vi.fn();
    render(<DatePicker value="2026-01-15" onChange={onChange} />);

    const input = screen.getByLabelText('Selecionar data') as HTMLInputElement;
    expect(input.value).toBe('2026-01-15');

    fireEvent.change(input, { target: { value: '2026-01-20' } });
    expect(onChange).toHaveBeenCalledWith('2026-01-20');
  });

  it('não mostra o botão "Hoje" quando o valor já é hoje', () => {
    render(<DatePicker value={todayDateKey()} onChange={vi.fn()} />);
    expect(screen.queryByText('Hoje')).not.toBeInTheDocument();
  });

  it('mostra o botão "Hoje" e volta pra data atual ao clicar', () => {
    const onChange = vi.fn();
    render(<DatePicker value="2026-01-15" onChange={onChange} />);

    const button = screen.getByText('Hoje');
    fireEvent.click(button);
    expect(onChange).toHaveBeenCalledWith(todayDateKey());
  });
});
