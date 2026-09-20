import { describe, expect, it } from 'vitest';
import { mapProduct } from '@/features/products/mappers/productMapper';
import type { ApiProduct } from '@/features/products/types';

const BASE: ApiProduct = {
  id: 1,
  nome: 'Cerveja',
  categoria: { id: 10, nome: 'Bebidas' },
  precoVenda: 8.5,
  tipoProduto: 'SIMPLES',
  controlaEstoque: true,
  unidadeEstoque: 'UNIDADE',
  quantidadeEstoque: 100,
  quantidadeBaixaPorVenda: 1,
  estoqueMinimo: 10,
  ativo: true,
};

describe('mapProduct', () => {
  it('mapeia um produto simples sem receita', () => {
    const result = mapProduct(BASE);

    expect(result).toEqual({
      id: '1',
      name: 'Cerveja',
      category: 'Bebidas',
      price: 8.5,
      costPrice: 0,
      stock: 100,
      minStock: 10,
      active: true,
      unit: 'un',
      isComposite: false,
      recipe: undefined,
    });
  });

  it('mapeia um produto composto com a receita fornecida', () => {
    const composto: ApiProduct = {
      ...BASE,
      id: 2,
      tipoProduto: 'COMPOSTO',
      unidadeEstoque: null,
      quantidadeEstoque: 0,
      estoqueMinimo: 0,
    };

    const result = mapProduct(composto, [{ ingredientId: '5', quantity: 2 }]);

    expect(result.isComposite).toBe(true);
    expect(result.recipe).toEqual([{ ingredientId: '5', quantity: 2 }]);
  });

  it('mapeia unidadeEstoque ML corretamente', () => {
    const result = mapProduct({ ...BASE, unidadeEstoque: 'ML' });
    expect(result.unit).toBe('ml');
  });

  it('cai para "un" quando unidadeEstoque é nula', () => {
    const result = mapProduct({ ...BASE, unidadeEstoque: null });
    expect(result.unit).toBe('un');
  });
});
