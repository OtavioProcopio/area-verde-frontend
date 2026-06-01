export type ApiConfiguracao = {
  id: number;
  nomeBar: string;
  diasParaAlertaFiado: number;
  permitirEstoqueNegativo: boolean;
  observacao: string | null;
  senhaConfigurada: boolean;
  criadoEm: string;
  atualizadoEm: string;
};

export type Configuracao = {
  id: string;
  nomeBar: string;
  diasParaAlertaFiado: number;
  permitirEstoqueNegativo: boolean;
  observacao: string;
  senhaConfigurada: boolean;
  criadoEm: string;
  atualizadoEm: string;
};

export type ConfiguracaoUpdateInput = {
  nomeBar: string;
  diasParaAlertaFiado: number;
  permitirEstoqueNegativo: boolean;
  observacao?: string | null;
};
