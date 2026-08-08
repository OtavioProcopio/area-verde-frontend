import { test, expect } from '@playwright/test';
import { apiSetupProdutoUnico, apiSetupSenha, loginUI } from './helpers';

const SENHA = 'senha1234';

test.beforeEach(async () => {
  await apiSetupSenha(SENHA);
});

test('registra uma entrada de estoque e atualiza o saldo', async ({
  page,
}) => {
  const runId = Date.now().toString(36);
  await apiSetupProdutoUnico(runId);

  await loginUI(page, SENHA);
  await page.locator('#nav-link-estoque').click();

  const row = page.locator('tr', { hasText: `Produto E2E ${runId}` });
  await row.getByTitle('Dar Entrada').click();

  await page.getByPlaceholder('Ex: 10').fill('20');
  await page.getByPlaceholder('Ex: Nota fiscal 1234').fill('NF 123');
  await page.getByRole('button', { name: 'Confirmar Entrada' }).click();

  await expect(row.getByText('70', { exact: true })).toBeVisible({
    timeout: 10_000,
  });
});

test('faz um ajuste manual de estoque', async ({ page }) => {
  const runId = Date.now().toString(36);
  await apiSetupProdutoUnico(runId);

  await loginUI(page, SENHA);
  await page.locator('#nav-link-estoque').click();

  const row = page.locator('tr', { hasText: `Produto E2E ${runId}` });
  await row.getByTitle('Ajuste Manual').click();

  await page.locator('input[type="number"]').fill('12');
  await page
    .getByPlaceholder('Ex: Quebra, Vencimento, Contagem')
    .fill('Contagem mensal');

  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Salvar Ajuste' }).click();

  await expect(row.getByText('12', { exact: true })).toBeVisible({
    timeout: 10_000,
  });
});

test('mostra o histórico de movimentações após uma entrada', async ({
  page,
}) => {
  const runId = Date.now().toString(36);
  await apiSetupProdutoUnico(runId);

  await loginUI(page, SENHA);
  await page.locator('#nav-link-estoque').click();

  const row = page.locator('tr', { hasText: `Produto E2E ${runId}` });
  await row.getByTitle('Dar Entrada').click();
  await page.getByPlaceholder('Ex: 10').fill('5');
  await page.getByRole('button', { name: 'Confirmar Entrada' }).click();
  await expect(row.getByText('55', { exact: true })).toBeVisible({
    timeout: 10_000,
  });

  await row.getByTitle('Histórico').click();
  await expect(page.getByText('Extrato de Estoque')).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.getByText('entrada')).toBeVisible();
});
