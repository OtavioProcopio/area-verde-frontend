export type ApiDailyReport = {
  data: string;
  caixa: { id: number; status: 'ABERTO' | 'FECHADO' } | null;
  vendas: {
    totalVendido: string | number;
    totalRecebido: string | number;
    totalFiadoGerado: string | number;
    totalPendenteAtual: string | number;
  };
  pagamentos: {
    dinheiro: string | number;
    pix: string | number;
    cartao: string | number;
  };
  comandas: {
    abertas: number;
    fechadas: number;
    pendentes: number;
    canceladas: number;
  };
  fiados: {
    geradosNoDia: string | number;
    quitadosNoDia: string | number;
    pendentesAtuais: string | number;
    vencidosAtuais: string | number;
  };
  estoque: {
    produtosComEstoqueBaixo: number;
    produtosComEstoqueNegativo: number;
  };
};

export type ApiBestSellingProduct = {
  produtoId: number | null;
  nomeProduto: string;
  quantidadeVendida: string | number;
  valorTotal: string | number;
  quantidadeComandas?: number | null;
};

export type ApiFiadoReportItem = {
  comandaId: number;
  clienteId?: number | null;
  nomeExibicao: string;
  total: string | number;
  pendenteEm?: string | null;
  vencimentoEm?: string | null;
  vencida: boolean;
};

export type ApiFiadosReportResponse = {
  resumo: {
    totalPendente: string | number;
    totalVencido: string | number;
    totalQuitadoPeriodo: string | number;
    quantidadePendencias: number;
    quantidadeVencidas: number;
  };
  pendencias: ApiFiadoReportItem[];
};

export type ApiStockReportItem = {
  produtoId: number;
  nome: string;
  unidadeEstoque: 'UNIDADE' | 'ML';
  quantidadeEstoque: string | number;
  estoqueMinimo: string | number;
};

export type ApiStockReportResponse = {
  resumo: {
    produtosControlados?: number | null;
    produtosComEstoqueBaixo: number;
    produtosComEstoqueNegativo: number;
  };
  baixo: ApiStockReportItem[];
  negativo: ApiStockReportItem[];
};

export type ApiConsumedStockReportItem = {
  produtoId: number;
  nome: string;
  unidadeEstoque: 'UNIDADE' | 'ML';
  quantidadeConsumida: string | number;
};

export type ApiCommandaReportItem = {
  status: 'ABERTA' | 'FECHADA' | 'PENDENTE' | 'CANCELADA';
  quantidade: number;
  valorTotal: string | number;
};

export type ApiCommandasReportResponse = {
  resumo: unknown;
  porStatus: ApiCommandaReportItem[];
};

export type DailyReport = {
  date: string;
  totalSold: number;
  totalReceived: number;
  totalFiadoGenerated: number;
  totalPending: number;
  payments: {
    dinheiro: number;
    pix: number;
    cartao: number;
  };
  commandas: {
    abertas: number;
    fechadas: number;
    pendentes: number;
    canceladas: number;
  };
  fiados: {
    geradosNoDia: number;
    quitadosNoDia: number;
    pendentesAtuais: number;
    vencidosAtuais: number;
  };
  stock: {
    low: number;
    negative: number;
  };
};

export type BestSellingProduct = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  total: number;
};

export type FiadoReportItem = {
  comandaId: string;
  customerName: string;
  total: number;
  overdue: boolean;
  pendenteEm: string;
  dueDate?: string;
};

export type StockReportItem = {
  productId: string;
  productName: string;
  unit: 'un' | 'ml';
  stock: number;
  minStock: number;
  type: 'baixo' | 'negativo';
};

export type ConsumedStockReportItem = {
  productId: string;
  productName: string;
  unit: 'un' | 'ml';
  consumed: number;
};

export type CommandaReportItem = {
  status: 'ABERTA' | 'FECHADA' | 'PENDENTE' | 'CANCELADA';
  quantity: number;
  total: number;
};
