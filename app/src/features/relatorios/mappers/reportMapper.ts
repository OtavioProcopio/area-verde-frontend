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
    name: item.nomeProduto,
    category: 'Sem categoria',
    quantity: toNumber(item.quantidadeVendida),
    total: toNumber(item.valorTotal),
  };
}

export function mapFiadoReportItem(item: ApiFiadoReportItem): FiadoReportItem {
  return {
    comandaId: String(item.comandaId),
    customerName: item.nomeExibicao || 'Cliente não identificado',
    total: toNumber(item.total),
    overdue: item.vencida,
    pendenteEm: item.pendenteEm || '',
    dueDate: item.vencimentoEm || undefined,
  };
}

export function mapStockReportItem(
  item: ApiStockReportItem,
  type: 'baixo' | 'negativo',
): StockReportItem {
  return {
    productId: String(item.produtoId),
    productName: item.nome,
    unit: mapUnit(item.unidadeEstoque),
    stock: toNumber(item.quantidadeEstoque),
    minStock: toNumber(item.estoqueMinimo),
    type,
  };
}

export function mapConsumedStockReportItem(
  item: ApiConsumedStockReportItem,
): ConsumedStockReportItem {
  return {
    productId: String(item.produtoId),
    productName: item.nome,
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
    total: toNumber(item.valorTotal),
  };
}
