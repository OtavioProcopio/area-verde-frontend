import {useCallback, useEffect, useState} from 'react';
import {ApiError, apiRequest} from './lib/api';
import {
  Cashier,
  CashierLog,
  Category,
  ClosedCashier,
  Comanda,
  Customer,
  CustomerHistoryEntry,
  Fiado,
  Product,
  RecipeItem,
  TabItem,
} from './types';

type ApiCategory = {
  id: number;
  nome: string;
  ativo: boolean;
};

type ApiProduct = {
  id: number;
  nome: string;
  categoria: {id: number; nome: string};
  precoVenda: number;
  tipoProduto: 'SIMPLES' | 'COMPOSTO';
  controlaEstoque: boolean;
  unidadeEstoque: string | null;
  quantidadeEstoque: number;
  quantidadeBaixaPorVenda: number;
  estoqueMinimo: number;
  ativo: boolean;
};

type ApiProductComposition = {
  produtoId: number;
  tipoProduto: 'SIMPLES' | 'COMPOSTO';
  componentes: Array<{
    produtoComponenteId: number;
    quantidadeBaixa: string;
  }>;
};

type ApiCustomerSummary = {
  id: number;
  nome: string;
  apelido?: string | null;
  telefone?: string | null;
  ativo: boolean;
};

type ApiCustomerDetail = ApiCustomerSummary & {
  observacao?: string | null;
};

type ApiPendenciaResumo = {
  comandaId: number;
  cliente?: {id: number; nome: string; apelido?: string | null} | null;
  total: string | number;
  abertaEm: string;
  pendenteEm?: string | null;
  vencimentoEm?: string | null;
  status: 'PENDENTE' | 'FECHADA';
  vencida: boolean;
};

type ApiCustomerPendencias = {
  totalPendente: string | number;
  totalVencido: string | number;
  pendencias: ApiPendenciaResumo[];
};

type ApiItemComanda = {
  id: number;
  produtoId?: number | null;
  nomeProduto: string;
  quantidade: number;
  precoUnitario: number;
  totalItem: number;
};

type ApiComandaSummary = {
  id: number;
  caixaOrigemId?: number | null;
  clienteId?: number | null;
  nomeCliente: string;
  nomeClienteSnapshot?: string | null;
  status: 'ABERTA' | 'FECHADA' | 'PENDENTE' | 'CANCELADA';
  total: number;
  abertaEm: string;
};

type ApiComandaDetail = ApiComandaSummary & {
  fechadaEm?: string | null;
  canceladaEm?: string | null;
  observacao?: string | null;
  itens: ApiItemComanda[];
};

type ApiPagamento = {
  formaPagamento: 'DINHEIRO' | 'PIX' | 'CARTAO' | 'FIADO';
  valor: string | number;
  criadoEm: string;
};

type ApiCaixaMovement = {
  id: number;
  tipo: 'ABERTURA' | 'REFORCO' | 'SANGRIA';
  valor: string | number;
  observacao?: string | null;
  criadoEm: string;
};

type ApiCaixaPagamento = ApiPagamento & {
  id: number;
  comandaId: number;
};

type ApiCaixaDetail = {
  id: number;
  status: 'ABERTO' | 'FECHADO';
  valorInicial: string | number;
  dinheiroEsperado: string | number;
  dinheiroInformado?: string | number | null;
  abertoEm: string;
  fechadoEm?: string | null;
  pagamentos: ApiCaixaPagamento[];
  movimentos: ApiCaixaMovement[];
};

type ApiCaixaSummary = {
  id: number;
  status: 'ABERTO' | 'FECHADO';
  valorInicial: string | number;
  dinheiroEsperado: string | number;
  abertoEm: string;
  fechadoEm?: string | null;
};

const PIN_STORAGE_KEY = 'av_pin';
const DEFAULT_PIN = '1234';

const EMPTY_CASHIER: Cashier = {
  isOpen: false,
  openedAt: null,
  closedAt: null,
  initialCash: 0,
  currentCashInMoney: 0,
  logs: [],
};

