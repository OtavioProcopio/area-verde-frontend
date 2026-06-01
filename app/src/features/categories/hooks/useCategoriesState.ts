import {useState} from 'react';
import {createCategory, saveCategory} from '../services/categoriesService';
import type {Category} from '../../../types';

type RefreshRef = {
  current: () => Promise<void>;
};

export function useCategoriesState(refreshRef: RefreshRef) {
  const [categories, setCategories] = useState<Category[]>([]);

  const addCategory = async (name: string) => {
    await createCategory(name);
    await refreshRef.current();
  };

  const updateCategory = async (updated: Category) => {
    const original = categories.find((category) => category.id === updated.id);
    await saveCategory(
      updated.id,
      updated.name,
      original && original.active !== updated.active ? updated.active : undefined,
    );
    await refreshRef.current();
  };

  return {
    categories,
    setCategories,
    addCategory,
    updateCategory,
  };
}
