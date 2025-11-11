"""
Handlers de Resposta de IA - RE-EDUCA Store.

Refatoração: Extrai lógica de geração de respostas de _generate_response
para reduzir complexidade ciclomática.

Cada handler é responsável por um tipo de intenção específica.
"""

from typing import Any, Dict, List, Optional


class AIResponseHandler:
    """Classe base para handlers de resposta de IA."""

    def generate_response(
        self, message: str, user_context: Optional[Dict[str, Any]] = None, agent_type: str = "platform_concierge"
    ) -> Dict[str, Any]:
        """
        Gera resposta baseada no contexto.

        Args:
            message: Mensagem do usuário
            user_context: Contexto do usuário
            agent_type: Tipo de agente

        Returns:
            Dict com response, suggestions e related_topics
        """
        raise NotImplementedError("Subclasses devem implementar generate_response")


class IMCCalculationHandler(AIResponseHandler):
    """Handler para intenções de cálculo de IMC."""

    def generate_response(
        self, message: str, user_context: Optional[Dict[str, Any]] = None, agent_type: str = "platform_concierge"
    ) -> Dict[str, Any]:
        """Gera resposta para cálculo de IMC."""
        health = user_context.get("health", {}) if user_context else {}

        bmi = health.get("bmi")

        if bmi:
            response_text = self._generate_bmi_response(bmi, health.get("bmi_category", ""))
        else:
            response_text = (
                "Para calcular seu IMC preciso da sua altura e peso. "
                "Use nossa calculadora de IMC em Ferramentas de Saúde! "
                "Ela fornece classificação e recomendações personalizadas."
            )

        return {
            "response": response_text,
            "suggestions": [
                "Como interpretar meu IMC?",
                "Qual é o IMC ideal para minha idade?",
                "Criar plano para melhorar meu IMC",
            ],
            "related_topics": ["IMC", "peso", "altura", "saúde"],
        }

    def _generate_bmi_response(self, bmi: float, bmi_category: str) -> str:
        """Gera texto de resposta baseado no valor do IMC."""
        if bmi < 18.5:
            return (
                f"Vejo que seu IMC atual é {bmi:.1f} (abaixo do peso). "
                f"Para ganhar peso de forma saudável, recomendo uma alimentação "
                f"balanceada rica em proteínas e carboidratos complexos, "
                f"combinada com exercícios de força."
            )
        elif bmi >= 25:
            return (
                f"Seu IMC atual é {bmi:.1f} (acima do peso ideal). "
                f"Vamos criar um plano personalizado para você! "
                f"Baseado no seu perfil, posso recomendar exercícios e "
                f"ajustes nutricionais específicos."
            )
        else:
            return (
                f"Ótimo! Seu IMC está em {bmi:.1f}, que está na faixa saudável. "
                f"Para mantê-lo assim, continue com hábitos equilibrados."
            )


class ExerciseRecommendationHandler(AIResponseHandler):
    """Handler para recomendações de exercícios."""

    def generate_response(
        self, message: str, user_context: Optional[Dict[str, Any]] = None, agent_type: str = "platform_concierge"
    ) -> Dict[str, Any]:
        """Gera resposta para recomendações de exercícios."""
        workouts = user_context.get("workouts", []) if user_context else []
        goals = user_context.get("goals", []) if user_context else []

        recent_exercises = self._extract_recent_exercises(workouts)
        goal_text = self._extract_goal_text(goals)

        if recent_exercises:
            response_text = (
                f"{goal_text}Você tem treinado recentemente: "
                f"{', '.join(recent_exercises)}. Que tal explorarmos exercícios "
                f"similares ou criar um treino que complemente sua rotina atual?"
            )
        else:
            response_text = (
                f"{goal_text}Nossa plataforma oferece uma biblioteca completa de "
                f"exercícios categorizados por dificuldade, grupos musculares e "
                f"equipamentos. Baseado no seu perfil, posso recomendar treinos "
                f"personalizados."
            )

        return {
            "response": response_text,
            "suggestions": [
                "Criar treino personalizado",
                "Ver exercícios similares",
                "Exercícios para meu objetivo",
                "Treino em casa sem equipamentos",
            ],
            "related_topics": ["exercícios", "fitness", "treino", "musculação"],
        }

    def _extract_recent_exercises(self, workouts: List[Dict]) -> List[str]:
        """Extrai nomes dos exercícios recentes."""
        if not workouts:
            return []

        return [
            w.get("name") or w.get("exercise_name") for w in workouts[:3] if w.get("name") or w.get("exercise_name")
        ]

    def _extract_goal_text(self, goals: List[Dict]) -> str:
        """Extrai texto dos objetivos do usuário."""
        if not goals:
            return ""

        goal_titles = [g.get("title", "") for g in goals[:2] if g.get("title")]
        if goal_titles:
            return f"Vejo que seus objetivos incluem: {', '.join(goal_titles)}. "
        return ""


