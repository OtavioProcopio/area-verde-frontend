export type ApiItemComanda = {
  id: number;
  produtoId?: number | null;
  nomeProduto: string;
  quantidade: number;
  precoUnitario: number;
  totalItem: number;
};

export type ApiComandaSummary = {
  id: number;
  caixaOrigemId?: number | null;
  clienteId?: number | null;
  nomeCliente: string;
  nomeClienteSnapshot?: string | null;
  status: 'ABERTA' | 'FECHADA' | 'PENDENTE' | 'CANCELADA';
  total: number;
  abertaEm: string;
};

export type ApiComandaDetail = ApiComandaSummary & {
  fechadaEm?: string | null;
  canceladaEm?: string | null;
  observacao?: string | null;
  itens: ApiItemComanda[];
};

export type ApiPagamento = {
  formaPagamento: 'DINHEIRO' | 'PIX' | 'CARTAO' | 'FIADO';
  valor: string | number;
  criadoEm: string;
};
