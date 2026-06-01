import {apiRequest} from '../../../lib/api';
import type {Fiado} from '../../../types';
import {toApiPaymentMethod} from '../../shared/mappers/apiValueMappers';
import {mapFiado} from '../mappers/fiadoMapper';
import type {ApiPendenciaResumo} from '../types';

export async function fetchFiados(): Promise<Fiado[]> {
  const fiados = await apiRequest<ApiPendenciaResumo[]>('/fiados');
  return fiados.filter((fiado) => fiado.cliente?.id).map(mapFiado);
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
