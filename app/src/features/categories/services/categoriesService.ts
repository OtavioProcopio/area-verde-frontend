import {apiRequest} from '../../../lib/api';
import type {Category} from '../../../types';
import {mapCategory} from '../mappers/categoryMapper';
import type {ApiCategory} from '../types';

export async function fetchCategories(): Promise<Category[]> {
  const categories = await apiRequest<ApiCategory[]>('/categorias');
  return categories.map(mapCategory);
}

export async function createCategory(name: string) {
  await apiRequest('/categorias', {
    method: 'POST',
    body: {nome: name},
  });
}

export async function saveCategory(
  categoryId: string,
  name: string,
  activeChanged?: boolean,
) {
  await apiRequest(`/categorias/${categoryId}`, {
    method: 'PUT',
    body: {nome: name},
  });

  if (activeChanged !== undefined) {
    await apiRequest(`/categorias/${categoryId}/${activeChanged ? 'ativar' : 'inativar'}`, {
      method: 'PATCH',
    });
  }
}
