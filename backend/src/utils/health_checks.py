# -*- coding: utf-8 -*-
"""
Health Checks RE-EDUCA Store.

Implementa health checks completos para monitoramento.
"""
import logging
from datetime import datetime
from typing import Any, Dict

from config.database import supabase_client, test_db_connection
from services.cache_service import cache_service

logger = logging.getLogger(__name__)


class HealthCheckService:
    """Service para health checks"""

    def __init__(self):
        self.checks = {"database": self._check_database, "cache": self._check_cache, "supabase": self._check_supabase}

    def perform_health_check(self, checks: list = None) -> Dict[str, Any]:
        """
        Realiza health check completo.

        Args:
            checks: Lista de checks a executar (None = todos)

        Returns:
            Dict com status de cada check
        """
        if checks is None:
            checks = list(self.checks.keys())

        results = {"status": "healthy", "timestamp": datetime.utcnow().isoformat(), "checks": {}}

        overall_healthy = True

        for check_name in checks:
            if check_name in self.checks:
                try:
                    check_result = self.checks[check_name]()
                    results["checks"][check_name] = check_result
                    if not check_result.get("healthy", False):
                        overall_healthy = False
                except (ValueError, KeyError) as e:
                    logger.warning(f"Erro de validação: {str(e)}")
                    # Tratamento específico pode ser adicionado aqui
                except Exception as e:
                    logger.error(f"Erro ao executar health check {check_name}: {str(e)}", exc_info=True)
                    results["checks"][check_name] = {"healthy": False, "error": str(e)}
                    overall_healthy = False

        results["status"] = "healthy" if overall_healthy else "degraded"
        return results

    def _check_database(self) -> Dict[str, Any]:
        """Verifica saúde do banco de dados"""
        try:
            start = datetime.utcnow()
            is_connected = test_db_connection()
            duration_ms = (datetime.utcnow() - start).total_seconds() * 1000

            return {
                "healthy": is_connected,
                "response_time_ms": round(duration_ms, 2),
                "timestamp": datetime.utcnow().isoformat(),
            }
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
            # Deixar Exception genérico tratar abaixo
        except Exception as e:
            return {"healthy": False, "error": str(e)}

    def _check_cache(self) -> Dict[str, Any]:
        """Verifica saúde do cache (Redis)"""
        try:
            is_available = cache_service.is_available() if cache_service else False

            if is_available:
                # Testa operação de ping
                start = datetime.utcnow()
                cache_service.redis_client.ping()
                duration_ms = (datetime.utcnow() - start).total_seconds() * 1000

                return {"healthy": True, "response_time_ms": round(duration_ms, 2), "type": "redis"}
            else:
                return {
                    "healthy": True,  # Cache não é crítico
                    "type": "memory",
                    "note": "Redis não disponível, usando cache em memória",
                }
        except Exception as e:
            return {"healthy": True, "error": str(e), "type": "unavailable"}  # Não crítico

    def _check_supabase(self) -> Dict[str, Any]:
        """Verifica saúde do Supabase"""
        try:
            start = datetime.utcnow()
            # NOTA: Acesso direto ao Supabase é legítimo aqui para health checks
            # que precisam testar a conexão diretamente sem passar por camadas de abstração
            supabase_client.table("users").select("id").limit(1).execute()
            duration_ms = (datetime.utcnow() - start).total_seconds() * 1000

            return {
                "healthy": True,
                "response_time_ms": round(duration_ms, 2),
                "timestamp": datetime.utcnow().isoformat(),
            }
        except Exception as e:
            return {"healthy": False, "error": str(e)}


# Instância global
health_check_service = HealthCheckService()
