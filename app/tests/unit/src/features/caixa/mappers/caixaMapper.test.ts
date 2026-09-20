import { describe, expect, it } from 'vitest';
import {
  isCaixaNaoEncontrado,
  mapCaixa,
  mapClosedCaixa,
} from '@/features/caixa/mappers/caixaMapper';
import { ApiError } from '@/lib/api/client';
import type { ApiCaixaDetail, ApiCaixaSummary } from '@/features/caixa/types';

describe('mapCaixa', () => {
  it('mapeia um caixa aberto sem movimentos nem pagamentos', () => {
    const api: ApiCaixaDetail = {
      id: 1,
      status: 'ABERTO',
      valorInicial: '100.00',
      dinheiroEsperado: '100.00',
      abertoEm: '2026-01-01T08:00:00Z',
      pagamentos: [],
      movimentos: [],
    };

    const result = mapCaixa(api);

    expect(result.isOpen).toBe(true);
    expect(result.initialCash).toBe(100);
    expect(result.currentCashInMoney).toBe(100);
    expect(result.logs).toEqual([]);
  });

  it('combina movimentos e pagamentos nos logs, ordenados do mais recente pro mais antigo', () => {
    const api: ApiCaixaDetail = {
      id: 1,
      status: 'ABERTO',
      valorInicial: 100,
      dinheiroEsperado: 150,
      abertoEm: '2026-01-01T08:00:00Z',
      movimentos: [
        {
          id: 1,
          tipo: 'REFORCO',
          valor: '50.00',
          observacao: 'reforço',
          criadoEm: '2026-01-01T09:00:00Z',
        },
      ],
      pagamentos: [
        {
          id: 5,
          comandaId: 3,
          formaPagamento: 'PIX',
          valor: '20.00',
          criadoEm: '2026-01-01T10:00:00Z',
        },
      ],
    };

    const result = mapCaixa(api);

    expect(result.logs).toHaveLength(2);
    expect(result.logs[0]).toMatchObject({
      id: 'pag-5',
      type: 'venda',
      paymentMethod: 'pix',
      description: 'Pagamento da comanda #3',
    });
    expect(result.logs[1]).toMatchObject({
      id: 'mov-1',
      type: 'suprimento',
      amount: 50,
    });
  });

  it('mapeia pagamento FIADO como recebimento_fiado', () => {
    const api: ApiCaixaDetail = {
      id: 1,
      status: 'FECHADO',
      valorInicial: 100,
      dinheiroEsperado: 100,
      abertoEm: '2026-01-01T08:00:00Z',
      movimentos: [],
      pagamentos: [
        {
          id: 9,
          comandaId: 4,
          formaPagamento: 'FIADO',
          valor: '30.00',
          criadoEm: '2026-01-01T10:00:00Z',
        },
      ],
    };

    expect(mapCaixa(api).logs[0].type).toBe('recebimento_fiado');
  });
});

describe('mapClosedCaixa', () => {
  it('mapeia um resumo de caixa fechado', () => {
    const summary: ApiCaixaSummary = {
      id: 2,
      status: 'FECHADO',
      valorInicial: '100.00',
      dinheiroEsperado: '180.00',
      abertoEm: '2026-01-01T08:00:00Z',
      fechadoEm: '2026-01-01T20:00:00Z',
    };

    const result = mapClosedCaixa(summary);

    expect(result).toEqual({
      id: '2',
      openedAt: '2026-01-01T08:00:00Z',
      closedAt: '2026-01-01T20:00:00Z',
      initialCash: 100,
      totalVendido: 0,
      totalReforcos: 0,
      totalSangrias: 0,
      finalCashInMoney: 180,
      status: 'fechado',
    });
  });
});

describe('isCaixaNaoEncontrado', () => {
  it('reconhece o código de erro de caixa aberto não encontrado', () => {
    const error = new ApiError('Nenhum caixa aberto', 404, {
      code: 'caixa_aberto_nao_encontrado',
    });
    expect(isCaixaNaoEncontrado(error)).toBe(true);
  });

  it('retorna false para outros erros', () => {
    expect(isCaixaNaoEncontrado(new ApiError('outro erro', 500))).toBe(false);
    expect(isCaixaNaoEncontrado(new Error('não é ApiError'))).toBe(false);
  });
});
