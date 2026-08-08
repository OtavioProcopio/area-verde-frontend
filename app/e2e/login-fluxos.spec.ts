import { test, expect } from '@playwright/test';
import { apiConfiguracoes, apiSetupSenha, loginUI } from './helpers';

const SENHA = 'senha1234';

test('login com senha incorreta mostra erro tratado', async ({ page }) => {
  await apiSetupSenha(SENHA);

  await page.goto('/');
  await expect(page.getByText('Acesso Restrito')).toBeVisible({
    timeout: 15_000,
  });

  await page.getByTestId('login-senha-input').fill('senhaTotalmenteErrada');
  await page.getByRole('button', { name: 'Entrar' }).click();

  await expect(page.getByText('Senha inválida')).toBeVisible({
    timeout: 10_000,
  });

  // A tela continua na de login, não avançou pro dashboard.
  await expect(page.locator('#nav-link-dashboard')).toHaveCount(0);
});

test('configuração inicial bloqueia senha com menos de 4 caracteres', async ({
  page,
}) => {
  const config = await apiConfiguracoes();
  test.skip(
    config.senhaConfigurada,
    'Backend já tem senha configurada nesta sessão de dev — a tela de ' +
      'Configuracao Inicial só aparece antes da primeira senha ser ' +
      'definida (num banco novo, ex: CI).',
  );

  await page.goto('/');
  await expect(page.getByText('Configuracao Inicial')).toBeVisible({
    timeout: 15_000,
  });

  await page.getByTestId('setup-nova-senha-input').fill('abc');
  await page.getByTestId('setup-confirmar-senha-input').fill('abc');
  await page
    .getByRole('button', { name: 'Definir senha e entrar' })
    .click();

  await expect(
    page.getByText('A senha precisa ter pelo menos 4 caracteres.'),
  ).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('#nav-link-dashboard')).toHaveCount(0);
});

test('configuração inicial bloqueia senhas que não coincidem', async ({
  page,
}) => {
  const config = await apiConfiguracoes();
  test.skip(
    config.senhaConfigurada,
    'Backend já tem senha configurada nesta sessão de dev — a tela de ' +
      'Configuracao Inicial só aparece antes da primeira senha ser ' +
      'definida (num banco novo, ex: CI).',
  );

  await page.goto('/');
  await expect(page.getByText('Configuracao Inicial')).toBeVisible({
    timeout: 15_000,
  });

  await page.getByTestId('setup-nova-senha-input').fill('senha1234');
  await page.getByTestId('setup-confirmar-senha-input').fill('senhaDiferente');
  await page
    .getByRole('button', { name: 'Definir senha e entrar' })
    .click();

  await expect(
    page.getByText('As senhas informadas nao coincidem.'),
  ).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('#nav-link-dashboard')).toHaveCount(0);
});

test('logout pede confirmação e volta pra tela de acesso', async ({
  page,
}) => {
  await apiSetupSenha(SENHA);
  await loginUI(page, SENHA);

  // Cancelar a confirmação mantém a sessão logada.
  page.once('dialog', (dialog) => void dialog.dismiss());
  await page.getByRole('button', { name: 'Sair' }).click();
  await expect(page.locator('#nav-link-dashboard')).toBeVisible();

  // Aceitar a confirmação encerra a sessão.
  page.once('dialog', (dialog) => void dialog.accept());
  await page.getByRole('button', { name: 'Sair' }).click();
  await expect(page.getByText('Acesso Restrito')).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.locator('#nav-link-dashboard')).toHaveCount(0);
});
