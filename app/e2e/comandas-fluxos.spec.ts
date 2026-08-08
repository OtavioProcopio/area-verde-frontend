import { test, expect } from '@playwright/test';
import {
  apiAbrirCaixa,
  apiAdicionarItem,
  apiCaixaAberto,
  apiCancelarComanda,
  apiCriarCategoria,
  apiCriarComanda,
  apiCriarProdutoSimples,
  apiFecharCaixaForcado,
  apiSetPermitirEstoqueNegativo,
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

test('adicionar produto com estoque zerado avisa com confirm antes de lançar', async ({
  page,
}) => {
  const runId = Date.now().toString(36);
  await apiAbrirCaixa();
  // Precisa que a config permita estoque negativo (senão o picker desabilita
  // o produto de propósito, ver teste de bloqueio no arquivo de config).
  await apiSetPermitirEstoqueNegativo(true);
  const categoria = await apiCriarCategoria(`Categoria Zerado ${runId}`);
  await apiCriarProdutoSimples({
    nome: `Produto Zerado ${runId}`,
    categoriaId: categoria.id,
    precoVenda: 10,
    quantidadeEstoque: 0,
  });
  const comanda = await apiCriarComanda(`Comanda Estoque Zero ${runId}`);

  await loginUI(page, SENHA);
  await page.locator('#nav-link-comandas').click();
  await page
    .locator('tr', { hasText: `Comanda Estoque Zero ${runId}` })
    .getByRole('button', { name: 'Abrir' })
    .click();

  await page.getByRole('button', { name: 'Tudo', exact: true }).click();
  await page
    .getByPlaceholder('Ex: Skol')
    .fill(`Produto Zerado ${runId}`);

  let message = '';
  page.once('dialog', (dialog) => {
    message = dialog.message();
    void dialog.accept();
  });
  await page
    .getByRole('button', { name: `Produto Zerado ${runId}` })
    .first()
    .click();
  await expect.poll(() => message, { timeout: 10_000 }).not.toBe('');
  expect(message.toLowerCase()).toContain('estoque zerado');

  const itemRow = page.locator('div.rounded-lg.p-3.flex', {
    hasText: `Produto Zerado ${runId}`,
  });
  await expect(itemRow).toBeVisible({ timeout: 10_000 });
});

test('produto com estoque zerado fica bloqueado quando a config não permite estoque negativo', async ({
  page,
}) => {
  const runId = Date.now().toString(36);
  await apiAbrirCaixa();
  await apiSetPermitirEstoqueNegativo(false);
  const categoria = await apiCriarCategoria(`Categoria Bloq ${runId}`);
  await apiCriarProdutoSimples({
    nome: `Produto Bloqueado ${runId}`,
    categoriaId: categoria.id,
    precoVenda: 10,
    quantidadeEstoque: 0,
  });
  await apiCriarComanda(`Comanda Estoque Bloq ${runId}`);

  await loginUI(page, SENHA);
  await page.locator('#nav-link-comandas').click();
  await page
    .locator('tr', { hasText: `Comanda Estoque Bloq ${runId}` })
    .getByRole('button', { name: 'Abrir' })
    .click();

  await page.getByRole('button', { name: 'Tudo', exact: true }).click();
  await page
    .getByPlaceholder('Ex: Skol')
    .fill(`Produto Bloqueado ${runId}`);

  await expect(
    page.getByRole('button', { name: `Produto Bloqueado ${runId}` }).first(),
  ).toBeDisabled();

  await apiSetPermitirEstoqueNegativo(true);
});

test('filtra a lista de comandas por status', async ({ page }) => {
  const runId = Date.now().toString(36);
  await apiAbrirCaixa();
  const comandaAberta = await apiCriarComanda(`Comanda Aberta ${runId}`);
  const comandaCancelada = await apiCriarComanda(
    `Comanda Cancelada ${runId}`,
  );
  await apiCancelarComanda(comandaCancelada.id);
  void comandaAberta;

  await loginUI(page, SENHA);
  await page.locator('#nav-link-comandas').click();

  await expect(
    page.getByText(`Comanda Aberta ${runId}`),
  ).toBeVisible({ timeout: 10_000 });
  await expect(
    page.getByText(`Comanda Cancelada ${runId}`),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Canceladas' }).click();
  await expect(
    page.getByText(`Comanda Cancelada ${runId}`),
  ).toBeVisible({ timeout: 10_000 });
  await expect(
    page.getByText(`Comanda Aberta ${runId}`),
  ).toHaveCount(0);

  await page.getByRole('button', { name: 'Abertas' }).click();
  await expect(
    page.getByText(`Comanda Aberta ${runId}`),
  ).toBeVisible({ timeout: 10_000 });
  await expect(
    page.getByText(`Comanda Cancelada ${runId}`),
  ).toHaveCount(0);
});