function toNumber(value: string | number | null | undefined): number {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function mapUnit(unit?: string | null): 'un' | 'ml' {
  switch (unit) {
    case 'UNIDADE':
      return 'un';
    case 'ML':
      return 'ml';
    default:
      return 'un';
  }
}

function mapPaymentMethod(
  method?: 'DINHEIRO' | 'PIX' | 'CARTAO' | 'FIADO',
): 'dinheiro' | 'pix' | 'cartao' | 'fiado' | undefined {
  switch (method) {
    case 'DINHEIRO':
      return 'dinheiro';
    case 'PIX':
      return 'pix';
    case 'CARTAO':
      return 'cartao';
    case 'FIADO':
      return 'fiado';
    default:
      return undefined;
  }
}

function mapStatus(
  status: 'ABERTA' | 'FECHADA' | 'PENDENTE' | 'CANCELADA',
): 'active' | 'paid' | 'cancelled' {
  if (status === 'ABERTA') return 'active';
  if (status === 'CANCELADA') return 'cancelled';
  return 'paid';
}

function toApiPaymentMethod(
  method: 'dinheiro' | 'pix' | 'cartao' | 'fiado',
): 'DINHEIRO' | 'PIX' | 'CARTAO' | 'FIADO' {
  switch (method) {
    case 'dinheiro':
      return 'DINHEIRO';
    case 'pix':
      return 'PIX';
    case 'cartao':
      return 'CARTAO';
    case 'fiado':
      return 'FIADO';
  }
}

function mapCategory(category: ApiCategory): Category {
  return {
    id: String(category.id),
    name: category.nome,
    active: category.ativo,
  };
}

function mapProduct(
  product: ApiProduct,
  recipe: RecipeItem[] = [],
): Product {
  return {
    id: String(product.id),
    name: product.nome,
    category: product.categoria.nome,
    price: toNumber(product.precoVenda),
    costPrice: 0,
    stock: toNumber(product.quantidadeEstoque),
    minStock: toNumber(product.estoqueMinimo),
    active: product.ativo,
    unit: mapUnit(product.unidadeEstoque),
    isComposite: product.tipoProduto === 'COMPOSTO',
    recipe: recipe.length > 0 ? recipe : undefined,
  };
}

function mapCustomer(
  detail: ApiCustomerDetail,
  pendencias: ApiCustomerPendencias,
): Customer {
  const history: CustomerHistoryEntry[] = pendencias.pendencias.map((pendencia) => ({
    id: `hist-${pendencia.comandaId}`,
    type: 'sale',
    amount: toNumber(pendencia.total),
    description: `Fiado da comanda #${pendencia.comandaId}`,
    timestamp: pendencia.pendenteEm || pendencia.abertaEm,
  }));

  return {
    id: String(detail.id),
    name: detail.nome,
    nickname: detail.apelido || undefined,
    phone: detail.telefone || '',
    balance: toNumber(pendencias.totalPendente),
    history,
    notes: detail.observacao || undefined,
    active: detail.ativo,
  };
}

function mapComanda(
  detail: ApiComandaDetail,
  payments: ApiPagamento[],
): Comanda {
  const paymentMethod =
    detail.status === 'PENDENTE'
      ? 'fiado'
      : mapPaymentMethod(payments[0]?.formaPagamento);

  return {
    id: String(detail.id),
    code: detail.nomeClienteSnapshot || detail.nomeCliente,
    customerId:
      detail.clienteId === null || detail.clienteId === undefined
        ? null
        : String(detail.clienteId),
    items: detail.itens.map(
      (item): TabItem => ({
        id: String(item.id),
        productId: item.produtoId ? String(item.produtoId) : `custom-${item.id}`,
        productName: item.nomeProduto,
        quantity: toNumber(item.quantidade),
        price: toNumber(item.precoUnitario),
      }),
    ),
    status: mapStatus(detail.status),
    createdAt: detail.abertaEm,
    paidAt: detail.fechadaEm || undefined,
    discount: 0,
    addition: 0,
    paymentMethod,
  };
}

function mapCaixa(detail: ApiCaixaDetail): Cashier {
  const logs: CashierLog[] = [
    ...detail.movimentos.map<CashierLog>((movement) => ({
      id: `mov-${movement.id}`,
      type:
        movement.tipo === 'ABERTURA'
          ? 'abertura'
          : movement.tipo === 'REFORCO'
            ? 'suprimento'
            : 'sangria',
      amount: toNumber(movement.valor),
      paymentMethod: 'dinheiro' as const,
      description: movement.observacao || movement.tipo,
      timestamp: movement.criadoEm,
    })),
    ...detail.pagamentos.map<CashierLog>((payment) => ({
      id: `pag-${payment.id}`,
      type:
        payment.formaPagamento === 'FIADO'
          ? 'recebimento_fiado'
          : 'venda',
      amount: toNumber(payment.valor),
      paymentMethod:
        mapPaymentMethod(payment.formaPagamento) || 'dinheiro',
      description: `Pagamento da comanda #${payment.comandaId}`,
      timestamp: payment.criadoEm,
    })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return {
    id: String(detail.id),
    isOpen: detail.status === 'ABERTO',
    openedAt: detail.abertoEm,
    closedAt: detail.fechadoEm || null,
    initialCash: toNumber(detail.valorInicial),
    currentCashInMoney: toNumber(detail.dinheiroEsperado),
    logs,
    notes: logs[0]?.description,
  };
}

function mapClosedCaixa(summary: ApiCaixaSummary): ClosedCashier {
  return {
    id: String(summary.id),
    openedAt: summary.abertoEm,
    closedAt: summary.fechadoEm || summary.abertoEm,
    initialCash: toNumber(summary.valorInicial),
    totalVendido: 0,
    totalReforcos: 0,
    totalSangrias: 0,
    finalCashInMoney: toNumber(summary.dinheiroEsperado),
    status: 'fechado',
  };
}

function mapFiado(pendencia: ApiPendenciaResumo): Fiado {
  const value = toNumber(pendencia.total);
  return {
    id: `fiado-${pendencia.comandaId}`,
    customerId: String(pendencia.cliente?.id || ''),
    comandaId: String(pendencia.comandaId),
    originalValue: value,
    paidValue: 0,
    remainingValue: value,
    date: pendencia.pendenteEm || pendencia.abertaEm,
    dueDate: pendencia.vencimentoEm || pendencia.abertaEm,
    status: pendencia.status === 'FECHADA' ? 'quitado' : 'aberto',
  };
}

async function fetchCategories(): Promise<Category[]> {
  const categories = await apiRequest<ApiCategory[]>('/categorias');
  return categories.map(mapCategory);
}

async function fetchProducts(): Promise<Product[]> {
  const products = await apiRequest<ApiProduct[]>('/produtos');
  const compositions = await Promise.all(
    products
      .filter((product) => product.tipoProduto === 'COMPOSTO')
      .map(async (product) => {
        const composition = await apiRequest<ApiProductComposition>(
          `/produtos/${product.id}/composicao`,
        );
        return [product.id, composition] as const;
      }),
  );

  const compositionMap = new Map<number, ApiProductComposition>(compositions);

  return products.map((product) =>
    mapProduct(
      product,
      (compositionMap.get(product.id)?.componentes || []).map((component) => ({
        ingredientId: String(component.produtoComponenteId),
        quantity: toNumber(component.quantidadeBaixa),
      })),
    ),
  );
}

async function fetchCustomers(): Promise<Customer[]> {
  const customers = await apiRequest<ApiCustomerSummary[]>('/clientes');
  const detailedCustomers = await Promise.all(
    customers.map(async (customer) => {
      const [detail, pendencias] = await Promise.all([
        apiRequest<ApiCustomerDetail>(`/clientes/${customer.id}`),
        apiRequest<ApiCustomerPendencias>(`/clientes/${customer.id}/pendencias`),
      ]);
      return mapCustomer(detail, pendencias);
    }),
  );
  return detailedCustomers;
}

async function fetchComandas(): Promise<Comanda[]> {
  const comandas = await apiRequest<ApiComandaSummary[]>('/comandas');
  const detailedComandas = await Promise.all(
    comandas.map(async (comanda) => {
      const [detail, payments] = await Promise.all([
        apiRequest<ApiComandaDetail>(`/comandas/${comanda.id}`),
        comanda.status === 'FECHADA' || comanda.status === 'PENDENTE'
          ? apiRequest<ApiPagamento[]>(`/comandas/${comanda.id}/pagamentos`)
          : Promise.resolve([]),
      ]);
      return mapComanda(detail, payments);
    }),
  );
  return detailedComandas;
}

async function fetchFiados(): Promise<Fiado[]> {
  const fiados = await apiRequest<ApiPendenciaResumo[]>('/fiados');
  return fiados
    .filter((fiado) => fiado.cliente?.id)
    .map(mapFiado);
}

async function fetchCaixaAtual(): Promise<Cashier> {
  try {
    const caixa = await apiRequest<ApiCaixaDetail>('/caixas/aberto');
    return mapCaixa(caixa);
  } catch (error) {
    if (
      error instanceof ApiError &&
      typeof error.payload === 'object' &&
      error.payload &&
      'code' in error.payload &&
      error.payload.code === 'caixa_aberto_nao_encontrado'
    ) {
      return EMPTY_CASHIER;
    }
    throw error;
  }
}

async function fetchCaixasHistory(): Promise<ClosedCashier[]> {
  const caixas = await apiRequest<ApiCaixaSummary[]>('/caixas?status=FECHADO');
  return caixas.map(mapClosedCaixa);
}

export function useSystemState() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [comandas, setComandas] = useState<Comanda[]>([]);
  const [fiados, setFiados] = useState<Fiado[]>([]);
  const [caixa, setCaixa] = useState<Cashier>(EMPTY_CASHIER);
  const [caixasHistory, setCaixasHistory] = useState<ClosedCashier[]>([]);
  const [accessPin, setAccessPin] = useState(DEFAULT_PIN);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadRemoteState = useCallback(async () => {
    const [loadedCategories, loadedProducts, loadedCustomers, loadedComandas, loadedFiados, loadedCaixa, loadedHistory] =
      await Promise.all([
        fetchCategories(),
        fetchProducts(),
        fetchCustomers(),
        fetchComandas(),
        fetchFiados(),
        fetchCaixaAtual(),
        fetchCaixasHistory(),
      ]);

    setCategories(loadedCategories);
    setProducts(loadedProducts);
    setCustomers(loadedCustomers);
    setComandas(loadedComandas);
    setFiados(loadedFiados);
    setCaixa(loadedCaixa);
    setCaixasHistory(loadedHistory);
  }, []);

  const refreshState = useCallback(async () => {
    try {
      await loadRemoteState();
    } catch (error) {
      console.error('Erro ao carregar dados da API', error);
      if (error instanceof ApiError) {
        console.error(error.payload);
      }
    }
  }, [loadRemoteState]);

  useEffect(() => {
    const storedPin = localStorage.getItem(PIN_STORAGE_KEY);
    setAccessPin(storedPin || DEFAULT_PIN);

    (async () => {
      setIsLoading(true);
      await refreshState();
      setIsLoading(false);
    })();
  }, [refreshState]);

  const login = (pin: string): boolean => {
    if (pin === accessPin) {
      setIsLoggedIn(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsLoggedIn(false);
  };

  const savePin = (newPin: string) => {
    setAccessPin(newPin);
    localStorage.setItem(PIN_STORAGE_KEY, newPin);
  };

  const getCategoryIdByName = (categoryName: string) => {
    const category = categories.find((item) => item.name === categoryName);
    if (!category) {
      throw new Error(`Categoria "${categoryName}" não encontrada na API.`);
    }
    return Number(category.id);
  };

  const syncProductComposition = async (
    productId: string,
    recipe: RecipeItem[] = [],
  ) => {
    const numericId = Number(productId);
    const current = await apiRequest<ApiProductComposition>(
      `/produtos/${numericId}/composicao`,
    );
    const currentMap = new Map(
      current.componentes.map((component) => [
        component.produtoComponenteId,
        component,
      ]),
    );
    const nextIds = new Set<number>();

    for (const item of recipe) {
      const componentId = Number(item.ingredientId);
      nextIds.add(componentId);
      if (currentMap.has(componentId)) {
        await apiRequest(`/produtos/${numericId}/composicao/componentes/${componentId}`, {
          method: 'PUT',
          body: {
            quantidadeBaixa: item.quantity,
          },
        });
      } else {
        await apiRequest(`/produtos/${numericId}/composicao/componentes`, {
          method: 'POST',
          body: {
            produtoComponenteId: componentId,
            quantidadeBaixa: item.quantity,
          },
        });
      }
    }

    for (const component of current.componentes) {
      if (!nextIds.has(component.produtoComponenteId)) {
        await apiRequest(
          `/produtos/${numericId}/composicao/componentes/${component.produtoComponenteId}`,
          {
            method: 'DELETE',
          },
        );
      }
    }
  };

  const abrirCaixa = async (valorInicial: number, observacao?: string) => {
    await apiRequest('/caixas/abrir', {
      method: 'POST',
      body: {
        valorInicial,
        observacao,
      },
    });
    await refreshState();
  };

  const fecharCaixa = async (observacaoFechamento?: string) => {
    if (!caixa.id) return;
    await apiRequest(`/caixas/${caixa.id}/fechar`, {
      method: 'POST',
      body: {
        dinheiroInformado: caixa.currentCashInMoney,
        observacao: observacaoFechamento,
      },
    });
    await refreshState();
  };

  const adicionarSuprimento = async (valor: number, descricao: string) => {
    if (!caixa.id) return;
    await apiRequest(`/caixas/${caixa.id}/reforcos`, {
      method: 'POST',
      body: {
        valor,
        observacao: descricao,
      },
    });
    await refreshState();
  };

  const realizarSangria = async (valor: number, descricao: string) => {
    if (!caixa.id) return;
    await apiRequest(`/caixas/${caixa.id}/sangrias`, {
      method: 'POST',
      body: {
        valor,
        observacao: descricao,
      },
    });
    await refreshState();
  };

  const addCategory = async (name: string) => {
    await apiRequest('/categorias', {
      method: 'POST',
      body: {nome: name},
    });
    await refreshState();
  };

  const updateCategory = async (updated: Category) => {
    const original = categories.find((category) => category.id === updated.id);
    await apiRequest(`/categorias/${updated.id}`, {
      method: 'PUT',
      body: {nome: updated.name},
    });

    if (original && original.active !== updated.active) {
      await apiRequest(`/categorias/${updated.id}/${updated.active ? 'ativar' : 'inativar'}`, {
        method: 'PATCH',
      });
    }

    await refreshState();
  };

  const addProduct = async (product: Omit<Product, 'id'>) => {
    const created = await apiRequest<ApiProduct>('/produtos', {
      method: 'POST',
      body: {
        nome: product.name,
        categoriaId: getCategoryIdByName(product.category),
        precoVenda: product.price,
        tipoProduto: product.isComposite ? 'COMPOSTO' : 'SIMPLES',
        controlaEstoque: !product.isComposite,
        unidadeEstoque: product.isComposite ? null : mapUnitToApi(product.unit),
        quantidadeEstoque: product.isComposite ? 0 : product.stock,
        quantidadeBaixaPorVenda: product.isComposite ? 0 : 1,
        estoqueMinimo: product.isComposite ? 0 : product.minStock,
      },
    });

    if (product.isComposite && product.recipe?.length) {
      await syncProductComposition(String(created.id), product.recipe);
    }

    if (!product.active) {
      await apiRequest(`/produtos/${created.id}/inativar`, {method: 'PATCH'});
    }

    await refreshState();
  };

  const updateProduct = async (updated: Product) => {
    const original = products.find((product) => product.id === updated.id);
    await apiRequest(`/produtos/${updated.id}`, {
      method: 'PUT',
      body: {
        nome: updated.name,
        categoriaId: getCategoryIdByName(updated.category),
        precoVenda: updated.price,
        tipoProduto: updated.isComposite ? 'COMPOSTO' : 'SIMPLES',
        controlaEstoque: !updated.isComposite,
        unidadeEstoque: updated.isComposite ? null : mapUnitToApi(updated.unit),
        quantidadeEstoque: updated.isComposite ? 0 : updated.stock,
        quantidadeBaixaPorVenda: updated.isComposite ? 0 : 1,
        estoqueMinimo: updated.isComposite ? 0 : updated.minStock,
      },
    });

    if (updated.isComposite) {
      await syncProductComposition(updated.id, updated.recipe || []);
    }

    if (original && original.active !== updated.active) {
      await apiRequest(`/produtos/${updated.id}/${updated.active ? 'ativar' : 'inativar'}`, {
        method: 'PATCH',
      });
    }

    await refreshState();
  };

  const deleteProduct = async (id: string) => {
    await apiRequest(`/produtos/${id}/inativar`, {
      method: 'PATCH',
    });
    await refreshState();
  };

  const addCustomer = async (
    customer: Omit<Customer, 'id' | 'balance' | 'history'>,
  ) => {
    const created = await apiRequest<ApiCustomerDetail>('/clientes', {
      method: 'POST',
      body: {
        nome: customer.name,
        apelido: customer.nickname,
        telefone: customer.phone,
        observacao: customer.notes,
      },
    });

    if (customer.active === false) {
      await apiRequest(`/clientes/${created.id}/inativar`, {method: 'PATCH'});
    }

    await refreshState();
  };

  const updateCustomer = async (updated: Customer) => {
    const original = customers.find((customer) => customer.id === updated.id);
    await apiRequest(`/clientes/${updated.id}`, {
      method: 'PUT',
      body: {
        nome: updated.name,
        apelido: updated.nickname,
        telefone: updated.phone,
        observacao: updated.notes,
      },
    });

    if (original && (original.active ?? true) !== (updated.active ?? true)) {
      await apiRequest(`/clientes/${updated.id}/${updated.active ? 'ativar' : 'inativar'}`, {
        method: 'PATCH',
      });
    }

    await refreshState();
  };

  const deleteCustomer = async (id: string) => {
    await apiRequest(`/clientes/${id}/inativar`, {
      method: 'PATCH',
    });
    await refreshState();
  };

  const pagarFiado = async (
    customerId: string,
    valor: number,
    metodo: 'dinheiro' | 'pix' | 'cartao',
  ): Promise<{success: boolean; msg: string}> => {
    const pendencias = fiados
      .filter((fiado) => fiado.customerId === customerId && fiado.status === 'aberto')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (pendencias.length === 0) {
      return {success: false, msg: 'Nenhuma pendência aberta para este cliente.'};
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

      await apiRequest(`/fiados/${pendencia.comandaId}/quitar`, {
        method: 'POST',
        body: {
          formaPagamento: toApiPaymentMethod(metodo),
          valorPago: saldo,
        },
      });
      restante = Number((restante - saldo).toFixed(2));
    }

    if (restante > 0.001) {
      return {
        success: false,
        msg: 'O valor informado não corresponde à soma exata das pendências em aberto.',
      };
    }

    await refreshState();
    return {success: true, msg: 'Fiado quitado com sucesso.'};
  };

  const addComanda = async (
    code: string,
    customerId: string | null = null,
  ): Promise<Comanda> => {
    const created = await apiRequest<ApiComandaDetail>('/comandas', {
      method: 'POST',
      body: {
        nomeCliente: code,
        clienteId: customerId ? Number(customerId) : undefined,
      },
    });

    const mapped = mapComanda(created, []);
    await refreshState();
    return mapped;
  };

  const updateComanda = async (updated: Comanda) => {
    const original = comandas.find((comanda) => comanda.id === updated.id);
    if (original?.customerId !== updated.customerId && updated.customerId) {
      await apiRequest(`/comandas/${updated.id}/cliente`, {
        method: 'PATCH',
        body: {
          clienteId: Number(updated.customerId),
        },
      });
      await refreshState();
    }
  };

  const cancelarComanda = async (comandaId: string) => {
    await apiRequest(`/comandas/${comandaId}/cancelar`, {
      method: 'PATCH',
      body: {},
    });
    await refreshState();
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

    await apiRequest(`/comandas/${comandaId}/itens`, {
      method: 'POST',
      body: {
        produtoId: productId,
        quantidade: item.quantity,
      },
    });
    await refreshState();
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
      await apiRequest(`/comandas/${comandaId}/itens/${itemId}`, {
        method: 'DELETE',
      });
    } else if (delta > 0) {
      await apiRequest(`/comandas/${comandaId}/itens/${itemId}/incrementar`, {
        method: 'PATCH',
        body: {quantidade: delta},
      });
    } else {
      await apiRequest(`/comandas/${comandaId}/itens/${itemId}/diminuir`, {
        method: 'PATCH',
        body: {quantidade: Math.abs(delta)},
      });
    }
    await refreshState();
  };

  const removeItemFromComanda = async (comandaId: string, itemId: string) => {
    await apiRequest(`/comandas/${comandaId}/itens/${itemId}`, {
      method: 'DELETE',
    });
    await refreshState();
  };

  const pagarComanda = async (
    comandaId: string,
    metodo: 'dinheiro' | 'pix' | 'cartao' | 'fiado',
    desconto = 0,
    acrescimo = 0,
    clienteIdParaFiado: string | null = null,
  ): Promise<{success: boolean; msg: string}> => {
    const comanda = comandas.find((item) => item.id === comandaId);
    if (!comanda) return {success: false, msg: 'Comanda não encontrada.'};

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

      await apiRequest(`/comandas/${comandaId}/fiado`, {
        method: 'POST',
        body: {
          clienteId: Number(customerId),
        },
      });
      await refreshState();
      return {success: true, msg: 'Comanda marcada como fiado.'};
    }

    await apiRequest(`/comandas/${comandaId}/fechar`, {
      method: 'POST',
      body: {
        formaPagamento: toApiPaymentMethod(metodo),
        valorPago: total,
      },
    });
    await refreshState();
    return {success: true, msg: 'Comanda finalizada com sucesso.'};
  };

  const reativarComanda = async () => {
    window.alert('Reabrir comanda não é suportado pela API atual.');
  };

  const resetAllData = async () => {
    localStorage.removeItem(PIN_STORAGE_KEY);
    setAccessPin(DEFAULT_PIN);
    await refreshState();
  };

  const importBackup = (): {success: boolean; msg: string} => {
    return {
      success: false,
      msg: 'Importação de backup não é suportada enquanto o frontend usa a API real.',
    };
  };

  const exportBackup = (): string => {
    return JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        categories,
        products,
        customers,
        comandas,
        fiados,
        caixa,
        caixasHistory,
      },
      null,
      2,
    );
  };

  return {
    isLoading,
    isLoggedIn,
    login,
    logout,
    accessPin,
    setAccessPin: savePin,
    products,
    categories,
    customers,
    comandas,
    fiados,
    caixa,
    caixasHistory,
    abrirCaixa,
    fecharCaixa,
    adicionarSuprimento,
    realizarSangria,
    addCategory,
    updateCategory,
    addProduct,
    updateProduct,
    deleteProduct,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    pagarFiado,
    addComanda,
    updateComanda,
    cancelarComanda,
    addItemToComanda,
    updateComandaItemQty,
    removeItemFromComanda,
    pagarComanda,
    reativarComanda,
    resetAllData,
    importBackup,
    exportBackup,
    refreshState,
  };
}

function mapUnitToApi(unit: string): string {
  switch (unit.toLowerCase()) {
    case 'un':
    case 'unidade':
      return 'UNIDADE';
    case 'ml':
      return 'ML';
    default:
      return 'UNIDADE';
  }
}
