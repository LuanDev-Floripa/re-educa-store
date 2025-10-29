/**
 * Teste completo de todas as rotas principais
 */
const PuppeteerTestSetup = require('./puppeteer_setup');
const config = require('./test_config');

describe('All Routes E2E Tests', () => {
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

    const routes = [
        { name: 'Health Check', path: '/health', method: 'GET', public: true },
        { name: 'Products List', path: '/api/products', method: 'GET', public: true },
        { name: 'Exercises List', path: '/api/exercises', method: 'GET', public: true },
        { name: 'Health Calculators', path: '/api/health/calculators/imc?weight=70&height=1.75', method: 'GET', public: true },
        { name: 'Admin Dashboard', path: '/api/admin/dashboard', method: 'GET', public: false },
        { name: 'System Info', path: '/api/system/info', method: 'GET', public: true },
    ];

    routes.forEach(route => {
        test(`Deve acessar ${route.name}`, async () => {
            global.currentTestName = `route-${route.name.toLowerCase().replace(/\s+/g, '-')}`;
            
            const url = `${config.TEST_BASE_URL}${route.path}`;
            console.log(`🔍 Testando: ${route.name} - ${url}`);
            
            try {
                const response = await page.goto(url, {
                    waitUntil: 'networkidle0',
                    timeout: 10000
                });
                
                const status = response.status();
                const content = await page.content();
                
                // Verifica se não retornou erro 5xx
                expect(status).toBeLessThan(500);
                
                // Se é rota pública, deve retornar 200
                if (route.public) {
                    expect([200, 201, 204]).toContain(status);
                }
                
                // Logs do backend
                const backendLog = await setup.captureBackendLogs();
                console.log(`📋 Backend log (últimas 3 linhas):`);
                console.log(backendLog.split('\n').slice(-3).join('\n'));
                
                console.log(`✅ ${route.name}: Status ${status}`);
                
            } catch (error) {
                console.error(`❌ Erro em ${route.name}:`, error.message);
                throw error;
            }
        }, 20000);
    });
});

jest.setTimeout(180000);
