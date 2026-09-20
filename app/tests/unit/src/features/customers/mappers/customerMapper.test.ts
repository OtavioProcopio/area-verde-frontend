import { describe, expect, it } from 'vitest';
import { mapCustomer } from '@/features/customers/mappers/customerMapper';
import type {
  ApiCustomerDetail,
  ApiCustomerPendencias,
} from '@/features/customers/types';

const DETAIL: ApiCustomerDetail = {
  id: 1,
  nome: 'João',
  apelido: 'Jãozinho',
  telefone: '11999998888',
  ativo: true,
  observacao: 'cliente antigo',
};

describe('mapCustomer', () => {
  it('mapeia cliente sem pendências', () => {
    const pendencias: ApiCustomerPendencias = {
      totalPendente: 0,
      totalVencido: 0,
      pendencias: [],
    };

    const result = mapCustomer(DETAIL, pendencias);

    expect(result).toEqual({
      id: '1',
      name: 'João',
      nickname: 'Jãozinho',
      phone: '11999998888',
      balance: 0,
      history: [],
      notes: 'cliente antigo',
      active: true,
    });
  });

  it('monta o histórico a partir das pendências, usando pendenteEm quando existe', () => {
    const pendencias: ApiCustomerPendencias = {
      totalPendente: 20,
      totalVencido: 0,
      pendencias: [
        {
          comandaId: 42,
          total: '20.00',
          abertaEm: '2026-01-01T00:00:00Z',
          pendenteEm: '2026-01-02T00:00:00Z',
          status: 'PENDENTE',
          vencida: false,
        },
      ],
    };

    const result = mapCustomer(DETAIL, pendencias);

    expect(result.balance).toBe(20);
    expect(result.history).toEqual([
      {
        id: 'hist-42',
        type: 'sale',
        amount: 20,
        description: 'Fiado da comanda #42',
        timestamp: '2026-01-02T00:00:00Z',
      },
    ]);
  });

  it('cai para abertaEm quando pendenteEm está ausente', () => {
    const pendencias: ApiCustomerPendencias = {
      totalPendente: 20,
      totalVencido: 0,
      pendencias: [
        {
          comandaId: 7,
          total: 20,
          abertaEm: '2026-01-01T00:00:00Z',
          status: 'PENDENTE',
          vencida: false,
        },
      ],
    };

    const result = mapCustomer(DETAIL, pendencias);
    expect(result.history[0].timestamp).toBe('2026-01-01T00:00:00Z');
  });

  it('mapeia apelido/observacao nulos como undefined', () => {
    const semExtras: ApiCustomerDetail = {
      ...DETAIL,
      apelido: null,
      observacao: null,
    };
    const result = mapCustomer(semExtras, {
      totalPendente: 0,
      totalVencido: 0,
      pendencias: [],
    });

    expect(result.nickname).toBeUndefined();
    expect(result.notes).toBeUndefined();
  });
});
