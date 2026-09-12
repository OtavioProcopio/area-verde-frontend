import { Comanda } from '../../types';

export interface ComandaTotals {
  subtotal: number;
  total: number;
  pago: number;
  restante: number;
}

export function getComandaTotals(comanda: Comanda): ComandaTotals {
  const subtotal = comanda.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const total = Math.max(0, subtotal);

  let pago = 0;
  let restante = 0;
  if (comanda.status === 'paid' && comanda.paymentMethod !== 'fiado') {
    pago = total;
  } else if (comanda.status === 'paid' && comanda.paymentMethod === 'fiado') {
    restante = total;
  } else if (comanda.status === 'active') {
    restante = total;
  }

  return { subtotal, total, pago, restante };
}
