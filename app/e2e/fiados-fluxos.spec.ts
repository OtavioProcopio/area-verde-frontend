import { test, expect } from '@playwright/test';
import {
  apiAbrirCaixa,
  apiAdicionarItem,
  apiCaixaAberto,
  apiCriarCliente,
  apiCriarComanda,
  apiFecharCaixaForcado,
  apiMarcarComoFiado,
  apiSetupProdutoUnico,
  apiSetupSenha,
  loginUI,
} from './helpers';

const SENHA = 'senha1234';

test.beforeEach(async () => {
  await apiSetupSenha(SENHA);
});

async function criarFiadoDe(
  runId: string,
  valor = 10,
  vencimentoEm?: string,
) {
  const cliente = await apiCriarCliente({ nome: `Cliente Fiado ${runId}` });
  await apiAbrirCaixa();
  const { produto } = await apiSetupProdutoUnico(runId, valor);
  const comanda = await apiCriarComanda(`Comanda Fiado ${runId}`, cliente.id);
  await apiAdicionarItem(comanda.id, produto.id, 1);
  await apiMarcarComoFiado(comanda.id, cliente.id, vencimentoEm);
  return { cliente, comanda };
}

test('quita um fiado via Pix', async ({ page }) => {
  const runId = `${Date.now().toString(36)}-pix`;
  const { cliente } = await criarFiadoDe(runId);

  await loginUI(page, SENHA);
  await page.locator('#nav-link-fiados').click();

  const row = page.locator('tr', { hasText: cliente.nome });
  await row.getByTitle('Quitar Valor').click();
  await page.getByRole('button', { name: '⚡ Pix' }).click();

  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'COMFIRMAR PAGAMENTO' }).click();

  await expect(
    page.locator('tr', { hasText: cliente.nome }),
  ).toHaveCount(0, { timeout: 10_000 });
});

test('quita um fiado via Cartão', async ({ page }) => {
  const runId = `${Date.now().toString(36)}-cartao`;
  const { cliente } = await criarFiadoDe(runId);

  await loginUI(page, SENHA);
  await page.locator('#nav-link-fiados').click();

  const row = page.locator('tr', { hasText: cliente.nome });
  await row.getByTitle('Quitar Valor').click();
  await page.getByRole('button', { name: '💳 Cartão' }).click();

  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'COMFIRMAR PAGAMENTO' }).click();

  await expect(
    page.locator('tr', { hasText: cliente.nome }),
  ).toHaveCount(0, { timeout: 10_000 });
});

test('bloqueia quitação com valor menor que o saldo (pagamento parcial)', async ({
  page,
}) => {
  const runId = `${Date.now().toString(36)}-parcial`;
  const { cliente } = await criarFiadoDe(runId, 20);

  await loginUI(page, SENHA);
  await page.locator('#nav-link-fiados').click();

  const row = page.locator('tr', { hasText: cliente.nome });
  await row.getByTitle('Quitar Valor').click();

  await page.locator('input[type="number"]').first().fill('10');

  const dialogMessages: string[] = [];
  page.on('dialog', (dialog) => {
    dialogMessages.push(dialog.message());
    dialog.accept();
  });
  await page.getByRole('button', { name: 'COMFIRMAR PAGAMENTO' }).click();

  await expect
    .poll(() => dialogMessages.join(' | '), { timeout: 10_000 })
    .toContain('parcial');

  // continua pendente, não sumiu da lista
  await expect(row).toBeVisible();
});

test('bloqueia quitação com valor maior que o saldo devedor', async ({
  page,
}) => {
  const runId = `${Date.now().toString(36)}-maior`;
  const { cliente } = await criarFiadoDe(runId, 10);

  await loginUI(page, SENHA);
  await page.locator('#nav-link-fiados').click();

  const row = page.locator('tr', { hasText: cliente.nome });
  await row.getByTitle('Quitar Valor').click();

  const valorInput = page.locator('input[type="number"]').first();
  await valorInput.fill('999');

  let message = '';
  page.once('dialog', (dialog) => {
    message = dialog.message();
    void dialog.accept();
  });
  await page.getByRole('button', { name: 'COMFIRMAR PAGAMENTO' }).click();
  await expect.poll(() => message, { timeout: 10_000 }).not.toBe('');

  expect(message.toLowerCase()).toContain('maior');
  await expect(row).toBeVisible();
});

