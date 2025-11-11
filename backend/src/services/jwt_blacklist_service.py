# -*- coding: utf-8 -*-
"""
Serviço de Blacklist JWT para RE-EDUCA Store.

Gerencia tokens JWT revogados usando Redis para alta performance.
Essencial para logout seguro e revogação de tokens comprometidos.
"""

import logging
from datetime import datetime, timedelta
from typing import Optional

from services.cache_service import cache_service

logger = logging.getLogger(__name__)


class JWTBlacklistService:
    """
    Serviço para gerenciar blacklist de tokens JWT revogados.
    
    Usa Redis como backend de armazenamento para:
    - Performance: Operações O(1)
    - TTL automático: Tokens expirados são removidos automaticamente
    - Distribuído: Funciona em múltiplas instâncias da aplicação
    """

    def __init__(self):
        """Inicializa o serviço de blacklist"""
        self.cache = cache_service
        self.prefix = "jwt:blacklist:"
        
    def revoke_token(self, token: str, expires_at: datetime) -> bool:
        """
        Adiciona token à blacklist.
        
        Args:
            token: Token JWT a ser revogado
            expires_at: Data de expiração do token
            
        Returns:
            bool: True se revogado com sucesso
        """
        try:
            # Calcula TTL baseado na expiração do token
            now = datetime.utcnow()
            ttl = int((expires_at - now).total_seconds())
            
            # Não adiciona se já expirou
            if ttl <= 0:
                logger.debug(f"Token já expirado, não adicionado à blacklist")
                return True
            
            # Adiciona à blacklist com TTL
            cache_key = f"{self.prefix}{token}"
            self.cache.set(
                cache_key,
                {
                    'revoked_at': now.isoformat(),
                    'expires_at': expires_at.isoformat()
                },
                ttl=ttl
            )
            
            logger.info(f"Token revogado com sucesso (TTL: {ttl}s)")
            return True
            
        except Exception as e:
            logger.error(f"Erro ao revogar token: {str(e)}", exc_info=True)
            return False
    
    def is_revoked(self, token: str) -> bool:
        """
        Verifica se token está na blacklist.
        
        Args:
            token: Token JWT a verificar
            
        Returns:
            bool: True se revogado
        """
        try:
            cache_key = f"{self.prefix}{token}"
            result = self.cache.get(cache_key)
            return result is not None
            
        except Exception as e:
            logger.error(f"Erro ao verificar blacklist: {str(e)}", exc_info=True)
            # Em caso de erro, por segurança, considera revogado
            return True
    
    def revoke_all_user_tokens(self, user_id: str, ttl: int = 86400) -> bool:
        """
        Revoga todos os tokens de um usuário.
        
        Útil quando:
        - Usuário muda senha
        - Usuário pede logout de todos dispositivos
        - Suspeita de comprometimento da conta
        
        Args:
            user_id: ID do usuário
            ttl: Tempo em segundos para manter na blacklist (padrão: 24h)
            
        Returns:
            bool: True se revogado com sucesso
        """
        try:
            cache_key = f"{self.prefix}user:{user_id}"
            self.cache.set(
                cache_key,
                {
                    'revoked_at': datetime.utcnow().isoformat(),
                    'all_tokens': True
                },
                ttl=ttl
            )
            
            logger.warning(f"Todos tokens do usuário {user_id} revogados")
            return True
            
        except Exception as e:
            logger.error(f"Erro ao revogar tokens do usuário: {str(e)}", exc_info=True)
            return False
    
    def is_user_revoked(self, user_id: str) -> bool:
        """
        Verifica se todos tokens do usuário foram revogados.
        
        Args:
            user_id: ID do usuário
            
        Returns:
            bool: True se todos tokens foram revogados
        """
        try:
            cache_key = f"{self.prefix}user:{user_id}"
            result = self.cache.get(cache_key)
            return result is not None
            
        except Exception as e:
            logger.error(f"Erro ao verificar revogação de usuário: {str(e)}", exc_info=True)
            return False
    
    def clear_expired(self) -> int:
        """
        Remove tokens expirados da blacklist.
        
        Nota: Redis faz isso automaticamente com TTL,
        mas este método pode ser usado para limpeza manual.
        
        Returns:
            int: Número de tokens removidos
        """
        try:
            # Redis remove automaticamente com TTL
            # Este método é principalmente para compatibilidade
            logger.debug("Limpeza de tokens expirados (Redis TTL automático)")
            return 0
            
        except Exception as e:
            logger.error(f"Erro ao limpar tokens expirados: {str(e)}", exc_info=True)
            return 0
    
    def get_stats(self) -> dict:
        """
        Retorna estatísticas da blacklist.
        
        Returns:
            dict: Estatísticas de uso
        """
        try:
            # Conta tokens na blacklist
            pattern = f"{self.prefix}*"
            keys = self.cache.keys(pattern) if hasattr(self.cache, 'keys') else []
            
            return {
                'total_revoked': len(keys),
                'prefix': self.prefix,
                'backend': 'redis'
            }
            
        except Exception as e:
            logger.error(f"Erro ao obter estatísticas: {str(e)}", exc_info=True)
            return {
                'total_revoked': 0,
                'error': str(e)
            }


# Instância global do serviço
jwt_blacklist_service = JWTBlacklistService()
