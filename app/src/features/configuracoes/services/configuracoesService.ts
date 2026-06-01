import { apiRequest } from '../../../lib/api';
import {
  mapConfiguracao,
  mapConfiguracaoUpdateToApi,
} from '../mappers/configuracaoMapper';
import type {
  ApiConfiguracao,
  Configuracao,
  ConfiguracaoUpdateInput,
} from '../types';

export async function fetchConfiguracao(): Promise<Configuracao> {
  const response = await apiRequest<ApiConfiguracao>('/configuracoes');
  return mapConfiguracao(response);
}

export async function updateConfiguracao(
  input: ConfiguracaoUpdateInput,
): Promise<Configuracao> {
  const response = await apiRequest<ApiConfiguracao>('/configuracoes', {
    method: 'PUT',
    body: mapConfiguracaoUpdateToApi(input),
  });

  return mapConfiguracao(response);
}