test('quitar remove o fiado da lista de abertos e mostra no histórico de quitados', async ({
  page,
}) => {
  // Regressão do bug #7 (docs/mapa-fluxos-e-cobertura-testes.md): GET
  // /api/fiados só retornava pendências em aberto, então o filtro
  // "Histórico de Quitados" nunca mostrava nada. Corrigido em
  // fiadosService.ts (busca /fiados + /fiados?quitados=true) e no backend
  // (comanda_repository.list_pendencias aceita quitados=true).
  const runId = `${Date.now().toString(36)}-historico`;
  const { cliente } = await criarFiadoDe(runId);

  await loginUI(page, SENHA);
  await page.locator('#nav-link-fiados').click();

  const row = page.locator('tr', { hasText: cliente.nome });
  await row.getByTitle('Quitar Valor').click();
  await page.getByRole('button', { name: '💵 Dinheiro' }).click();
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'COMFIRMAR PAGAMENTO' }).click();
  await expect(row).toHaveCount(0, { timeout: 10_000 });

  await page
    .locator('select')
    .filter({ hasText: 'Pendências em Aberto' })
    .selectOption({ label: 'Histórico de Quitados' });

  await expect(
    page.locator('tr', { hasText: cliente.nome }),
  ).toBeVisible({ timeout: 10_000 });
});

test('filtro "Apenas Vencidos" mostra só o fiado com vencimento no passado', async ({
  page,
}) => {
  const runIdVencido = `${Date.now().toString(36)}-vencido`;
  const runIdEmDia = `${Date.now().toString(36)}-emdia`;
  const hoje = new Date().toISOString().split('T')[0];

  // O backend rejeita vencimentoEm no passado (o fiado nasce vencido só
  // depois de virar o dia), então usamos hoje: o filtro do front compara
  // dueDate (meia-noite) contra o timestamp atual, que já é mais tarde.
  const { cliente: clienteVencido } = await criarFiadoDe(
    runIdVencido,
    10,
    hoje,
  );
  const { cliente: clienteEmDia } = await criarFiadoDe(runIdEmDia, 10);

  await loginUI(page, SENHA);
  await page.locator('#nav-link-fiados').click();

  await expect(
    page.locator('tr', { hasText: clienteVencido.nome }),
  ).toBeVisible({ timeout: 10_000 });
  await expect(
    page.locator('tr', { hasText: clienteEmDia.nome }),
  ).toBeVisible();

  await page
    .locator('select')
    .filter({ hasText: 'Pendências em Aberto' })
    .selectOption({ label: 'Apenas Vencidos' });

  await expect(
    page.locator('tr', { hasText: clienteVencido.nome }),
  ).toBeVisible({ timeout: 10_000 });
  await expect(
    page.locator('tr', { hasText: clienteEmDia.nome }),
  ).toHaveCount(0);
});

test('bloqueia quitação de fiado quando o caixa está fechado', async ({
  page,
}) => {
  const runId = `${Date.now().toString(36)}-caixafechado`;
  const { cliente } = await criarFiadoDe(runId);

  const caixaAberto = await apiCaixaAberto();
  if (caixaAberto) await apiFecharCaixaForcado(caixaAberto.id);

  await loginUI(page, SENHA);
  await page.locator('#nav-link-fiados').click();

  const row = page.locator('tr', { hasText: cliente.nome });
  await row.getByTitle('Quitar Valor').click();
  await page.getByRole('button', { name: '💵 Dinheiro' }).click();

  let message = '';
  page.once('dialog', (dialog) => {
    message = dialog.message();
    void dialog.accept();
  });
  await page.getByRole('button', { name: 'COMFIRMAR PAGAMENTO' }).click();
  await expect.poll(() => message, { timeout: 10_000 }).not.toBe('');

  expect(message.toLowerCase()).toContain('caixa');
  // continua pendente, não foi removido da lista
  await expect(row).toBeVisible();
});
