import {useCallback, useEffect, useState} from 'react';
import {ApiError} from '../../../lib/api';
import {fetchCaixaAtual, fetchCaixasHistory} from '../../caixa/services/caixaService';
import {fetchCategories} from '../../categories/services/categoriesService';
import {fetchComandas} from '../../comandas/services/comandasService';
import {fetchCustomers} from '../../customers/services/customersService';
import {fetchFiados} from '../../fiados/services/fiadosService';
import {fetchProducts} from '../../products/services/productsService';
import type {
  Cashier,
  Category,
  ClosedCashier,
  Comanda,
  Customer,
  Fiado,
  Product,
} from '../../../types';

type BootstrapSetters = {
  setCategories: (value: Category[]) => void;
  setProducts: (value: Product[]) => void;
  setCustomers: (value: Customer[]) => void;
  setComandas: (value: Comanda[]) => void;
  setFiados: (value: Fiado[]) => void;
  setCaixa: (value: Cashier) => void;
  setCaixasHistory: (value: ClosedCashier[]) => void;
};

export function useRemoteBootstrap(setters: BootstrapSetters) {
  const [isLoading, setIsLoading] = useState(true);
  const {
    setCategories,
    setProducts,
    setCustomers,
    setComandas,
    setFiados,
    setCaixa,
    setCaixasHistory,
  } = setters;

  const loadRemoteState = useCallback(async () => {
    const [
      loadedCategories,
      loadedProducts,
      loadedCustomers,
      loadedComandas,
      loadedFiados,
      loadedCaixa,
      loadedHistory,
    ] = await Promise.all([
      fetchCategories(),
      fetchProducts(),
      fetchCustomers(),
      fetchComandas(),
      fetchFiados(),
      fetchCaixaAtual(),
      fetchCaixasHistory(),
    ]);

    setCategories(loadedCategories);
    setProducts(loadedProducts);
    setCustomers(loadedCustomers);
    setComandas(loadedComandas);
    setFiados(loadedFiados);
    setCaixa(loadedCaixa);
    setCaixasHistory(loadedHistory);
  }, [
    setCategories,
    setProducts,
    setCustomers,
    setComandas,
    setFiados,
    setCaixa,
    setCaixasHistory,
  ]);

  const refreshState = useCallback(async () => {
    try {
      await loadRemoteState();
    } catch (error) {
      console.error('Erro ao carregar dados da API', error);
      if (error instanceof ApiError) {
        console.error(error.payload);
      }
    }
  }, [loadRemoteState]);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      await refreshState();
      setIsLoading(false);
    })();
  }, [refreshState]);

  return {
    isLoading,
    refreshState,
  };
}
