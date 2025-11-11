/**
 * Setup do Puppeteer para testes E2E
 */
const puppeteer = require('puppeteer');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

class PuppeteerTestSetup {
    constructor(config = {}) {
        this.config = {
            headless: config.headless !== false,
            slowMo: config.slowMo || 0,
            timeout: config.timeout || 30000,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu',
                ...(config.args || [])
            ],
            ...config
        };
        
        this.browser = null;
        this.page = null;
        this.logCapture = [];
    }

    async setup() {
        console.log('🚀 Iniciando Puppeteer...');
        this.browser = await puppeteer.launch(this.config);
        this.page = await this.browser.newPage();
        
        // Configura timeout padrão
        this.page.setDefaultTimeout(this.config.timeout);
        
        // Captura logs do console do navegador
        if (this.config.captureBrowserLogs) {
            this.page.on('console', msg => {
                const logEntry = {
                    type: msg.type(),
                    text: msg.text(),
                    timestamp: new Date().toISOString()
                };
                this.logCapture.push(logEntry);
                console.log(`[Browser ${logEntry.type}] ${logEntry.text}`);
            });

            this.page.on('pageerror', error => {
                const logEntry = {
                    type: 'error',
                    text: error.message,
                    stack: error.stack,
                    timestamp: new Date().toISOString()
                };
                this.logCapture.push(logEntry);
                console.error(`[Browser Error] ${error.message}`);
            });
        }
        
        // Intercepta requisições para adicionar headers de teste
        if (this.config.bypassAuth) {
            await this.page.setRequestInterception(true);
            this.page.on('request', request => {
                // Adiciona header para bypass de autenticação
                const headers = {
                    ...request.headers(),
                    'X-Test-Mode': 'true',
                    'X-Bypass-Auth': 'true',
                    'Authorization': 'Bearer test-token-bypass'
                };
                request.continue({ headers });
            });
        }
        
        console.log('✅ Puppeteer configurado');
        return { browser: this.browser, page: this.page };
    }

    async captureBackendLogs(logFile = '../logs/app.log') {
        return new Promise((resolve, reject) => {
            const logPath = path.resolve(__dirname, '..', '..', logFile);
            const command = `tail -n 50 ${logPath} | lynx -stdin -dump 2>/dev/null || cat ${logPath}`;
            
            exec(command, (error, stdout, stderr) => {
                if (error && !stdout) {
                    console.warn('⚠️  Não foi possível capturar logs do backend:', error.message);
                    resolve('');
                } else {
                    resolve(stdout || '');
                }
            });
        });
    }

    async saveLogs(testName) {
        const logDir = path.resolve(__dirname, '..', '..', 'logs', 'e2e');
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const logFile = path.join(logDir, `${testName}-${timestamp}.json`);
        
        const logs = {
            testName,
            timestamp: new Date().toISOString(),
            browserLogs: this.logCapture,
            backendLogs: await this.captureBackendLogs()
        };

        fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
        console.log(`📄 Logs salvos em: ${logFile}`);
        return logFile;
    }

    async cleanup() {
        if (this.page) {
            await this.page.close();
        }
        if (this.browser) {
            await this.browser.close();
        }
        console.log('🧹 Puppeteer limpo');
    }

    async navigateToDashboard(bypassAuth = true) {
        const url = `${this.config.baseUrl || 'http://localhost:9002'}/dashboard`;
        console.log(`📍 Navegando para: ${url}`);
        
        await this.page.goto(url, { 
            waitUntil: 'networkidle2',
            timeout: this.config.timeout 
        });

        // Se bypass auth estiver ativado, injeta token de teste
        if (bypassAuth) {
            await this.page.evaluate(() => {
                localStorage.setItem('auth_token', 'test-token-bypass');
                localStorage.setItem('user_data', JSON.stringify({
                    id: 'test-user-id',
                    email: 'test@example.com',
                    name: 'Test User',
                    role: 'admin'
                }));
            });
            
            // Recarrega a página para aplicar as mudanças
            await this.page.reload({ waitUntil: 'networkidle2' });
        }
        
        return this.page;
    }

    async waitForElement(selector, timeout = 5000) {
        try {
            await this.page.waitForSelector(selector, { timeout });
            return true;
        } catch (error) {
            return false;
        }
    }

    async takeScreenshot(name) {
        const screenshotDir = path.resolve(__dirname, '..', '..', 'logs', 'e2e', 'screenshots');
        if (!fs.existsSync(screenshotDir)) {
            fs.mkdirSync(screenshotDir, { recursive: true });
        }
        const screenshotPath = path.join(screenshotDir, `${name}-${Date.now()}.png`);
        await this.page.screenshot({ path: screenshotPath, fullPage: true });
        return screenshotPath;
    }
}

module.exports = PuppeteerTestSetup;
