import { test, expect } from '@playwright/test';

/**
 * Testes E2E de Calculadoras de Saúde RE-EDUCA Store
 * 
 * Testes completos das calculadoras
 */

test.describe('Calculadoras de Saúde', () => {
  test.beforeEach(async ({ page }) => {
    // Fazer login primeiro
    const testEmail = process.env.TEST_USER_EMAIL || 'test@example.com';
    const testPassword = process.env.TEST_USER_PASSWORD || 'test123';

    await page.goto('/login');
    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/senha|password/i).fill(testPassword);
    await page.getByRole('button', { name: /entrar|login/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });

  test('deve calcular IMC corretamente', async ({ page }) => {
    await page.goto('/tools/imc'); // ou rota correta

    // Preencher dados
    await page.getByLabel(/peso|weight/i).fill('70');
    await page.getByLabel(/altura|height/i).fill('175');

    // Calcular
    await page.getByRole('button', { name: /calcular|calculate/i }).click();

    // Verificar resultado
    await expect(page.getByText(/imc|bmi/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/\d+\.\d+/)).toBeVisible(); // Resultado numérico
  });

  test('deve calcular calorias diárias', async ({ page }) => {
    await page.goto('/tools/calories'); // ou rota correta

    // Preencher dados
    await page.getByLabel(/idade|age/i).fill('30');
    await page.getByLabel(/peso|weight/i).fill('70');
    await page.getByLabel(/altura|height/i).fill('175');
    await page.getByLabel(/gênero|gender/i).selectOption('male');
    await page.getByLabel(/nível.*atividade|activity/i).selectOption('moderate');

    // Calcular
    await page.getByRole('button', { name: /calcular|calculate/i }).click();

    // Verificar resultado
    await expect(page.getByText(/calorias|calories|kcal/i)).toBeVisible({ timeout: 5000 });
  });

  test('deve calcular hidratação', async ({ page }) => {
    await page.goto('/tools/hydration'); // ou rota correta

    // Preencher dados
    await page.getByLabel(/peso|weight/i).fill('70');
    await page.getByLabel(/nível.*atividade|activity/i).selectOption('moderate');

    // Calcular
    await page.getByRole('button', { name: /calcular|calculate/i }).click();

    // Verificar resultado
    await expect(page.getByText(/água|water|litros|liters|ml/i)).toBeVisible({ timeout: 5000 });
  });
});
