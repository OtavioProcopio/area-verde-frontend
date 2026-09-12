/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import { Comanda, Product, Customer, TabItem, Category } from '../types';
import { ComandaListView } from './comandas/ComandaListView';
import { CartPanel } from './comandas/CartPanel';
import { ProductPicker } from './comandas/ProductPicker';
import { NewComandaModal } from './comandas/NewComandaModal';
import { CheckoutModal } from './comandas/CheckoutModal';
import { ReceiptModal } from './comandas/ReceiptModal';
import { ConfirmDialog, ConfirmDialogRequest } from './comandas/ConfirmDialog';
import { OperationNotice } from './comandas/OperationNotice';

type PaymentMethod = 'dinheiro' | 'pix' | 'cartao' | 'fiado';

interface ComandasProps {
  comandas: Comanda[];
  products: Product[];
  categories: Category[];
  customers: Customer[];
  caixaIsOpen: boolean;
  permitirEstoqueNegativo: boolean;
  onAddComanda: (
    code: string,
    customerId: string | null,
  ) => Promise<{ comanda: Comanda | null; success: boolean; msg: string }>;
  onUpdateComanda: (
    id: string,
    updates: Partial<Comanda>,
  ) => void | Promise<void>;
  onAddItemToComanda: (comandaId: string, item: Omit<TabItem, 'id'>) => unknown;
  onUpdateComandaItemQty: (
    comandaId: string,
    itemId: string,
    qty: number,
  ) => unknown;
  onRemoveItemFromComanda: (comandaId: string, itemId: string) => unknown;
  onCancelarComanda: (comandaId: string) => unknown;
  onPagarComanda: (
    comandaId: string,
    metodo: PaymentMethod,
    desconto: number,
    acrescimo: number,
    clienteIdParaFiado: string | null,
  ) => Promise<{ success: boolean; msg: string }>;
  onAddCustomer: (c: {
    name: string;
    phone: string;
    notes?: string;
  }) => unknown;
  onImmersiveChange?: (immersive: boolean) => void;
}

const NOTICE_DURATION_MS = 3200;

