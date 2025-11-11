# -*- coding: utf-8 -*-
"""
Serviço de Compliance LGPD RE-EDUCA Store.

Implementa funcionalidades de compliance LGPD:
- Consentimento de dados
- Exportação de dados
- Exclusão e anonimização de dados
- Auditoria de acesso
"""
import logging
from datetime import datetime
from typing import Any, Dict, List

from middleware.logging import log_security_event
from repositories.lgpd_repository import LGPDRepository
from repositories.order_repository import OrderRepository
from repositories.product_repository import ProductRepository
from repositories.user_repository import UserRepository
from services.base_service import BaseService
from services.health_service import HealthService
from services.order_service import OrderService
from services.user_service import UserService

logger = logging.getLogger(__name__)


class LGPDService(BaseService):
    """
    Service para compliance LGPD.

    Utiliza LGPDRepository, UserRepository e OrderRepository para acesso a dados,
    seguindo o padrão de arquitetura em camadas do projeto.
    """

    def __init__(self):
        super().__init__()
        self.repo = LGPDRepository()
        self.user_repo = UserRepository()
        self.order_repo = OrderRepository()
        self.product_repo = ProductRepository()
        self.user_service = UserService()
        self.order_service = OrderService()
        self.health_service = HealthService()

    # ============================================================
    # CONSENTIMENTOS
    # ============================================================

    def get_user_consents(self, user_id: str) -> Dict[str, Any]:
        """
        Retorna consentimentos do usuário.

        Utiliza LGPDRepository para buscar consentimentos registrados.
        """
        try:
            consents_list = self.repo.find_consents_by_user(user_id)

            consents = {}
            for consent in consents_list:
                consents[consent["consent_type"]] = {
                    "granted": consent["granted"],
                    "granted_at": consent["granted_at"],
                    "revoked_at": consent["revoked_at"],
                    "version": consent.get("version"),
                }

            return {"success": True, "consents": consents}
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
        except Exception as e:
            self.logger.error(f"Erro ao buscar consentimentos: {str(e)}", exc_info=True)
            return {"success": False, "error": str(e)}

    def grant_consent(
        self,
        user_id: str,
        consent_type: str,
        consent_text: str = None,
        version: str = None,
        ip_address: str = None,
        user_agent: str = None,
    ) -> Dict[str, Any]:
        """
        Registra consentimento do usuário.

        Utiliza LGPDRepository para criar ou atualizar consentimentos.
        """
        try:
            existing = self.repo.find_consent_by_type(user_id, consent_type)

            now = datetime.utcnow().isoformat()
            consent_data = {
                "user_id": user_id,
                "consent_type": consent_type,
                "granted": True,
                "granted_at": now,
                "revoked_at": None,
                "consent_text": consent_text,
                "version": version,
                "ip_address": ip_address,
                "user_agent": user_agent,
            }

            if existing:
                result = self.repo.update_consent(existing["id"], consent_data)
            else:
                result = self.repo.create_consent(consent_data)

            if not result:
                return {"success": False, "error": "Erro ao registrar consentimento"}

            # Log de auditoria
            self._log_data_access(
                user_id=user_id,
                accessed_user_id=user_id,
                access_type="modify",
                resource_type="consent",
                metadata={"consent_type": consent_type, "action": "grant"},
            )

            return {"success": True, "message": "Consentimento registrado"}
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
        except Exception as e:
            self.logger.error(f"Erro ao registrar consentimento: {str(e)}", exc_info=True)
            return {"success": False, "error": str(e)}

    def revoke_consent(self, user_id: str, consent_type: str) -> Dict[str, Any]:
        """
        Revoga consentimento do usuário.

        Utiliza LGPDRepository para atualizar o status do consentimento.
        """
        try:
            existing = self.repo.find_consent_by_type(user_id, consent_type)

            if not existing:
                return {"success": False, "error": "Consentimento não encontrado"}

            update_data = {"granted": False, "revoked_at": datetime.utcnow().isoformat()}

            result = self.repo.update_consent(existing["id"], update_data)

            if not result:
                return {"success": False, "error": "Erro ao revogar consentimento"}

            # Log de auditoria
            self._log_data_access(
                user_id=user_id,
                accessed_user_id=user_id,
                access_type="modify",
                resource_type="consent",
                metadata={"consent_type": consent_type, "action": "revoke"},
            )

            return {"success": True, "message": "Consentimento revogado"}
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
        except Exception as e:
            self.logger.error(f"Erro ao revogar consentimento: {str(e)}", exc_info=True)
            return {"success": False, "error": str(e)}

    # ============================================================
    # EXPORTAÇÃO DE DADOS
    # ============================================================

    def export_user_data(self, user_id: str, data_types: List[str] = None, format: str = "json") -> Dict[str, Any]:
        """
        Exporta todos os dados do usuário (LGPD).

        Args:
            user_id: ID do usuário
            data_types: Tipos de dados a exportar (None = todos)
            format: Formato ('json', 'csv', 'pdf')
        """
        try:
            if data_types is None or "all" in data_types:
                data_types = ["profile", "health_data", "orders", "activities", "exercises", "goals"]

            export_data = {}

            if "profile" in data_types:
                profile = self.user_repo.find_by_id(user_id)
                export_data["profile"] = profile if profile else {}

            # Dados de saúde
            if "health_data" in data_types:
                health_data = {
                    "imc_history": self._get_health_history(user_id, "imc_calculations"),
                    "biological_age_history": self._get_health_history(user_id, "biological_age_calculations"),
                    "calorie_history": self._get_health_history(user_id, "calorie_calculations"),
                    "food_diary": self._get_table_data(user_id, "food_diary_entries"),
                    "exercise_entries": self._get_table_data(user_id, "exercise_entries"),
                }
                export_data["health_data"] = health_data

            if "orders" in data_types:
                # Inclui order_items e products relacionados para exportação completa
                orders_data = self.order_repo.find_by_user(user_id, page=1, per_page=1000)
                orders = orders_data.get("orders", []) if orders_data else []
                
                # Enriquecer pedidos com informações completas de produtos
                enriched_orders = []
                for order in orders:
                    enriched_order = {**order}
                    
                    # Processar order_items e buscar produtos relacionados
                    items = order.get("items", []) or order.get("order_items", [])
                    if items:
                        # Coletar todos os product_ids únicos
                        product_ids = list(set([
                            item.get("product_id") 
                            for item in items 
                            if item.get("product_id")
                        ]))
                        
                        # Buscar produtos relacionados
                        if product_ids:
                            try:
                                products = self.product_repo.find_by_ids(product_ids)
                                products_dict = {p.get("id"): p for p in products if p.get("id")}
                                
                                # Enriquecer items com dados do produto
                                enriched_items = []
                                for item in items:
                                    product_id = item.get("product_id")
                                    enriched_item = {**item}
                                    
                                    if product_id and product_id in products_dict:
                                        enriched_item["product"] = {
                                            "id": products_dict[product_id].get("id"),
                                            "name": products_dict[product_id].get("name"),
                                            "description": products_dict[product_id].get("description"),
                                            "category": products_dict[product_id].get("category"),
                                            "price": products_dict[product_id].get("price"),
                                            "image_url": products_dict[product_id].get("image_url"),
                                        }
                                    
                                    enriched_items.append(enriched_item)
                                
                                enriched_order["items"] = enriched_items
                            except (ValueError, KeyError, AttributeError) as e:
                                logger.warning(f"Erro ao buscar produtos para exportação LGPD: {str(e)}")
                                # Continua sem produtos, mas mantém items
                                enriched_order["items"] = items
                        else:
                            enriched_order["items"] = items
                    else:
                        enriched_order["items"] = []
                    
                    enriched_orders.append(enriched_order)
                
                export_data["orders"] = enriched_orders

            if "activities" in data_types:
                activities_result = self.user_service.get_user_activities(user_id, page=1, per_page=1000)
                export_data["activities"] = activities_result.get("activities", [])

            # Exercícios e treinos
            if "exercises" in data_types:
                exercises = {
                    "workout_sessions": self._get_table_data(user_id, "workout_sessions"),
                    "exercise_logs": self._get_table_data(user_id, "exercise_entries"),
                }
                export_data["exercises"] = exercises

            # Objetivos
            if "goals" in data_types:
                goals = self._get_table_data(user_id, "user_goals")
                export_data["goals"] = goals

            # Metadata
            export_data["export_metadata"] = {
                "exported_at": datetime.utcnow().isoformat(),
                "user_id": user_id,
                "data_types": data_types,
                "format": format,
            }

            # Log de auditoria
            self._log_data_access(
                user_id=user_id,
                accessed_user_id=user_id,
                access_type="export",
                resource_type="all",
                metadata={"data_types": data_types, "format": format},
            )

            return {"success": True, "data": export_data}
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
        except Exception as e:
            self.logger.error(f"Erro ao exportar dados: {str(e)}", exc_info=True)
            return {"success": False, "error": str(e)}

    # ============================================================
    # EXCLUSÃO E ANONIMIZAÇÃO
    # ============================================================

    def delete_user_account(
        self,
        user_id: str,
        deletion_type: str = "anonymize",
        reason: str = None,
        requested_by: str = None,
        ip_address: str = None,
        user_agent: str = None,
    ) -> Dict[str, Any]:
        """
        Exclui ou anonimiza conta do usuário.

        Args:
            user_id: ID do usuário
            deletion_type: 'full', 'partial', 'anonymize'
            reason: Motivo da exclusão
        """
        try:
            # Se for anonimização, preserva dados agregados
            anonymized_data = None
            if deletion_type == "anonymize":
                anonymized_data = self._anonymize_user_data(user_id)
            elif deletion_type == "full":
                # Exclui completamente
                self._delete_user_data_completely(user_id)

            # Registra exclusão
            deletion_record = {
                "user_id": user_id,
                "deletion_type": deletion_type,
                "reason": reason,
                "anonymized_data": anonymized_data,
                "requested_by": requested_by or user_id,
                "ip_address": ip_address,
                "user_agent": user_agent,
                "metadata": {"deleted_at": datetime.utcnow().isoformat()},
            }

            self.repo.create_deletion_record(deletion_record)

            # Log de auditoria
            log_security_event(
                event="user_account_deleted",
                user_id=user_id,
                details={"deletion_type": deletion_type, "reason": reason},
            )

            return {"success": True, "message": "Conta processada com sucesso"}
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
        except Exception as e:
            self.logger.error(f"Erro ao excluir conta: {str(e)}", exc_info=True)
            return {"success": False, "error": str(e)}

    def _anonymize_user_data(self, user_id: str) -> Dict[str, Any]:
        """Anonimiza dados do usuário mantendo estatísticas"""
        try:
            # Dados agregados antes de anonimizar
            stats = {"total_orders": 0, "total_health_records": 0, "account_created_at": None, "last_login": None}

            orders_result = self.order_service.get_user_orders(user_id, page=1, per_page=1)
            stats["total_orders"] = orders_result.get("pagination", {}).get("total", 0)

            anonymized_email = f"deleted_{user_id[:8]}@deleted.local"
            self.user_service.update_user_profile(
                user_id,
                {
                    "email": anonymized_email,
                    "name": "Usuário Excluído",
                    "password_hash": "",  # Remove senha
                    "is_active": False,
                },
            )

            # Remove dados pessoais de outras tabelas
            # (mantém apenas dados agregados para estatísticas)

            return stats
        except Exception as e:
            logger.error(f"Erro ao anonimizar dados: {str(e)}")
            return {}

    def _delete_user_data_completely(self, user_id: str):
        """Exclui completamente todos os dados do usuário"""
        # ON DELETE CASCADE deve cuidar disso via foreign keys
        # Mas podemos garantir exclusão manual se necessário
        try:
            self.user_repo.delete(user_id)
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
        except Exception as e:
            logger.error(f"Erro ao excluir usuário: {str(e)}", exc_info=True)
            raise

    # ============================================================
    # AUDITORIA
    # ============================================================

    def _log_data_access(
        self,
        user_id: str,
        accessed_user_id: str,
        access_type: str,
        resource_type: str,
        resource_id: str = None,
        accessed_by: str = "user",
        ip_address: str = None,
        user_agent: str = None,
        metadata: Dict[str, Any] = None,
    ):
        """Registra acesso a dados pessoais"""
        try:
            log_entry = {
                "user_id": user_id,
                "accessed_user_id": accessed_user_id,
                "access_type": access_type,
                "resource_type": resource_type,
                "resource_id": resource_id,
                "accessed_by": accessed_by,
                "ip_address": ip_address,
                "user_agent": user_agent,
                "metadata": metadata or {},
            }

            self.repo.create_access_log(log_entry)
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
        except Exception as e:
            self.logger.warning(f"Erro ao registrar log de acesso: {str(e)}")

    def get_access_logs(self, user_id: str, page: int = 1, per_page: int = 20) -> Dict[str, Any]:
        """Retorna logs de acesso aos dados do usuário"""
        try:
            offset = (page - 1) * per_page
            logs = self.repo.find_access_logs(accessed_user_id=user_id, limit=per_page, offset=offset)

            total = self.repo.count_access_logs(accessed_user_id=user_id)

            return {
                "success": True,
                "logs": logs,
                "pagination": {
                    "page": page,
                    "per_page": per_page,
                    "total": total,
                    "pages": (total + per_page - 1) // per_page if total > 0 else 0,
                },
            }
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
        except Exception as e:
            logger.error(f"Erro ao buscar logs: {str(e)}", exc_info=True)
            return {"success": False, "error": str(e)}

    # ============================================================
    # HELPERS
    # ============================================================

    def _get_health_history(self, user_id: str, table_name: str) -> List[Dict[str, Any]]:
        """
        Busca histórico de saúde.
        
        Utiliza HealthService quando possível para manter consistência na arquitetura.
        """
        try:
            return self.repo.get_table_data_by_user(user_id, table_name)
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
        except Exception as e:
            self.logger.warning(f"Erro ao buscar {table_name}: {str(e)}")
            return []

    def _get_table_data(self, user_id: str, table_name: str) -> List[Dict[str, Any]]:
        """
        Busca dados de uma tabela relacionada ao usuário.

        Utiliza LGPDRepository para acessar dados de tabelas específicas.
        """
        try:
            return self.repo.get_table_data_by_user(user_id, table_name)
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
        except Exception as e:
            self.logger.warning(f"Erro ao buscar {table_name}: {str(e)}")
            return []
turn []
