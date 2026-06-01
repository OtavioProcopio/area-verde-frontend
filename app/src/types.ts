/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface RecipeItem {
  ingredientId: string;
  quantity: number; // e.g. 1 unit, or 0.1 liters, etc.
}

export interface StockMovement {
  id: string;
  productId: string;
  type: 'entrada' | 'saida' | 'ajuste';
  quantity: number;
  date: string;
  origin: string;
  note?: string;
  previousBalance: number;
  newBalance: number;
}

export interface Category {
  id: string;
  name: string;
  active: boolean;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number; // Preço de venda
  costPrice: number; // Preço de custo
  stock: number; // Estoque atual
  minStock: number; // Alerta de estoque mínimo
  active: boolean; // Status do produto
  unit: 'un' | 'ml'; // Unidades compatíveis com a API
  isComposite: boolean; // Se é feito a partir de outros produtos do estoque
  recipe?: RecipeItem[]; // Lista de ingredientes e suas proporções
}

export interface Fiado {
  id: string;
  customerId: string;
  comandaId?: string; // Optional if it was a manual debit without comanda
  originalValue: number;
  paidValue: number;
  remainingValue: number;
  date: string;
  dueDate: string;
  status: 'aberto' | 'quitado';
}

export interface CustomerHistoryEntry {
  id: string;
  type: 'sale' | 'payment' | 'manual_debit';
  amount: number; // positive for debit/sale, negative for payments received
  description: string;
  timestamp: string;
}

export interface Customer {
  id: string;
  name: string;
  nickname?: string;
  phone: string;
  balance: number; // Saldo pendente (positivo = deve ao bar)
  history: CustomerHistoryEntry[];
  notes?: string;
  active?: boolean;
}

export interface TabItem {
  id: string; // Unique ID for this item in the cart (to allow customized pricing/multiples of same product)
  productId: string;
  productName: string;
  quantity: number;
  price: number; // Price of product at checkout
}

export interface Comanda {
  id: string;
  code: string; // display name (e.g. "Tab #12" or "João do Pneu")
  customerId: string | null; // linked customer for "fiado" balance
  items: TabItem[];
  status: 'active' | 'paid' | 'cancelled';
  createdAt: string;
  paidAt?: string;
  discount: number; // R$
  addition: number; // Taxa de serviço ou acréscimo
  paymentMethod?: 'dinheiro' | 'pix' | 'cartao' | 'fiado';
}

export interface CashierLog {
  id: string;
  type:
    | 'abertura'
    | 'fechamento'
    | 'venda'
    | 'suprimento'
    | 'sangria'
    | 'recebimento_fiado';
  amount: number;
  paymentMethod?: 'dinheiro' | 'pix' | 'cartao' | 'fiado';
  description: string;
  timestamp: string;
}

export interface Cashier {
  id?: string;
  isOpen: boolean;
  openedAt: string | null;
  closedAt: string | null;
  initialCash: number; // Fundo de caixa inicial em dinheiro
  currentCashInMoney: number; // Total acumulado de dinheiro em caixa física (inicial + vendas dinheiro + suprimentos + fiado dinheiro - sangrias)
  logs: CashierLog[];
  notes?: string; // Observação inicial na abertura ou fechamento
}

export interface ClosedCashier {
  id: string;
  openedAt: string;
  closedAt: string;
  initialCash: number;
  totalVendido: number;
  totalReforcos: number;
  totalSangrias: number;
  finalCashInMoney: number;
  status: 'fechado';
  notes?: string;
}
