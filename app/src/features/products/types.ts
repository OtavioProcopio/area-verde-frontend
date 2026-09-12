export type ApiProduct = {
  id: number;
  nome: string;
  categoria: { id: number; nome: string };
  precoVenda: number;
  tipoProduto: 'SIMPLES' | 'COMPOSTO';
  controlaEstoque: boolean;
  unidadeEstoque: string | null;
  quantidadeEstoque: number;
  quantidadeBaixaPorVenda: number;
  estoqueMinimo: number;
  ativo: boolean;
};

export type ApiProductComposition = {
  produtoId: number;
  tipoProduto: 'SIMPLES' | 'COMPOSTO';
  componentes: Array<{
    produtoComponenteId: number;
    quantidadeBaixa: string;
  }>;
};

export type ApiProdutoCompostoResponse = {
  produto: ApiProduct;
  componentes: ApiProductComposition['componentes'];
};
