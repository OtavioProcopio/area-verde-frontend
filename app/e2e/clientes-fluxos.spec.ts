import { test, expect } from '@playwright/test';
import {
  apiAbrirCaixa,
  apiAdicionarItem,
  apiCriarCliente,
  apiCriarComanda,
  apiSetupProdutoUnico,
  apiSetupSenha,
  loginUI,
} from './helpers';

const SENHA = 'senha1234';

test.beforeEach(async () => {
  await apiSetupSenha(SENHA);
});

test('cria um cliente pela tela própria de Clientes', async ({ page }) => {
  const runId = Date.now().toString(36);

  await loginUI(page, SENHA);
  await page.locator('#nav-link-clientes').click();
  await page.getByRole('button', { name: 'Novo Cliente' }).click();

  await page.getByPlaceholder('Ex: João Silva').fill(`Cliente Novo ${runId}`);
  // Telefone precisa variar por execução: o backend bloqueia criação de
  // cliente com telefone já usado por outro cliente ativo (mesma regra que
  // bloqueia nome duplicado), então um número fixo passaria só na primeira
  // vez que este teste rodasse contra um banco de dev persistente.
  await page
    .getByPlaceholder('(31) 90000-0000')
    .fill(`11${Date.now().toString().slice(-9)}`);
  await page.getByRole('button', { name: 'Salvar Cliente' }).click();

  // filtra pela busca pra não depender de paginação/ordenação da lista
  // (a base de clientes acumula entre os arquivos de teste na mesma run)
  await page
    .getByPlaceholder('Busca por nome, apelido, telefone...')
    .fill(`Cliente Novo ${runId}`);
  await expect(page.getByText(`Cliente Novo ${runId}`)).toBeVisible({
    timeout: 10_000,
  });
});

test('edita um cliente direto da lista (regressão do bug de edição)', async ({
  page,
}) => {
  // Antes desta sessão, editar um cliente direto da lista não salvava nada
  // (o form usava selectedCustomer, que só era populado ao entrar no
  // detalhe). Ver bugfix/tratamento-erro-crud-caixa-produtos-clientes-fiados.
  const runId = Date.now().toString(36);
  await apiCriarCliente({ nome: `Cliente Lista ${runId}` });

  await loginUI(page, SENHA);
  await page.locator('#nav-link-clientes').click();

  await page
    .locator('tr', { hasText: `Cliente Lista ${runId}` })
    .getByTitle('Editar')
    .click();

  await page.getByPlaceholder('Ex: João Silva').fill(`Cliente Lista Editado ${runId}`);
  await page.getByRole('button', { name: 'Salvar Cliente' }).click();

  await expect(
    page.getByText(`Cliente Lista Editado ${runId}`),
  ).toBeVisible({ timeout: 10_000 });
  await expect(
    page.getByText(`Cliente Lista ${runId}`, { exact: true }),
  ).toHaveCount(0);
});

test('edita um cliente pela tela de detalhe', async ({ page }) => {
  const runId = Date.now().toString(36);
  await apiCriarCliente({ nome: `Cliente Detalhe ${runId}` });

  await loginUI(page, SENHA);
  await page.locator('#nav-link-clientes').click();
  await page
    .locator('tr', { hasText: `Cliente Detalhe ${runId}` })
    .getByTitle('Ver Detalhes')
    .click();

  await page.getByRole('button', { name: 'Editar Cadastro' }).click();
  await page
    .getByPlaceholder('Ex: João Silva')
    .fill(`Cliente Detalhe Editado ${runId}`);
  await page.getByRole('button', { name: 'Salvar Cliente' }).click();

  await expect(
    page.getByText(`Cliente Detalhe Editado ${runId}`),
  ).toBeVisible({ timeout: 10_000 });
});

test('ativa e inativa um cliente pela listagem', async ({ page }) => {
  const runId = Date.now().toString(36);
  await apiCriarCliente({ nome: `Cliente Toggle ${runId}` });

  await loginUI(page, SENHA);
  await page.locator('#nav-link-clientes').click();

  const row = page.locator('tr', { hasText: `Cliente Toggle ${runId}` });
  await expect(row.getByText('ATIVO', { exact: true })).toBeVisible({
    timeout: 10_000,
  });

  await row.getByTitle('Inativar').click();
  await expect(row.getByText('INATIVO', { exact: true })).toBeVisible({
    timeout: 10_000,
  });

  await row.getByTitle('Ativar').click();
  await expect(row.getByText('ATIVO', { exact: true })).toBeVisible({
    timeout: 10_000,
  });
});

test('paga um fiado pela tela de detalhe do cliente', async ({ page }) => {
  const runId = Date.now().toString(36);
  const cliente = await apiCriarCliente({ nome: `Cliente Fiado Det ${runId}` });
  await apiAbrirCaixa();
  const { produto } = await apiSetupProdutoUnico(runId);
  const comanda = await apiCriarComanda(`Comanda Fiado Det ${runId}`, cliente.id);
  await apiAdicionarItem(comanda.id, produto.id, 1);

  await loginUI(page, SENHA);

  // marca como fiado pela POS antes de testar o pagamento no detalhe
  // (comanda criada com clienteId: a lista mostra o nome do cliente
  // vinculado, não o "nomeCliente" que foi passado na criação)
  await page.locator('#nav-link-comandas').click();
  await page
    .locator('tr', { hasText: `Cliente Fiado Det ${runId}` })
    .getByRole('button', { name: 'Abrir' })
    .click();
  await page.getByRole('button', { name: /Lançar no/i }).click();
  // a comanda já foi criada com clienteId, então handleLaunchCheckout já
  // pré-seleciona o cliente vinculado no select — só confirmamos.
  await expect(page.getByTestId('checkout-cliente-select')).toHaveValue(
    String(cliente.id),
  );
  await page.locator('#btn-confirm-pos-payment').click();
  const fecharReciboBtn = page.getByRole('button', {
    name: 'Fechar e Prosseguir',
  });
  await expect(fecharReciboBtn).toBeVisible({ timeout: 10_000 });
  await fecharReciboBtn.click();

  await page.locator('#nav-link-clientes').click();
  await page
    .locator('tr', { hasText: `Cliente Fiado Det ${runId}` })
    .getByTitle('Ver Detalhes')
    .click();

  await page.getByPlaceholder('Quantia (R$)').fill('10');
  await page.getByRole('button', { name: '💵 Dinheiro' }).click();

  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Lançar Pagamento' }).click();

  // "Quitado" só aparece na lista (a tela de detalhe mostra o saldo em R$)
  await page.getByRole('button', { name: 'Voltar para lista' }).click();
  await expect(
    page
      .locator('tr', { hasText: `Cliente Fiado Det ${runId}` })
      .getByText('Quitado', { exact: true }),
  ).toBeVisible({ timeout: 10_000 });
});
