"""
Configuração para testes E2E com Puppeteer
"""
import os

# Configurações de teste
TESTING = True
BYPASS_AUTH = True  # Bypassa autenticação nos testes
TEST_BASE_URL = os.environ.get('TEST_BASE_URL', 'http://localhost:9001')
TEST_FRONTEND_URL = os.environ.get('TEST_FRONTEND_URL', 'http://localhost:9002')

# Credenciais de teste (ignoradas se BYPASS_AUTH=True)
TEST_USER_EMAIL = os.environ.get('TEST_USER_EMAIL', 'test@example.com')
TEST_USER_PASSWORD = os.environ.get('TEST_USER_PASSWORD', 'test123')
TEST_ADMIN_EMAIL = os.environ.get('TEST_ADMIN_EMAIL', 'admin@test.com')
TEST_ADMIN_PASSWORD = os.environ.get('TEST_ADMIN_PASSWORD', 'admin123')

# Configurações do Puppeteer
PUPPETEER_HEADLESS = os.environ.get('PUPPETEER_HEADLESS', 'true').lower() == 'true'
PUPPETEER_SLOW_MO = int(os.environ.get('PUPPETEER_SLOW_MO', '0'))  # Delay entre ações
PUPPETEER_TIMEOUT = int(os.environ.get('PUPPETEER_TIMEOUT', '30000'))  # 30 segundos

# Configurações de captura de logs
CAPTURE_BACKEND_LOGS = True
CAPTURE_BROWSER_LOGS = True
LOG_OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'logs', 'e2e')
