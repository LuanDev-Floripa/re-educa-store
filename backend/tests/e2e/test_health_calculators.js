/**
 * Testes E2E para Health Calculators
 */
const PuppeteerTestSetup = require('./puppeteer_setup');
const config = require('./test_config');

describe('Health Calculators E2E Tests', () => {
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

    test('Deve calcular IMC', async () => {
        global.currentTestName = 'health-imc-calc';
        
        const url = `${config.TEST_BASE_URL}/api/health/calculators/imc?weight=70&height=1.75`;
        const response = await page.goto(url, { waitUntil: 'networkidle0' });
        
        const content = await page.content();
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        
        expect(response.status()).toBe(200);
        if (jsonMatch) {
            const data = JSON.parse(jsonMatch[0]);
            expect(data).toHaveProperty('imc');
            expect(data.imc).toBeCloseTo(22.86, 1);
        }
    }, 15000);

    test('Deve calcular calorias', async () => {
        global.currentTestName = 'health-calories-calc';
        
        const url = `${config.TEST_BASE_URL}/api/health/calculators/calories?age=30&gender=male&weight=70&height=175&activity=moderate`;
        const response = await page.goto(url, { waitUntil: 'networkidle0' });
        
        expect(response.status()).toBe(200);
    }, 15000);

    test('Deve calcular hidratação', async () => {
        global.currentTestName = 'health-hydration-calc';
        
        const url = `${config.TEST_BASE_URL}/api/health/calculators/hydration?weight=70&activity=moderate`;
        const response = await page.goto(url, { waitUntil: 'networkidle0' });
        
        expect(response.status()).toBe(200);
    }, 15000);
});

jest.setTimeout(60000);
