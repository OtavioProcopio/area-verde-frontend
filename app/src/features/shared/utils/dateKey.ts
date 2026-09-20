/** Chave de data local (yyyy-MM-dd), no fuso do navegador — não usar
 * toISOString() aqui, que converte pra UTC e pode virar o dia errado. */
export function toDateKey(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function todayDateKey(): string {
  return toDateKey(new Date());
}
