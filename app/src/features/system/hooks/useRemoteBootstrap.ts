import {useCallback, useEffect, useState} from 'react';
import {fetchCaixaAtual, fetchCaixasHistory} from '../../caixa/services/caixaService';
import {fetchCategories} from '../../categories/services/categoriesService';
import {fetchComandas} from '../../comandas/services/comandasService';
import {fetchConfiguracao} from '../../configuracoes/services/configuracoesService';
import type {Configuracao} from '../../configuracoes/types';
import {fetchCustomers} from '../../customers/services/customersService';
import {fetchFiados} from '../../fiados/services/fiadosService';
import {fetchProducts} from '../../products/services/productsService';
import {getApiErrorMessage} from '../../shared/utils/getApiErrorMessage';
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
  setConfiguracao: (value: Configuracao) => void;
};

export function useRemoteBootstrap(setters: BootstrapSetters) {
  const [isLoading, setIsLoading] = useState(true);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const {
    setCategories,
    setProducts,
    setCustomers,
    setComandas,
    setFiados,
    setCaixa,
    setCaixasHistory,
    setConfiguracao,
  } = setters;

  const loadRemoteState = useCallback(async () => {
    const [
      loadedConfiguracao,
      loadedCategories,
      loadedProducts,
      loadedCustomers,
      loadedComandas,
      loadedFiados,
      loadedCaixa,
      loadedHistory,
    ] = await Promise.all([
      fetchConfiguracao(),
      fetchCategories(),
      fetchProducts(),
      fetchCustomers(),
      fetchComandas(),
      fetchFiados(),
      fetchCaixaAtual(),
      fetchCaixasHistory(),
    ]);

    setConfiguracao(loadedConfiguracao);
    setCategories(loadedCategories);
    setProducts(loadedProducts);
    setCustomers(loadedCustomers);
    setComandas(loadedComandas);
    setFiados(loadedFiados);
    setCaixa(loadedCaixa);
    setCaixasHistory(loadedHistory);
  }, [
    setConfiguracao,
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
      setBootstrapError(null);
    } catch (error) {
      setBootstrapError(
        getApiErrorMessage(
          error,
          'Nao foi possivel carregar os dados do sistema agora.',
        ),
      );
    }
  }, [loadRemoteState]);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        await refreshState();
      } finally {
        setIsLoading(false);
      }
    })();
  }, [refreshState]);

  return {
    isLoading,
    bootstrapError,
    refreshState,
  };
}
