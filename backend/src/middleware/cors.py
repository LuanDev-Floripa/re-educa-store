"""
Middleware CORS para RE-EDUCA Store
"""
import os
from flask import Flask
from flask_cors import CORS

def setup_cors(app: Flask):
    """Configura CORS para a aplicação"""
    
    # Obter origens permitidas do .env ou usar padrões
    cors_origins = os.getenv('CORS_ORIGINS', '').split(',')
    
    # Adicionar origens do Cloudflare
    default_origins = [
        'http://localhost:9002',
        'http://localhost:3000',
        'http://localhost:5173',
        'https://re-educa.topsupplementslab.com',
        'https://re-educa-store.pages.dev'
    ]
    
    # Combinar origens
    all_origins = list(set(cors_origins + default_origins))
    all_origins = [origin.strip() for origin in all_origins if origin.strip()]
    
    # Configuração CORS
    CORS(app, 
         origins=all_origins,
         methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD', 'PATCH'],
         allow_headers=['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
         supports_credentials=True,
         max_age=3600)
    
    # Headers de segurança adicionais
    @app.after_request
    def add_security_headers(response):
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        return response