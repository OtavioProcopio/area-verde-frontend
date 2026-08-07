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

type OperationResult = { success: boolean; msg: string };

export function useComandasState(refreshRef: RefreshRef) {
  const [comandas, setComandas] = useState<Comanda[]>([]);

  const addComanda = async (
    code: string,
    customerId: string | null = null,
  ): Promise<{ comanda: Comanda | null } & OperationResult> => {
    try {
      const created = await createComanda(code, customerId);
      await refreshRef.current();
      return {
        comanda: created,
        success: true,
        msg: 'Comanda criada com sucesso.',
      };
    } catch (error) {
      return {
        comanda: null,
        success: false,
        msg: getApiErrorMessage(error, 'Não foi possível criar a comanda.'),
      };
    }
  };

  const updateComanda = async (updated: Comanda): Promise<OperationResult> => {
    try {
      const original = comandas.find((comanda) => comanda.id === updated.id);
      if (original?.customerId !== updated.customerId && updated.customerId) {
        await linkCustomerToComanda(updated.id, updated.customerId);
        await refreshRef.current();
      }
      return { success: true, msg: 'Comanda atualizada com sucesso.' };
    } catch (error) {
      return {
        success: false,
        msg: getApiErrorMessage(error, 'Não foi possível atualizar a comanda.'),
      };
    }
  };

  const cancelarComanda = async (
    comandaId: string,
  ): Promise<OperationResult> => {
    try {
      await cancelComanda(comandaId);
      await refreshRef.current();
      return { success: true, msg: 'Comanda cancelada com sucesso.' };
    } catch (error) {
      return {
        success: false,
        msg: getApiErrorMessage(error, 'Não foi possível cancelar a comanda.'),
      };
    }
  };

  const addItemToComanda = async (
    comandaId: string,
    item: Omit<TabItem, 'id'>,
  ): Promise<OperationResult> => {
    const productId = Number(item.productId);
    if (!Number.isFinite(productId)) {
      window.alert('Itens manuais ainda não são suportados pela API real.');
      return { success: false, msg: 'Item manual não suportado.' };
    }

    try {
      await createComandaItem(comandaId, item);
      await refreshRef.current();
      return { success: true, msg: 'Item adicionado com sucesso.' };
    } catch (error) {
      const msg = getApiErrorMessage(
        error,
        'Não foi possível adicionar o item.',
      );
      window.alert(msg);
      return { success: false, msg };
    }
  };

  const updateComandaItemQty = async (
    comandaId: string,
    itemId: string,
    quantity: number,
  ): Promise<OperationResult> => {
    const comanda = comandas.find((item) => item.id === comandaId);
    const currentItem = comanda?.items.find((item) => item.id === itemId);
    if (!currentItem) return { success: false, msg: 'Item não encontrado.' };

    const delta = quantity - currentItem.quantity;
    if (delta === 0) return { success: true, msg: 'Nenhuma alteração.' };

    try {
      if (quantity <= 0) {
        await deleteComandaItem(comandaId, itemId);
      } else if (delta > 0) {
        await incrementComandaItem(comandaId, itemId, delta);
      } else {
        await decrementComandaItem(comandaId, itemId, Math.abs(delta));
      }

      await refreshRef.current();
      return { success: true, msg: 'Quantidade atualizada com sucesso.' };
    } catch (error) {
      const msg = getApiErrorMessage(
        error,
        'Não foi possível atualizar a quantidade do item.',
      );
      window.alert(msg);
      return { success: false, msg };
    }
  };

  const removeItemFromComanda = async (
    comandaId: string,
    itemId: string,
  ): Promise<OperationResult> => {
    try {
      await deleteComandaItem(comandaId, itemId);
      await refreshRef.current();
      return { success: true, msg: 'Item removido com sucesso.' };
    } catch (error) {
      const msg = getApiErrorMessage(error, 'Não foi possível remover o item.');
      window.alert(msg);
      return { success: false, msg };
    }
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
