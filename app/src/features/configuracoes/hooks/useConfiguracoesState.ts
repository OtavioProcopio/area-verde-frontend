import { useState } from 'react';
import { getApiErrorMessage } from '../../shared/utils/getApiErrorMessage';
import { updateConfiguracao as persistConfiguracao } from '../services/configuracoesService';
import type { Configuracao, ConfiguracaoUpdateInput } from '../types';

type RefreshRef = {
  current: () => Promise<void>;
};

export function useConfiguracoesState(refreshRef: RefreshRef) {
  const [configuracao, setConfiguracao] = useState<Configuracao | null>(null);
  const [isSavingConfiguracao, setIsSavingConfiguracao] = useState(false);
  const [configuracaoFeedback, setConfiguracaoFeedback] = useState<{
    tone: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const saveConfiguracao = async (input: ConfiguracaoUpdateInput) => {
    setIsSavingConfiguracao(true);
    setConfiguracaoFeedback(null);

    try {
      const updated = await persistConfiguracao(input);
      setConfiguracao(updated);
      setConfiguracaoFeedback({
        tone: 'success',
        message: 'Configurações salvas com sucesso.',
      });
      await refreshRef.current();
    } catch (error) {
      setConfiguracaoFeedback({
        tone: 'error',
        message: getApiErrorMessage(
          error,
          'Não foi possível salvar as configurações do sistema.',
        ),
      });
      throw error;
    } finally {
      setIsSavingConfiguracao(false);
    }
  };

  return {
    configuracao,
    setConfiguracao,
    isSavingConfiguracao,
    configuracaoFeedback,
    clearConfiguracaoFeedback: () => setConfiguracaoFeedback(null),
    saveConfiguracao,
  };
}
