import { Calendar } from 'lucide-react';
import { todayDateKey } from '../utils/dateKey';

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
}

/** Seletor de data reutilizável — value/onChange usam o formato yyyy-MM-dd
 * (mesmo formato de `<input type="date">` e de `toDateKey`). */
export function DatePicker({
  value,
  onChange,
  label,
  className = '',
}: DatePickerProps) {
  const isToday = value === todayDateKey();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        <Calendar
          size={18}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-cream-400"
        />
        <input
          type="date"
          aria-label={label || 'Selecionar data'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="rounded-lg border border-counter-700 bg-counter-950 py-2.5 pl-9 pr-3 text-sm font-semibold text-cream-100 outline-none focus:border-gold-500"
        />
      </div>
      {!isToday && (
        <button
          type="button"
          onClick={() => onChange(todayDateKey())}
          className="shrink-0 rounded-lg border border-counter-700 bg-counter-800 px-3 py-2.5 text-sm font-semibold text-cream-300 transition hover:border-gold-500/50 hover:text-gold-300"
        >
          Hoje
        </button>
      )}
    </div>
  );
}
