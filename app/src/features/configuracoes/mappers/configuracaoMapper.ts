import type {
  ApiConfiguracao,
  Configuracao,
  ConfiguracaoUpdateInput,
} from '../types';

export function mapConfiguracao(configuracao: ApiConfiguracao): Configuracao {
  return {
    id: String(configuracao.id),
    nomeBar: configuracao.nomeBar,
    diasParaAlertaFiado: configuracao.diasParaAlertaFiado,
    permitirEstoqueNegativo: configuracao.permitirEstoqueNegativo,
    observacao: configuracao.observacao || '',
    senhaConfigurada: configuracao.senhaConfigurada,
    criadoEm: configuracao.criadoEm,
    atualizadoEm: configuracao.atualizadoEm,
  };
}

export function mapConfiguracaoUpdateToApi(input: ConfiguracaoUpdateInput) {
  return {
    nomeBar: input.nomeBar,
    diasParaAlertaFiado: input.diasParaAlertaFiado,
    permitirEstoqueNegativo: input.permitirEstoqueNegativo,
    observacao: input.observacao || null,
  };
}
