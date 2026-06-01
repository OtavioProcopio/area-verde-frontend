import {useRef} from 'react';
import {useAccessPin} from './features/acesso/hooks/useAccessPin';
import {useCaixaState} from './features/caixa/hooks/useCaixaState';
import {useCategoriesState} from './features/categories/hooks/useCategoriesState';
import {useComandasState} from './features/comandas/hooks/useComandasState';
import {useCustomersState} from './features/customers/hooks/useCustomersState';
import {useFiadosState} from './features/fiados/hooks/useFiadosState';
import {useProductsState} from './features/products/hooks/useProductsState';
import {useBackupState} from './features/system/hooks/useBackupState';
import {useRemoteBootstrap} from './features/system/hooks/useRemoteBootstrap';

export function useSystemState() {
  const refreshRef = useRef<() => Promise<void>>(async () => {});

  const access = useAccessPin();
  const categoriesState = useCategoriesState(refreshRef);
  const productsState = useProductsState(categoriesState.categories, refreshRef);
  const customersState = useCustomersState(refreshRef);
  const fiadosState = useFiadosState(refreshRef);
  const caixaState = useCaixaState(refreshRef);
  const comandasState = useComandasState(refreshRef);

  const bootstrap = useRemoteBootstrap({
    setCategories: categoriesState.setCategories,
    setProducts: productsState.setProducts,
    setCustomers: customersState.setCustomers,
    setComandas: comandasState.setComandas,
    setFiados: fiadosState.setFiados,
    setCaixa: caixaState.setCaixa,
    setCaixasHistory: caixaState.setCaixasHistory,
  });

  refreshRef.current = bootstrap.refreshState;

  const backupState = useBackupState({
    categories: categoriesState.categories,
    products: productsState.products,
    customers: customersState.customers,
    comandas: comandasState.comandas,
    fiados: fiadosState.fiados,
    caixa: caixaState.caixa,
    caixasHistory: caixaState.caixasHistory,
    refreshState: bootstrap.refreshState,
    resetPin: access.resetPin,
  });

  return {
    isLoading: bootstrap.isLoading,
    isLoggedIn: access.isLoggedIn,
    login: access.login,
    logout: access.logout,
    accessPin: access.accessPin,
    setAccessPin: access.setAccessPin,
    products: productsState.products,
    categories: categoriesState.categories,
    customers: customersState.customers,
    comandas: comandasState.comandas,
    fiados: fiadosState.fiados,
    caixa: caixaState.caixa,
    caixasHistory: caixaState.caixasHistory,
    abrirCaixa: caixaState.abrirCaixa,
    fecharCaixa: caixaState.fecharCaixa,
    adicionarSuprimento: caixaState.adicionarSuprimento,
    realizarSangria: caixaState.realizarSangria,
    addCategory: categoriesState.addCategory,
    updateCategory: categoriesState.updateCategory,
    addProduct: productsState.addProduct,
    updateProduct: productsState.updateProduct,
    deleteProduct: productsState.deleteProduct,
    addCustomer: customersState.addCustomer,
    updateCustomer: customersState.updateCustomer,
    deleteCustomer: customersState.deleteCustomer,
    pagarFiado: fiadosState.pagarFiado,
    addComanda: comandasState.addComanda,
    updateComanda: comandasState.updateComanda,
    cancelarComanda: comandasState.cancelarComanda,
    addItemToComanda: comandasState.addItemToComanda,
    updateComandaItemQty: comandasState.updateComandaItemQty,
    removeItemFromComanda: comandasState.removeItemFromComanda,
    pagarComanda: comandasState.pagarComanda,
    reativarComanda: comandasState.reativarComanda,
    resetAllData: backupState.resetAllData,
    importBackup: backupState.importBackup,
    exportBackup: backupState.exportBackup,
    refreshState: bootstrap.refreshState,
  };
}
