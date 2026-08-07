import { test, expect, type Page } from '@playwright/test';
import { apiCaixaAberto, apiFecharCaixaForcado, apiSetupSenha } from './helpers';

/**
 * Simula o fluxo completo de atendimento de um bar no Area Verde:
 * login -> abertura de caixa -> cadastro de categoria/produto ->
 * comanda paga em dinheiro -> comanda lançada no caderno (fiado) ->
 * quitação do fiado -> fechamento de caixa.
 *
 * Roda em série sobre a MESMA página/sessão (ver test.describe.serial),
 * porque o app não usa token persistido: cada reload volta pra tela de
 * login. O beforeAll garante caixa fechado e senha definida via API antes
 * de começar, pra funcionar mesmo depois de outros arquivos de teste
 * rodarem primeiro na mesma execução (banco compartilhado).
 */

const RUN_ID = Date.now().toString(36);
const SENHA = 'senha1234';
const CATEGORIA_NOME = `Bebidas E2E ${RUN_ID}`;
const PRODUTO_NOME = `Cerveja E2E ${RUN_ID}`;
const PRODUTO_PRECO_VENDA = '10.00';
const COMANDA_PAGA_NOME = `Comanda Paga ${RUN_ID}`;
const COMANDA_FIADO_NOME = `Comanda Fiado ${RUN_ID}`;
const CLIENTE_NOME = `Cliente E2E ${RUN_ID}`;

