import type {
  Cashier,
  Category,
  ClosedCashier,
  Comanda,
  Customer,
  Fiado,
  Product,
} from '../../../types';

type BackupStateArgs = {
  categories: Category[];
  products: Product[];
  customers: Customer[];
  comandas: Comanda[];
  fiados: Fiado[];
  caixa: Cashier;
  caixasHistory: ClosedCashier[];
  refreshState: () => Promise<void>;
  resetPin: () => void;
};

export function useBackupState({
  categories,
  products,
  customers,
  comandas,
  fiados,
  caixa,
  caixasHistory,
  refreshState,
  resetPin,
}: BackupStateArgs) {
  const resetAllData = async () => {
    resetPin();
    await refreshState();
  };

  const importBackup = (): {success: boolean; msg: string} => ({
    success: false,
    msg: 'Importação de backup não é suportada enquanto o frontend usa a API real.',
  });

  const exportBackup = (): string =>
    JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        categories,
        products,
        customers,
        comandas,
        fiados,
        caixa,
        caixasHistory,
      },
      null,
      2,
    );

  return {
    resetAllData,
    importBackup,
    exportBackup,
  };
}
