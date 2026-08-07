import { test, expect } from '@playwright/test';
import {
  apiAbrirCaixa,
  apiCaixaAberto,
  apiCriarComanda,
  apiFecharCaixaForcado,
  apiSetupSenha,
  loginUI,
} from './helpers';

const SENHA = 'senha1234';

test.beforeEach(async () => {
  await apiSetupSenha(SENHA);
  const aberto = await apiCaixaAberto();
  if (aberto) await apiFecharCaixaForcado(aberto.id);
});

test('bloqueia fechar o caixa com uma comanda aberta', async ({ page }) => {
  const runId = Date.now().toString(36);
  await apiAbrirCaixa(200);
  await apiCriarComanda(`Comanda Bloqueia Fechamento ${runId}`);

  await loginUI(page, SENHA);
  await page.locator('#nav-link-caixa').click();
  await page.locator('#btn-fechar-trigger').click();
  await page
    .getByRole('button', { name: 'Fechar Caixa Operativo' })
    .click();

  await expect(
    page.getByText('Não é possível fechar o caixa com comandas abertas'),
  ).toBeVisible({ timeout: 10_000 });
  // continua aberto
  await expect(page.locator('#state-caixa-aberto-container')).toBeVisible();
});

test('registra um reforço (suprimento) no caixa aberto', async ({ page }) => {
  await apiAbrirCaixa(200);

  await loginUI(page, SENHA);
  await page.locator('#nav-link-caixa').click();
  await page.locator('#btn-reforco-trigger').click();

  await expect(
    page.getByRole('heading', { name: 'Registrar Reforço' }),
  ).toBeVisible();
  await page.getByPlaceholder('0.00').fill('50');
  await page
    .getByPlaceholder(/Peguei R\$ 50 em moedas/)
    .fill('Troco extra do gerente');
  await page.getByRole('button', { name: 'Salvar Entrada' }).click();

  await expect(page.getByRole('button', { name: 'Salvar Entrada' })).toHaveCount(
    0,
    { timeout: 10_000 },
  );
});

test('registra uma sangria dentro do limite do caixa', async ({ page }) => {
  await apiAbrirCaixa(200);

  await loginUI(page, SENHA);
  await page.locator('#nav-link-caixa').click();
  await page.locator('#btn-sangria-trigger').click();

  await expect(
    page.getByRole('heading', { name: 'Registrar Sangria' }),
  ).toBeVisible();
  await page.getByPlaceholder('0.00').fill('30');
  await page
    .getByPlaceholder(/Compra de saco de gelo/)
    .fill('Troco de compra de gelo');
  await page.getByRole('button', { name: 'Salvar Retirada' }).click();

  await expect(page.getByRole('button', { name: 'Salvar Retirada' })).toHaveCount(
    0,
    { timeout: 10_000 },
  );
});

test('bloqueia sangria maior que o dinheiro disponível na gaveta', async ({
  page,
}) => {
  await apiAbrirCaixa(200);

  await loginUI(page, SENHA);
  await page.locator('#nav-link-caixa').click();
  await page.locator('#btn-sangria-trigger').click();

  await page.getByPlaceholder('0.00').fill('99999');
  await page
    .getByPlaceholder(/Compra de saco de gelo/)
    .fill('Tentativa inválida');

  let message = '';
  page.once('dialog', (dialog) => {
    message = dialog.message();
    void dialog.accept();
  });
  await page.getByRole('button', { name: 'Salvar Retirada' }).click();
  await expect.poll(() => message, { timeout: 10_000 }).not.toBe('');

  expect(message.toLowerCase()).toContain('excede');
});

test('fecha o caixa sem comandas abertas e mostra no histórico', async ({
  page,
}) => {
  await apiAbrirCaixa(200);

  await loginUI(page, SENHA);
  await page.locator('#nav-link-caixa').click();

  const historico = page.locator('#historico-caixas-fechados-container');
  const rowsBefore = await historico.locator('tbody tr').count();

  await page.locator('#btn-fechar-trigger').click();
  await page
    .getByRole('button', { name: 'Fechar Caixa Operativo' })
    .click();

  await expect(page.locator('#state-caixa-fechado-card')).toBeVisible({
    timeout: 10_000,
  });
  // Outros testes deste arquivo também fecham caixa (via beforeEach ou
  // diretamente), então o histórico é cumulativo na mesma execução —
  // validamos que cresceu, não um delta exato de +1.
  await expect
    .poll(() => historico.locator('tbody tr').count(), { timeout: 10_000 })
    .toBeGreaterThan(rowsBefore);
});
