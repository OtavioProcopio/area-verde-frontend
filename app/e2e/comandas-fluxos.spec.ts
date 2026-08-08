import { test, expect } from '@playwright/test';
import {
  apiAbrirCaixa,
  apiAdicionarItem,
  apiCaixaAberto,
  apiCriarCategoria,
  apiCriarComanda,
  apiCriarProdutoSimples,
  apiFecharCaixaForcado,
  apiSetupProdutoUnico,
  apiSetupSenha,
  loginUI,
} from './helpers';

const SENHA = 'senha1234';

test.beforeEach(async () => {
  await apiSetupSenha(SENHA);
});

test('fecha comanda com pagamento via Pix', async ({ page }) => {
  const runId = `${Date.now().toString(36)}-pix`;
  await apiAbrirCaixa();
  const { produto } = await apiSetupProdutoUnico(runId);
  const comanda = await apiCriarComanda(`Comanda Pix ${runId}`);
  await apiAdicionarItem(comanda.id, produto.id, 1);

  await loginUI(page, SENHA);
  await page.locator('#nav-link-comandas').click();
  await page
    .locator('tr', { hasText: `Comanda Pix ${runId}` })
    .getByRole('button', { name: 'Abrir' })
    .click();

  await page.getByRole('button', { name: /PAGAMENTO & FECHAMENTO/ }).click();
  await page.getByRole('button', { name: '⚡ Pix Manual' }).click();
  await page.locator('#btn-confirm-pos-payment').click();

  await expect(
    page.getByRole('button', { name: 'Fechar e Prosseguir' }),
  ).toBeVisible({ timeout: 10_000 });
});

test('fecha comanda com pagamento via Cartão', async ({ page }) => {
  const runId = `${Date.now().toString(36)}-cartao`;
  await apiAbrirCaixa();
  const { produto } = await apiSetupProdutoUnico(runId);
  const comanda = await apiCriarComanda(`Comanda Cartao ${runId}`);
  await apiAdicionarItem(comanda.id, produto.id, 1);

  await loginUI(page, SENHA);
  await page.locator('#nav-link-comandas').click();
  await page
    .locator('tr', { hasText: `Comanda Cartao ${runId}` })
    .getByRole('button', { name: 'Abrir' })
    .click();

  await page.getByRole('button', { name: /PAGAMENTO & FECHAMENTO/ }).click();
  await page.getByRole('button', { name: '💳 Cartão' }).click();
  await page.locator('#btn-confirm-pos-payment').click();

  await expect(
    page.getByRole('button', { name: 'Fechar e Prosseguir' }),
  ).toBeVisible({ timeout: 10_000 });
});

test('bloqueia a criação de comanda quando o caixa está fechado', async ({
  page,
}) => {
  const runId = Date.now().toString(36);
  const caixaAberto = await apiCaixaAberto();
  if (caixaAberto) {
    await apiFecharCaixaForcado(caixaAberto.id);
  }

  await loginUI(page, SENHA);
  await page.locator('#nav-link-comandas').click();
  await page.locator('#btn-spawn-comanda-list').click();
  await page
    .getByTestId('comanda-nome-input')
    .fill(`Comanda Sem Caixa ${runId}`);
  await page.getByRole('button', { name: 'Abrir Comanda' }).click();

  // API rejeita (regra: comanda exige caixa aberto) e o form agora mostra
  // o erro em vez de falhar silenciosamente (bugfix desta sessão).
  await expect(page.getByText('Nenhum caixa aberto encontrado')).toBeVisible({
    timeout: 10_000,
  });
});

test('cancela uma comanda ativa', async ({ page }) => {
  const runId = Date.now().toString(36);
  await apiAbrirCaixa();
  const comanda = await apiCriarComanda(`Comanda Cancelar ${runId}`);

  await loginUI(page, SENHA);
  await page.locator('#nav-link-comandas').click();
  await page
    .locator('tr', { hasText: `Comanda Cancelar ${runId}` })
    .getByRole('button', { name: 'Abrir' })
    .click();

  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'CANCELAR CONTA' }).click();
  // onClick do botão já chama setViewMode('list') após confirmar, então
  // caímos direto na lista — confere que o status mudou pra cancelada
  const row = page.locator('tr', {
    hasText: `Comanda Cancelar ${runId}`,
  });
  await expect(row.getByText(/cancelad/i)).toBeVisible({ timeout: 10_000 });
});

