import { test, expect } from '@playwright/test';
import { apiSetupSenha, loginUI } from './helpers';

const SENHA = 'senha1234';

test.beforeEach(async () => {
  await apiSetupSenha(SENHA);
});

test('salva as configurações gerais do sistema', async ({ page }) => {
  const runId = Date.now().toString(36);

  await loginUI(page, SENHA);
  await page.locator('#nav-link-configuracoes').click();

  await page
    .locator('#input-bar-name')
    .fill(`Boteco E2E ${runId}`);
  await page
    .getByRole('button', { name: /BLOQUEADO|PERMITIDO/ })
    .click();
  await page
    .locator('input[type="number"]')
    .first()
    .fill('15');

  await page.getByRole('button', { name: 'Salvar configuracoes' }).click();

  await expect(
    page.getByText('Configurações salvas com sucesso.'),
  ).toBeVisible({ timeout: 10_000 });

  await page.reload();
  await loginUI(page, SENHA);
  await page.locator('#nav-link-configuracoes').click();
  await expect(page.locator('#input-bar-name')).toHaveValue(
    `Boteco E2E ${runId}`,
  );
});

test('troca a senha de acesso com sucesso e permite login com a nova senha', async ({
  page,
}) => {
  const NOVA_SENHA = 'senha5678';

  await loginUI(page, SENHA);
  await page.locator('#nav-link-configuracoes').click();

  await page.locator('#ipt-current-pin').fill(SENHA);
  await page.locator('#ipt-new-pin').fill(NOVA_SENHA);
  await page.locator('#ipt-confirm-pin').fill(NOVA_SENHA);
  await page.getByRole('button', { name: 'Salvar nova senha' }).click();

  await expect(
    page.getByText('Senha de acesso atualizada com sucesso.'),
  ).toBeVisible({ timeout: 10_000 });

  await page.getByRole('button', { name: 'Sair' }).click();
  await loginUI(page, NOVA_SENHA);

  // Restaura a senha original pra não vazar estado pros próximos testes.
  await page.locator('#nav-link-configuracoes').click();
  await page.locator('#ipt-current-pin').fill(NOVA_SENHA);
  await page.locator('#ipt-new-pin').fill(SENHA);
  await page.locator('#ipt-confirm-pin').fill(SENHA);
  await page.getByRole('button', { name: 'Salvar nova senha' }).click();
  await expect(
    page.getByText('Senha de acesso atualizada com sucesso.'),
  ).toBeVisible({ timeout: 10_000 });
});

test('troca de senha com senha atual incorreta mostra erro tratado', async ({
  page,
}) => {
  await loginUI(page, SENHA);
  await page.locator('#nav-link-configuracoes').click();

  await page.locator('#ipt-current-pin').fill('senhaErrada000');
  await page.locator('#ipt-new-pin').fill('outraSenha123');
  await page.locator('#ipt-confirm-pin').fill('outraSenha123');
  await page.getByRole('button', { name: 'Salvar nova senha' }).click();

  await expect(page.getByText('Senha atual inválida')).toBeVisible({
    timeout: 10_000,
  });

  // Login continua funcionando com a senha antiga (nada foi alterado).
  await page.getByRole('button', { name: 'Sair' }).click();
  await loginUI(page, SENHA);
});

test('recarregar sessão do sistema encerra a sessão e volta pro login', async ({
  page,
}) => {
  await loginUI(page, SENHA);
  await page.locator('#nav-link-configuracoes').click();

  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('#btn-master-purge').click();

  await expect(page.getByText(/Acesso Restrito/)).toBeVisible({
    timeout: 10_000,
  });
});
