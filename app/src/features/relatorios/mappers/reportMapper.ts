import { mapUnit } from '../../shared/mappers/apiValueMappers';
import { toNumber } from '../../shared/utils/toNumber';
import type {
  ApiBestSellingProduct,
  ApiCommandaReportItem,
  ApiConsumedStockReportItem,
  ApiDailyReport,
  ApiFiadoReportItem,
  ApiStockReportItem,
  BestSellingProduct,
  CommandaReportItem,
  ConsumedStockReportItem,
  DailyReport,
  FiadoReportItem,
  StockReportItem,
} from '../types';

export function mapDailyReport(report: ApiDailyReport): DailyReport {
  return {
    date: report.data,
    totalSold: toNumber(report.vendas.totalVendido),
    totalReceived: toNumber(report.vendas.totalRecebido),
    totalFiadoGenerated: toNumber(report.vendas.totalFiadoGerado),
    totalPending: toNumber(report.vendas.totalPendenteAtual),
    payments: {
      dinheiro: toNumber(report.pagamentos.dinheiro),
      pix: toNumber(report.pagamentos.pix),
      cartao: toNumber(report.pagamentos.cartao),
    },
    commandas: report.comandas,
    fiados: {
      geradosNoDia: toNumber(report.fiados.geradosNoDia),
      quitadosNoDia: toNumber(report.fiados.quitadosNoDia),
      pendentesAtuais: toNumber(report.fiados.pendentesAtuais),
      vencidosAtuais: toNumber(report.fiados.vencidosAtuais),
    },
    stock: {
      low: report.estoque.produtosComEstoqueBaixo,
      negative: report.estoque.produtosComEstoqueNegativo,
    },
  };
}

export function mapBestSellingProduct(
  item: ApiBestSellingProduct,
): BestSellingProduct {
  return {
    id: item.produtoId === null ? 'unknown' : String(item.produtoId),
    name: item.produtoNome,
    category: item.categoriaNome || 'Sem categoria',
    quantity: toNumber(item.quantidadeVendida),
    total: toNumber(item.valorTotal),
  };
}

export function mapFiadoReportItem(item: ApiFiadoReportItem): FiadoReportItem {
  return {
    comandaId: String(item.comandaId),
    customerName: item.clienteNome || 'Cliente não identificado',
    total: toNumber(item.total),
    status: item.status,
    overdue: item.vencida,
    openedAt: item.abertaEm,
    dueDate: item.vencimentoEm || undefined,
  };
}

export function mapStockReportItem(item: ApiStockReportItem): StockReportItem {
  return {
    productId: String(item.produtoId),
    productName: item.produtoNome,
    unit: mapUnit(item.unidadeEstoque),
    stock: toNumber(item.quantidadeEstoque),
    minStock: toNumber(item.estoqueMinimo),
    type: item.tipo,
  };
}

export function mapConsumedStockReportItem(
  item: ApiConsumedStockReportItem,
): ConsumedStockReportItem {
  return {
    productId: String(item.produtoId),
    productName: item.produtoNome,
    unit: mapUnit(item.unidadeEstoque),
    consumed: toNumber(item.quantidadeConsumida),
  };
}

export function mapCommandaReportItem(
  item: ApiCommandaReportItem,
): CommandaReportItem {
  return {
    status: item.status,
    quantity: item.quantidade,
    total: toNumber(item.total),
  };
}
