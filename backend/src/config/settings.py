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

# Carregar variáveis de ambiente do arquivo .env
try:
    from dotenv import load_dotenv

    load_dotenv()
except ImportError:
    pass  # dotenv não está disponível


class Config:
    """
    Configuração base da aplicação.

    Carrega valores de variáveis de ambiente com fallbacks.
    """

    # Configurações básicas
    # IMPORTANTE: SECRET_KEY DEVE ser definida via variável de ambiente em produção
    SECRET_KEY = os.environ.get("SECRET_KEY")
    if not SECRET_KEY:
        raise ValueError(
            "SECRET_KEY não definida! Configure a variável de ambiente SECRET_KEY. "
            "Em produção, NUNCA use valores padrão para SECRET_KEY."
        )
    DEBUG = os.environ.get("DEBUG", "False").lower() == "true"

    LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO" if not DEBUG else "DEBUG")
    LOG_FORMAT = os.environ.get("LOG_FORMAT", "%(asctime)s - %(name)s - %(levelname)s - %(message)s")
    USE_JSON_LOGGING = os.environ.get("USE_JSON_LOGGING", "false").lower() == "true"

    # Configurações do Supabase
    # IMPORTANTE: Estas variáveis DEVEM ser definidas via .env
    SUPABASE_URL = os.environ.get("SUPABASE_URL")
    SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise ValueError(
            "SUPABASE_URL e SUPABASE_KEY devem ser definidas via variáveis de ambiente. " "Verifique seu arquivo .env"
        )

    # Configurações de API externa
    USDA_API_KEY = os.environ.get("USDA_API_KEY")
    if not USDA_API_KEY and DEBUG:
        # Apenas em desenvolvimento, permite valor padrão
        USDA_API_KEY = "your-usda-api-key"
        import warnings

        warnings.warn("USDA_API_KEY não definida. Usando valor padrão (apenas para desenvolvimento)")
    USDA_BASE_URL = "https://api.nal.usda.gov/fdc/v1"

    # Configurações de CORS
    # Ler CORS_ORIGINS do ambiente, com fallback para desenvolvimento
    cors_origins_str = os.environ.get("CORS_ORIGINS", "http://localhost:5174,http://localhost:3000,http://localhost:5173")
    CORS_ORIGINS = [origin.strip() for origin in cors_origins_str.split(",")]

    # Configurações de JWT
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", SECRET_KEY)
    JWT_ACCESS_TOKEN_EXPIRES = 7 * 24 * 60 * 60  # 7 dias em segundos
    JWT_REFRESH_TOKEN_EXPIRES = 30 * 24 * 60 * 60  # 30 dias em segundos

    # Configurações de rate limiting
    RATELIMIT_DEFAULT = "200 per day;50 per hour"
    RATELIMIT_STORAGE_URL = "memory://"

    # Configurações de cache
    CACHE_TYPE = "simple"
    CACHE_DEFAULT_TIMEOUT = 300

    # Configurações de paginação
    DEFAULT_PAGE_SIZE = 20
    MAX_PAGE_SIZE = 100

    # Configurações de upload
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB
    UPLOAD_FOLDER = "uploads"
    ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "pdf"}

    # Configurações de email
    MAIL_SERVER = os.environ.get("MAIL_SERVER", "smtp.gmail.com")
    MAIL_PORT = int(os.environ.get("MAIL_PORT", 587))
    MAIL_USE_TLS = os.environ.get("MAIL_USE_TLS", "true").lower() == "true"
    MAIL_USERNAME = os.environ.get("MAIL_USERNAME")
    MAIL_PASSWORD = os.environ.get("MAIL_PASSWORD")

    STRIPE_SECRET_KEY = os.environ.get("STRIPE_SECRET_KEY")
    STRIPE_PUBLISHABLE_KEY = os.environ.get("STRIPE_PUBLISHABLE_KEY")
    # Nota: Stripe keys são opcionais (usado apenas se configurado)
    if not STRIPE_SECRET_KEY and not DEBUG:
        import warnings

        warnings.warn("STRIPE_SECRET_KEY não definida. Pagamentos Stripe não estarão disponíveis")

    # Configurações de afiliados
    HOTMART_TOKEN = os.environ.get("HOTMART_TOKEN")
    KIWIFY_TOKEN = os.environ.get("KIWIFY_TOKEN")
    BRAIP_TOKEN = os.environ.get("BRAIP_TOKEN")

    OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
    if not OPENAI_API_KEY and not DEBUG:
        import warnings

        warnings.warn("OPENAI_API_KEY não definida. Funcionalidades de IA podem estar limitadas")
    AI_MODEL = os.environ.get("AI_MODEL", "gpt-3.5-turbo")

    # Configurações de monitoramento
    SENTRY_DSN = os.environ.get("SENTRY_DSN")
    GOOGLE_ANALYTICS_ID = os.environ.get("GOOGLE_ANALYTICS_ID")


class DevelopmentConfig(Config):
    """Configuração para desenvolvimento"""

    DEBUG = True
    LOG_LEVEL = "DEBUG"


class ProductionConfig(Config):
    """Configuração para produção"""

    DEBUG = False
    LOG_LEVEL = "WARNING"

    # Configurações de segurança para produção
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"


class TestingConfig(Config):
    """Configuração para testes"""

    TESTING = True
    DEBUG = True
    WTF_CSRF_ENABLED = False


# Dicionário de configurações
config = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "testing": TestingConfig,
    "default": DevelopmentConfig,
}


def get_config(config_name: Optional[str] = None):
    """Retorna a configuração baseada no ambiente"""
    if config_name is None:
        config_name = os.environ.get("FLASK_ENV", "default")

    return config.get(config_name, config["default"])
