import type { Product, RecipeItem } from '../../../types';
import { mapUnit, mapUnitToApi } from '../../shared/mappers/apiValueMappers';
import { toNumber } from '../../shared/utils/toNumber';
import type { ApiProduct } from '../types';

export function mapProduct(
  product: ApiProduct,
  recipe: RecipeItem[] = [],
): Product {
  return {
    id: String(product.id),
    name: product.nome,
    category: product.categoria.nome,
    price: toNumber(product.precoVenda),
    costPrice: 0,
    stock: toNumber(product.quantidadeEstoque),
    minStock: toNumber(product.estoqueMinimo),
    active: product.ativo,
    unit: mapUnit(product.unidadeEstoque),
    isComposite: product.tipoProduto === 'COMPOSTO',
    recipe: recipe.length > 0 ? recipe : undefined,
  };
}

export { mapUnitToApi };
