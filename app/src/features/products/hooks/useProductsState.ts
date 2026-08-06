import { useState } from 'react';
import {
  createProduct,
  inactivateProduct,
  saveProduct,
} from '../services/productsService';
import { getApiErrorMessage } from '../../shared/utils/getApiErrorMessage';
import type { Category, Product } from '../../../types';

type RefreshRef = {
  current: () => Promise<void>;
};

type OperationResult = { success: boolean; msg: string };

export function useProductsState(
  categories: Category[],
  refreshRef: RefreshRef,
) {
  const [products, setProducts] = useState<Product[]>([]);

  const addProduct = async (
    product: Omit<Product, 'id'>,
  ): Promise<OperationResult> => {
    try {
      await createProduct(product, categories);
      await refreshRef.current();
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
      await saveProduct(
        updated,
        categories,
        original && original.active !== updated.active
          ? updated.active
          : undefined,
      );
      await refreshRef.current();
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
      await inactivateProduct(id);
      await refreshRef.current();
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
