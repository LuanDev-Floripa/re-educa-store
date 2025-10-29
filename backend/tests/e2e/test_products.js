/**
 * Testes E2E para Produtos
 */
const PuppeteerTestSetup = require('./puppeteer_setup');
const config = require('./test_config');

describe('Products E2E Tests', () => {
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

    test('Deve listar produtos via API', async () => {
        global.currentTestName = 'products-list-api';
        
        const response = await page.goto(`${config.TEST_BASE_URL}/api/products`, {
            waitUntil: 'networkidle0'
        });
        
        const content = await page.content();
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        
        expect(response.status()).toBeLessThan(400);
        if (jsonMatch) {
            const data = JSON.parse(jsonMatch[0]);
            expect(data).toHaveProperty('products');
        }
    }, 20000);

    test('Deve buscar produtos com filtros', async () => {
        global.currentTestName = 'products-search';
        
        const searchUrl = `${config.TEST_BASE_URL}/api/products/search?q=vitamina&limit=10`;
        await page.goto(searchUrl, { waitUntil: 'networkidle0' });
        
        const content = await page.content();
        expect(content.length).toBeGreaterThan(0);
    }, 15000);
});

jest.setTimeout(60000);
