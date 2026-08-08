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

test('ativa e inativa uma categoria pela listagem', async ({ page }) => {
  const runId = Date.now().toString(36);
  await apiCriarCategoria(`Categoria Toggle ${runId}`);

  await loginUI(page, SENHA);
  await page.locator('#nav-link-produtos').click();
  await page.getByRole('button', { name: 'Categorias', exact: true }).click();

  const card = page.locator('div.rounded-xl.p-4', {
    hasText: `Categoria Toggle ${runId}`,
  });
  const toggleButton = card.locator('button').first();

  await expect(card).toHaveClass(/border-slate-800/);
  await toggleButton.click();
  await expect(card).toHaveClass(/opacity-60/);

  await toggleButton.click();
  await expect(card).not.toHaveClass(/opacity-60/);
});

test('edita a quantidade e remove um componente da composição', async ({
  page,
}) => {
  const runId = Date.now().toString(36);
  const categoria = await apiCriarCategoria(`Categoria Comp ${runId}`);
  await apiCriarProdutoSimples({
    nome: `Xarope E2E ${runId}`,
    categoriaId: categoria.id,
    precoVenda: 3,
    quantidadeEstoque: 100,
  });

  await loginUI(page, SENHA);
  await page.locator('#nav-link-produtos').click();
  await page.getByRole('button', { name: 'Novo Produto' }).click();

  await page
    .getByTestId('produto-nome-input')
    .fill(`Drink Composto E2E ${runId}`);
  await page
    .getByTestId('produto-categoria-select')
    .selectOption({ label: `Categoria Comp ${runId}` });
  await page.getByTestId('produto-preco-venda-input').fill('18.00');
  await page.locator('#checkbox-is-composite').check();
  await page.getByRole('button', { name: 'Salvar Ficha' }).click();

  await expect(page.getByText(`Drink Composto E2E ${runId}`)).toBeVisible({
    timeout: 10_000,
  });

  await page
    .locator('tr', { hasText: `Drink Composto E2E ${runId}` })
    .getByRole('button', { name: 'Gerenciar Composição' })
    .click();

  await page.getByRole('button', { name: 'Adicionar Componente' }).click();
  await page
    .locator('form')
    .filter({ hasText: 'Insumo Físico' })
    .locator('select')
    .selectOption({ label: `Xarope E2E ${runId}` });
  await page.getByPlaceholder('Ex: 50').fill('0.03');
  await page.getByRole('button', { name: 'Salvar Componente' }).click();

  const row = page.locator('tr', { hasText: `Xarope E2E ${runId}` });
  await expect(row).toBeVisible({ timeout: 10_000 });

  // Editar a quantidade do componente
  await row.locator('button').nth(0).click();
  await page.getByPlaceholder('Ex: 50').fill('0.08');
  await page.getByRole('button', { name: 'Salvar Componente' }).click();
  await expect(row.getByText('0.08')).toBeVisible({ timeout: 10_000 });

  // Remover o componente
  page.once('dialog', (dialog) => dialog.accept());
  await row.locator('button').nth(1).click();
  await expect(page.getByText('Composição Vazia')).toBeVisible({
    timeout: 10_000,
  });
});

test('filtra produtos por busca, categoria, tipo e status', async ({
  page,
}) => {
  const runId = Date.now().toString(36);
  const categoriaA = await apiCriarCategoria(`Categoria Filtro A ${runId}`);
  const categoriaB = await apiCriarCategoria(`Categoria Filtro B ${runId}`);
  await apiCriarProdutoSimples({
    nome: `Produto Filtro Alvo ${runId}`,
    categoriaId: categoriaA.id,
    precoVenda: 10,
  });
  await apiCriarProdutoSimples({
    nome: `Produto Filtro Outro ${runId}`,
    categoriaId: categoriaB.id,
    precoVenda: 10,
  });

  await loginUI(page, SENHA);
  await page.locator('#nav-link-produtos').click();

  await expect(
    page.getByText(`Produto Filtro Alvo ${runId}`),
  ).toBeVisible({ timeout: 10_000 });
  await expect(
    page.getByText(`Produto Filtro Outro ${runId}`),
  ).toBeVisible();

  // Busca por nome
  await page
    .getByPlaceholder('Buscar pelo nome...')
    .fill(`Produto Filtro Alvo ${runId}`);
  await expect(
    page.getByText(`Produto Filtro Alvo ${runId}`),
  ).toBeVisible();
  await expect(
    page.getByText(`Produto Filtro Outro ${runId}`),
  ).toHaveCount(0);
  await page.getByPlaceholder('Buscar pelo nome...').fill('');

  // Filtro por categoria
  await page
    .locator('select')
    .filter({ hasText: 'Todas as Categorias' })
    .selectOption({ label: `Categoria Filtro A ${runId}` });
  await expect(
    page.getByText(`Produto Filtro Alvo ${runId}`),
  ).toBeVisible();
  await expect(
    page.getByText(`Produto Filtro Outro ${runId}`),
  ).toHaveCount(0);
  await page
    .locator('select')
    .filter({ hasText: 'Categoria Filtro A' })
    .selectOption({ label: 'Todas as Categorias' });

  // Filtro por tipo (apenas compostos não deve mostrar produto simples)
  await page
    .locator('select')
    .filter({ hasText: 'Todos os Tipos' })
    .selectOption({ label: 'Apenas Compostos' });
  await expect(
    page.getByText(`Produto Filtro Alvo ${runId}`),
  ).toHaveCount(0);
  await page
    .locator('select')
    .filter({ hasText: 'Apenas Compostos' })
    .selectOption({ label: 'Todos os Tipos' });

  // Filtro por status (inativo não deve mostrar produto ativo)
  await page
    .locator('select')
    .filter({ hasText: 'Qualquer Status' })
    .selectOption({ label: 'Apenas Inativos' });
  await expect(
    page.getByText(`Produto Filtro Alvo ${runId}`),
  ).toHaveCount(0);
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
