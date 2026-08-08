import { apiRequest } from '../../../lib/api';
import type { Fiado } from '../../../types';
import { toApiPaymentMethod } from '../../shared/mappers/apiValueMappers';
import { mapFiado } from '../mappers/fiadoMapper';
import type { ApiPendenciaResumo } from '../types';

export async function fetchFiados(): Promise<Fiado[]> {
  // /fiados sozinho so traz pendencias em aberto (status PENDENTE); o
  // historico de quitados precisa do parametro quitados=true, ver
  // GET /api/fiados no backend (comanda_repository.list_pendencias).
  const [abertos, quitados] = await Promise.all([
    apiRequest<ApiPendenciaResumo[]>('/fiados'),
    apiRequest<ApiPendenciaResumo[]>('/fiados?quitados=true'),
  ]);
  return [...abertos, ...quitados]
    .filter((fiado) => fiado.cliente?.id)
    .map(mapFiado);
}

export async function settleFiado(
  comandaId: string,
  valorPago: number,
  metodo: 'dinheiro' | 'pix' | 'cartao',
) {
  await apiRequest(`/fiados/${comandaId}/quitar`, {
    method: 'POST',
    body: {
      formaPagamento: toApiPaymentMethod(metodo),
      valorPago,
    },
  });
}