export default function Comandas({
  comandas,
  products,
  categories,
  customers,
  caixaIsOpen,
  permitirEstoqueNegativo,
  onAddComanda,
  onUpdateComanda,
  onAddItemToComanda,
  onUpdateComandaItemQty,
  onRemoveItemFromComanda,
  onCancelarComanda,
  onPagarComanda,
  onAddCustomer,
  onImmersiveChange,
}: ComandasProps) {
  const [viewMode, setViewMode] = useState<'list' | 'pos'>('list');
  const [selectedComandaId, setSelectedComandaId] = useState<string | null>(
    comandas.filter((c) => c.status === 'active')[0]?.id || null,
  );

  useEffect(() => {
    onImmersiveChange?.(viewMode === 'pos');
    return () => onImmersiveChange?.(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode]);

  const [showNewComandaModal, setShowNewComandaModal] = useState(false);
  const [newComandaError, setNewComandaError] = useState<string | null>(null);

  const [checkoutMethod, setCheckoutMethod] = useState<PaymentMethod | null>(
    null,
  );
  const [receiptComanda, setReceiptComanda] = useState<Comanda | null>(null);

  const [confirmRequest, setConfirmRequest] =
    useState<ConfirmDialogRequest | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const activeComandas = comandas.filter((c) => c.status === 'active');
  const selectedComanda = comandas.find((c) => c.id === selectedComandaId);

  const showNotice = (message: string) => {
    setNotice(message);
    setTimeout(() => {
      setNotice((current) => (current === message ? null : current));
    }, NOTICE_DURATION_MS);
  };

  const handleCreateComanda = async (
    name: string,
    customerId: string | null,
  ) => {
    setNewComandaError(null);
    const res = await onAddComanda(name, customerId);

    if (!res.success || !res.comanda) {
      setNewComandaError(res.msg);
      return;
    }

    setSelectedComandaId(res.comanda.id);
    setViewMode('pos');
    setShowNewComandaModal(false);
  };

  const addItem = (comandaId: string, product: Product) => {
    onAddItemToComanda(comandaId, {
      productId: product.id,
      productName: product.name,
      quantity: 1,
      price: product.price,
    });
  };

  const handleAddProductToComanda = (product: Product) => {
    if (!selectedComandaId) {
      showNotice('Selecione ou abra uma comanda ativa antes de lançar itens.');
      return;
    }

    if (!product.isComposite && product.stock <= 0) {
      setConfirmRequest({
        title: 'Estoque zerado',
        message: `"${product.name}" está com estoque zerado. Registrar a saída mesmo assim?`,
        tone: 'danger',
        confirmLabel: 'Registrar mesmo assim',
        onConfirm: () => addItem(selectedComandaId, product),
      });
      return;
    }

    addItem(selectedComandaId, product);
  };

  const handleLaunchCheckout = (metodo: 'dinheiro' | 'fiado') => {
    if (!selectedComanda) return;

    if (selectedComanda.items.length === 0) {
      showNotice('Impossível fechar uma comanda vazia.');
      return;
    }
    if (!caixaIsOpen) {
      showNotice(
        'O caixa diário está fechado. Abra o caixa na aba "Controle de Caixa".',
      );
      return;
    }

    setCheckoutMethod(metodo);
  };

  const handleCheckoutSuccess = (paidComanda: Comanda) => {
    setCheckoutMethod(null);
    setReceiptComanda(paidComanda);

    const remaining = comandas.filter(
      (c) => c.status === 'active' && c.id !== paidComanda.id,
    );
    setSelectedComandaId(remaining[0]?.id ?? null);
  };

  const requestCancelComanda = (id: string, code: string) => {
    setConfirmRequest({
      title: 'Cancelar comanda',
      message: `Tem certeza que deseja cancelar a comanda ${code}? Essa ação não pode ser desfeita.`,
      tone: 'danger',
      confirmLabel: 'Cancelar comanda',
      onConfirm: () => {
        onCancelarComanda(id);
        if (id === selectedComandaId) setViewMode('list');
      },
    });
  };

  const requestRemoveItem = (itemId: string, productName: string) => {
    if (!selectedComandaId) return;
    setConfirmRequest({
      title: 'Remover item',
      message: `Remover "${productName}" da comanda?`,
      tone: 'danger',
      confirmLabel: 'Remover',
      onConfirm: () => onRemoveItemFromComanda(selectedComandaId, itemId),
    });
  };

  const openNewComandaModal = () => {
    setNewComandaError(null);
    setShowNewComandaModal(true);
  };

  return (
    <div id="comandas-module">
      <OperationNotice message={notice} />

      {viewMode === 'list' && (
        <ComandaListView
          comandas={comandas}
          customers={customers}
          onOpenComanda={(id) => {
            setSelectedComandaId(id);
            setViewMode('pos');
          }}
          onRequestCancelComanda={requestCancelComanda}
          onNewComanda={openNewComandaModal}
        />
      )}

      {viewMode === 'pos' && (
        <div className="flex h-[calc(100vh-112px)] min-h-[500px] flex-col lg:h-[calc(100vh-96px)]">
          <div className="flex shrink-0 items-center justify-between gap-4 border-b-2 border-counter-700 bg-counter-900 px-4 py-2.5">
            <div className="flex flex-1 items-center gap-2 overflow-x-auto">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className="mr-1 shrink-0 rounded-lg px-3 py-2 text-sm font-bold text-cream-300 transition hover:bg-counter-800"
              >
                &larr; Voltar
              </button>
              {activeComandas.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedComandaId(c.id)}
                  className={`shrink-0 rounded-lg border px-4 py-2 text-sm font-bold transition ${
                    c.id === selectedComandaId
                      ? 'border-gold-500 bg-gold-500 text-counter-950'
                      : 'border-counter-700 bg-counter-800 text-cream-300 hover:border-gold-500/50'
                  }`}
                >
                  {c.code}
                </button>
              ))}
              {activeComandas.length === 0 && (
                <div className="px-2 text-sm italic text-cream-400">
                  Nenhuma comanda aberta na sua sessão
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={openNewComandaModal}
              className="shrink-0 rounded-lg bg-gold-500/15 px-4 py-2 text-sm font-bold text-gold-400 transition hover:bg-gold-500/25"
            >
              + Nova comanda
            </button>
          </div>

          {!selectedComanda ? (
            <div className="flex flex-1 flex-col items-center justify-center bg-counter-950 text-center text-cream-400">
              <ShoppingBag size={67} className="mb-4 opacity-30" />
              <h5 className="mb-1 font-display text-xl font-bold text-cream-200">
                Nenhuma comanda em atendimento
              </h5>
              <p className="max-w-xs">
                Abra uma nova ou selecione uma comanda acima.
              </p>
            </div>
          ) : (
            <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-12">
              <div className="col-span-1 min-h-[420px] lg:col-span-7 lg:min-h-0">
                <CartPanel
                  comanda={selectedComanda}
                  products={products}
                  customers={customers}
                  onUpdateComanda={onUpdateComanda}
                  onUpdateComandaItemQty={(itemId, qty) =>
                    onUpdateComandaItemQty(selectedComanda.id, itemId, qty)
                  }
                  onRequestRemoveItem={requestRemoveItem}
                  onRequestCancelComanda={() =>
                    requestCancelComanda(
                      selectedComanda.id,
                      selectedComanda.code,
                    )
                  }
                  onCheckout={handleLaunchCheckout}
                />
              </div>
              <div className="col-span-1 min-h-[420px] border-t-2 border-counter-700 lg:col-span-5 lg:min-h-0 lg:border-l-2 lg:border-t-0">
                <ProductPicker
                  key={selectedComanda.id}
                  products={products}
                  categories={categories}
                  permitirEstoqueNegativo={permitirEstoqueNegativo}
                  onAddProduct={handleAddProductToComanda}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {showNewComandaModal && (
        <NewComandaModal
          customers={customers}
          error={newComandaError}
          onClose={() => setShowNewComandaModal(false)}
          onSubmit={handleCreateComanda}
        />
      )}

      {checkoutMethod && selectedComanda && (
        <CheckoutModal
          comanda={selectedComanda}
          customers={customers}
          initialMethod={checkoutMethod}
          onAddCustomer={onAddCustomer}
          onConfirm={(metodo, customerId) =>
            onPagarComanda(selectedComanda.id, metodo, 0, 0, customerId)
          }
          onSuccess={handleCheckoutSuccess}
          onClose={() => setCheckoutMethod(null)}
        />
      )}

      {receiptComanda && (
        <ReceiptModal
          comanda={receiptComanda}
          onClose={() => setReceiptComanda(null)}
        />
      )}

      <ConfirmDialog
        request={confirmRequest}
        onClose={() => setConfirmRequest(null)}
      />
    </div>
  );
}
