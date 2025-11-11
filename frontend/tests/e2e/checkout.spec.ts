import { test, expect } from '@playwright/test';

/**
 * Testes E2E de Checkout RE-EDUCA Store
 * 
 * Testes do fluxo completo de compra
 */

test.describe('Checkout', () => {
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

  test('deve iniciar checkout com itens no carrinho', async ({ page }) => {
    // Primeiro adicionar item ao carrinho
    await page.goto('/store');
    await page.waitForSelector('[data-testid="product-card"], .product-card, article', { timeout: 10000 });
    
    const firstProduct = page.locator('[data-testid="product-card"], .product-card, article').first();
    await firstProduct.click();
    
    const addToCartButton = page.getByRole('button', { name: /adicionar ao carrinho|add to cart/i });
    await addToCartButton.click();
    await page.waitForTimeout(1000); // Aguardar item ser adicionado

    // Ir para checkout
    await page.goto('/checkout');
    await expect(page.getByRole('heading', { name: /checkout|finalizar compra/i })).toBeVisible({ timeout: 5000 });
  });

  test('deve validar campos obrigatórios no checkout', async ({ page }) => {
    await page.goto('/checkout');
    
    // Tentar finalizar sem preencher
    const submitButton = page.getByRole('button', { name: /finalizar|confirmar|pagar/i });
    await submitButton.click();

    // Verificar mensagens de erro
    await expect(page.getByText(/obrigatório|required|preencha/i)).toBeVisible({ timeout: 3000 });
  });

  test('deve preencher endereço de entrega', async ({ page }) => {
    await page.goto('/checkout');
    
    // Preencher endereço
    await page.getByLabel(/cep|zip/i).fill('01310-100');
    await page.getByLabel(/rua|street|endereço/i).fill('Avenida Paulista');
    await page.getByLabel(/número|number/i).fill('1000');
    await page.getByLabel(/cidade|city/i).fill('São Paulo');
    await page.getByLabel(/estado|state/i).selectOption('SP');

    // Verificar se campos foram preenchidos
    await expect(page.getByLabel(/rua|street/i)).toHaveValue(/paulista/i);
  });
});
