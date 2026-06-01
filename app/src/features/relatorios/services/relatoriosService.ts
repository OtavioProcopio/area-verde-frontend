import { apiRequest } from '../../../lib/api';
import {
  mapBestSellingProduct,
  mapCommandaReportItem,
  mapConsumedStockReportItem,
  mapDailyReport,
  mapFiadoReportItem,
  mapStockReportItem,
} from '../mappers/reportMapper';
import type {
  ApiBestSellingProduct,
  ApiCommandaReportItem,
  ApiConsumedStockReportItem,
  ApiDailyReport,
  ApiFiadoReportItem,
  ApiStockReportItem,
} from '../types';

type PeriodFilter = {
  dataInicio?: string;
  dataFim?: string;
};

function withQuery(
  path: string,
  params: Record<string, string | number | undefined>,
) {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      query.set(key, String(value));
    }
  }

  const suffix = query.toString();
  return suffix ? `${path}?${suffix}` : path;
}

export async function fetchDailyReport(data?: string) {
  const report = await apiRequest<ApiDailyReport>(
    withQuery('/relatorios/diario', { data }),
  );
  return mapDailyReport(report);
}

export async function fetchBestSellingProducts(
  filters: PeriodFilter & { limite?: number } = {},
) {
  const response = await apiRequest<ApiBestSellingProduct[]>(
    withQuery('/relatorios/produtos-mais-vendidos', filters),
  );
  return response.map(mapBestSellingProduct);
}

export async function fetchFiadosReport(
  filters: PeriodFilter & {
    status?: 'pendentes' | 'vencidos' | 'quitados' | 'todos';
    clienteId?: string;
  } = {},
) {
  const response = await apiRequest<ApiFiadoReportItem[]>(
    withQuery('/relatorios/fiados', filters),
  );
  return response.map(mapFiadoReportItem);
}

export async function fetchStockReport(
  tipo: 'baixo' | 'negativo' | 'todos' = 'todos',
) {
  const response = await apiRequest<ApiStockReportItem[]>(
    withQuery('/relatorios/estoque', { tipo }),
  );
  return response.map(mapStockReportItem);
}

export async function fetchConsumedStockReport(filters: PeriodFilter = {}) {
  const response = await apiRequest<ApiConsumedStockReportItem[]>(
    withQuery('/relatorios/estoque-consumido', filters),
  );
  return response.map(mapConsumedStockReportItem);
}

export async function fetchCommandasReport(
  filters: PeriodFilter & {
    status?: 'ABERTA' | 'FECHADA' | 'PENDENTE' | 'CANCELADA';
  } = {},
) {
  const response = await apiRequest<ApiCommandaReportItem[]>(
    withQuery('/relatorios/comandas', filters),
  );
  return response.map(mapCommandaReportItem);
}
