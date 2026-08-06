import { useState } from 'react';
import { settleFiado } from '../services/fiadosService';
import { getApiErrorMessage } from '../../shared/utils/getApiErrorMessage';
import type { Fiado } from '../../../types';

type RefreshRef = {
  current: () => Promise<void>;
};

export function useFiadosState(refreshRef: RefreshRef) {
  const [fiados, setFiados] = useState<Fiado[]>([]);

  const pagarFiado = async (
    customerId: string,
    valor: number,
    metodo: 'dinheiro' | 'pix' | 'cartao',
  ): Promise<{ success: boolean; msg: string }> => {
    const pendencias = fiados
      .filter(
        (fiado) => fiado.customerId === customerId && fiado.status === 'aberto',
      )
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (pendencias.length === 0) {
      return {
        success: false,
        msg: 'Nenhuma pendência aberta para este cliente.',
      };
    }

    let restante = Number(valor.toFixed(2));
    for (const pendencia of pendencias) {
      if (restante <= 0) break;

      const saldo = Number(pendencia.remainingValue.toFixed(2));
      if (restante + 0.001 < saldo) {
        return {
          success: false,
          msg: 'A API ainda não suporta pagamento parcial de um único fiado.',
        };
      }

      try {
        await settleFiado(pendencia.comandaId || '', saldo, metodo);
      } catch (error) {
        await refreshRef.current();
        return {
          success: false,
          msg: getApiErrorMessage(error, 'Não foi possível quitar o fiado.'),
        };
      }
      restante = Number((restante - saldo).toFixed(2));
    }

    if (restante > 0.001) {
      return {
        success: false,
        msg: 'O valor informado não corresponde à soma exata das pendências em aberto.',
      };
    }

    await refreshRef.current();
    return { success: true, msg: 'Fiado quitado com sucesso.' };
  };

  return {
    fiados,
    setFiados,
    pagarFiado,
  };
}
