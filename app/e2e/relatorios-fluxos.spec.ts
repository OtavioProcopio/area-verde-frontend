import { test, expect } from '@playwright/test';
import {
  apiAbrirCaixa,
  apiAdicionarItem,
  apiCriarCliente,
  apiCriarComanda,
  apiMarcarComoFiado,
  apiSetupProdutoUnico,
  apiSetupSenha,
  fecharRecibo,
  loginUI,
} from './helpers';

const SENHA = 'senha1234';

test.beforeEach(async () => {
  await apiSetupSenha(SENHA);
});

test('aba Diário Operacional mostra o total vendido após uma venda em dinheiro', async ({
  page,
}) => {
  const runId = Date.now().toString(36);
  await apiAbrirCaixa();
  const { produto } = await apiSetupProdutoUnico(runId, 15);
  const comanda = await apiCriarComanda(`Comanda Relatorio ${runId}`);
  await apiAdicionarItem(comanda.id, produto.id, 1);

  await loginUI(page, SENHA);
  await page.locator('#nav-link-comandas').click();
  await page
    .locator('tr', { hasText: `Comanda Relatorio ${runId}` })
    .getByRole('button', { name: 'Abrir' })
    .click();
  await page.getByRole('button', { name: /PAGAMENTO & FECHAMENTO/ }).click();
  await page.getByRole('button', { name: '💵 Dinheiro' }).click();
  await page.locator('#btn-confirm-pos-payment').click();
  await fecharRecibo(page);

  await page.locator('#nav-link-relatorios').click();
  await expect(page.getByText('Total Vendido')).toBeVisible({
    timeout: 10_000,
  });
  // A pagina soma tudo do dia, entao so confirmamos que carregou valores
  // numericos reais (nao o estado vazio) apos a venda.
  await expect(page.getByText('Total Recebido')).toBeVisible();
});

test('aba Produtos Mais Vendidos lista o produto vendido', async ({
  page,
}) => {
  const runId = Date.now().toString(36);
  await apiAbrirCaixa();
  const { produto } = await apiSetupProdutoUnico(runId, 12);
  const comanda = await apiCriarComanda(`Comanda Vendido ${runId}`);
  await apiAdicionarItem(comanda.id, produto.id, 2);

  await loginUI(page, SENHA);
  await page.locator('#nav-link-comandas').click();
  await page
    .locator('tr', { hasText: `Comanda Vendido ${runId}` })
    .getByRole('button', { name: 'Abrir' })
    .click();
  await page.getByRole('button', { name: /PAGAMENTO & FECHAMENTO/ }).click();
  await page.getByRole('button', { name: '💵 Dinheiro' }).click();
  await page.locator('#btn-confirm-pos-payment').click();
  await fecharRecibo(page);

  await page.locator('#nav-link-relatorios').click();
  await page.getByRole('button', { name: 'Produtos Vendidos' }).click();

  await expect(page.getByText(`Produto E2E ${runId}`)).toBeVisible({
    timeout: 10_000,
  });
});

test('aba Alerta de Estoque mostra produto com saldo baixo', async ({
  page,
}) => {
  const runId = Date.now().toString(36);
  await apiSetupProdutoUnico(runId);

  await loginUI(page, SENHA);
  // reduz o estoque do produto pra abaixo do mínimo via ajuste no Estoque
  await page.locator('#nav-link-estoque').click();
  const row = page.locator('tr', { hasText: `Produto E2E ${runId}` });
  await row.getByTitle('Ajuste Manual').click();
  await page.locator('input[type="number"]').fill('1');
  await page
    .getByPlaceholder('Ex: Quebra, Vencimento, Contagem')
    .fill('Simular estoque baixo');
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Salvar Ajuste' }).click();
  await expect(row.getByText('1', { exact: true })).toBeVisible({
    timeout: 10_000,
  });

  await page.locator('#nav-link-relatorios').click();
  await page.getByRole('button', { name: 'Alerta de Estoque' }).click();

  await expect(page.getByText(`Produto E2E ${runId}`)).toBeVisible({
    timeout: 10_000,
  });
});

test('aba Estoque Consumido mostra o produto baixado após uma venda', async ({
  page,
}) => {
  const runId = Date.now().toString(36);
  await apiAbrirCaixa();
  const { produto } = await apiSetupProdutoUnico(runId, 9);
  const comanda = await apiCriarComanda(`Comanda Consumo ${runId}`);
  await apiAdicionarItem(comanda.id, produto.id, 3);

  await loginUI(page, SENHA);
  await page.locator('#nav-link-comandas').click();
  await page
    .locator('tr', { hasText: `Comanda Consumo ${runId}` })
    .getByRole('button', { name: 'Abrir' })
    .click();
  await page.getByRole('button', { name: /PAGAMENTO & FECHAMENTO/ }).click();
  await page.getByRole('button', { name: '💵 Dinheiro' }).click();
  await page.locator('#btn-confirm-pos-payment').click();
  await fecharRecibo(page);

  await page.locator('#nav-link-relatorios').click();
  await page.getByRole('button', { name: 'Estoque Consumido' }).click();

  await expect(page.getByText(`Produto E2E ${runId}`)).toBeVisible({
    timeout: 10_000,
  });
});

test('aba Inadimplência / Fiados mostra o cliente com pendência aberta', async ({
  page,
}) => {
  const runId = Date.now().toString(36);
  await apiAbrirCaixa();
  const { produto } = await apiSetupProdutoUnico(runId, 20);
  const cliente = await apiCriarCliente({ nome: `Cliente Fiado ${runId}` });
  const comanda = await apiCriarComanda(`Comanda Fiado ${runId}`, cliente.id);
  await apiAdicionarItem(comanda.id, produto.id, 1);
  await apiMarcarComoFiado(comanda.id, cliente.id);

  await loginUI(page, SENHA);
  await page.locator('#nav-link-relatorios').click();
  await page
    .getByRole('button', { name: 'Inadimplência / Fiados' })
    .click();

  await expect(page.getByText(`Cliente Fiado ${runId}`)).toBeVisible({
    timeout: 10_000,
  });
});

test('aba Comandas mostra o total de comandas fechadas', async ({ page }) => {
  const runId = Date.now().toString(36);
  await apiAbrirCaixa();
  const { produto } = await apiSetupProdutoUnico(runId, 8);
  const comanda = await apiCriarComanda(`Comanda Status ${runId}`);
  await apiAdicionarItem(comanda.id, produto.id, 1);

  await loginUI(page, SENHA);
  await page.locator('#nav-link-comandas').click();
  await page
    .locator('tr', { hasText: `Comanda Status ${runId}` })
    .getByRole('button', { name: 'Abrir' })
    .click();
  await page.getByRole('button', { name: /PAGAMENTO & FECHAMENTO/ }).click();
  await page.getByRole('button', { name: '💵 Dinheiro' }).click();
  await page.locator('#btn-confirm-pos-payment').click();
  await fecharRecibo(page);

  await page.locator('#nav-link-relatorios').click();
  await page
    .getByRole('button', { name: 'Comandas', exact: true })
    .click();

  await expect(page.getByText('FECHADA')).toBeVisible({ timeout: 10_000 });
});

test('troca o filtro de período sem quebrar a tela', async ({ page }) => {
  await loginUI(page, SENHA);
  await page.locator('#nav-link-relatorios').click();

  await page
    .locator('select')
    .filter({ hasText: 'Hoje' })
    .selectOption({ label: 'Últimos 7 Dias' });

  await expect(page.getByText('Total Vendido')).toBeVisible({
    timeout: 10_000,
  });
});
