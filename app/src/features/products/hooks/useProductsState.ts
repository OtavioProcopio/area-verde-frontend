import { useState } from 'react';
import {
  createProduct,
  inactivateProduct,
  saveProduct,
} from '../services/productsService';
import type { Category, Product } from '../../../types';

type RefreshRef = {
  current: () => Promise<void>;
};

export function useProductsState(
  categories: Category[],
  refreshRef: RefreshRef,
) {
  const [products, setProducts] = useState<Product[]>([]);

  const addProduct = async (product: Omit<Product, 'id'>) => {
    await createProduct(product, categories);
    await refreshRef.current();
  };

  const updateProduct = async (updated: Product) => {
    const original = products.find((product) => product.id === updated.id);
    await saveProduct(
      updated,
      categories,
      original && original.active !== updated.active
        ? updated.active
        : undefined,
    );
    await refreshRef.current();
  };

  const deleteProduct = async (id: string) => {
    await inactivateProduct(id);
    await refreshRef.current();
  };

  return {
    products,
    setProducts,
    addProduct,
    updateProduct,
    deleteProduct,
  };
}
