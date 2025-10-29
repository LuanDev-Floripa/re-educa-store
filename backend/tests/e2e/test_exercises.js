/**
 * Testes E2E para Exercícios
 */
const PuppeteerTestSetup = require('./puppeteer_setup');
const config = require('./test_config');

describe('Exercises E2E Tests', () => {
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

    test('Deve listar exercícios', async () => {
        global.currentTestName = 'exercises-list';
        
        const url = `${config.TEST_BASE_URL}/api/exercises?limit=10`;
        const response = await page.goto(url, { waitUntil: 'networkidle0' });
        
        expect(response.status()).toBe(200);
        const content = await page.content();
        expect(content.length).toBeGreaterThan(0);
    }, 15000);

    test('Deve buscar exercícios por categoria', async () => {
        global.currentTestName = 'exercises-by-category';
        
        const url = `${config.TEST_BASE_URL}/api/exercises?category=cardio&limit=5`;
        const response = await page.goto(url, { waitUntil: 'networkidle0' });
        
        expect(response.status()).toBe(200);
    }, 15000);
});

jest.setTimeout(60000);