test.describe.serial('Fluxo completo de atendimento no bar', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    await apiSetupSenha(SENHA);
    const aberto = await apiCaixaAberto();
    if (aberto) await apiFecharCaixaForcado(aberto.id);

    page = await browser.newPage();
    page.on('dialog', (dialog) => dialog.accept());
    await page.goto('/');
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('acessa o sistema (configura senha inicial se necessário)', async () => {
    await expect(
      page.getByText(/Acesso Restrito|Configuracao Inicial/),
    ).toBeVisible({ timeout: 15_000 });

    const isFirstRun = await page.getByText('Configuracao Inicial').isVisible();

    if (isFirstRun) {
      await page.getByTestId('setup-nova-senha-input').fill(SENHA);
      await page.getByTestId('setup-confirmar-senha-input').fill(SENHA);
      await page
        .getByRole('button', { name: 'Definir senha e entrar' })
        .click();
    } else {
      await page.getByTestId('login-senha-input').fill(SENHA);
      await page.getByRole('button', { name: 'Entrar' }).click();
    }

    await expect(page.locator('#nav-link-dashboard')).toBeVisible({
      timeout: 10_000,
    });
  });

  test('abre o caixa do dia com fundo de troco', async () => {
    await page.locator('#nav-link-caixa').click();
    await expect(page.locator('#state-caixa-fechado-card')).toBeVisible();

    await page.locator('#btn-open-abertura-modal').click();
    await page.getByTestId('caixa-valor-inicial-input').fill('200.00');
    await page.getByRole('button', { name: 'Confirmar Abertura' }).click();

    await expect(page.locator('#state-caixa-aberto-container')).toBeVisible({
      timeout: 10_000,
    });
  });

  test('cadastra uma categoria de produtos', async () => {
    await page.locator('#nav-link-produtos').click();
    await page.getByRole('button', { name: 'Categorias', exact: true }).click();
    await page.getByRole('button', { name: 'Nova', exact: true }).click();

    await page.getByTestId('categoria-nome-input').fill(CATEGORIA_NOME);
    await page.getByRole('button', { name: 'Salvar', exact: true }).click();

    await expect(page.getByText(CATEGORIA_NOME)).toBeVisible({
      timeout: 10_000,
    });
  });

  test('cadastra um produto simples na categoria criada', async () => {
    await page.getByRole('button', { name: 'Produtos', exact: true }).click();
    await page.getByRole('button', { name: 'Novo Produto' }).click();

    await page.getByTestId('produto-nome-input').fill(PRODUTO_NOME);
    await page
      .getByTestId('produto-categoria-select')
      .selectOption({ label: CATEGORIA_NOME });
    await page.getByTestId('produto-preco-custo-input').fill('5.00');
    await page
      .getByTestId('produto-preco-venda-input')
      .fill(PRODUTO_PRECO_VENDA);
    await page.getByTestId('produto-estoque-input').fill('50');

    await page.getByRole('button', { name: 'Salvar Ficha' }).click();

    await expect(page.getByText(PRODUTO_NOME)).toBeVisible({
      timeout: 10_000,
    });
  });

  test('bloqueia o pagamento de uma comanda sem itens', async () => {
    // handleLaunchCheckout valida "comanda vazia" / "caixa fechado" antes de
    // abrir o modal de checkout (ver bugfix/comandas-checkout-erro-silencioso).
    await page.locator('#nav-link-comandas').click();
    await page.locator('#btn-spawn-comanda-list').click();

    await page.getByTestId('comanda-nome-input').fill(COMANDA_PAGA_NOME);
    await page.getByRole('button', { name: 'Abrir Comanda' }).click();

    await expect(page.getByPlaceholder('Ex: Skol')).toBeVisible({
      timeout: 10_000,
    });

    const dialogPromise = page.waitForEvent('dialog');
    await page
      .getByRole('button', { name: /PAGAMENTO & FECHAMENTO/ })
      .click();
    const dialog = await dialogPromise;

    expect(dialog.message()).toContain('vazia');
    await expect(page.getByRole('heading', { name: 'Finalização Balcão' })).toHaveCount(0);
  });

  test('adiciona item na comanda e fecha com pagamento em dinheiro', async () => {
    await page.getByRole('button', { name: 'Tudo', exact: true }).click();
    await page.getByPlaceholder('Ex: Skol').fill(PRODUTO_NOME);
    await page.getByRole('button', { name: PRODUTO_NOME }).first().click();

    await page
      .getByRole('button', { name: /PAGAMENTO & FECHAMENTO/ })
      .click();
    await page.getByRole('button', { name: '💵 Dinheiro' }).click();
    await page.locator('#btn-confirm-pos-payment').click();

    await expect(
      page.getByRole('button', { name: 'Fechar e Prosseguir' }),
    ).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: 'Fechar e Prosseguir' }).click();
  });

  test('cria nova comanda e lança no caderno de fiado com cliente novo', async () => {
    await page.getByRole('button', { name: '← Voltar' }).click();
    await page.locator('#btn-spawn-comanda-list').click();
    await page.getByTestId('comanda-nome-input').fill(COMANDA_FIADO_NOME);
    await page.getByRole('button', { name: 'Abrir Comanda' }).click();

    await page.getByRole('button', { name: 'Tudo', exact: true }).click();
    await page.getByPlaceholder('Ex: Skol').fill(PRODUTO_NOME);
    await page.getByRole('button', { name: PRODUTO_NOME }).first().click();

    await page.getByRole('button', { name: /LANÇAR NO/ }).click();
    await page.getByRole('button', { name: '+ Novo' }).click();

    await page.getByPlaceholder('Nome Completo').fill(CLIENTE_NOME);
    await page.getByPlaceholder('Telefone').fill('11999998888');
    await page.getByRole('button', { name: 'Salvar', exact: true }).click();

    const clienteSelect = page.getByTestId('checkout-cliente-select');
    const clienteOptionValue = await clienteSelect
      .locator('option', { hasText: CLIENTE_NOME })
      .getAttribute('value');
    await clienteSelect.selectOption(clienteOptionValue!);
    await page.locator('#btn-confirm-pos-payment').click();

    await expect(
      page.getByRole('button', { name: 'Fechar e Prosseguir' }),
    ).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: 'Fechar e Prosseguir' }).click();
  });

  test('quita o fiado do cliente no caderno de pendências', async () => {
    await page.locator('#nav-link-fiados').click();

    const row = page.locator('tr', { hasText: CLIENTE_NOME });
    await expect(row).toBeVisible({ timeout: 10_000 });
    await row.getByRole('button', { name: /Quitar/ }).click();

    await page.getByRole('button', { name: '💵 Dinheiro' }).click();
    await page
      .getByRole('button', { name: 'COMFIRMAR PAGAMENTO' })
      .click();

    await expect(page.locator('tr', { hasText: CLIENTE_NOME })).toHaveCount(
      0,
      { timeout: 10_000 },
    );
  });

  test('fecha o caixa do dia', async () => {
    await page.locator('#nav-link-caixa').click();
    await page.locator('#btn-fechar-trigger').click();

    await page
      .getByRole('button', { name: 'Fechar Caixa Operativo' })
      .click();

    await expect(page.locator('#state-caixa-fechado-card')).toBeVisible({
      timeout: 10_000,
    });
  });
});
