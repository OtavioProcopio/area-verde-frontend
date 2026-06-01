import type {Fiado} from '../../../types';
import {toNumber} from '../../shared/utils/toNumber';
import type {ApiPendenciaResumo} from '../types';

export function mapFiado(pendencia: ApiPendenciaResumo): Fiado {
  const value = toNumber(pendencia.total);
  return {
    id: `fiado-${pendencia.comandaId}`,
    customerId: String(pendencia.cliente?.id || ''),
    comandaId: String(pendencia.comandaId),
    originalValue: value,
    paidValue: 0,
    remainingValue: value,
    date: pendencia.pendenteEm || pendencia.abertaEm,
    dueDate: pendencia.vencimentoEm || pendencia.abertaEm,
    status: pendencia.status === 'FECHADA' ? 'quitado' : 'aberto',
  };
}
