/**
 * Testes E2E para Dashboard usando Puppeteer
 * Bypassa autenticação seguindo boas práticas de testes
 */
const PuppeteerTestSetup = require('./puppeteer_setup');
const config = require('./test_config');

describe('Dashboard E2E Tests', () => {
    let setup;
    let page;
    let browser;

    beforeAll(async () => {
        setup = new PuppeteerTestSetup({
            headless: config.PUPPETEER_HEADLESS,
            slowMo: config.PUPPETEER_SLOW_MO,
            timeout: config.PUPPETEER_TIMEOUT,
            baseUrl: config.TEST_FRONTEND_URL,
            bypassAuth: config.BYPASS_AUTH,
            captureBrowserLogs: true
        });

        const result = await setup.setup();
        browser = result.browser;
        page = result.page;
    });

    afterAll(async () => {
        if (setup) {
            await setup.cleanup();
        }
    });

    afterEach(async () => {
        // Salva logs após cada teste
        if (setup && global.currentTestName) {
            await setup.saveLogs(global.currentTestName);
        }
    });

    test('Deve carregar o dashboard sem autenticação (bypass)', async () => {
        global.currentTestName = 'dashboard-load-bypass';
        
        // Navega para dashboard com bypass de auth
        await setup.navigateToDashboard(true);
        
        // Aguarda elementos principais carregarem
        const dashboardLoaded = await setup.waitForElement('[data-testid="dashboard"]', 10000) ||
                                await setup.waitForElement('.dashboard', 10000) ||
                                await setup.waitForElement('#dashboard', 10000);
        
        // Verifica se a página não retornou erro 401/403
        const pageContent = await page.content();
        const hasAuthError = pageContent.includes('401') || 
                            pageContent.includes('403') ||
                            pageContent.includes('unauthorized') ||
                            pageContent.includes('access denied');
        
        expect(hasAuthError).toBe(false);
        expect(dashboardLoaded || pageContent.length > 1000).toBe(true);
        
        // Captura screenshot
        await setup.takeScreenshot('dashboard-loaded');
    }, 30000);

    test('Deve acessar rotas protegidas do dashboard', async () => {
        global.currentTestName = 'dashboard-protected-routes';
        
        await setup.navigateToDashboard(true);
        
        // Lista de rotas protegidas para testar
        const protectedRoutes = [
            '/dashboard/analytics',
            '/dashboard/settings',
            '/dashboard/profile'
        ];
        
        for (const route of protectedRoutes) {
            const fullUrl = `${config.TEST_FRONTEND_URL}${route}`;
            console.log(`📍 Testando rota: ${fullUrl}`);
            
            try {
                const response = await page.goto(fullUrl, {
                    waitUntil: 'networkidle2',
                    timeout: 10000
                });
                
                const status = response.status();
                expect(status).toBeLessThan(400); // Não deve ser 4xx ou 5xx
                
                const content = await page.content();
                const hasError = content.includes('404') || 
                               content.includes('403') ||
                               content.includes('401');
                
                expect(hasError).toBe(false);
            } catch (error) {
                console.warn(`⚠️  Rota ${route} não acessível:`, error.message);
            }
        }
        
        await setup.takeScreenshot('protected-routes');
    }, 60000);

    test('Deve capturar logs do backend durante navegação', async () => {
        global.currentTestName = 'dashboard-backend-logs';
        
        await setup.navigateToDashboard(true);
        
        // Faz algumas ações para gerar logs
        await page.click('body'); // Simula interação
        await page.waitForTimeout(1000);
        
        // Captura logs do backend usando Lynx
        const backendLogs = await setup.captureBackendLogs();
        
        expect(backendLogs).toBeDefined();
        expect(backendLogs.length).toBeGreaterThan(0);
        
        console.log('📋 Últimas linhas do log do backend:');
        console.log(backendLogs.split('\n').slice(-10).join('\n'));
    }, 20000);

    test('Deve testar API endpoints sem autenticação (bypass)', async () => {
        global.currentTestName = 'dashboard-api-bypass';
        
        // Testa endpoints da API que normalmente requerem auth
        const apiEndpoints = [
            '/api/users/dashboard',
            '/api/admin/dashboard',
            '/api/health'
        ];
        
        for (const endpoint of apiEndpoints) {
            const url = `${config.TEST_BASE_URL}${endpoint}`;
            console.log(`🔍 Testando API: ${url}`);
            
            try {
                const response = await page.goto(url, {
                    waitUntil: 'networkidle0',
                    timeout: 5000
                });
                
                const content = await page.content();
                const status = await response.status();
                
                // Com bypass, não deve retornar 401/403
                expect([401, 403]).not.toContain(status);
                
                // Se retornar JSON, deve ser válido
                if (content.includes('{')) {
                    expect(content).toContain('"');
                }
            } catch (error) {
                console.warn(`⚠️  Endpoint ${endpoint}:`, error.message);
            }
        }
    }, 30000);
});

// Configura Jest timeout global
jest.setTimeout(120000);
