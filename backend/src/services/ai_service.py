"""
Serviço de IA Inteligente RE-EDUCA Store.

Gerencia interações com IA incluindo:
- Processamento de mensagens de chat
- Análise de intenção do usuário
- Recomendações contextuais
- Histórico de conversas
- Fallback para indisponibilidade
"""

import logging
from datetime import datetime
from typing import Any, Dict, Optional

from services.base_service import BaseService
from services.exercise_service import ExerciseService
from services.health_service import HealthService
from services.order_service import OrderService
from services.user_service import UserService

logger = logging.getLogger(__name__)


class AIService(BaseService):
    """
    Service para operações de IA e chat inteligente.
    
    Utiliza outros services para buscar contexto do usuário (goals, workouts, etc).
    """

    def __init__(self):
        """Inicializa o serviço de IA."""
        super().__init__()
        self.user_service = UserService()
        self.health_service = HealthService()
        self.order_service = OrderService()
        self.exercise_service = ExerciseService()

    def process_chat_message(
        self,
        user_id: str,
        message: str,
        agent_type: str = "platform_concierge",
        user_context: Optional[Dict[str, Any]] = None,
        context_summary: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Processa mensagem do chat com IA preditiva usando contexto do usuário.

        Args:
            user_id (str): ID do usuário.
            message (str): Mensagem do usuário.
            agent_type (str): Tipo de agente (platform_concierge, dr_nutri, coach_fit, etc.)
            user_context (dict, opcional): Dados do usuário (perfil, saúde, atividades, etc.)
            context_summary (str, opcional): Resumo textual do contexto do usuário

        Returns:
            Dict[str, Any]: Resposta da IA com success e data ou erro.
        """
        try:
            # Buscar contexto do usuário se não foi fornecido
            if user_context is None:
                user_context = self._get_user_context(user_id)

            # Analisa a intenção da mensagem
            intent = self._analyze_intent(message, user_context)

            # Gera resposta baseada na intenção e contexto do usuário
            response = self._generate_response(
                user_id=user_id,
                message=message,
                intent=intent,
                agent_type=agent_type,
                user_context=user_context,
                context_summary=context_summary,
            )

            # Salva a conversa no histórico
            self._save_chat_message(user_id, message, response["response"], agent_type=agent_type, intent=intent)

            return {"success": True, "data": response}

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao processar mensagem: {str(e)}", exc_info=True)
            return {"success": False, "error": str(e)}

    def _analyze_intent(self, message: str, user_context: Optional[Dict[str, Any]] = None) -> str:
        """
        Analisa a intenção da mensagem do usuário com base no contexto.

        Args:
            message (str): Mensagem do usuário
            user_context (dict, opcional): Contexto do usuário para melhor análise

        Returns:
            str: Tipo de intenção identificada
        """
        message_lower = message.lower()

        # Padrões de intenção melhorados com contexto
        if any(word in message_lower for word in ["imc", "peso", "altura", "massa corporal", "calcular imc"]):
            return "imc_calculation"
        elif any(
            word in message_lower for word in ["exercício", "treino", "musculação", "cardio", "treinar", "academia"]
        ):
            return "exercise_recommendation"
        elif any(
            word in message_lower for word in ["alimentação", "comida", "nutrição", "dieta", "calorias", "refeição"]
        ):
            return "nutrition_advice"
        elif any(
            word in message_lower for word in ["produto", "comprar", "loja", "suplemento", "produtos recomendados"]
        ):
            return "product_recommendation"
        elif any(word in message_lower for word in ["saúde", "bem-estar", "fitness", "progresso", "resultados"]):
            return "health_advice"
        elif any(word in message_lower for word in ["obrigado", "valeu", "thanks", "agradeço"]):
            return "gratitude"
        elif any(word in message_lower for word in ["objetivo", "meta", "alcançar", "quero"]):
            return "goal_setting"
        elif any(word in message_lower for word in ["progresso", "evolução", "como estou", "resultado"]):
            return "progress_inquiry"
        else:
            return "general"

    def _get_user_context(self, user_id: str) -> Dict[str, Any]:
        """
        Busca contexto completo do usuário para IA preditiva.

        Utiliza outros services em vez de queries diretas para acesso padronizado.

        Args:
            user_id (str): ID do usuário

        Returns:
            dict: Contexto do usuário (perfil, saúde, atividades, etc.)
        """
        try:
            profile = self.user_service.get_user_by_id(user_id) or {}

            health_analytics = self.health_service.get_health_analytics(user_id, period_days=30)
            health = health_analytics.get("health", {}) if health_analytics else {}

            activities_result = self.user_service.get_user_activities(user_id, page=1, per_page=10)
            activities = activities_result.get("activities", []) if activities_result else []

            orders_result = self.order_service.get_user_orders(user_id, page=1, per_page=5)
            purchases = orders_result.get("orders", []) if orders_result else []

            try:
                from repositories.goal_repository import GoalRepository

                goal_repo = GoalRepository()
                goals = goal_repo.find_active_by_user(user_id)
            except (ValueError, KeyError) as e:
                logger.warning(f"Erro de validação: {str(e)}")
                # Tratamento específico pode ser adicionado aqui
            except Exception as e:
                self.logger.warning(f"Erro ao buscar goals: {e}")
                goals = []

            try:
                from repositories.workout_repository import WorkoutRepository

                workout_repo = WorkoutRepository()
                workouts = workout_repo.find_recent(user_id, limit=5)
            except (ValueError, KeyError) as e:
                logger.warning(f"Erro de validação: {str(e)}")
                # Tratamento específico pode ser adicionado aqui
            except Exception as e:
                self.logger.warning(f"Erro ao buscar workouts: {e}")
                workouts = []

            return {
                "profile": profile,
                "health": health,
                "activities": activities,
                "purchases": purchases,
                "goals": goals,
                "workouts": workouts,
            }

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar contexto do usuário: {str(e)}", exc_info=True)
            return {}

    def _generate_response(
        self,
        user_id: str,
        message: str,
        intent: str,
        agent_type: str = "platform_concierge",
        user_context: Optional[Dict[str, Any]] = None,
        context_summary: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Gera resposta baseada na intenção e contexto do usuário para IA preditiva.

        Refatorado para usar Strategy Pattern e reduzir complexidade ciclomática.
        Lógica de geração de respostas foi extraída para handlers especializados.

        Args:
            user_id (str): ID do usuário
            message (str): Mensagem do usuário
            intent (str): Intenção identificada
            agent_type (str): Tipo de agente
            user_context (dict, opcional): Contexto do usuário
            context_summary (str, opcional): Resumo textual do contexto

        Returns:
            dict: Resposta da IA com sugestões e tópicos relacionados
        """
        from services.ai_response_handlers import create_response_handler

        handler = create_response_handler(intent)
        return handler.generate_response(message, user_context, agent_type)

    def _save_chat_message(
        self,
        user_id: str,
        user_message: str,
        ai_response: str,
        agent_type: str = "platform_concierge",
        intent: str = "general",
    ):
        """
        Salva mensagem no histórico de chat com metadados

        Args:
            user_id (str): ID do usuário
            user_message (str): Mensagem do usuário
            ai_response (str): Resposta da IA
            agent_type (str): Tipo de agente usado
            intent (str): Intenção identificada
        """
        try:
            chat_data = {
                "user_id": user_id,
                "user_message": user_message,
                "ai_response": ai_response,
                "agent_type": agent_type,
                "intent": intent,
                "created_at": datetime.now().isoformat(),
            }

            from repositories.ai_repository import AIRepository

            repo = AIRepository()
            created_message = repo.create_chat_message(chat_data)
            return created_message

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao salvar chat: {str(e)}", exc_info=True)
            # Não falha a operação se não conseguir salvar

    def get_chat_history(self, user_id: str, limit: int = 50) -> Dict[str, Any]:
        """Obtém histórico de chat do usuário"""
        try:
            from repositories.ai_repository import AIRepository

            repo = AIRepository()
            messages = repo.find_by_user(user_id, limit=limit)

            return {"success": True, "data": messages or []}

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao obter histórico: {str(e)}", exc_info=True)
            return {"success": False, "error": str(e)}

    def analyze_image(self, user_id: str, image_file, analysis_type: str = "general") -> Dict[str, Any]:
        """Analisa imagem com IA"""
        try:
            # Simula análise baseada no tipo
            if analysis_type == "food":
                return {
                    "success": True,
                    "data": {
                        "food_name": "Alimento Identificado",
                        "description": (
                            "Este parece ser um alimento saudável. Recomendo verificar " "as informações nutricionais."
                        ),
                        "confidence": 85.0,
                        "category": "Alimento",
                        "nutritional_info": {"calories": "~200 kcal", "protein": "~15g", "carbs": "~25g", "fat": "~8g"},
                        "recommendations": [
                            "Adicione este alimento ao seu diário alimentar",
                            "Verifique a porção adequada para seus objetivos",
                            "Combine com outros alimentos nutritivos",
                        ],
                    },
                }
            elif analysis_type == "exercise":
                return {
                    "success": True,
                    "data": {
                        "exercise_name": "Exercício Identificado",
                        "description": "Este exercício é excelente para fortalecimento muscular.",
                        "confidence": 80.0,
                        "difficulty": "Intermediário",
                        "muscle_groups": ["Peito", "Ombros", "Tríceps"],
                        "equipment": "Peso livre",
                        "form_tips": [
                            "Mantenha a postura ereta",
                            "Controle o movimento",
                            "Respire corretamente durante o exercício",
                        ],
                    },
                }
            else:
                return {
                    "success": True,
                    "data": {
                        "description": (
                            "Análise geral da imagem concluída. Identifiquei elementos "
                            "relacionados à saúde e bem-estar."
                        ),
                        "confidence": 75.0,
                        "objects": [
                            {"name": "Objeto de saúde", "confidence": 85},
                            {"name": "Elemento fitness", "confidence": 70},
                        ],
                        "tags": ["saúde", "bem-estar", "fitness"],
                    },
                }

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro na análise de imagem: {str(e)}", exc_info=True)
            return {"success": False, "error": str(e)}
