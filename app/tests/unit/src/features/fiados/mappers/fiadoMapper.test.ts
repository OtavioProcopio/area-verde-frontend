import { describe, expect, it } from 'vitest';
import { mapFiado } from '@/features/fiados/mappers/fiadoMapper';
import type { ApiPendenciaResumo } from '@/features/fiados/types';

const BASE: ApiPendenciaResumo = {
  comandaId: 1,
  cliente: { id: 5, nome: 'João' },
  total: '20.00',
  abertaEm: '2026-01-01T00:00:00Z',
  pendenteEm: '2026-01-02T00:00:00Z',
  vencimentoEm: '2026-01-10',
  status: 'PENDENTE',
  vencida: false,
};

describe('mapFiado', () => {
  it('mapeia uma pendência em aberto', () => {
    const result = mapFiado(BASE);

    expect(result).toEqual({
      id: 'fiado-1',
      customerId: '5',
      comandaId: '1',
      originalValue: 20,
      paidValue: 0,
      remainingValue: 20,
      date: '2026-01-02T00:00:00Z',
      dueDate: '2026-01-10',
      status: 'aberto',
    });
  });

  it('mapeia status FECHADA como quitado', () => {
    expect(mapFiado({ ...BASE, status: 'FECHADA' }).status).toBe('quitado');
  });

  it('usa string vazia como customerId quando cliente é nulo', () => {
    expect(mapFiado({ ...BASE, cliente: null }).customerId).toBe('');
  });

  it('cai para abertaEm quando pendenteEm/vencimentoEm estão ausentes', () => {
    const semDatas: ApiPendenciaResumo = {
      ...BASE,
      pendenteEm: null,
      vencimentoEm: null,
    };
    const result = mapFiado(semDatas);

    expect(result.date).toBe(BASE.abertaEm);
    expect(result.dueDate).toBe(BASE.abertaEm);
  });
});
