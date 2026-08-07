import { test, expect } from '@playwright/test';
import {
  apiAbrirCaixa,
  apiAdicionarItem,
  apiCaixaAberto,
  apiCriarComanda,
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
