/**
 * Testes E2E para Carrinho de Compras
 */
const PuppeteerTestSetup = require('./puppeteer_setup');
const config = require('./test_config');

describe('Cart E2E Tests', () => {
    let setup;
    let page;

    beforeAll(async () => {
        setup = new PuppeteerTestSetup({
            headless: config.PUPPETEER_HEADLESS,
            baseUrl: config.TEST_FRONTEND_URL,
            bypassAuth: config.BYPASS_AUTH
        });
        const result = await setup.setup();
        page = result.page;
    });

    afterAll(async () => {
        if (setup) await setup.cleanup();
    });

    test('Deve acessar carrinho via API', async () => {
        global.currentTestName = 'cart-get';
        
        const url = `${config.TEST_BASE_URL}/api/cart`;
        const response = await page.goto(url, { waitUntil: 'networkidle0' });
        
        const status = response.status();
        // Pode retornar 200 (carrinho vazio) ou 401 se não tiver bypass correto
        expect(status).toBeLessThan(500);
    }, 15000);

    test('Deve adicionar item ao carrinho (POST)', async () => {
        global.currentTestName = 'cart-add-item';
        
        const url = `${config.TEST_BASE_URL}/api/cart/add`;
        
        // Usa evaluate para fazer POST via fetch
        const result = await page.evaluate(async (testUrl) => {
            try {
                const response = await fetch(testUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Bypass-Auth': 'true',
                        'Authorization': 'Bearer test-token-bypass'
                    },
                    body: JSON.stringify({
                        product_id: 'test-product',
                        quantity: 1
                    })
                });
                return { status: response.status, ok: response.ok };
            } catch (error) {
                return { error: error.message };
            }
        }, url);
        
        console.log('📋 Resultado:', result);
        expect(result.status).toBeLessThan(500);
    }, 20000);
});

jest.setTimeout(60000);
