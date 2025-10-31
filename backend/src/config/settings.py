"""
Configurações da aplicação RE-EDUCA Store.

Centraliza todas as variáveis de ambiente e configurações incluindo:
- Supabase (URL, API keys)
- JWT (tokens, expiração)
- APIs externas (USDA, pagamentos)
- CORS, rate limiting, cache
- Email, upload, logging
- Ambientes (dev, staging, prod)

SEGURANÇA:
- NUNCA commitar secrets reais
- Usar .env para valores sensíveis
- Defaults são apenas para desenvolvimento
"""
import os
from typing import Optional

class Config:
    """
    Configuração base da aplicação.
    
    Carrega valores de variáveis de ambiente com fallbacks.
    """
    
    # Configurações básicas
    SECRET_KEY = os.environ.get('SECRET_KEY', 'your-super-secret-key-change-in-production')
    DEBUG = os.environ.get('DEBUG', 'False').lower() == 'true'
    
    # Configurações do Supabase
    SUPABASE_URL = os.environ.get('SUPABASE_URL', 'your-supabase-url')
    SUPABASE_KEY = os.environ.get('SUPABASE_KEY', 'your-supabase-anon-key')
    
    # Configurações de API externa
    USDA_API_KEY = os.environ.get('USDA_API_KEY', 'your-usda-api-key')
    USDA_BASE_URL = 'https://api.nal.usda.gov/fdc/v1'
    
    # Configurações de CORS
    CORS_ORIGINS = [
        'http://localhost:5174',
        'http://localhost:3000',
        'http://localhost:5173'
    ]
    
    # Configurações de JWT
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', SECRET_KEY)
    JWT_ACCESS_TOKEN_EXPIRES = 7 * 24 * 60 * 60  # 7 dias em segundos
    JWT_REFRESH_TOKEN_EXPIRES = 30 * 24 * 60 * 60  # 30 dias em segundos
    
    # Configurações de rate limiting
    RATELIMIT_DEFAULT = "200 per day;50 per hour"
    RATELIMIT_STORAGE_URL = "memory://"
    
    # Configurações de logging
    LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO')
    LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    
    # Configurações de cache
    CACHE_TYPE = "simple"
    CACHE_DEFAULT_TIMEOUT = 300
    
    # Configurações de paginação
    DEFAULT_PAGE_SIZE = 20
    MAX_PAGE_SIZE = 100
    
    # Configurações de upload
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB
    UPLOAD_FOLDER = 'uploads'
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'pdf'}
    
    # Configurações de email
    MAIL_SERVER = os.environ.get('MAIL_SERVER', 'smtp.gmail.com')
    MAIL_PORT = int(os.environ.get('MAIL_PORT', 587))
    MAIL_USE_TLS = os.environ.get('MAIL_USE_TLS', 'true').lower() == 'true'
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME')
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD')
    
    # Configurações de pagamento
    STRIPE_SECRET_KEY = os.environ.get('STRIPE_SECRET_KEY')
    STRIPE_PUBLISHABLE_KEY = os.environ.get('STRIPE_PUBLISHABLE_KEY')
    
    # Configurações de afiliados
    HOTMART_TOKEN = os.environ.get('HOTMART_TOKEN')
    KIWIFY_TOKEN = os.environ.get('KIWIFY_TOKEN')
    BRAIP_TOKEN = os.environ.get('BRAIP_TOKEN')
    
    # Configurações de IA
    OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
    AI_MODEL = os.environ.get('AI_MODEL', 'gpt-3.5-turbo')
    
    # Configurações de monitoramento
    SENTRY_DSN = os.environ.get('SENTRY_DSN')
    GOOGLE_ANALYTICS_ID = os.environ.get('GOOGLE_ANALYTICS_ID')

class DevelopmentConfig(Config):
    """Configuração para desenvolvimento"""
    DEBUG = True
    LOG_LEVEL = 'DEBUG'

class ProductionConfig(Config):
    """Configuração para produção"""
    DEBUG = False
    LOG_LEVEL = 'WARNING'
    
    # Configurações de segurança para produção
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'

class TestingConfig(Config):
    """Configuração para testes"""
    TESTING = True
    DEBUG = True
    WTF_CSRF_ENABLED = False

# Dicionário de configurações
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}

def get_config(config_name: Optional[str] = None):
    """Retorna a configuração baseada no ambiente"""
    if config_name is None:
        config_name = os.environ.get('FLASK_ENV', 'default')
    
    return config.get(config_name, config['default'])