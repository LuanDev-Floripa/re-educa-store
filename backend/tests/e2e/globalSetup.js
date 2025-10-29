/**
 * Setup global antes de todos os testes E2E
 */
module.exports = async () => {
    console.log('🚀 Setup global dos testes E2E');
    
    // Verifica se o backend está rodando
    const http = require('http');
    const TEST_BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:9001';
    
    return new Promise((resolve, reject) => {
        const url = new URL(`${TEST_BASE_URL}/health`);
        const req = http.get(url, (res) => {
            if (res.statusCode === 200) {
                console.log('✅ Backend está rodando');
                resolve();
            } else {
                console.warn('⚠️  Backend retornou status:', res.statusCode);
                resolve(); // Continua mesmo assim
            }
        });
        
        req.on('error', (error) => {
            console.warn('⚠️  Não foi possível conectar ao backend:', error.message);
            console.warn('   Certifique-se de que o backend está rodando em', TEST_BASE_URL);
            resolve(); // Continua mesmo assim para verificar no teste
        });
        
        req.setTimeout(5000, () => {
            req.destroy();
            console.warn('⚠️  Timeout ao verificar backend');
            resolve();
        });
    });
};
