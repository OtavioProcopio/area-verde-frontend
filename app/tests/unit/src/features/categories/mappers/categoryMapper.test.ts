import { describe, expect, it } from 'vitest';
import { mapCategory } from '@/features/categories/mappers/categoryMapper';
import type { ApiCategory } from '@/features/categories/types';

describe('mapCategory', () => {
  it('mapeia uma categoria ativa', () => {
    const api: ApiCategory = { id: 1, nome: 'Bebidas', ativo: true };
    expect(mapCategory(api)).toEqual({
      id: '1',
      name: 'Bebidas',
      active: true,
    });
  });

  it('mapeia uma categoria inativa', () => {
    const api: ApiCategory = { id: 2, nome: 'Descontinuados', ativo: false };
    expect(mapCategory(api)).toEqual({
      id: '2',
      name: 'Descontinuados',
      active: false,
    });
  });
});