class NutritionAdviceHandler(AIResponseHandler):
    """Handler para conselhos nutricionais."""

    def generate_response(
        self, message: str, user_context: Optional[Dict[str, Any]] = None, agent_type: str = "platform_concierge"
    ) -> Dict[str, Any]:
        """Gera resposta para conselhos nutricionais."""
        return {
            "response": (
                "A alimentação é a base da saúde! Nossa plataforma oferece um "
                "diário alimentar completo, calculadora de calorias e recomendações "
                "nutricionais personalizadas. Você pode registrar suas refeições e "
                "acompanhar seus macronutrientes diariamente."
            ),
            "suggestions": [
                "Como calcular minhas calorias diárias?",
                "Quais alimentos são mais nutritivos?",
                "Como fazer um diário alimentar?",
                "Receitas saudáveis",
            ],
            "related_topics": ["nutrição", "alimentação", "calorias", "dieta"],
        }


class ProductRecommendationHandler(AIResponseHandler):
    """Handler para recomendações de produtos."""

    def generate_response(
        self, message: str, user_context: Optional[Dict[str, Any]] = None, agent_type: str = "platform_concierge"
    ) -> Dict[str, Any]:
        """Gera resposta para recomendações de produtos."""
        purchases = user_context.get("purchases", []) if user_context else []
        goals = user_context.get("goals", []) if user_context else []

        recent_products = self._extract_recent_products(purchases)
        goal_keywords = self._extract_goal_keywords(goals)

        if recent_products:
            response_text = (
                f"Vejo que você já comprou: {', '.join(recent_products[:2])}. "
                f"Baseado nisso e nos seus objetivos, posso recomendar produtos "
                f"complementares que podem potencializar seus resultados!"
            )
        elif goal_keywords:
            response_text = (
                f"Baseado nos seus objetivos ({', '.join(goal_keywords)}), "
                f"posso recomendar produtos específicos que vão te ajudar a "
                f"alcançar suas metas mais rapidamente."
            )
        else:
            response_text = (
                "Nossa loja oferece produtos cuidadosamente selecionados! "
                "Com base no seu perfil, posso recomendar suplementos, "
                "equipamentos e produtos de saúde personalizados."
            )

        return {
            "response": response_text,
            "suggestions": [
                "Ver produtos recomendados para mim",
                "Suplementos baseados nos meus objetivos",
                "Equipamentos para meus treinos",
                "Produtos complementares às minhas compras",
            ],
            "related_topics": ["produtos", "suplementos", "equipamentos", "loja"],
        }

    def _extract_recent_products(self, purchases: List[Dict]) -> List[str]:
        """Extrai nomes dos produtos comprados recentemente."""
        recent_products = []
        if purchases:
            for purchase in purchases[:3]:
                items = purchase.get("order_items", [])
                for item in items:
                    product = item.get("products") or item.get("product", {})
                    if product:
                        recent_products.append(product.get("name", ""))
        return recent_products

    def _extract_goal_keywords(self, goals: List[Dict]) -> List[str]:
        """Extrai palavras-chave dos objetivos."""
        goal_keywords = []
        if goals:
            for goal in goals:
                title = (goal.get("title", "") or "").lower()
                if "perder peso" in title or "emagrecer" in title:
                    goal_keywords.append("perda de peso")
                elif "ganhar massa" in title or "hipertrofia" in title:
                    goal_keywords.append("ganho de massa")
        return goal_keywords


class HealthAdviceHandler(AIResponseHandler):
    """Handler para conselhos de saúde."""

    def generate_response(
        self, message: str, user_context: Optional[Dict[str, Any]] = None, agent_type: str = "platform_concierge"
    ) -> Dict[str, Any]:
        """Gera resposta para conselhos de saúde."""
        return {
            "response": (
                "Saúde e bem-estar são nossa prioridade! Nossa plataforma combina "
                "tecnologia e conhecimento para oferecer orientações personalizadas. "
                "Use nossas ferramentas de saúde para acompanhar seu progresso e "
                "receber insights valiosos."
            ),
            "suggestions": [
                "Como criar um plano de saúde?",
                "Ferramentas de monitoramento",
                "Acompanhar meu progresso",
                "Consultar especialistas",
            ],
            "related_topics": ["saúde", "bem-estar", "monitoramento", "progresso"],
        }


class DefaultHandler(AIResponseHandler):
    """Handler padrão para intenções não reconhecidas."""

    def generate_response(
        self, message: str, user_context: Optional[Dict[str, Any]] = None, agent_type: str = "platform_concierge"
    ) -> Dict[str, Any]:
        """Gera resposta padrão."""
        return {
            "response": (
                "Olá! Como posso ajudar você hoje? Posso ajudar com cálculos de saúde, "
                "recomendações de exercícios, nutrição, produtos e muito mais. "
                "O que você gostaria de saber?"
            ),
            "suggestions": [
                "Calcular meu IMC",
                "Ver exercícios recomendados",
                "Recomendações nutricionais",
                "Produtos para meus objetivos",
            ],
            "related_topics": ["saúde", "fitness", "nutrição", "produtos"],
        }


# Factory para criar handlers


def create_response_handler(intent: str) -> AIResponseHandler:
    """
    Cria handler apropriado baseado na intenção.

    Args:
        intent: Intenção identificada

    Returns:
        Handler apropriado ou DefaultHandler
    """
    handlers = {
        "imc_calculation": IMCCalculationHandler(),
        "exercise_recommendation": ExerciseRecommendationHandler(),
        "nutrition_advice": NutritionAdviceHandler(),
        "product_recommendation": ProductRecommendationHandler(),
        "health_advice": HealthAdviceHandler(),
    }

    return handlers.get(intent, DefaultHandler())