test('incrementa e decrementa a quantidade de um item na comanda', async ({
  page,
}) => {
  const runId = Date.now().toString(36);
  await apiAbrirCaixa();
  const { produto } = await apiSetupProdutoUnico(runId);
  const comanda = await apiCriarComanda(`Comanda Qty ${runId}`);
  await apiAdicionarItem(comanda.id, produto.id, 1);

  await loginUI(page, SENHA);
  await page.locator('#nav-link-comandas').click();
  await page
    .locator('tr', { hasText: `Comanda Qty ${runId}` })
    .getByRole('button', { name: 'Abrir' })
    .click();

  // A linha do item tem 4 botões sem texto (ícones lucide-react), nesta
  // ordem: Minus (0), Plus (1), ... , Trash (último, exclui o item inteiro).
  const itemRow = page.locator('div.rounded-lg.p-3.flex', {
    hasText: `Produto E2E ${runId}`,
  });
  await expect(itemRow).toBeVisible({ timeout: 10_000 });

  await itemRow.locator('button').nth(1).click();
  await expect(itemRow.getByText('2', { exact: true })).toBeVisible({
    timeout: 10_000,
  });

  await itemRow.locator('button').nth(0).click();
  await expect(itemRow.getByText('1', { exact: true })).toBeVisible({
    timeout: 10_000,
  });
});

test('remove um item da comanda pelo ícone de lixeira', async ({ page }) => {
  const runId = Date.now().toString(36);
  await apiAbrirCaixa();
  const { produto } = await apiSetupProdutoUnico(runId);
  const comanda = await apiCriarComanda(`Comanda Trash ${runId}`);
  await apiAdicionarItem(comanda.id, produto.id, 2);

  await loginUI(page, SENHA);
  await page.locator('#nav-link-comandas').click();
  await page
    .locator('tr', { hasText: `Comanda Trash ${runId}` })
    .getByRole('button', { name: 'Abrir' })
    .click();

  const itemRow = page.locator('div.rounded-lg.p-3.flex', {
    hasText: `Produto E2E ${runId}`,
  });
  await expect(itemRow).toBeVisible({ timeout: 10_000 });

  page.once('dialog', (dialog) => dialog.accept());
  await itemRow.locator('button').nth(2).click();

  await expect(page.getByText(`Produto E2E ${runId}`)).toHaveCount(0);
});

test('remove um item decrementando a quantidade até 0 (com confirmação)', async ({
  page,
}) => {
  const runId = Date.now().toString(36);
  await apiAbrirCaixa();
  const { produto } = await apiSetupProdutoUnico(runId);
  const comanda = await apiCriarComanda(`Comanda Zero ${runId}`);
  await apiAdicionarItem(comanda.id, produto.id, 1);

  await loginUI(page, SENHA);
  await page.locator('#nav-link-comandas').click();
  await page
    .locator('tr', { hasText: `Comanda Zero ${runId}` })
    .getByRole('button', { name: 'Abrir' })
    .click();

  const itemRow = page.locator('div.rounded-lg.p-3.flex', {
    hasText: `Produto E2E ${runId}`,
  });
  await expect(itemRow).toBeVisible({ timeout: 10_000 });

  page.once('dialog', (dialog) => dialog.accept());
  await itemRow.locator('button').nth(0).click();

  await expect(page.getByText(`Produto E2E ${runId}`)).toHaveCount(0);
});

test('picker de produtos limita a grade quando o catálogo é grande', async ({
  page,
}) => {
  test.setTimeout(60_000);
  const runId = Date.now().toString(36);
  await apiAbrirCaixa();
  const categoria = await apiCriarCategoria(`Categoria Grande ${runId}`);
  // Backend ordena produtos por nome — "Zzz" garante que este fique
  // depois de todos os "Bulk NN" (2 dígitos) na ordem alfabética, ficando
  // de fora dos 60 primeiros do corte.
  const alvo = `Produto Zzz Alvo ${runId}`;

  for (let i = 0; i < 60; i++) {
    await apiCriarProdutoSimples({
      nome: `Produto Bulk ${runId} ${String(i).padStart(2, '0')}`,
      categoriaId: categoria.id,
      precoVenda: 5,
    });
  }
  await apiCriarProdutoSimples({
    nome: alvo,
    categoriaId: categoria.id,
    precoVenda: 5,
  });
  const comanda = await apiCriarComanda(`Comanda Catalogo Grande ${runId}`);

  await loginUI(page, SENHA);
  await page.locator('#nav-link-comandas').click();
  await page
    .locator('tr', { hasText: `Comanda Catalogo Grande ${runId}` })
    .getByRole('button', { name: 'Abrir' })
    .click();

  await page
    .getByRole('button', { name: `Categoria Grande ${runId}` })
    .click();

  await expect(page.getByText(/Mostrando 60 de 61 produtos/)).toBeVisible({
    timeout: 10_000,
  });
  // O produto 61º não renderiza até buscar por ele.
  await expect(page.getByRole('button', { name: alvo })).toHaveCount(0);

  await page.getByPlaceholder('Ex: Skol').fill(alvo);
  await expect(
    page.getByRole('button', { name: alvo }).first(),
  ).toBeVisible({ timeout: 10_000 });
});
