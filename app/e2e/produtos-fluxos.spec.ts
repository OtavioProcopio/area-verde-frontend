import { test, expect } from '@playwright/test';
import {
  apiCriarCategoria,
  apiCriarProdutoSimples,
  apiSetupSenha,
  loginUI,
} from './helpers';

const SENHA = 'senha1234';

test.beforeEach(async () => {
  await apiSetupSenha(SENHA);
});

test('cria um produto composto e adiciona um componente na composição', async ({
  page,
}) => {
  const runId = Date.now().toString(36);
  const categoria = await apiCriarCategoria(`Categoria Composto ${runId}`);
  const componente = await apiCriarProdutoSimples({
    nome: `Cachaca E2E ${runId}`,
    categoriaId: categoria.id,
    precoVenda: 5,
    quantidadeEstoque: 100,
  });

  await loginUI(page, SENHA);
  await page.locator('#nav-link-produtos').click();
  await page.getByRole('button', { name: 'Novo Produto' }).click();

  await page.getByTestId('produto-nome-input').fill(`Caipirinha E2E ${runId}`);
  await page
    .getByTestId('produto-categoria-select')
    .selectOption({ label: `Categoria Composto ${runId}` });
  await page.getByTestId('produto-preco-venda-input').fill('15.00');
  await page.locator('#checkbox-is-composite').check();
  await page.getByRole('button', { name: 'Salvar Ficha' }).click();

  await expect(page.getByText(`Caipirinha E2E ${runId}`)).toBeVisible({
    timeout: 10_000,
  });

  await page
    .locator('tr', { hasText: `Caipirinha E2E ${runId}` })
    .getByRole('button', { name: 'Gerenciar Composição' })
    .click();

  await page.getByRole('button', { name: 'Adicionar Componente' }).click();
  await page
    .locator('form')
    .filter({ hasText: 'Insumo Físico' })
    .locator('select')
    .selectOption({ label: `Cachaca E2E ${runId}` });
  await page.getByPlaceholder('Ex: 50').fill('0.05');
  await page.getByRole('button', { name: 'Salvar Componente' }).click();

  await expect(page.getByText(`Cachaca E2E ${runId}`)).toBeVisible({
    timeout: 10_000,
  });
});

test('edita um produto existente', async ({ page }) => {
  const runId = Date.now().toString(36);
  const categoria = await apiCriarCategoria(`Categoria Edit ${runId}`);
  await apiCriarProdutoSimples({
    nome: `Produto Original ${runId}`,
    categoriaId: categoria.id,
    precoVenda: 8,
  });

  await loginUI(page, SENHA);
  await page.locator('#nav-link-produtos').click();
  await page
    .locator('tr', { hasText: `Produto Original ${runId}` })
    .getByRole('button', { name: 'Editar Produto' })
    .click();

  await page.getByTestId('produto-nome-input').fill(`Produto Editado ${runId}`);
  await page.getByTestId('produto-preco-venda-input').fill('20.00');
  await page.getByRole('button', { name: 'Salvar Ficha' }).click();

  await expect(page.getByText(`Produto Editado ${runId}`)).toBeVisible({
    timeout: 10_000,
  });
  await expect(
    page.getByText(`Produto Original ${runId}`, { exact: true }),
  ).toHaveCount(0);
});

test('inativa e reativa um produto pela listagem', async ({ page }) => {
  const runId = Date.now().toString(36);
  const categoria = await apiCriarCategoria(`Categoria Toggle ${runId}`);
  await apiCriarProdutoSimples({
    nome: `Produto Toggle ${runId}`,
    categoriaId: categoria.id,
    precoVenda: 8,
  });

  await loginUI(page, SENHA);
  await page.locator('#nav-link-produtos').click();

  const row = page.locator('tr', { hasText: `Produto Toggle ${runId}` });
  await expect(row.getByText('Ativo', { exact: true })).toBeVisible({
    timeout: 10_000,
  });

  await row.getByText('Ativo', { exact: true }).click();
  await expect(row.getByText('Inativo', { exact: true })).toBeVisible({
    timeout: 10_000,
  });

  await row.getByText('Inativo', { exact: true }).click();
  await expect(row.getByText('Ativo', { exact: true })).toBeVisible({
    timeout: 10_000,
  });
});

test('renomeia uma categoria existente', async ({ page }) => {
  const runId = Date.now().toString(36);
  await apiCriarCategoria(`Categoria Renomear ${runId}`);

  await loginUI(page, SENHA);
  await page.locator('#nav-link-produtos').click();
  await page.getByRole('button', { name: 'Categorias', exact: true }).click();

  const card = page.locator('div.rounded-xl.p-4', {
    hasText: `Categoria Renomear ${runId}`,
  });
  await card.getByRole('button', { name: 'Editar Nome' }).click();

  await page.getByTestId('categoria-nome-input').fill(`Categoria Renomeada ${runId}`);
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();

  await expect(
    page.getByText(`Categoria Renomeada ${runId}`),
  ).toBeVisible({ timeout: 10_000 });
});
