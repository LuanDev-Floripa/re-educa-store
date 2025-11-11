import { test, expect } from '@playwright/test';

/**
 * Testes E2E de Autenticação RE-EDUCA Store
 * 
 * Testes completos de autenticação
 */

test.describe('Autenticação', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('deve exibir página de login', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /login|entrar/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/senha|password/i)).toBeVisible();
  });

  test('deve mostrar erro com credenciais inválidas', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('teste@invalid.com');
    await page.getByLabel(/senha|password/i).fill('senha_errada');
    await page.getByRole('button', { name: /entrar|login/i }).click();

    // Deve mostrar mensagem de erro
    await expect(page.getByText(/erro|invalid|incorrect/i)).toBeVisible({ timeout: 5000 });
  });

  test('deve redirecionar para dashboard após login bem-sucedido', async ({ page }) => {
    // Assumindo que temos um usuário de teste
    // Em produção, usar variáveis de ambiente ou seed de dados
    const testEmail = process.env.TEST_USER_EMAIL || 'test@example.com';
    const testPassword = process.env.TEST_USER_PASSWORD || 'test123';

    await page.goto('/login');
    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/senha|password/i).fill(testPassword);
    await page.getByRole('button', { name: /entrar|login/i }).click();

    // Deve redirecionar para dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });

  test('deve fazer logout corretamente', async ({ page, context }) => {
    // Primeiro fazer login
    const testEmail = process.env.TEST_USER_EMAIL || 'test@example.com';
    const testPassword = process.env.TEST_USER_PASSWORD || 'test123';

    await page.goto('/login');
    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/senha|password/i).fill(testPassword);
    await page.getByRole('button', { name: /entrar|login/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

    // Fazer logout
    await page.getByRole('button', { name: /logout|sair/i }).click();

    // Deve redirecionar para login
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });
});
