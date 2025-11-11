/**
 * Testes E2E para Admin Dashboard
 */
const PuppeteerTestSetup = require('./puppeteer_setup');
const config = require('./test_config');

describe('Admin E2E Tests', () => {
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

    test('Deve acessar dashboard admin via API', async () => {
        global.currentTestName = 'admin-dashboard-api';
        
        const url = `${config.TEST_BASE_URL}/api/admin/dashboard`;
        const response = await page.goto(url, {
            waitUntil: 'networkidle0'
        });
        
        const status = response.status();
        const content = await page.content();
        
        // Com bypass, não deve retornar 401/403
        expect([401, 403]).not.toContain(status);
        expect(content.length).toBeGreaterThan(0);
        
        // Captura log do backend
        const backendLog = await setup.captureBackendLogs();
        console.log('📋 Log do backend:', backendLog.split('\n').slice(-5).join('\n'));
    }, 20000);

    test('Deve acessar analytics admin', async () => {
        global.currentTestName = 'admin-analytics';
        
        const url = `${config.TEST_BASE_URL}/api/admin/analytics/sales?period=30`;
        await page.goto(url, { waitUntil: 'networkidle0' });
        
        const content = await page.content();
        expect(content.length).toBeGreaterThan(0);
    }, 15000);

    test('Deve listar usuários (admin)', async () => {
        global.currentTestName = 'admin-users-list';
        
        const url = `${config.TEST_BASE_URL}/api/admin/users?page=1&per_page=10`;
        const response = await page.goto(url, { waitUntil: 'networkidle0' });
        
        expect([401, 403]).not.toContain(response.status());
    }, 15000);
});

jest.setTimeout(60000);
