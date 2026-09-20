import { useState } from 'react';
import { EMPTY_CASHIER } from '../mappers/caixaMapper';
import {
  closeCaixa,
  createReforco,
  createSangria,
  fetchCaixaAtual,
  fetchCaixasHistory,
  openCaixa,
} from '../services/caixaService';
import { getApiErrorMessage } from '../../shared/utils/getApiErrorMessage';
import type { Cashier, ClosedCashier } from '../../../types';

type OperationResult = { success: boolean; msg: string };

export function useCaixaState() {
  const [caixa, setCaixa] = useState<Cashier>(EMPTY_CASHIER);
  const [caixasHistory, setCaixasHistory] = useState<ClosedCashier[]>([]);

  const abrirCaixa = async (
    valorInicial: number,
    observacao?: string,
  ): Promise<OperationResult> => {
    try {
      setCaixa(await openCaixa(valorInicial, observacao));
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
      const [updated, history] = await Promise.all([
        closeCaixa(caixa.id, caixa.currentCashInMoney, observacaoFechamento),
        fetchCaixasHistory(),
      ]);
      setCaixa(updated);
      setCaixasHistory(history);
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
      setCaixa(await createReforco(caixa.id, valor, descricao));
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
      setCaixa(await createSangria(caixa.id, valor, descricao));
      return { success: true, msg: 'Sangria registrada com sucesso.' };
    } catch (error) {
      return {
        success: false,
        msg: getApiErrorMessage(error, 'Não foi possível registrar a sangria.'),
      };
    }
  };

  const refreshCaixa = async () => {
    setCaixa(await fetchCaixaAtual());
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
    refreshCaixa,
  };
}
