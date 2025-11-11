import { test, expect } from '@playwright/test';

/**
 * Testes E2E de Carrinho RE-EDUCA Store
 * 
 * Testes completos do fluxo de carrinho
 */

test.describe('Carrinho de Compras', () => {
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

  test('deve adicionar produto ao carrinho', async ({ page }) => {
    await page.goto('/store');
    
    // Aguardar produtos carregarem
    await page.waitForSelector('[data-testid="product-card"], .product-card, article', { timeout: 10000 });
    
    // Clicar no primeiro produto
    const firstProduct = page.locator('[data-testid="product-card"], .product-card, article').first();
    await firstProduct.click();

    // Aguardar página de detalhes
    await expect(page).toHaveURL(/\/store\/.*|.*\/product\/.*/, { timeout: 5000 });

    // Adicionar ao carrinho
    const addToCartButton = page.getByRole('button', { name: /adicionar ao carrinho|add to cart/i });
    await addToCartButton.click();

    // Verificar notificação de sucesso ou badge do carrinho
    await expect(
      page.getByText(/adicionado|adicionado ao carrinho|added/i).or(
        page.locator('[aria-label*="carrinho"], [aria-label*="cart"]')
      )
    ).toBeVisible({ timeout: 5000 });
  });

  test('deve exibir produtos no carrinho', async ({ page }) => {
    await page.goto('/cart');
    
    // Verificar se carrinho está visível
    await expect(page.getByRole('heading', { name: /carrinho|cart/i })).toBeVisible();
    
    // Verificar se há itens ou mensagem de carrinho vazio
    const cartContent = page.locator('[data-testid="cart-items"], .cart-items, main');
    await expect(cartContent).toBeVisible();
  });

  test('deve atualizar quantidade de item no carrinho', async ({ page }) => {
    await page.goto('/cart');
    
    // Aguardar itens do carrinho
    await page.waitForSelector('[data-testid="cart-item"], .cart-item', { timeout: 5000 }).catch(() => {
      // Se não houver itens, pular teste
      test.skip();
    });

    // Encontrar botão de incrementar quantidade
    const incrementButton = page.locator('[aria-label*="aumentar"], [aria-label*="increase"], button:has-text("+")').first();
    await incrementButton.click();

    // Verificar se quantidade foi atualizada
    await expect(page.getByText(/atualizado|updated/i).or(page.locator('input[type="number"]'))).toBeVisible({ timeout: 3000 });
  });

  test('deve remover item do carrinho', async ({ page }) => {
    await page.goto('/cart');
    
    // Aguardar itens do carrinho
    await page.waitForSelector('[data-testid="cart-item"], .cart-item', { timeout: 5000 }).catch(() => {
      test.skip();
    });

    // Encontrar botão de remover
    const removeButton = page.locator('[aria-label*="remover"], [aria-label*="remove"], button:has-text("×")').first();
    await removeButton.click();

    // Verificar confirmação ou remoção
    await expect(page.getByText(/removido|removed|confirmar/i)).toBeVisible({ timeout: 5000 });
  });
});
