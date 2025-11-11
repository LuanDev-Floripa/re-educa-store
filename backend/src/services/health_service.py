"""
Service de saúde RE-EDUCA Store.

Gerencia dados de saúde do usuário incluindo:
- Cálculos e histórico de IMC
- Calorias e nutrição
- Hidratação
- Gordura corporal
- Métricas de saúde consolidadas
- Integrações com APIs externas
"""

import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

import requests
from config.settings import get_config
from repositories.health_repository import HealthRepository
from services.base_service import BaseService
from utils.helpers import generate_uuid

logger = logging.getLogger(__name__)


class HealthService(BaseService):
    """
    Service para operações de saúde.
    
    Utiliza HealthRepository exclusivamente para acesso a dados de saúde.
    """

    def __init__(self):
        """Inicializa o serviço de saúde."""
        super().__init__()
        self.config = get_config()
        self.repo = HealthRepository()  # Repositório de saúde

    def save_imc_calculation(self, user_id: str, calculation_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Salva cálculo de IMC no banco.

        Args:
            user_id (str): ID do usuário.
            calculation_data (Dict[str, Any]): Dados do cálculo.

        Returns:
            Dict[str, Any]: Entrada salva ou erro.
        """
        try:
            # Usa repositório ao invés de acessar Supabase diretamente
            entry = self.repo.save_imc_calculation(user_id, calculation_data)

            if entry:
                return {"success": True, "entry": entry}
            else:
                return {"success": False, "error": "Erro ao salvar cálculo"}

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao salvar cálculo IMC: {str(e)}", exc_info=True)
            return {"success": False, "error": "Erro interno do servidor"}

    def get_imc_history(self, user_id: str, page: int = 1, per_page: int = 20) -> Dict[str, Any]:
        """Retorna histórico de cálculos de IMC"""
        try:
            # Usa repositório ao invés de acessar Supabase diretamente
            return self.repo.get_imc_history(user_id, page, per_page)
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar histórico IMC: {str(e)}", exc_info=True)
            return {"error": "Erro interno do servidor"}

    def search_foods(self, query: str) -> List[Dict[str, Any]]:
        """
        Busca alimentos na API USDA.

        Utiliza USDAFoodParser para processamento e reduzir complexidade ciclomática.
        """
        try:
            # API USDA Food Data Central
            url = f"{self.config.USDA_BASE_URL}/foods/search"
            params = {
                "api_key": self.config.USDA_API_KEY,
                "query": query,
                "pageSize": 25,
                "dataType": ["Foundation", "SR Legacy"],
            }

            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()

            data = response.json()

            from services.usda_food_parser import USDAFoodParser

            parser = USDAFoodParser()
            foods = parser.parse_food_list(data.get("foods", []))

            return foods

        except requests.RequestException as e:
            logger.error(f"Erro na API USDA: {str(e)}")
            return []
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao buscar alimentos: {str(e)}", exc_info=True)
            return []

    def get_food_details(self, fdc_id: int) -> Optional[Dict[str, Any]]:
        """
        Retorna detalhes nutricionais de um alimento.
        
        Utiliza USDAFoodParser para processamento e reduzir complexidade ciclomática.
        """
        try:
            url = f"{self.config.USDA_BASE_URL}/food/{fdc_id}"
            params = {"api_key": self.config.USDA_API_KEY, "format": "full"}

            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()

            data = response.json()

            from services.usda_food_parser import USDAFoodParser

            parser = USDAFoodParser()
            food = parser.parse_food_item(data)

            # Adiciona todos os nutrientes para compatibilidade
            if food:
                nutrients = {}
                for nutrient in data.get("foodNutrients", []):
                    nutrient_name = parser._get_nutrient_name(nutrient)
                    nutrient_value = parser._get_nutrient_value(nutrient)
                    nutrient_unit = parser._get_nutrient_unit(nutrient)
                    nutrient_id = parser._get_nutrient_id(nutrient)

                    if nutrient_name and nutrient_value:
                        nutrients[nutrient_name] = {"value": nutrient_value, "unit": nutrient_unit, "id": nutrient_id}

                food["nutrients"] = nutrients

            return food

        except requests.RequestException as e:
            logger.error(f"Erro na API USDA: {str(e)}")
            return None
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar detalhes do alimento: {str(e)}", exc_info=True)
            return None

    def add_food_entry(self, user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Adiciona entrada de alimento - usa repositório"""
        """Adiciona entrada no diário alimentar"""
        try:
            entry_data = {
                "id": generate_uuid(),
                "user_id": user_id,
                "food_name": data["food_name"],
                "quantity": data["quantity"],
                "unit": data["unit"],
                "calories": data.get("calories", 0),
                "protein": data.get("protein", 0),
                "carbs": data.get("carbs", 0),
                "fat": data.get("fat", 0),
                "fiber": data.get("fiber", 0),
                "consumed_at": (
                    data.get("entry_date", datetime.now().isoformat())
                    if data.get("entry_date")
                    else datetime.now().isoformat()
                ),
                "meal_type": data.get("meal_type", "other"),
                "created_at": datetime.now().isoformat(),
            }

            entry = self.repo.add_food_entry(user_id, entry_data)

            if entry:
                return {"success": True, "entry": entry}
            else:
                return {"success": False, "error": "Erro ao adicionar entrada"}

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao adicionar entrada alimentar: {str(e)}", exc_info=True)
            return {"success": False, "error": "Erro interno do servidor"}

    def get_food_entries(
        self, user_id: str, date: Optional[str] = None, page: int = 1, per_page: int = 20
    ) -> Dict[str, Any]:
        """
        Retorna entradas do diário alimentar com paginação.

        Repositório retorna dict com paginação completa.
        """
        try:
            # Repositório já retorna dict com 'entries' e 'pagination'
            result = self.repo.get_food_entries(user_id, date=date, page=page, per_page=per_page)
            return result

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            return {"entries": [], "pagination": {"page": page, "per_page": per_page, "total": 0, "pages": 0}}
        except Exception as e:
            self.logger.error(f"Erro ao buscar entradas alimentares: {str(e)}", exc_info=True)
            return {"entries": [], "pagination": {"page": page, "per_page": per_page, "total": 0, "pages": 0}}

    def update_food_entry(self, user_id: str, entry_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Atualiza entrada do diário alimentar.

        Args:
            user_id: ID do usuário
            entry_id: ID da entrada
            data: Dados atualizados

        Returns:
            Dict com success e entry atualizada ou error
        """
        try:
            from datetime import datetime

            # Preparar dados de atualização
            update_data = {
                "food_name": data.get("food_name"),
                "quantity": data.get("quantity"),
                "unit": data.get("unit"),
                "calories": data.get("calories", 0),
                "protein": data.get("protein", 0),
                "carbs": data.get("carbs", 0),
                "fat": data.get("fat", 0),
                "fiber": data.get("fiber", 0),
                "consumed_at": (
                    data.get("entry_date", datetime.now().isoformat())
                    if data.get("entry_date")
                    else datetime.now().isoformat()
                ),
                "meal_type": data.get("meal_type", "other"),
                "updated_at": datetime.now().isoformat(),
            }

            # Atualizar usando repositório
            updated_entry = self.repo.update_food_entry(user_id, entry_id, update_data)

            if updated_entry:
                return {"success": True, "entry": updated_entry}
            else:
                return {"success": False, "error": "Entrada não encontrada ou sem permissão"}

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            return {"success": False, "error": f"Erro de validação: {str(e)}"}
        except Exception as e:
            self.logger.error(f"Erro ao atualizar entrada alimentar: {str(e)}", exc_info=True)
            return {"success": False, "error": "Erro interno do servidor"}

    def delete_food_entry(self, user_id: str, entry_id: str) -> Dict[str, Any]:
        """
        Deleta entrada do diário alimentar.

        Args:
            user_id: ID do usuário
            entry_id: ID da entrada

        Returns:
            Dict com sucesso ou erro
        """
        try:
            deleted = self.repo.delete_food_entry(user_id, entry_id)

            if deleted:
                return {"success": True}
            else:
                return {"success": False, "error": "Entrada não encontrada ou sem permissão"}

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao deletar entrada alimentar: {str(e)}", exc_info=True)
            return {"success": False, "error": "Erro interno do servidor"}

    def add_exercise_entry(self, user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Adiciona entrada de exercício"""
        try:
            entry_data = {
                "id": generate_uuid(),
                "user_id": user_id,
                "exercise_name": data["exercise_name"],
                "duration": data["duration"],
                "intensity": data.get("intensity", "moderate"),
                "calories_burned": data.get("calories_burned", 0),
                "exercise_type": data.get("exercise_type", "other"),
                "entry_date": data.get("entry_date", datetime.now().date().isoformat()),
                "notes": data.get("notes", ""),
                "created_at": datetime.now().isoformat(),
            }

            entry = self.repo.add_exercise_entry(user_id, entry_data)

            if entry:
                return {"success": True, "entry": entry}
            else:
                return {"success": False, "error": "Erro ao adicionar exercício"}

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao adicionar exercício: {str(e)}", exc_info=True)
            return {"success": False, "error": "Erro interno do servidor"}

    def get_exercise_entries(
        self, user_id: str, date: Optional[str] = None, page: int = 1, per_page: int = 20
    ) -> Dict[str, Any]:
        """
        Retorna entradas de exercícios.

        Utiliza HealthRepository para acesso padronizado aos dados.
        """
        try:
            entries = self.repo.get_exercise_entries(user_id, date=date, page=page, per_page=per_page)

            # Reformatar para compatibilidade
            total = len(entries) if isinstance(entries, list) else 0

            return {
                "entries": entries if isinstance(entries, list) else [],
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
            self.logger.error(f"Erro ao buscar entradas de exercício: {str(e)}", exc_info=True)
            return {"error": "Erro interno do servidor"}

    def get_health_analytics(self, user_id: str, period_days: int = 30) -> Dict[str, Any]:
        """
        Retorna analytics avançados de saúde do usuário.
        
        Inclui:
        - Métricas básicas e avançadas
        - Análise de tendências detalhadas
        - Comparações entre períodos
        - Análise de correlações
        - Insights e recomendações
        """
        try:
            end_date = datetime.now()
            start_date = end_date - timedelta(days=period_days)

            # Buscar dados históricos
            imc_history = self.repo.get_imc_history(user_id, page=1, per_page=1000)
            imc_data = imc_history.get("entries", []) if isinstance(imc_history, dict) else []
            imc_result_data = [
                entry
                for entry in imc_data
                if start_date.isoformat() <= entry.get("created_at", "") <= end_date.isoformat()
            ]

            food_entries_result = self.repo.get_food_entries(user_id, page=1, per_page=1000)
            food_data = (
                food_entries_result.get("entries", [])
                if isinstance(food_entries_result, dict)
                else (food_entries_result if isinstance(food_entries_result, list) else [])
            )

            exercise_entries_result = self.repo.get_exercise_entries(user_id, page=1, per_page=1000)
            exercise_data = (
                exercise_entries_result.get("entries", [])
                if isinstance(exercise_entries_result, dict)
                else (exercise_entries_result if isinstance(exercise_entries_result, list) else [])
            )

            # Buscar outros cálculos de saúde
            biological_age_history = self.repo.get_biological_age_history(user_id, page=1, per_page=100)
            biological_age_data = (
                biological_age_history.get("entries", [])
                if isinstance(biological_age_history, dict)
                else []
            )

            # Métricas básicas
            total_calories_consumed = sum(entry.get("calories", 0) for entry in food_data)
            total_calories_burned = sum(entry.get("calories_burned", 0) for entry in exercise_data)
            avg_imc = (
                sum(entry.get("imc", 0) for entry in imc_result_data) / len(imc_result_data) if imc_result_data else 0
            )

            # Métricas avançadas
            avg_daily_calories = total_calories_consumed / period_days if period_days > 0 else 0
            avg_daily_exercise = len(exercise_data) / period_days if period_days > 0 else 0
            avg_exercise_duration = (
                sum(entry.get("duration", 0) for entry in exercise_data) / len(exercise_data)
                if exercise_data
                else 0
            )

            # Análise de macronutrientes
            total_protein = sum(entry.get("protein", 0) for entry in food_data)
            total_carbs = sum(entry.get("carbs", 0) for entry in food_data)
            total_fat = sum(entry.get("fat", 0) for entry in food_data)
            total_fiber = sum(entry.get("fiber", 0) for entry in food_data)

            # Análise de tendências avançadas
            imc_trend = self._calculate_trend(imc_result_data, "imc")
            calories_trend = self._calculate_trend(food_data, "calories")
            exercise_trend = self._calculate_trend(exercise_data, "calories_burned")

            # Comparação com período anterior
            previous_start = start_date - timedelta(days=period_days)
            previous_imc_data = [
                entry
                for entry in imc_data
                if previous_start.isoformat() <= entry.get("created_at", "") < start_date.isoformat()
            ]
            previous_avg_imc = (
                sum(entry.get("imc", 0) for entry in previous_imc_data) / len(previous_imc_data)
                if previous_imc_data
                else 0
            )

            # Análise de correlações
            correlations = self._analyze_correlations(
                imc_result_data, food_data, exercise_data, period_days
            )

            # Insights e recomendações
            insights = self._generate_health_insights(
                avg_imc, total_calories_consumed, total_calories_burned, len(exercise_data), period_days
            )

            # Análise temporal detalhada
            daily_metrics = self._calculate_daily_metrics(food_data, exercise_data, start_date, end_date)

            return {
                "period": {"start_date": start_date.isoformat(), "end_date": end_date.isoformat(), "days": period_days},
                "metrics": {
                    "total_imc_calculations": len(imc_result_data),
                    "average_imc": round(avg_imc, 2),
                    "imc_change": round(avg_imc - previous_avg_imc, 2) if previous_avg_imc > 0 else 0,
                    "total_food_entries": len(food_data),
                    "total_calories_consumed": total_calories_consumed,
                    "avg_daily_calories": round(avg_daily_calories, 2),
                    "total_exercise_entries": len(exercise_data),
                    "total_calories_burned": total_calories_burned,
                    "avg_daily_exercise": round(avg_daily_exercise, 2),
                    "avg_exercise_duration": round(avg_exercise_duration, 2),
                    "net_calories": total_calories_consumed - total_calories_burned,
                    "macronutrients": {
                        "protein": round(total_protein, 2),
                        "carbs": round(total_carbs, 2),
                        "fat": round(total_fat, 2),
                        "fiber": round(total_fiber, 2),
                    },
                    "biological_age_calculations": len(biological_age_data),
                },
                "trends": {
                    "imc_trend": imc_trend,
                    "calories_trend": calories_trend,
                    "exercise_trend": exercise_trend,
                },
                "comparison": {
                    "previous_avg_imc": round(previous_avg_imc, 2),
                    "current_avg_imc": round(avg_imc, 2),
                    "imc_change_percent": (
                        round(((avg_imc - previous_avg_imc) / previous_avg_imc * 100), 2)
                        if previous_avg_imc > 0
                        else 0
                    ),
                },
                "correlations": correlations,
                "insights": insights,
                "daily_metrics": daily_metrics,
            }

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            return {"error": "Erro de validação"}
        except Exception as e:
            self.logger.error(f"Erro ao gerar analytics: {str(e)}", exc_info=True)
            return {"error": "Erro interno do servidor"}

    def get_health_goals(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Retorna metas de saúde do usuário.

        Utiliza GoalRepository para acesso padronizado aos dados.
        """
        try:
            from repositories.goal_repository import GoalRepository

            goal_repo = GoalRepository()
            return goal_repo.find_active_by_user(user_id)

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar metas: {str(e)}", exc_info=True)
            return []

    def create_health_goal(self, user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Cria nova meta de saúde"""
        try:
            goal_data = {
                "id": generate_uuid(),
                "user_id": user_id,
                "type": data["type"],
                "target_value": data["target_value"],
                "current_value": data.get("current_value", 0),
                "unit": data.get("unit", ""),
                "deadline": data.get("deadline"),
                "description": data.get("description", ""),
                "active": True,
                "created_at": datetime.now().isoformat(),
            }

            goal = self.repo.save_goal(user_id, goal_data)

            if goal:
                return {"success": True, "goal": goal}
            else:
                return {"success": False, "error": "Erro ao criar meta"}

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao criar meta: {str(e)}", exc_info=True)
            return {"success": False, "error": "Erro interno do servidor"}

    def save_calorie_calculation(self, user_id: str, calculation_data: Dict[str, Any]) -> Dict[str, Any]:
        """Salva cálculo de calorias - usa repositório"""
        """Salva cálculo de calorias no banco"""
        try:
            entry_data = {
                "id": generate_uuid(),
                "user_id": user_id,
                "age": calculation_data.get("age"),
                "gender": calculation_data.get("gender"),
                "weight": calculation_data.get("weight"),
                "height": calculation_data.get("height"),
                "activity_level": calculation_data.get("activity_level"),
                "goal": calculation_data.get("goal"),
                "bmr": calculation_data.get("bmr"),
                "tdee": calculation_data.get("tdee"),
                "target_calories": calculation_data.get("target_calories"),
                "deficit": calculation_data.get("deficit", 0),
                "surplus": calculation_data.get("surplus", 0),
                "created_at": datetime.now().isoformat(),
            }

            entry = self.repo.save_calorie_calculation(user_id, entry_data)

            if entry:
                return {"success": True, "entry": entry}
            else:
                return {"success": False, "error": "Erro ao salvar cálculo"}

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao salvar cálculo de calorias: {str(e)}", exc_info=True)
            return {"success": False, "error": "Erro interno do servidor"}

    def get_calorie_history(self, user_id: str, page: int = 1, per_page: int = 20) -> Dict[str, Any]:
        """
        Retorna histórico de cálculos de calorias.

        Utiliza HealthRepository para acesso padronizado aos dados.
        """
        try:
            return self.repo.get_calorie_history(user_id, page, per_page)

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar histórico de calorias: {str(e)}", exc_info=True)
            return {"error": "Erro interno do servidor"}

    def calculate_biological_age(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calcula idade biológica baseada em múltiplos fatores.
        
        Utiliza BiologicalAgeCalculator para processamento e reduzir complexidade ciclomática.

        Args:
            data: Dados do usuário incluindo idade, fatores de saúde, etc.

        Returns:
            Dict com idade biológica calculada, diferença, classificação e score.
        """
        try:
            from services.biological_age_calculator import BiologicalAgeCalculator

            calculator = BiologicalAgeCalculator()
            result = calculator.calculate(data)

            # Gera recomendações
            recommendations = self._generate_biological_age_recommendations(
                result["age_difference"],
                data.get("chronicDiseases", []),
                data.get("lifestyleFactors", []),
                data.get("factors", {}).get("cardiovascularFitness"),
                data.get("factors", {}).get("strength"),
                data.get("factors", {}).get("sleepQuality"),
                data.get("factors", {}).get("dietQuality"),
            )

            result["recommendations"] = recommendations
            result["factors_used"] = {
                "fitness": data.get("factors", {}).get("cardiovascularFitness"),
                "strength": data.get("factors", {}).get("strength"),
                "sleep": data.get("factors", {}).get("sleepQuality"),
                "diet": data.get("factors", {}).get("dietQuality"),
            }

            return result

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao calcular idade biológica: {str(e)}", exc_info=True)
            return {"error": "Erro ao calcular idade biológica"}

    def _generate_biological_age_recommendations(
        self, age_difference, diseases, lifestyle, cardio, strength, sleep, diet
    ) -> List[Dict[str, str]]:
        """Gera recomendações baseadas no cálculo"""
        recommendations = []

        if age_difference > 0:
            recommendations.append(
                {
                    "type": "warning",
                    "title": "Envelhecimento Acelerado",
                    "message": "Sua idade biológica está acima da cronológica. Foque em melhorar hábitos de vida.",
                }
            )
        elif age_difference < -2:
            recommendations.append(
                {
                    "type": "success",
                    "title": "Envelhecimento Lento",
                    "message": "Excelente! Continue mantendo seus hábitos saudáveis.",
                }
            )

        if cardio in ["poor", "below_average"]:
            recommendations.append(
                {
                    "type": "error",
                    "title": "Fitness Cardiovascular",
                    "message": "Melhore sua condição cardiovascular com exercícios aeróbicos regulares.",
                }
            )

        if strength in ["poor", "below_average"]:
            recommendations.append(
                {
                    "type": "warning",
                    "title": "Força Muscular",
                    "message": "Inclua treino de força para manter a massa muscular e densidade óssea.",
                }
            )

        if sleep in ["poor", "fair"]:
            recommendations.append(
                {
                    "type": "warning",
                    "title": "Qualidade do Sono",
                    "message": "Melhore sua higiene do sono para otimizar a recuperação e regeneração celular.",
                }
            )

        if diet in ["poor", "fair"]:
            recommendations.append(
                {
                    "type": "warning",
                    "title": "Qualidade da Dieta",
                    "message": "Adote uma dieta rica em antioxidantes, ômega-3 e nutrientes anti-inflamatórios.",
                }
            )

        if diseases and len(diseases) > 0:
            recommendations.append(
                {
                    "type": "error",
                    "title": "Doenças Crônicas",
                    "message": "Trabalhe com profissionais de saúde para gerenciar suas condições médicas.",
                }
            )

        if "smoking" in lifestyle:
            recommendations.append(
                {
                    "type": "error",
                    "title": "Tabagismo",
                    "message": "Parar de fumar é uma das melhores coisas que você pode fazer para sua saúde.",
                }
            )

        if "sedentary" in lifestyle:
            recommendations.append(
                {
                    "type": "warning",
                    "title": "Vida Sedentária",
                    "message": "Aumente sua atividade física diária. Mesmo pequenas mudanças fazem diferença.",
                }
            )

        recommendations.append(
            {
                "type": "info",
                "title": "Dica Geral",
                "message": "O envelhecimento saudável é um processo contínuo. Pequenas melhorias diárias têm grande impacto a longo prazo.",
            }
        )

        return recommendations

    def save_biological_age_calculation(self, user_id: str, calculation_data: Dict[str, Any]) -> Dict[str, Any]:
        """Salva cálculo de idade biológica no banco"""
        try:
            entry_data = {
                "id": generate_uuid(),
                "user_id": user_id,
                "chronological_age": calculation_data.get("chronological_age"),
                "biological_age": calculation_data.get("biological_age"),
                "age_difference": calculation_data.get("age_difference"),
                "classification": calculation_data.get("classification"),
                "score": calculation_data.get("score"),
                "factors": calculation_data.get("factors_used", {}),
                "recommendations": calculation_data.get("recommendations", []),
                "created_at": datetime.now().isoformat(),
            }

            entry = self.repo.create_biological_age_calculation(entry_data)

            if entry:
                return {"success": True, "entry": entry}
            else:
                return {"success": False, "error": "Erro ao salvar cálculo"}

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao salvar cálculo de idade biológica: {str(e)}", exc_info=True)
            return {"success": False, "error": "Erro interno do servidor"}

    def save_hydration_calculation(self, user_id: str, calculation_data: Dict[str, Any]) -> Dict[str, Any]:
        """Salva cálculo de hidratação no banco"""
        try:
            entry_data = {
                "id": generate_uuid(),
                "user_id": user_id,
                "weight": calculation_data.get("weight"),
                "age": calculation_data.get("age"),
                "gender": calculation_data.get("gender"),
                "activity_level": calculation_data.get("activity_level"),
                "climate": calculation_data.get("climate"),
                "exercise_duration": calculation_data.get("exercise_duration", 0),
                "exercise_intensity": calculation_data.get("exercise_intensity"),
                "health_conditions": calculation_data.get("health_conditions", []),
                "total_intake": calculation_data.get("total_intake"),
                "water_intake": calculation_data.get("water_intake"),
                "other_fluids": calculation_data.get("other_fluids"),
                "created_at": datetime.now().isoformat(),
            }

            entry = self.repo.create_hydration_calculation(entry_data)

            if entry:
                return {"success": True, "entry": entry}
            else:
                return {"success": False, "error": "Erro ao salvar cálculo"}

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao salvar cálculo de hidratação: {str(e)}", exc_info=True)
            return {"success": False, "error": "Erro interno do servidor"}

    def save_metabolism_calculation(self, user_id: str, calculation_data: Dict[str, Any]) -> Dict[str, Any]:
        """Salva cálculo de metabolismo no banco - usa tabela específica"""
        try:
            entry_data = {
                "id": generate_uuid(),
                "user_id": user_id,
                "age": calculation_data.get("age"),
                "gender": calculation_data.get("gender"),
                "weight": calculation_data.get("weight"),
                "height": calculation_data.get("height"),  # Em metros
                "activity_level": calculation_data.get("activity_level"),
                "bmr": calculation_data.get("bmr"),
                "tdee": calculation_data.get("tdee"),
                "metabolism_type": calculation_data.get("metabolism_type"),
                "recommendations": calculation_data.get("recommendations", []),
                "created_at": datetime.now().isoformat(),
            }

            entry = self.repo.create_metabolism_calculation(entry_data)

            if entry:
                return {"success": True, "entry": entry}
            else:
                return {"success": False, "error": "Erro ao salvar cálculo"}

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao salvar cálculo de metabolismo: {str(e)}", exc_info=True)
            return {"success": False, "error": "Erro interno do servidor"}

    def save_sleep_calculation(self, user_id: str, calculation_data: Dict[str, Any]) -> Dict[str, Any]:
        """Salva cálculo de sono no banco - usa tabela específica"""
        try:
            entry_data = {
                "id": generate_uuid(),
                "user_id": user_id,
                "age": calculation_data.get("age"),
                "sleep_duration": calculation_data.get("sleep_duration"),
                "sleep_quality": calculation_data.get("sleep_quality"),
                "bedtime": calculation_data.get("bedtime"),
                "wake_time": calculation_data.get("wake_time"),
                "sleep_efficiency": calculation_data.get("sleep_efficiency"),
                "recommendations": calculation_data.get("recommendations", []),
                "created_at": datetime.now().isoformat(),
            }

            entry = self.repo.create_sleep_calculation(entry_data)
            if entry:
                return {"success": True, "entry": entry}
            else:
                return {"success": False, "error": "Erro ao salvar cálculo"}

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao salvar cálculo de sono: {str(e)}", exc_info=True)
            return {"success": False, "error": "Erro interno do servidor"}

    def get_biological_age_history(
        self,
        user_id: str,
        page: int = 1,
        per_page: int = 20,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Retorna histórico de cálculos de idade biológica.

        Utiliza HealthRepository com método específico para tabela biological_age_calculations.
        """
        try:
            return self.repo.get_biological_age_history(user_id, page, per_page, start_date, end_date)
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar histórico de idade biológica: {str(e)}", exc_info=True)
            return {"error": "Erro interno do servidor"}

    def get_metabolism_history(
        self,
        user_id: str,
        page: int = 1,
        per_page: int = 20,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Retorna histórico de cálculos de metabolismo.

        Utiliza HealthRepository com método específico para tabela metabolism_calculations.
        """
        try:
            return self.repo.get_metabolism_history(user_id, page, per_page, start_date, end_date)
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar histórico de metabolismo: {str(e)}", exc_info=True)
            return {"error": "Erro interno do servidor"}

    def get_sleep_history(
        self,
        user_id: str,
        page: int = 1,
        per_page: int = 20,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Retorna histórico de cálculos de sono.

        Utiliza HealthRepository para acesso padronizado aos dados.
        """
        try:
            return self.repo.get_calculation_history("sleep", user_id, page, per_page, start_date, end_date)
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar histórico de sono: {str(e)}", exc_info=True)
            return {"error": "Erro interno do servidor"}

    def get_stress_history(
        self,
        user_id: str,
        page: int = 1,
        per_page: int = 20,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Retorna histórico de cálculos de estresse.

        Utiliza HealthRepository com método específico para tabela stress_calculations.
        """
        try:
            return self.repo.get_stress_history(user_id, page, per_page, start_date, end_date)
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar histórico de estresse: {str(e)}", exc_info=True)
            return {"error": "Erro interno do servidor"}

    def get_hydration_history(
        self,
        user_id: str,
        page: int = 1,
        per_page: int = 20,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Retorna histórico de cálculos de hidratação.

        Utiliza HealthRepository com método específico para tabela hydration_calculations.
        """
        try:
            return self.repo.get_hydration_history(user_id, page, per_page, start_date, end_date)
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar histórico de hidratação: {str(e)}", exc_info=True)
            return {"error": "Erro interno do servidor"}

    def save_stress_calculation(self, user_id: str, calculation_data: Dict[str, Any]) -> Dict[str, Any]:
        """Salva cálculo de estresse no banco"""
        try:
            entry_data = {
                "id": generate_uuid(),
                "user_id": user_id,
                "stress_level": calculation_data.get("stress_level"),
                "stress_score": calculation_data.get("stress_score"),
                "stress_factors": calculation_data.get("stress_factors", []),
                "coping_strategies": calculation_data.get("coping_strategies", []),
                "recommendations": calculation_data.get("recommendations", []),
                "created_at": datetime.now().isoformat(),
            }

            entry = self.repo.save_calculation("stress", user_id, entry_data)

            if entry:
                return {"success": True, "entry": entry}
            else:
                return {"success": False, "error": "Erro ao salvar cálculo"}

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao salvar cálculo de estresse: {str(e)}", exc_info=True)
            return {"success": False, "error": "Erro interno do servidor"}

    def _calculate_trend(self, data: List[Dict[str, Any]], field: str) -> Dict[str, Any]:
        """Calcula tendência dos dados"""
        if not data:
            return {"trend": "stable", "change": 0}

        sorted_data = sorted(data, key=lambda x: x.get("created_at", ""))

        if len(sorted_data) < 2:
            return {"trend": "stable", "change": 0}

        first_value = sorted_data[0].get(field, 0)
        last_value = sorted_data[-1].get(field, 0)

        change = last_value - first_value
        change_percent = (change / first_value * 100) if first_value > 0 else 0

        if change_percent > 5:
            trend = "increasing"
        elif change_percent < -5:
            trend = "decreasing"
        else:
            trend = "stable"

        return {"trend": trend, "change": round(change, 2), "change_percent": round(change_percent, 2)}

    def _analyze_correlations(
        self, imc_data: List[Dict], food_data: List[Dict], exercise_data: List[Dict], period_days: int
    ) -> Dict[str, Any]:
        """Analisa correlações entre diferentes métricas de saúde"""
        try:
            correlations = {
                "exercise_vs_imc": "insufficient_data",
                "calories_vs_imc": "insufficient_data",
                "consistency_score": 0,
            }

            if len(imc_data) >= 2 and len(exercise_data) > 0:
                # Calcular correlação entre exercício e IMC
                imc_values = [entry.get("imc", 0) for entry in imc_data]
                exercise_days = len(exercise_data)
                exercise_frequency = exercise_days / period_days if period_days > 0 else 0

                if exercise_frequency > 0.3:  # Exercita mais de 30% dos dias
                    avg_imc_start = imc_values[0] if imc_values else 0
                    avg_imc_end = imc_values[-1] if imc_values else 0
                    if avg_imc_start > 0 and avg_imc_end < avg_imc_start:
                        correlations["exercise_vs_imc"] = "positive"
                    else:
                        correlations["exercise_vs_imc"] = "neutral"
                else:
                    correlations["exercise_vs_imc"] = "negative"

            if len(imc_data) >= 2 and len(food_data) > 0:
                # Calcular correlação entre calorias e IMC
                avg_daily_calories = sum(entry.get("calories", 0) for entry in food_data) / period_days
                if 1500 <= avg_daily_calories <= 2500:
                    correlations["calories_vs_imc"] = "balanced"
                elif avg_daily_calories > 2500:
                    correlations["calories_vs_imc"] = "high"
                else:
                    correlations["calories_vs_imc"] = "low"

            # Score de consistência (quanto mais dados, maior o score)
            data_points = len(imc_data) + len(food_data) + len(exercise_data)
            max_possible = period_days * 3  # 3 tipos de dados por dia
            correlations["consistency_score"] = round((data_points / max_possible * 100) if max_possible > 0 else 0, 2)

            return correlations
        except Exception as e:
            logger.warning(f"Erro ao analisar correlações: {str(e)}")
            return {"exercise_vs_imc": "unknown", "calories_vs_imc": "unknown", "consistency_score": 0}

    def _generate_health_insights(
        self, avg_imc: float, total_calories: float, total_burned: float, exercise_count: int, period_days: int
    ) -> List[Dict[str, str]]:
        """Gera insights e recomendações baseadas nas métricas"""
        insights = []

        # Insight sobre IMC
        if avg_imc > 0:
            if avg_imc < 18.5:
                insights.append(
                    {
                        "type": "warning",
                        "title": "IMC Abaixo do Normal",
                        "message": "Seu IMC está abaixo do recomendado. Considere consultar um nutricionista.",
                    }
                )
            elif avg_imc > 25:
                insights.append(
                    {
                        "type": "warning",
                        "title": "IMC Acima do Normal",
                        "message": "Seu IMC está acima do recomendado. Foque em exercícios e dieta balanceada.",
                    }
                )
            else:
                insights.append(
                    {
                        "type": "success",
                        "title": "IMC Saudável",
                        "message": "Parabéns! Seu IMC está dentro da faixa saudável.",
                    }
                )

        # Insight sobre exercícios
        avg_daily_exercise = exercise_count / period_days if period_days > 0 else 0
        if avg_daily_exercise < 0.3:
            insights.append(
                {
                    "type": "info",
                    "title": "Aumente a Frequência de Exercícios",
                    "message": "Tente exercitar-se pelo menos 3 vezes por semana para melhores resultados.",
                }
            )
        elif avg_daily_exercise >= 0.5:
            insights.append(
                {
                    "type": "success",
                    "title": "Excelente Frequência de Exercícios",
                    "message": "Você está mantendo uma rotina de exercícios consistente!",
                }
            )

        # Insight sobre balanço calórico
        net_calories = total_calories - total_burned
        if net_calories > 500 * period_days:
            insights.append(
                {
                    "type": "warning",
                    "title": "Excesso Calórico",
                    "message": "Você está consumindo mais calorias do que queimando. Considere ajustar sua dieta.",
                }
            )
        elif net_calories < -500 * period_days:
            insights.append(
                {
                    "type": "info",
                    "title": "Déficit Calórico Significativo",
                    "message": "Você está em déficit calórico. Certifique-se de consumir nutrientes suficientes.",
                }
            )

        return insights

    def _calculate_daily_metrics(
        self, food_data: List[Dict], exercise_data: List[Dict], start_date: datetime, end_date: datetime
    ) -> List[Dict[str, Any]]:
        """Calcula métricas diárias para análise temporal"""
        try:
            from collections import defaultdict

            daily_metrics_dict = defaultdict(lambda: {"calories": 0, "exercise": 0, "exercise_duration": 0})

            # Agrupar por dia
            for entry in food_data:
                entry_date = entry.get("consumed_at") or entry.get("created_at", "")
                if entry_date:
                    try:
                        date_obj = datetime.fromisoformat(entry_date.replace("Z", "+00:00")).date()
                        date_str = date_obj.isoformat()
                        daily_metrics_dict[date_str]["calories"] += entry.get("calories", 0)
                    except (ValueError, AttributeError):
                        pass

            for entry in exercise_data:
                entry_date = entry.get("entry_date") or entry.get("created_at", "")
                if entry_date:
                    try:
                        date_obj = datetime.fromisoformat(entry_date.replace("Z", "+00:00")).date()
                        date_str = date_obj.isoformat()
                        daily_metrics_dict[date_str]["exercise"] += 1
                        daily_metrics_dict[date_str]["exercise_duration"] += entry.get("duration", 0)
                    except (ValueError, AttributeError):
                        pass

            # Preencher todos os dias do período
            current = start_date.date()
            end = end_date.date()
            daily_metrics = []

            while current <= end:
                date_str = current.isoformat()
                daily_metrics.append(
                    {
                        "date": date_str,
                        "calories": daily_metrics_dict[date_str]["calories"],
                        "exercise_count": daily_metrics_dict[date_str]["exercise"],
                        "exercise_duration": daily_metrics_dict[date_str]["exercise_duration"],
                    }
                )
                current += timedelta(days=1)

            return daily_metrics
        except Exception as e:
            logger.warning(f"Erro ao calcular métricas diárias: {str(e)}")
            return []
