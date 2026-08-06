import { useState } from 'react';
import {
  addItemToComanda as createComandaItem,
  cancelComanda,
  closeComanda,
  createComanda,
  decrementComandaItem,
  deleteComandaItem,
  incrementComandaItem,
  linkCustomerToComanda,
  markComandaAsFiado,
} from '../services/comandasService';
import { getApiErrorMessage } from '../../shared/utils/getApiErrorMessage';
import type { Comanda, TabItem } from '../../../types';

type RefreshRef = {
  current: () => Promise<void>;
};

export function useComandasState(refreshRef: RefreshRef) {
  const [comandas, setComandas] = useState<Comanda[]>([]);

  const addComanda = async (
    code: string,
    customerId: string | null = null,
  ): Promise<Comanda> => {
    const created = await createComanda(code, customerId);
    await refreshRef.current();
    return created;
  };

  const updateComanda = async (updated: Comanda) => {
    const original = comandas.find((comanda) => comanda.id === updated.id);
    if (original?.customerId !== updated.customerId && updated.customerId) {
      await linkCustomerToComanda(updated.id, updated.customerId);
      await refreshRef.current();
    }
  };

  const cancelarComanda = async (comandaId: string) => {
    await cancelComanda(comandaId);
    await refreshRef.current();
  };

  const addItemToComanda = async (
    comandaId: string,
    item: Omit<TabItem, 'id'>,
  ) => {
    const productId = Number(item.productId);
    if (!Number.isFinite(productId)) {
      window.alert('Itens manuais ainda não são suportados pela API real.');
      return;
    }

    await createComandaItem(comandaId, item);
    await refreshRef.current();
  };

  const updateComandaItemQty = async (
    comandaId: string,
    itemId: string,
    quantity: number,
  ) => {
    const comanda = comandas.find((item) => item.id === comandaId);
    const currentItem = comanda?.items.find((item) => item.id === itemId);
    if (!currentItem) return;

    const delta = quantity - currentItem.quantity;
    if (delta === 0) return;

    if (quantity <= 0) {
      await deleteComandaItem(comandaId, itemId);
    } else if (delta > 0) {
      await incrementComandaItem(comandaId, itemId, delta);
    } else {
      await decrementComandaItem(comandaId, itemId, Math.abs(delta));
    }

    await refreshRef.current();
  };

  const removeItemFromComanda = async (comandaId: string, itemId: string) => {
    await deleteComandaItem(comandaId, itemId);
    await refreshRef.current();
  };

  const pagarComanda = async (
    comandaId: string,
    metodo: 'dinheiro' | 'pix' | 'cartao' | 'fiado',
    desconto = 0,
    acrescimo = 0,
    clienteIdParaFiado: string | null = null,
  ): Promise<{ success: boolean; msg: string }> => {
    const comanda = comandas.find((item) => item.id === comandaId);
    if (!comanda) return { success: false, msg: 'Comanda não encontrada.' };

    if (desconto > 0 || acrescimo > 0) {
      return {
        success: false,
        msg: 'Desconto e acréscimo ainda não estão integrados à API.',
      };
    }

    const total = comanda.items.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0,
    );

    if (metodo === 'fiado') {
      const customerId = clienteIdParaFiado || comanda.customerId;
      if (!customerId) {
        return {
          success: false,
          msg: 'Selecione um cliente para marcar a comanda como fiado.',
        };
      }

      try {
        await markComandaAsFiado(comandaId, customerId);
        await refreshRef.current();
        return { success: true, msg: 'Comanda marcada como fiado.' };
      } catch (error) {
        return {
          success: false,
          msg: getApiErrorMessage(
            error,
            'Não foi possível marcar a comanda como fiado.',
          ),
        };
      }
    }

    try {
      await closeComanda(comandaId, metodo, total);
      await refreshRef.current();
      return { success: true, msg: 'Comanda finalizada com sucesso.' };
    } catch (error) {
      return {
        success: false,
        msg: getApiErrorMessage(error, 'Não foi possível fechar a comanda.'),
      };
    }
  };

  const reativarComanda = async () => {
    window.alert('Reabrir comanda não é suportado pela API atual.');
  };

  return {
    comandas,
    setComandas,
    addComanda,
    updateComanda,
    cancelarComanda,
    addItemToComanda,
    updateComandaItemQty,
    removeItemFromComanda,
    pagarComanda,
    reativarComanda,
  };
}
