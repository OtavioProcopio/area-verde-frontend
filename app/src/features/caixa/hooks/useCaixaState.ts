import { useState } from 'react';
import { EMPTY_CASHIER } from '../mappers/caixaMapper';
import {
  closeCaixa,
  createReforco,
  createSangria,
  openCaixa,
} from '../services/caixaService';
import type { Cashier, ClosedCashier } from '../../../types';

type RefreshRef = {
  current: () => Promise<void>;
};

export function useCaixaState(refreshRef: RefreshRef) {
  const [caixa, setCaixa] = useState<Cashier>(EMPTY_CASHIER);
  const [caixasHistory, setCaixasHistory] = useState<ClosedCashier[]>([]);

  const abrirCaixa = async (valorInicial: number, observacao?: string) => {
    await openCaixa(valorInicial, observacao);
    await refreshRef.current();
  };

  const fecharCaixa = async (observacaoFechamento?: string) => {
    if (!caixa.id) return;

    await closeCaixa(caixa.id, caixa.currentCashInMoney, observacaoFechamento);
    await refreshRef.current();
  };

  const adicionarSuprimento = async (valor: number, descricao: string) => {
    if (!caixa.id) return;

    await createReforco(caixa.id, valor, descricao);
    await refreshRef.current();
  };

  const realizarSangria = async (valor: number, descricao: string) => {
    if (!caixa.id) return;

    await createSangria(caixa.id, valor, descricao);
    await refreshRef.current();
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
