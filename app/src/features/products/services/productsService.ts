import { apiRequest } from '../../../lib/api';
import type { Category, Product, RecipeItem } from '../../../types';
import { toNumber } from '../../shared/utils/toNumber';
import { mapProduct, mapUnitToApi } from '../mappers/productMapper';
import type {
  ApiProduct,
  ApiProductComposition,
  ApiProdutoCompostoResponse,
} from '../types';

function getCategoryIdByName(categories: Category[], categoryName: string) {
  const category = categories.find((item) => item.name === categoryName);
  if (!category) {
    throw new Error(`Categoria "${categoryName}" não encontrada na API.`);
  }

  return Number(category.id);
}

export async function fetchProducts(): Promise<Product[]> {
  const products = await apiRequest<ApiProduct[]>('/produtos');
  const compositions = await Promise.all(
    products
      .filter((product) => product.tipoProduto === 'COMPOSTO')
      .map(async (product) => {
        const composition = await apiRequest<ApiProductComposition>(
          `/produtos/${product.id}/composicao`,
        );
        return [product.id, composition] as const;
      }),
  );

  const compositionMap = new Map<number, ApiProductComposition>(compositions);

  return products.map((product) =>
    mapProduct(
      product,
      (compositionMap.get(product.id)?.componentes || []).map((component) => ({
        ingredientId: String(component.produtoComponenteId),
        quantity: toNumber(component.quantidadeBaixa),
      })),
    ),
  );
}

export async function syncProductComposition(
  productId: string,
  recipe: RecipeItem[] = [],
) {
  const numericId = Number(productId);
  const current = await apiRequest<ApiProductComposition>(
    `/produtos/${numericId}/composicao`,
  );
  const currentMap = new Map(
    current.componentes.map((component) => [
      component.produtoComponenteId,
      component,
    ]),
  );
  const nextIds = new Set<number>();

  for (const item of recipe) {
    const componentId = Number(item.ingredientId);
    nextIds.add(componentId);
    if (currentMap.has(componentId)) {
      await apiRequest(
        `/produtos/${numericId}/composicao/componentes/${componentId}`,
        {
          method: 'PUT',
          body: {
            quantidadeBaixa: item.quantity,
          },
        },
      );
    } else {
      await apiRequest(`/produtos/${numericId}/composicao/componentes`, {
        method: 'POST',
        body: {
          produtoComponenteId: componentId,
          quantidadeBaixa: item.quantity,
        },
      });
    }
  }

  for (const component of current.componentes) {
    if (!nextIds.has(component.produtoComponenteId)) {
      await apiRequest(
        `/produtos/${numericId}/composicao/componentes/${component.produtoComponenteId}`,
        { method: 'DELETE' },
      );
    }
  }
}

export async function createProduct(
  product: Omit<Product, 'id'>,
  categories: Category[],
) {
  const categoriaId = getCategoryIdByName(categories, product.category);
  let createdId: number;

  if (product.isComposite) {
    // Cria produto + composição numa única transação no backend
    // (POST /produtos/compostos), evitando produto composto incompleto caso
    // uma segunda chamada de composição falhasse no meio do caminho.
    const created = await apiRequest<ApiProdutoCompostoResponse>(
      '/produtos/compostos',
      {
        method: 'POST',
        body: {
          nome: product.name,
          categoriaId,
          precoVenda: product.price,
          controlaEstoque: false,
          unidadeEstoque: null,
          quantidadeEstoque: 0,
          quantidadeBaixaPorVenda: 0,
          estoqueMinimo: 0,
          componentes: (product.recipe ?? []).map((item) => ({
            produtoComponenteId: Number(item.ingredientId),
            quantidadeBaixa: item.quantity,
          })),
        },
      },
    );
    createdId = created.produto.id;
  } else {
    const created = await apiRequest<ApiProduct>('/produtos', {
      method: 'POST',
      body: {
        nome: product.name,
        categoriaId,
        precoVenda: product.price,
        tipoProduto: 'SIMPLES',
        controlaEstoque: true,
        unidadeEstoque: mapUnitToApi(product.unit),
        quantidadeEstoque: product.stock,
        quantidadeBaixaPorVenda: 1,
        estoqueMinimo: product.minStock,
      },
    });
    createdId = created.id;
  }

  if (!product.active) {
    await apiRequest(`/produtos/${createdId}/inativar`, { method: 'PATCH' });
  }
}

export async function saveProduct(
  product: Product,
  categories: Category[],
  activeChanged?: boolean,
) {
  await apiRequest(`/produtos/${product.id}`, {
    method: 'PUT',
    body: {
      nome: product.name,
      categoriaId: getCategoryIdByName(categories, product.category),
      precoVenda: product.price,
      tipoProduto: product.isComposite ? 'COMPOSTO' : 'SIMPLES',
      controlaEstoque: !product.isComposite,
      unidadeEstoque: product.isComposite ? null : mapUnitToApi(product.unit),
      quantidadeEstoque: product.isComposite ? 0 : product.stock,
      quantidadeBaixaPorVenda: product.isComposite ? 0 : 1,
      estoqueMinimo: product.isComposite ? 0 : product.minStock,
    },
  });

  if (product.isComposite) {
    await syncProductComposition(product.id, product.recipe || []);
  }

  if (activeChanged !== undefined) {
    await apiRequest(
      `/produtos/${product.id}/${activeChanged ? 'ativar' : 'inativar'}`,
      {
        method: 'PATCH',
      },
    );
  }
}

export async function inactivateProduct(id: string) {
  await apiRequest(`/produtos/${id}/inativar`, {
    method: 'PATCH',
  });
}
