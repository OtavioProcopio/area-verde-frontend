import { apiRequest } from '../../../lib/api';
import type { Category } from '../../../types';
import { mapCategory } from '../mappers/categoryMapper';
import type { ApiCategory } from '../types';

export async function fetchCategories(): Promise<Category[]> {
  const categories = await apiRequest<ApiCategory[]>('/categorias');
  return categories.map(mapCategory);
}

export async function createCategory(name: string): Promise<Category> {
  const created = await apiRequest<ApiCategory>('/categorias', {
    method: 'POST',
    body: { nome: name },
  });
  return mapCategory(created);
}

export async function saveCategory(
  categoryId: string,
  name: string,
  activeChanged?: boolean,
): Promise<Category> {
  let saved = await apiRequest<ApiCategory>(`/categorias/${categoryId}`, {
    method: 'PUT',
    body: { nome: name },
  });

  if (activeChanged !== undefined) {
    saved = await apiRequest<ApiCategory>(
      `/categorias/${categoryId}/${activeChanged ? 'ativar' : 'inativar'}`,
      {
        method: 'PATCH',
      },
    );
  }

  return mapCategory(saved);
}
