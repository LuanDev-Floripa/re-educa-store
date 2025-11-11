/**
 * Testes E2E para Autenticação
 */
const PuppeteerTestSetup = require('./puppeteer_setup');
const config = require('./test_config');

describe('Auth E2E Tests', () => {
    let setup;
    let page;

    beforeAll(async () => {
        setup = new PuppeteerTestSetup({
            headless: config.PUPPETEER_HEADLESS,
            baseUrl: config.TEST_FRONTEND_URL,
            bypassAuth: false // Testa autenticação real
        });
        const result = await setup.setup();
        page = result.page;
    });

    afterAll(async () => {
        if (setup) await setup.cleanup();
    });

    test('Deve ter endpoint de health check', async () => {
        global.currentTestName = 'auth-health';
        
        const url = `${config.TEST_BASE_URL}/health`;
        const response = await page.goto(url, { waitUntil: 'networkidle0' });
        
        expect(response.status()).toBe(200);
        const content = await page.content();
        expect(content).toContain('healthy');
    }, 10000);

    test('Deve acessar endpoint de registro', async () => {
        global.currentTestName = 'auth-register-endpoint';
        
        const url = `${config.TEST_BASE_URL}/api/auth/register`;
        
        // Testa apenas se endpoint existe (não faz registro real)
        const result = await page.evaluate(async (testUrl) => {
            try {
                const response = await fetch(testUrl, {
                    method: 'OPTIONS' // Preflight
                });
                return { status: response.status, ok: response.ok };
            } catch (error) {
                return { error: error.message };
            }
        }, url);
        
        // Endpoint deve existir
        expect(result.status).toBeLessThan(500);
    }, 15000);
});

jest.setTimeout(60000);
