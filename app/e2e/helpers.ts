import { expect, type Page } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

async function api<T = unknown>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${BASE_URL}/api${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
  });
  const text = await res.text();
  const body = text ? JSON.parse(text) : undefined;
  if (!res.ok) {
    throw new Error(
      `API ${init.method ?? 'GET'} ${path} -> ${res.status}: ${JSON.stringify(body)}`,
    );
  }
  return body as T;
}

/**
 * Helpers de setup via API, usados para levar o sistema a um estado
 * conhecido rapidamente (sem passar por toda a UI de novo em cada teste).
 * O FLUXO em si (o que o teste realmente valida) sempre passa pela UI.
 */

export async function apiConfiguracoes() {
  return api<{ senhaConfigurada: boolean }>('/configuracoes');
}

export async function apiSetupSenha(senha: string) {
  const config = await apiConfiguracoes();
  if (!config.senhaConfigurada) {
    await api('/acesso/senha', {
      method: 'PUT',
      body: JSON.stringify({ senhaAtual: null, novaSenha: senha }),
    });
  }
}

export async function apiCaixaAberto(): Promise<{ id: number } | null> {
  try {
    return await api('/caixas/aberto');
  } catch {
    return null;
  }
}

export async function apiAbrirCaixa(valorInicial = 200, observacao = '') {
  const existing = await apiCaixaAberto();
  if (existing) return existing;
  return api<{ id: number }>('/caixas/abrir', {
    method: 'POST',
    body: JSON.stringify({ valorInicial, observacao }),
  });
}

export async function apiFecharCaixa(caixaId: number, dinheiroInformado = 0) {
  return api(`/caixas/${caixaId}/fechar`, {
    method: 'POST',
    body: JSON.stringify({ dinheiroInformado, observacao: '' }),
  });
}

/** Cancela toda comanda ABERTA (deixada por um teste anterior, ex: os que
 * validam o bloqueio de fechamento de caixa), pra não travar o setup dos
 * testes seguintes. */
export async function apiCancelarComandasAbertas() {
  const abertas = await api<Array<{ id: number }>>('/comandas/abertas');
  for (const comanda of abertas) {
    await api(`/comandas/${comanda.id}/cancelar`, { method: 'PATCH' });
  }
}

export async function apiFecharCaixaForcado(caixaId: number) {
  await apiCancelarComandasAbertas();
  return apiFecharCaixa(caixaId);
}

export async function apiCriarCategoria(nome: string) {
  return api<{ id: number; nome: string }>('/categorias', {
    method: 'POST',
    body: JSON.stringify({ nome }),
  });
}

export async function apiCriarProdutoSimples(params: {
  nome: string;
  categoriaId: number;
  precoVenda: number;
  quantidadeEstoque?: number;
  estoqueMinimo?: number;
}) {
  return api<{ id: number; nome: string }>('/produtos', {
    method: 'POST',
    body: JSON.stringify({
      nome: params.nome,
      categoriaId: params.categoriaId,
      precoVenda: params.precoVenda,
      tipoProduto: 'SIMPLES',
      controlaEstoque: true,
      unidadeEstoque: 'UNIDADE',
      quantidadeEstoque: params.quantidadeEstoque ?? 50,
      quantidadeBaixaPorVenda: 1,
      estoqueMinimo: params.estoqueMinimo ?? 5,
    }),
  });
}

export async function apiCriarComanda(
  nomeCliente: string,
  clienteId?: number,
) {
  return api<{ id: number; codigo: string }>('/comandas', {
    method: 'POST',
    body: JSON.stringify({ nomeCliente, clienteId }),
  });
}

export async function apiMarcarComoFiado(comandaId: number, clienteId: number) {
  return api(`/comandas/${comandaId}/fiado`, {
    method: 'POST',
    body: JSON.stringify({ clienteId }),
  });
}

export async function apiAdicionarItem(
  comandaId: number,
  produtoId: number,
  quantidade = 1,
) {
  return api(`/comandas/${comandaId}/itens`, {
    method: 'POST',
    body: JSON.stringify({ produtoId, quantidade }),
  });
}

export async function apiCriarCliente(params: {
  nome: string;
  telefone?: string;
}) {
  return api<{ id: number; nome: string }>('/clientes', {
    method: 'POST',
    body: JSON.stringify({
      nome: params.nome,
      telefone: params.telefone ?? '',
    }),
  });
}

/** Cria categoria + produto simples com nomes únicos prontos pra uso em um teste. */
export async function apiSetupProdutoUnico(runId: string, precoVenda = 10) {
  const categoria = await apiCriarCategoria(`Categoria E2E ${runId}`);
  const produto = await apiCriarProdutoSimples({
    nome: `Produto E2E ${runId}`,
    categoriaId: categoria.id,
    precoVenda,
  });
  return { categoria, produto };
}

/**
 * Login via UI (não existe token/sessão persistida no app — cada reload
 * volta pra tela de login). Assume que a senha já foi definida via
 * apiSetupSenha antes de navegar.
 */
export async function loginUI(page: Page, senha: string) {
  await page.goto('/');
  await expect(
    page.getByText(/Acesso Restrito|Configuracao Inicial/),
  ).toBeVisible({ timeout: 15_000 });

  const isFirstRun = await page.getByText('Configuracao Inicial').isVisible();
  if (isFirstRun) {
    await page.getByTestId('setup-nova-senha-input').fill(senha);
    await page.getByTestId('setup-confirmar-senha-input').fill(senha);
    await page.getByRole('button', { name: 'Definir senha e entrar' }).click();
  } else {
    await page.getByTestId('login-senha-input').fill(senha);
    await page.getByRole('button', { name: 'Entrar' }).click();
  }

  await expect(page.locator('#nav-link-dashboard')).toBeVisible({
    timeout: 10_000,
  });
}

/**
 * Fecha o modal de recibo que aparece após um pagamento de comanda
 * confirmado. Necessário antes de navegar pra outra aba, senão o modal
 * (ainda aberto) intercepta os cliques.
 */
export async function fecharRecibo(page: Page) {
  const botao = page.getByRole('button', { name: 'Fechar e Prosseguir' });
  await expect(botao).toBeVisible({ timeout: 10_000 });
  await botao.click();
}
