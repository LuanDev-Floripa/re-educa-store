/**
 * Configuração para testes E2E
 */
module.exports = {
    TESTING: process.env.TESTING === 'true' || true,
    BYPASS_AUTH: process.env.BYPASS_AUTH !== 'false', // Default: true
    TEST_BASE_URL: process.env.TEST_BASE_URL || 'http://localhost:9001',
    TEST_FRONTEND_URL: process.env.TEST_FRONTEND_URL || 'http://localhost:9002',
    
    // Credenciais de teste (usadas apenas se BYPASS_AUTH=false)
    TEST_USER_EMAIL: process.env.TEST_USER_EMAIL || 'test@example.com',
    TEST_USER_PASSWORD: process.env.TEST_USER_PASSWORD || 'test123',
    
    // Configurações Puppeteer
    PUPPETEER_HEADLESS: process.env.PUPPETEER_HEADLESS !== 'false',
    PUPPETEER_SLOW_MO: parseInt(process.env.PUPPETEER_SLOW_MO || '0'),
    PUPPETEER_TIMEOUT: parseInt(process.env.PUPPETEER_TIMEOUT || '30000'),
    
    // Captura de logs
    CAPTURE_BACKEND_LOGS: true,
    CAPTURE_BROWSER_LOGS: true
};
