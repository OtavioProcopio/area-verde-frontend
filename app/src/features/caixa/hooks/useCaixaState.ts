import { useState } from 'react';
import { EMPTY_CASHIER } from '../mappers/caixaMapper';
import {
  closeCaixa,
  createReforco,
  createSangria,
  openCaixa,
} from '../services/caixaService';
import { getApiErrorMessage } from '../../shared/utils/getApiErrorMessage';
import type { Cashier, ClosedCashier } from '../../../types';

type RefreshRef = {
  current: () => Promise<void>;
};

type OperationResult = { success: boolean; msg: string };

export function useCaixaState(refreshRef: RefreshRef) {
  const [caixa, setCaixa] = useState<Cashier>(EMPTY_CASHIER);
  const [caixasHistory, setCaixasHistory] = useState<ClosedCashier[]>([]);

  const abrirCaixa = async (
    valorInicial: number,
    observacao?: string,
  ): Promise<OperationResult> => {
    try {
      await openCaixa(valorInicial, observacao);
      await refreshRef.current();
      return { success: true, msg: 'Caixa aberto com sucesso.' };
    } catch (error) {
      return {
        success: false,
        msg: getApiErrorMessage(error, 'Não foi possível abrir o caixa.'),
      };
    }
  };

  const fecharCaixa = async (
    observacaoFechamento?: string,
  ): Promise<OperationResult> => {
    if (!caixa.id) {
      return { success: false, msg: 'Nenhum caixa aberto para fechar.' };
    }

    try {
      await closeCaixa(
        caixa.id,
        caixa.currentCashInMoney,
        observacaoFechamento,
      );
      await refreshRef.current();
      return { success: true, msg: 'Caixa fechado com sucesso.' };
    } catch (error) {
      return {
        success: false,
        msg: getApiErrorMessage(error, 'Não foi possível fechar o caixa.'),
      };
    }
  };

  const adicionarSuprimento = async (
    valor: number,
    descricao: string,
  ): Promise<OperationResult> => {
    if (!caixa.id) {
      return { success: false, msg: 'Nenhum caixa aberto no momento.' };
    }

    try {
      await createReforco(caixa.id, valor, descricao);
      await refreshRef.current();
      return { success: true, msg: 'Reforço registrado com sucesso.' };
    } catch (error) {
      return {
        success: false,
        msg: getApiErrorMessage(error, 'Não foi possível registrar o reforço.'),
      };
    }
  };

  const realizarSangria = async (
    valor: number,
    descricao: string,
  ): Promise<OperationResult> => {
    if (!caixa.id) {
      return { success: false, msg: 'Nenhum caixa aberto no momento.' };
    }

    try {
      await createSangria(caixa.id, valor, descricao);
      await refreshRef.current();
      return { success: true, msg: 'Sangria registrada com sucesso.' };
    } catch (error) {
      return {
        success: false,
        msg: getApiErrorMessage(error, 'Não foi possível registrar a sangria.'),
      };
    }
  };

  return {
    caixa,
    caixasHistory,
    setCaixa,
    setCaixasHistory,
    abrirCaixa,
    fecharCaixa,
    adicionarSuprimento,
    realizarSangria,
  };
}
