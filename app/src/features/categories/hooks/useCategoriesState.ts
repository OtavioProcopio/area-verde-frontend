import { useState } from 'react';
import { createCategory, saveCategory } from '../services/categoriesService';
import { getApiErrorMessage } from '../../shared/utils/getApiErrorMessage';
import type { Category } from '../../../types';

type OperationResult = { success: boolean; msg: string };

export function useCategoriesState() {
  const [categories, setCategories] = useState<Category[]>([]);

  const upsertCategory = (updated: Category) =>
    setCategories((prev) => {
      const exists = prev.some((category) => category.id === updated.id);
      return exists
        ? prev.map((category) =>
            category.id === updated.id ? updated : category,
          )
        : [...prev, updated];
    });

  const addCategory = async (name: string): Promise<OperationResult> => {
    try {
      upsertCategory(await createCategory(name));
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
      const saved = await saveCategory(
        updated.id,
        updated.name,
        original && original.active !== updated.active
          ? updated.active
          : undefined,
      );
      upsertCategory(saved);
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
