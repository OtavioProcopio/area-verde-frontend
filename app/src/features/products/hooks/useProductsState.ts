import { useState } from 'react';
import {
  createProduct,
  inactivateProduct,
  saveProduct,
} from '../services/productsService';
import { getApiErrorMessage } from '../../shared/utils/getApiErrorMessage';
import type { Category, Product } from '../../../types';

type OperationResult = { success: boolean; msg: string };

export function useProductsState(categories: Category[]) {
  const [products, setProducts] = useState<Product[]>([]);

  const upsertProduct = (updated: Product) =>
    setProducts((prev) => {
      const exists = prev.some((product) => product.id === updated.id);
      return exists
        ? prev.map((product) => (product.id === updated.id ? updated : product))
        : [...prev, updated];
    });

  const addProduct = async (
    product: Omit<Product, 'id'>,
  ): Promise<OperationResult> => {
    try {
      upsertProduct(await createProduct(product, categories));
      return { success: true, msg: 'Produto cadastrado com sucesso.' };
    } catch (error) {
      return {
        success: false,
        msg: getApiErrorMessage(error, 'Não foi possível cadastrar o produto.'),
      };
    }
  };

  const updateProduct = async (updated: Product): Promise<OperationResult> => {
    try {
      const original = products.find((product) => product.id === updated.id);
      const saved = await saveProduct(
        updated,
        categories,
        original && original.active !== updated.active
          ? updated.active
          : undefined,
      );
      upsertProduct(saved);
      return { success: true, msg: 'Produto atualizado com sucesso.' };
    } catch (error) {
      return {
        success: false,
        msg: getApiErrorMessage(error, 'Não foi possível atualizar o produto.'),
      };
    }
  };

  const deleteProduct = async (id: string): Promise<OperationResult> => {
    try {
      upsertProduct(await inactivateProduct(id));
      return { success: true, msg: 'Produto inativado com sucesso.' };
    } catch (error) {
      return {
        success: false,
        msg: getApiErrorMessage(error, 'Não foi possível inativar o produto.'),
      };
    }
  };

  return {
    products,
    setProducts,
    addProduct,
    updateProduct,
    deleteProduct,
  };
}
