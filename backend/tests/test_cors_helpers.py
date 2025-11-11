# -*- coding: utf-8 -*-
"""
Testes para helpers de CORS.

Verifica:
- get_allowed_origins() retorna origens corretas por ambiente
- is_origin_allowed() valida origens corretamente
- validate_origin_format() valida formato
"""
import pytest
import os
import sys
from pathlib import Path

# Adiciona o diretório src ao path
backend_dir = Path(__file__).parent.parent
src_dir = backend_dir / 'src'
sys.path.insert(0, str(src_dir))

from utils.cors_helpers import (
    get_allowed_origins,
    is_origin_allowed,
    validate_origin_format
)


class TestGetAllowedOrigins:
    """Testa get_allowed_origins()."""
    
    def test_development_defaults(self):
        """Testa origens padrão de desenvolvimento."""
        # Salva env atual
        old_env = os.environ.get('FLASK_ENV')
        old_cors = os.environ.get('CORS_ORIGINS')
        
        try:
            os.environ['FLASK_ENV'] = 'development'
            if 'CORS_ORIGINS' in os.environ:
                del os.environ['CORS_ORIGINS']
            
            origins = get_allowed_origins('development')
            
            # Verifica origens padrão
            assert 'http://localhost:5173' in origins
            assert 'http://localhost:3000' in origins
            assert 'http://localhost:9002' in origins
            
            # Verifica origens de produção sempre incluídas
            assert 'https://re-educa.topsupplementslab.com' in origins
            assert 'https://www.re-educa.topsupplementslab.com' in origins
            
        finally:
            # Restaura env
            if old_env:
                os.environ['FLASK_ENV'] = old_env
            elif 'FLASK_ENV' in os.environ:
                del os.environ['FLASK_ENV']
            
            if old_cors:
                os.environ['CORS_ORIGINS'] = old_cors
            elif 'CORS_ORIGINS' in os.environ:
                del os.environ['CORS_ORIGINS']
    
    def test_custom_origins_from_env(self):
        """Testa origens customizadas do .env."""
        # Salva env atual
        old_env = os.environ.get('FLASK_ENV')
        old_cors = os.environ.get('CORS_ORIGINS')
        
        try:
            os.environ['FLASK_ENV'] = 'development'
            os.environ['CORS_ORIGINS'] = 'https://custom1.com,https://custom2.com'
            
            origins = get_allowed_origins('development')
            
            assert 'https://custom1.com' in origins
            assert 'https://custom2.com' in origins
            
        finally:
            # Restaura env
            if old_env:
                os.environ['FLASK_ENV'] = old_env
            elif 'FLASK_ENV' in os.environ:
                del os.environ['FLASK_ENV']
            
            if old_cors:
                os.environ['CORS_ORIGINS'] = old_cors
            elif 'CORS_ORIGINS' in os.environ:
                del os.environ['CORS_ORIGINS']
    
    def test_production_always_included(self):
        """Testa que origens de produção sempre estão incluídas."""
        origins = get_allowed_origins('production')
        
        assert 'https://re-educa.topsupplementslab.com' in origins
        assert 'https://www.re-educa.topsupplementslab.com' in origins
        assert 'https://topsupplementslab.com' in origins


class TestIsOriginAllowed:
    """Testa is_origin_allowed()."""
    
    def test_exact_match(self):
        """Testa correspondência exata."""
        allowed = ['http://localhost:5173', 'https://example.com']
        
        assert is_origin_allowed('http://localhost:5173', allowed) is True
        assert is_origin_allowed('https://example.com', allowed) is True
        assert is_origin_allowed('http://localhost:3000', allowed) is False
    
    def test_subdomain_matching(self):
        """Testa correspondência de subdomínios."""
        # Testa subdomínios de topsupplementslab.com
        assert is_origin_allowed('https://re-educa.topsupplementslab.com') is True
        assert is_origin_allowed('https://www.re-educa.topsupplementslab.com') is True
        assert is_origin_allowed('https://topsupplementslab.com') is True
    
    def test_empty_origin(self):
        """Testa origem vazia."""
        assert is_origin_allowed('', []) is False
        assert is_origin_allowed(None, []) is False
    
    def test_uses_default_origins(self):
        """Testa que usa origens padrão se não fornecidas."""
        # Deve usar get_allowed_origins() internamente
        assert is_origin_allowed('http://localhost:5173') is True
        assert is_origin_allowed('http://evil.com') is False


class TestValidateOriginFormat:
    """Testa validate_origin_format()."""
    
    def test_valid_origins(self):
        """Testa origens válidas."""
        assert validate_origin_format('http://localhost:5173') is True
        assert validate_origin_format('https://example.com') is True
        assert validate_origin_format('https://example.com:8080') is True
    
    def test_invalid_origins(self):
        """Testa origens inválidas."""
        assert validate_origin_format('') is False
        assert validate_origin_format('localhost:5173') is False  # Sem http://
        assert validate_origin_format('http:// example.com') is False  # Com espaço
        assert validate_origin_format('http://example.com\n') is False  # Com newline
        assert validate_origin_format('ftp://example.com') is False  # Não é http/https
    
    def test_malformed_origins(self):
        """Testa origens malformadas."""
        assert validate_origin_format(None) is False
        assert validate_origin_format('   ') is False
        assert validate_origin_format('javascript:alert(1)') is False


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
