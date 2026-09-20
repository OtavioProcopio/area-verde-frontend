import { useState } from 'react';
import {
  addItemToComanda as createComandaItem,
  cancelComanda,
  closeComanda,
  createComanda,
  decrementComandaItem,
  deleteComandaItem,
  fetchComandaById,
  incrementComandaItem,
  linkCustomerToComanda,
  markComandaAsFiado,
} from '../services/comandasService';
import { getApiErrorMessage } from '../../shared/utils/getApiErrorMessage';
import type { Comanda, TabItem } from '../../../types';

type OperationResult = { success: boolean; msg: string };

export function useComandasState(
  refreshCaixa: () => Promise<void>,
  refreshFiados: () => Promise<void>,
) {
  const [comandas, setComandas] = useState<Comanda[]>([]);

  const upsertComanda = (updated: Comanda) =>
    setComandas((prev) => {
      const exists = prev.some((comanda) => comanda.id === updated.id);
      return exists
        ? prev.map((comanda) => (comanda.id === updated.id ? updated : comanda))
        : [...prev, updated];
    });

  const addComanda = async (
    code: string,
    customerId: string | null = null,
  ): Promise<{ comanda: Comanda | null } & OperationResult> => {
    try {
      const created = await createComanda(code, customerId);
      upsertComanda(created);
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
        const saved = await linkCustomerToComanda(
          updated.id,
          updated.customerId,
        );
        upsertComanda(saved);
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
      const updated = await cancelComanda(comandaId);
      upsertComanda(updated);
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
      return { success: false, msg: 'Item manual não suportado.' };
    }

    try {
      const updated = await createComandaItem(comandaId, item);
      upsertComanda(updated);
      return { success: true, msg: 'Item adicionado com sucesso.' };
    } catch (error) {
      const msg = getApiErrorMessage(
        error,
        'Não foi possível adicionar o item.',
      );
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
      const updated =
        quantity <= 0
          ? await deleteComandaItem(comandaId, itemId)
          : delta > 0
            ? await incrementComandaItem(comandaId, itemId, delta)
            : await decrementComandaItem(comandaId, itemId, Math.abs(delta));

      upsertComanda(updated);
      return { success: true, msg: 'Quantidade atualizada com sucesso.' };
    } catch (error) {
      const msg = getApiErrorMessage(
        error,
        'Não foi possível atualizar a quantidade do item.',
      );
      return { success: false, msg };
    }
  };

  const removeItemFromComanda = async (
    comandaId: string,
    itemId: string,
  ): Promise<OperationResult> => {
    try {
      const updated = await deleteComandaItem(comandaId, itemId);
      upsertComanda(updated);
      return { success: true, msg: 'Item removido com sucesso.' };
    } catch (error) {
      const msg = getApiErrorMessage(error, 'Não foi possível remover o item.');
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
        // A resposta de /fiado tem um formato diferente do
        // ComandaDetalheResponse (é PendenciaDetalheResponse) — refetch
        // pontual da comanda em vez de tentar remapear a resposta.
        const [updated] = await Promise.all([
          fetchComandaById(comandaId),
          refreshFiados(),
        ]);
        upsertComanda(updated);
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
      // Idem: resposta de /fechar (FecharComandaResponse) não traz itens —
      // refetch pontual da comanda + do caixa (o pagamento impacta o caixa).
      const [updated] = await Promise.all([
        fetchComandaById(comandaId),
        refreshCaixa(),
      ]);
      upsertComanda(updated);
      return { success: true, msg: 'Comanda finalizada com sucesso.' };
    } catch (error) {
      return {
        success: false,
        msg: getApiErrorMessage(error, 'Não foi possível fechar a comanda.'),
      };
    }
  };

  const reativarComanda = async (): Promise<OperationResult> => {
    return {
      success: false,
      msg: 'Reabrir comanda não é suportado pela API atual.',
    };
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
