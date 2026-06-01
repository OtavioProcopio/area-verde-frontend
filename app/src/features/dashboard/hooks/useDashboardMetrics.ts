import {useCallback, useEffect, useState} from 'react';
import {
  fetchBestSellingProducts,
  fetchCommandasReport,
  fetchDailyReport,
  fetchStockReport,
} from '../../relatorios/services/relatoriosService';
import type {
  BestSellingProduct,
  DailyReport,
  StockReportItem,
} from '../../relatorios/types';

type DashboardMetrics = {
  dailyReport: DailyReport | null;
  openCommandasCount: number;
  openCommandasTotal: number;
  bestSellers: BestSellingProduct[];
  lowStockItems: StockReportItem[];
  negativeStockItems: StockReportItem[];
};

function getTodayIsoDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Não foi possível carregar os indicadores do dashboard.';
}

export function useDashboardMetrics() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMetrics = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const today = getTodayIsoDate();
      const [
        dailyReport,
        commandasReport,
        bestSellers,
        lowStockItems,
        negativeStockItems,
      ] = await Promise.all([
        fetchDailyReport(today),
        fetchCommandasReport({status: 'ABERTA', dataInicio: today, dataFim: today}),
        fetchBestSellingProducts({
          dataInicio: today,
          dataFim: today,
          limite: 5,
        }),
        fetchStockReport('baixo'),
        fetchStockReport('negativo'),
      ]);

      const openCommandas = commandasReport.find((item) => item.status === 'ABERTA');

      setMetrics({
        dailyReport,
        openCommandasCount: openCommandas?.quantity || 0,
        openCommandasTotal: openCommandas?.total || 0,
        bestSellers,
        lowStockItems,
        negativeStockItems,
      });
    } catch (loadError) {
      setError(toErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMetrics();
  }, [loadMetrics]);

  return {
    metrics,
    isLoading,
    error,
    reload: loadMetrics,
  };
}
