import { describe, expect, it } from 'vitest';
import { mapComanda } from '@/features/comandas/mappers/comandaMapper';
import type { ApiComandaDetail, ApiPagamento } from '@/features/comandas/types';

const BASE: ApiComandaDetail = {
  id: 1,
  caixaOrigemId: 9,
  clienteId: null,
  nomeCliente: 'Mesa 1',
  nomeClienteSnapshot: null,
  status: 'ABERTA',
  total: 0,
  abertaEm: '2026-01-01T10:00:00Z',
  itens: [],
};

describe('mapComanda', () => {
  it('mapeia uma comanda aberta sem itens', () => {
    const result = mapComanda(BASE, []);

    expect(result).toEqual({
      id: '1',
      code: 'Mesa 1',
      customerId: null,
      items: [],
      status: 'active',
      createdAt: '2026-01-01T10:00:00Z',
      paidAt: undefined,
      discount: 0,
      addition: 0,
      paymentMethod: undefined,
    });
  });

  it('mapeia os itens e usa nomeClienteSnapshot quando presente', () => {
    const comanda: ApiComandaDetail = {
      ...BASE,
      nomeClienteSnapshot: 'Mesa 1 (fechada)',
      clienteId: 7,
      itens: [
        {
          id: 100,
          produtoId: 3,
          nomeProduto: 'Cerveja',
          quantidade: 2,
          precoUnitario: 5,
          totalItem: 10,
        },
        {
          id: 101,
          produtoId: null,
          nomeProduto: 'Item manual',
          quantidade: 1,
          precoUnitario: 3,
          totalItem: 3,
        },
      ],
    };

    const result = mapComanda(comanda, []);

    expect(result.code).toBe('Mesa 1 (fechada)');
    expect(result.customerId).toBe('7');
    expect(result.items).toEqual([
      {
        id: '100',
        productId: '3',
        productName: 'Cerveja',
        quantity: 2,
        price: 5,
      },
      {
        id: '101',
        productId: 'custom-101',
        productName: 'Item manual',
        quantity: 1,
        price: 3,
      },
    ]);
  });

  it('mapeia status CANCELADA/PENDENTE/FECHADA para cancelled/paid', () => {
    expect(mapComanda({ ...BASE, status: 'CANCELADA' }, []).status).toBe(
      'cancelled',
    );
    expect(mapComanda({ ...BASE, status: 'FECHADA' }, []).status).toBe('paid');
    expect(mapComanda({ ...BASE, status: 'PENDENTE' }, []).status).toBe('paid');
  });

  it('marca paymentMethod como fiado quando o status é PENDENTE, mesmo sem pagamentos', () => {
    const result = mapComanda({ ...BASE, status: 'PENDENTE' }, []);
    expect(result.paymentMethod).toBe('fiado');
  });

  it('deriva paymentMethod do primeiro pagamento quando a comanda está fechada', () => {
    const pagamentos: ApiPagamento[] = [
      { formaPagamento: 'PIX', valor: 10, criadoEm: '2026-01-01T11:00:00Z' },
    ];

    const result = mapComanda({ ...BASE, status: 'FECHADA' }, pagamentos);
    expect(result.paymentMethod).toBe('pix');
  });
});
