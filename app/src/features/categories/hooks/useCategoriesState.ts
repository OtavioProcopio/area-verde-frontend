import { useState } from 'react';
import { createCategory, saveCategory } from '../services/categoriesService';
import { getApiErrorMessage } from '../../shared/utils/getApiErrorMessage';
import type { Category } from '../../../types';

type RefreshRef = {
  current: () => Promise<void>;
};

type OperationResult = { success: boolean; msg: string };

export function useCategoriesState(refreshRef: RefreshRef) {
  const [categories, setCategories] = useState<Category[]>([]);

  const addCategory = async (name: string): Promise<OperationResult> => {
    try {
      await createCategory(name);
      await refreshRef.current();
      return { success: true, msg: 'Categoria cadastrada com sucesso.' };
    } catch (error) {
      return {
        success: false,
        msg: getApiErrorMessage(
          error,
          'Não foi possível cadastrar a categoria.',
        ),
      };
    }
  };

  const updateCategory = async (
    updated: Category,
  ): Promise<OperationResult> => {
    try {
      const original = categories.find(
        (category) => category.id === updated.id,
      );
      await saveCategory(
        updated.id,
        updated.name,
        original && original.active !== updated.active
          ? updated.active
          : undefined,
      );
      await refreshRef.current();
      return { success: true, msg: 'Categoria atualizada com sucesso.' };
    } catch (error) {
      return {
        success: false,
        msg: getApiErrorMessage(
          error,
          'Não foi possível atualizar a categoria.',
        ),
      };
    }
  };

  return {
    categories,
    setCategories,
    addCategory,
    updateCategory,
  };
}
