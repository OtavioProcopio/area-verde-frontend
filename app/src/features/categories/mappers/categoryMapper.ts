import type { Category } from '../../../types';
import type { ApiCategory } from '../types';

export function mapCategory(category: ApiCategory): Category {
  return {
    id: String(category.id),
    name: category.nome,
    active: category.ativo,
  };
}
