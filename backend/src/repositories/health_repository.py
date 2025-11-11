"""
Repositório de Saúde RE-EDUCA Store.

Gerencia acesso a dados relacionados à saúde do usuário.
"""

import logging
from typing import Any, Dict, List, Optional

from repositories.base_repository import BaseRepository

logger = logging.getLogger(__name__)


class HealthRepository(BaseRepository):
    """
    Repositório para operações com dados de saúde.

    Tabelas:
    - health_calculations
    - biological_age_calculations
    - hydration_calculations
    - body_fat_history
    - etc.
    """

    def __init__(self):
        """Inicializa o repositório de saúde."""
        super().__init__("health_calculations")  # Tabela padrão

    def create_biological_age_calculation(self, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Cria cálculo de idade biológica.

        Args:
            data: Dados do cálculo

        Returns:
            Cálculo criado ou None
        """
        try:
            # Usa tabela específica
            result = self.db.table("biological_age_calculations").insert(data).execute()
            if result.data and len(result.data) > 0:
                return result.data[0]
            return None
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao criar cálculo de idade biológica: {str(e)}", exc_info=True)
            return None

    def create_hydration_calculation(self, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Cria cálculo de hidratação.

        Args:
            data: Dados do cálculo

        Returns:
            Cálculo criado ou None
        """
        try:
            # Usa tabela específica
            result = self.db.table("hydration_calculations").insert(data).execute()
            if result.data and len(result.data) > 0:
                return result.data[0]
            return None
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao criar cálculo de hidratação: {str(e)}", exc_info=True)
            return None

    def create_metabolism_calculation(self, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Cria cálculo de metabolismo na tabela específica.

        Args:
            data: Dados do cálculo

        Returns:
            Cálculo criado ou None
        """
        try:
            result = self.db.table("metabolism_calculations").insert(data).execute()
            if result.data and len(result.data) > 0:
                return result.data[0]
            return None
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao criar cálculo de metabolismo: {str(e)}", exc_info=True)
            return None

    def create_sleep_calculation(self, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Cria cálculo de sono na tabela específica.

        Args:
            data: Dados do cálculo

        Returns:
            Cálculo criado ou None
        """
        try:
            result = self.db.table("sleep_calculations").insert(data).execute()
            if result.data and len(result.data) > 0:
                return result.data[0]
            return None
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao criar cálculo de sono: {str(e)}", exc_info=True)
            return None

    def create_stress_calculation(self, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Cria cálculo de estresse na tabela específica.

        Args:
            data: Dados do cálculo

        Returns:
            Cálculo criado ou None
        """
        try:
            result = self.db.table("stress_calculations").insert(data).execute()
            if result.data and len(result.data) > 0:
                return result.data[0]
            return None
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao criar cálculo de estresse: {str(e)}", exc_info=True)
            return None

    def get_metabolism_history(
        self,
        user_id: str,
        page: int = 1,
        per_page: int = 20,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Retorna histórico de cálculos de metabolismo da tabela específica."""
        try:
            offset = (page - 1) * per_page
            query = self.db.table("metabolism_calculations").select("*").eq("user_id", user_id)
            if start_date:
                query = query.gte("created_at", start_date)
            if end_date:
                query = query.lte("created_at", end_date)
            result = query.order("created_at", desc=True).range(offset, offset + per_page - 1).execute()
            entries = result.data if result.data else []
            count_query = self.db.table("metabolism_calculations").select("id", count="exact").eq("user_id", user_id)
            if start_date:
                count_query = count_query.gte("created_at", start_date)
            if end_date:
                count_query = count_query.lte("created_at", end_date)
            count_result = count_query.execute()
            total = count_result.count if hasattr(count_result, "count") else len(entries)
            return {
                "entries": entries,
                "pagination": {
                    "page": page,
                    "per_page": per_page,
                    "total": total,
                    "pages": (total + per_page - 1) // per_page if total > 0 else 0,
                },
            }
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar histórico de metabolismo: {str(e)}", exc_info=True)
            return {"entries": [], "pagination": {"page": page, "per_page": per_page, "total": 0, "pages": 0}}

    def get_sleep_history(
        self,
        user_id: str,
        page: int = 1,
        per_page: int = 20,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Retorna histórico de cálculos de sono da tabela específica."""
        try:
            offset = (page - 1) * per_page
            query = self.db.table("sleep_calculations").select("*").eq("user_id", user_id)
            if start_date:
                query = query.gte("created_at", start_date)
            if end_date:
                query = query.lte("created_at", end_date)
            result = query.order("created_at", desc=True).range(offset, offset + per_page - 1).execute()
            entries = result.data if result.data else []
            count_query = self.db.table("sleep_calculations").select("id", count="exact").eq("user_id", user_id)
            if start_date:
                count_query = count_query.gte("created_at", start_date)
            if end_date:
                count_query = count_query.lte("created_at", end_date)
            count_result = count_query.execute()
            total = count_result.count if hasattr(count_result, "count") else len(entries)
            return {
                "entries": entries,
                "pagination": {
                    "page": page,
                    "per_page": per_page,
                    "total": total,
                    "pages": (total + per_page - 1) // per_page if total > 0 else 0,
                },
            }
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar histórico de sono: {str(e)}", exc_info=True)
            return {"entries": [], "pagination": {"page": page, "per_page": per_page, "total": 0, "pages": 0}}

    def get_stress_history(
        self,
        user_id: str,
        page: int = 1,
        per_page: int = 20,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Retorna histórico de cálculos de estresse da tabela específica."""
        try:
            offset = (page - 1) * per_page
            query = self.db.table("stress_calculations").select("*").eq("user_id", user_id)
            if start_date:
                query = query.gte("created_at", start_date)
            if end_date:
                query = query.lte("created_at", end_date)
            result = query.order("created_at", desc=True).range(offset, offset + per_page - 1).execute()
            entries = result.data if result.data else []
            count_query = self.db.table("stress_calculations").select("id", count="exact").eq("user_id", user_id)
            if start_date:
                count_query = count_query.gte("created_at", start_date)
            if end_date:
                count_query = count_query.lte("created_at", end_date)
            count_result = count_query.execute()
            total = count_result.count if hasattr(count_result, "count") else len(entries)
            return {
                "entries": entries,
                "pagination": {
                    "page": page,
                    "per_page": per_page,
                    "total": total,
                    "pages": (total + per_page - 1) // per_page if total > 0 else 0,
                },
            }
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar histórico de estresse: {str(e)}", exc_info=True)
            return {"entries": [], "pagination": {"page": page, "per_page": per_page, "total": 0, "pages": 0}}

    def find_by_user_and_type(
        self, user_id: str, calculation_type: str, limit: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Busca cálculos por usuário e tipo.

        Args:
            user_id: ID do usuário
            calculation_type: Tipo de cálculo
            limit: Limite de resultados

        Returns:
            Lista de cálculos
        """
        try:
            filters = {"user_id": user_id, "calculation_type": calculation_type}
            return self.find_all(filters=filters, order_by="created_at", desc=True, limit=limit)
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar cálculos: {str(e)}", exc_info=True)
            return []

    def create_health_calculation(self, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Cria registro de cálculo de saúde na tabela principal.

        Args:
            data: Dados do cálculo

        Returns:
            Cálculo criado ou None
        """
        try:
            from datetime import datetime

            from utils.helpers import generate_uuid

            if "id" not in data:
                data["id"] = generate_uuid()
            if "created_at" not in data:
                data["created_at"] = datetime.now().isoformat()

            return self.create(data)
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao criar cálculo de saúde: {str(e)}", exc_info=True)
            return None

    def create_imc_history(self, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Cria registro de histórico de IMC."""
        try:
            from datetime import datetime

            from utils.helpers import generate_uuid

            if "id" not in data:
                data["id"] = generate_uuid()
            if "calculated_at" not in data:
                data["calculated_at"] = datetime.now().isoformat()

            result = self.db.table("imc_history").insert(data).execute()
            return result.data[0] if result.data and len(result.data) > 0 else None
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.warning(f"Tabela imc_history pode não existir ou erro ao inserir: {str(e)}")
            return None

    def create_calories_history(self, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Cria registro de histórico de calorias."""
        try:
            from datetime import datetime

            from utils.helpers import generate_uuid

            if "id" not in data:
                data["id"] = generate_uuid()
            if "calculated_at" not in data:
                data["calculated_at"] = datetime.now().isoformat()

            result = self.db.table("calories_history").insert(data).execute()
            return result.data[0] if result.data and len(result.data) > 0 else None
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.warning(f"Tabela calories_history pode não existir ou erro ao inserir: {str(e)}")
            return None

    def create_hydration_history(self, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Cria registro de histórico de hidratação."""
        try:
            from datetime import datetime

            from utils.helpers import generate_uuid

            if "id" not in data:
                data["id"] = generate_uuid()
            if "calculated_at" not in data:
                data["calculated_at"] = datetime.now().isoformat()

            result = self.db.table("hydration_history").insert(data).execute()
            return result.data[0] if result.data and len(result.data) > 0 else None
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.warning(f"Tabela hydration_history pode não existir ou erro ao inserir: {str(e)}")
            return None

    def create_body_fat_history(self, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Cria registro de histórico de gordura corporal."""
        try:
            from datetime import datetime

            from utils.helpers import generate_uuid

            if "id" not in data:
                data["id"] = generate_uuid()
            if "calculated_at" not in data:
                data["calculated_at"] = datetime.now().isoformat()

            result = self.db.table("body_fat_history").insert(data).execute()
            return result.data[0] if result.data and len(result.data) > 0 else None
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.warning(f"Tabela body_fat_history pode não existir ou erro ao inserir: {str(e)}")
            return None

    def save_imc_calculation(self, user_id: str, calculation_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Salva cálculo de IMC usando create_imc_history."""
        return self.create_imc_history({"user_id": user_id, **calculation_data})

    def save_calorie_calculation(self, user_id: str, calculation_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Salva cálculo de calorias usando create_calories_history."""
        return self.create_calories_history({"user_id": user_id, **calculation_data})

    def save_calculation(
        self, calculation_type: str, user_id: str, entry_data: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """
        Salva cálculo genérico na tabela health_calculations.

        Args:
            calculation_type: Tipo de cálculo (metabolism, sleep, stress, etc)
            user_id: ID do usuário
            entry_data: Dados do cálculo

        Returns:
            Cálculo criado ou None
        """
        try:
            from datetime import datetime

            from utils.helpers import generate_uuid

            calculation_data = {
                "id": generate_uuid(),
                "user_id": user_id,
                "calculation_type": calculation_type,
                "input_data": entry_data,
                "result_data": entry_data,
                "created_at": datetime.now().isoformat(),
            }

            return self.create_health_calculation(calculation_data)
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao salvar cálculo {calculation_type}: {str(e)}", exc_info=True)
            return None

    def get_calculation_history(
        self,
        calculation_type: str,
        user_id: str,
        page: int = 1,
        per_page: int = 20,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Retorna histórico de cálculos filtrado por tipo.

        Args:
            calculation_type: Tipo de cálculo
            user_id: ID do usuário
            page: Página
            per_page: Itens por página
            start_date: Data inicial (opcional)
            end_date: Data final (opcional)

        Returns:
            Dict com histórico paginado
        """
        try:
            query = self.db.table("health_calculations").select("*")
            query = query.eq("user_id", user_id).eq("calculation_type", calculation_type)

            if start_date:
                query = query.gte("created_at", start_date)
            if end_date:
                query = query.lte("created_at", end_date)

            query = query.order("created_at", desc=True)

            # Paginação
            offset = (page - 1) * per_page
            query = query.range(offset, offset + per_page - 1)

            result = query.execute()
            entries = result.data if result.data else []

            # Conta total
            count_query = self.db.table("health_calculations").select("id", count="exact")
            count_query = count_query.eq("user_id", user_id).eq("calculation_type", calculation_type)
            if start_date:
                count_query = count_query.gte("created_at", start_date)
            if end_date:
                count_query = count_query.lte("created_at", end_date)

            count_result = count_query.execute()
            total = count_result.count if hasattr(count_result, "count") else len(entries)

            return {
                "entries": entries,
                "pagination": {
                    "page": page,
                    "per_page": per_page,
                    "total": total,
                    "pages": (total + per_page - 1) // per_page,
                },
            }
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar histórico de {calculation_type}: {str(e)}", exc_info=True)
            return {"entries": [], "pagination": {"page": page, "per_page": per_page, "total": 0, "pages": 0}}

    def save_goal(self, user_id: str, goal_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Salva meta de saúde do usuário."""
        try:
            from datetime import datetime

            from utils.helpers import generate_uuid

            if "id" not in goal_data:
                goal_data["id"] = generate_uuid()
            if "user_id" not in goal_data:
                goal_data["user_id"] = user_id
            if "created_at" not in goal_data:
                goal_data["created_at"] = datetime.now().isoformat()

            result = self.db.table("health_goals").insert(goal_data).execute()
            return result.data[0] if result.data and len(result.data) > 0 else None
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.warning(f"Tabela health_goals pode não existir ou erro ao inserir: {str(e)}")
            return None

    def get_imc_history(self, user_id: str, page: int = 1, per_page: int = 20) -> Dict[str, Any]:
        """Retorna histórico de IMC do usuário com paginação."""
        try:
            offset = (page - 1) * per_page

            result = (
                self.db.table("imc_history")
                .select("*")
                .eq("user_id", user_id)
                .order("calculated_at", desc=True)
                .range(offset, offset + per_page - 1)
                .execute()
            )

            entries = result.data if result.data else []

            # Conta total
            count_result = self.db.table("imc_history").select("id", count="exact").eq("user_id", user_id).execute()
            total = count_result.count if hasattr(count_result, "count") else len(entries)

            return {
                "entries": entries,
                "pagination": {
                    "page": page,
                    "per_page": per_page,
                    "total": total,
                    "pages": (total + per_page - 1) // per_page if total > 0 else 0,
                },
            }
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar histórico de IMC: {str(e)}", exc_info=True)
            return {"entries": [], "pagination": {"page": page, "per_page": per_page, "total": 0, "pages": 0}}

    def get_calorie_history(self, user_id: str, page: int = 1, per_page: int = 20) -> Dict[str, Any]:
        """Retorna histórico de calorias do usuário com paginação."""
        try:
            offset = (page - 1) * per_page

            result = (
                self.db.table("calories_history")
                .select("*")
                .eq("user_id", user_id)
                .order("calculated_at", desc=True)
                .range(offset, offset + per_page - 1)
                .execute()
            )

            entries = result.data if result.data else []

            # Conta total
            count_result = (
                self.db.table("calories_history").select("id", count="exact").eq("user_id", user_id).execute()
            )
            total = count_result.count if hasattr(count_result, "count") else len(entries)

            return {
                "entries": entries,
                "pagination": {
                    "page": page,
                    "per_page": per_page,
                    "total": total,
                    "pages": (total + per_page - 1) // per_page if total > 0 else 0,
                },
            }
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar histórico de calorias: {str(e)}", exc_info=True)
            return {"entries": [], "pagination": {"page": page, "per_page": per_page, "total": 0, "pages": 0}}

    def add_exercise_entry(self, user_id: str, entry_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Adiciona entrada de exercício."""
        try:
            result = self.db.table("exercise_entries").insert(entry_data).execute()
            return result.data[0] if result.data and len(result.data) > 0 else None
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.warning(f"Tabela exercise_entries pode não existir ou erro ao inserir: {str(e)}")
            return None

    def get_health_goals(self, user_id: str) -> List[Dict[str, Any]]:
        """Retorna metas de saúde do usuário."""
        try:
            result = (
                self.db.table("health_goals")
                .select("*")
                .eq("user_id", user_id)
                .order("created_at", desc=True)
                .execute()
            )
            return result.data if result.data else []
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.warning(f"Erro ao buscar metas de saúde: {str(e)}")
            return []

    def get_biological_age_history(
        self,
        user_id: str,
        page: int = 1,
        per_page: int = 20,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Retorna histórico de cálculos de idade biológica da tabela específica.

        Args:
            user_id: ID do usuário
            page: Página
            per_page: Itens por página
            start_date: Data inicial (opcional)
            end_date: Data final (opcional)

        Returns:
            Dict com histórico paginado
        """
        try:
            offset = (page - 1) * per_page

            query = self.db.table("biological_age_calculations").select("*").eq("user_id", user_id)

            if start_date:
                query = query.gte("created_at", start_date)
            if end_date:
                query = query.lte("created_at", end_date)

            result = query.order("created_at", desc=True).range(offset, offset + per_page - 1).execute()

            entries = result.data if result.data else []

            # Conta total
            count_query = (
                self.db.table("biological_age_calculations").select("id", count="exact").eq("user_id", user_id)
            )
            if start_date:
                count_query = count_query.gte("created_at", start_date)
            if end_date:
                count_query = count_query.lte("created_at", end_date)

            count_result = count_query.execute()
            total = count_result.count if hasattr(count_result, "count") else len(entries)

            return {
                "entries": entries,
                "pagination": {
                    "page": page,
                    "per_page": per_page,
                    "total": total,
                    "pages": (total + per_page - 1) // per_page if total > 0 else 0,
                },
            }
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar histórico de idade biológica: {str(e)}", exc_info=True)
            return {"entries": [], "pagination": {"page": page, "per_page": per_page, "total": 0, "pages": 0}}

    def get_hydration_history(
        self,
        user_id: str,
        page: int = 1,
        per_page: int = 20,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Retorna histórico de cálculos de hidratação da tabela específica.

        Args:
            user_id: ID do usuário
            page: Página
            per_page: Itens por página
            start_date: Data inicial (opcional)
            end_date: Data final (opcional)

        Returns:
            Dict com histórico paginado
        """
        try:
            offset = (page - 1) * per_page

            query = self.db.table("hydration_calculations").select("*").eq("user_id", user_id)

            if start_date:
                query = query.gte("created_at", start_date)
            if end_date:
                query = query.lte("created_at", end_date)

            result = query.order("created_at", desc=True).range(offset, offset + per_page - 1).execute()

            entries = result.data if result.data else []

            # Conta total
            count_query = self.db.table("hydration_calculations").select("id", count="exact").eq("user_id", user_id)
            if start_date:
                count_query = count_query.gte("created_at", start_date)
            if end_date:
                count_query = count_query.lte("created_at", end_date)

            count_result = count_query.execute()
            total = count_result.count if hasattr(count_result, "count") else len(entries)

            return {
                "entries": entries,
                "pagination": {
                    "page": page,
                    "per_page": per_page,
                    "total": total,
                    "pages": (total + per_page - 1) // per_page if total > 0 else 0,
                },
            }
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar histórico de hidratação: {str(e)}", exc_info=True)
            return {"entries": [], "pagination": {"page": page, "per_page": per_page, "total": 0, "pages": 0}}

    def get_food_entries(
        self, user_id: str, date: Optional[str] = None, page: int = 1, per_page: int = 20
    ) -> Dict[str, Any]:
        """
        Retorna entradas do diário alimentar com paginação.

        Retorna dict com paginação completa incluindo metadados.

        Args:
            user_id: ID do usuário
            date: Data para filtrar (opcional, formato YYYY-MM-DD)
            page: Página
            per_page: Itens por página

        Returns:
            Dict com 'entries' (lista) e 'pagination' (metadados)
        """
        try:
            offset = (page - 1) * per_page

            # Query base
            query = self.db.table("food_diary_entries").select("*").eq("user_id", user_id)

            if date:
                query = query.eq("consumed_at", date)

            # Buscar total de registros (para paginação)
            count_query = self.db.table("food_diary_entries").select("id", count="exact").eq("user_id", user_id)
            if date:
                count_query = count_query.eq("consumed_at", date)
            
            count_result = count_query.execute()
            total = count_result.count if hasattr(count_result, "count") else 0

            # Buscar dados paginados
            result = (
                query.order("consumed_at", desc=True)
                .order("created_at", desc=True)
                .range(offset, offset + per_page - 1)
                .execute()
            )

            entries = result.data if result.data else []

            return {
                "entries": entries,
                "pagination": {
                    "page": page,
                    "per_page": per_page,
                    "total": total,
                    "pages": (total + per_page - 1) // per_page if total > 0 else 0,
                },
            }
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            return {"entries": [], "pagination": {"page": page, "per_page": per_page, "total": 0, "pages": 0}}
        except Exception as e:
            self.logger.error(f"Erro ao buscar entradas alimentares: {str(e)}", exc_info=True)
            return {"entries": [], "pagination": {"page": page, "per_page": per_page, "total": 0, "pages": 0}}

    def update_food_entry(self, user_id: str, entry_id: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Atualiza entrada do diário alimentar.
        
        Args:
            user_id: ID do usuário
            entry_id: ID da entrada
            update_data: Dados a atualizar
        
        Returns:
            Entrada atualizada ou None
        """
        try:
            # Verificar se entrada existe e pertence ao usuário
            existing = (
                self.db.table("food_diary_entries")
                .select("*")
                .eq("id", entry_id)
                .eq("user_id", user_id)
                .execute()
            )
            
            if not existing.data or len(existing.data) == 0:
                return None
            
            # Atualizar entrada
            result = (
                self.db.table("food_diary_entries")
                .update(update_data)
                .eq("id", entry_id)
                .eq("user_id", user_id)
                .execute()
            )
            
            if result.data and len(result.data) > 0:
                return result.data[0]
            return None
            
        except Exception as e:
            self.logger.error(f"Erro ao atualizar entrada alimentar: {str(e)}", exc_info=True)
            return None

    def delete_food_entry(self, user_id: str, entry_id: str) -> bool:
        """
        Deleta entrada do diário alimentar.

        Args:
            user_id: ID do usuário
            entry_id: ID da entrada

        Returns:
            True se deletado, False caso contrário
        """
        try:
            result = self.db.table("food_diary_entries").delete().eq("id", entry_id).eq("user_id", user_id).execute()

            return result.data is not None and len(result.data) > 0
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao deletar entrada alimentar: {str(e)}", exc_info=True)
            return False

    def add_food_entry(self, user_id: str, entry_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Adiciona entrada no diário alimentar."""
        try:
            result = self.db.table("food_diary_entries").insert(entry_data).execute()
            return result.data[0] if result.data and len(result.data) > 0 else None
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao adicionar entrada alimentar: {str(e)}", exc_info=True)
            return None

    def get_exercise_entries(
        self, user_id: str, date: Optional[str] = None, page: int = 1, per_page: int = 20
    ) -> List[Dict[str, Any]]:
        """Retorna entradas de exercícios."""
        try:
            offset = (page - 1) * per_page

            query = self.db.table("exercise_entries").select("*").eq("user_id", user_id)

            if date:
                query = query.eq("entry_date", date)

            result = (
                query.order("entry_date", desc=True)
                .order("created_at", desc=True)
                .range(offset, offset + per_page - 1)
                .execute()
            )

            return result.data if result.data else []
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar entradas de exercícios: {str(e)}", exc_info=True)
            return []
