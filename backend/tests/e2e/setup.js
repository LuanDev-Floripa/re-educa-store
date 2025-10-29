/**
 * Setup antes de cada teste E2E
 */
beforeAll(() => {
    // Configura variáveis de ambiente para bypass de autenticação
    process.env.TESTING = 'true';
    process.env.BYPASS_AUTH = 'true';
    
    console.log('🧪 Configuração de teste ativada');
    console.log('   - BYPASS_AUTH: true');
    console.log('   - TESTING: true');
});

afterEach(async () => {
    // Aguarda um pouco entre testes para não sobrecarregar
    await new Promise(resolve => setTimeout(resolve, 1000));
});
