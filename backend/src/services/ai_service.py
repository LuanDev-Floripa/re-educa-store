"""
Serviço de IA Inteligente RE-EDUCA Store.

Gerencia interações com IA incluindo:
- Processamento de mensagens de chat
- Análise de intenção do usuário
- Recomendações contextuais
- Histórico de conversas
- Fallback para indisponibilidade
"""
from typing import Dict, Any, Optional
from datetime import datetime
from services.base_service import BaseService
from services.user_service import UserService
from services.health_service import HealthService
from services.order_service import OrderService
from services.exercise_service import ExerciseService


class AIService(BaseService):
    """
    Service para operações de IA e chat inteligente.

    CORRIGIDO: Agora usa outros services para buscar contexto.
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
        agent_type: str = 'platform_concierge',
        user_context: Optional[Dict[str, Any]] = None,
        context_summary: Optional[str] = None
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
                context_summary=context_summary
            )

            # Salva a conversa no histórico
            self._save_chat_message(
                user_id,
                message,
                response['response'],
                agent_type=agent_type,
                intent=intent
            )

            return {
                'success': True,
                'data': response
            }

        except Exception as e:
            self.logger.error(f"Erro ao processar mensagem: {str(e)}")
            return {'success': False, 'error': str(e)}

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
        if any(word in message_lower for word in ['imc', 'peso', 'altura', 'massa corporal', 'calcular imc']):
            return 'imc_calculation'
        elif any(word in message_lower for word in [
                'exercício', 'treino', 'musculação', 'cardio',
                'treinar', 'academia'
            ]):
            return 'exercise_recommendation'
        elif any(word in message_lower for word in [
                'alimentação', 'comida', 'nutrição', 'dieta',
                'calorias', 'refeição'
            ]):
            return 'nutrition_advice'
        elif any(word in message_lower for word in [
                'produto', 'comprar', 'loja', 'suplemento',
                'produtos recomendados'
            ]):
            return 'product_recommendation'
        elif any(word in message_lower for word in ['saúde', 'bem-estar', 'fitness', 'progresso', 'resultados']):
            return 'health_advice'
        elif any(word in message_lower for word in ['obrigado', 'valeu', 'thanks', 'agradeço']):
            return 'gratitude'
        elif any(word in message_lower for word in ['objetivo', 'meta', 'alcançar', 'quero']):
            return 'goal_setting'
        elif any(word in message_lower for word in ['progresso', 'evolução', 'como estou', 'resultado']):
            return 'progress_inquiry'
        else:
            return 'general'

    def _get_user_context(self, user_id: str) -> Dict[str, Any]:
        """
        Busca contexto completo do usuário para IA preditiva.

        CORRIGIDO: Agora usa outros services em vez de queries diretas.

        Args:
            user_id (str): ID do usuário

        Returns:
            dict: Contexto do usuário (perfil, saúde, atividades, etc.)
        """
        try:
            # ✅ CORRIGIDO: Busca dados do usuário via UserService
            profile = self.user_service.get_user_by_id(user_id) or {}

            # ✅ CORRIGIDO: Buscar dados de saúde via HealthService
            health_analytics = self.health_service.get_health_analytics(user_id, period_days=30)
            health = health_analytics.get('health', {}) if health_analytics else {}

            # ✅ CORRIGIDO: Buscar atividades recentes via UserService
            activities_result = self.user_service.get_user_activities(user_id, page=1, per_page=10)
            activities = activities_result.get('activities', []) if activities_result else []

            # ✅ CORRIGIDO: Buscar compras via OrderService
            orders_result = self.order_service.get_user_orders(user_id, page=1, per_page=5)
            purchases = orders_result.get('orders', []) if orders_result else []

            # ✅ CORRIGIDO: Buscar objetivos via GoalRepository
            try:
                from repositories.goal_repository import GoalRepository
                goal_repo = GoalRepository()
                goals = goal_repo.find_active_by_user(user_id)
            except Exception as e:
                self.logger.warning(f"Erro ao buscar goals: {e}")
                goals = []

            # ✅ CORRIGIDO: Buscar treinos via WorkoutRepository
            try:
                from repositories.workout_repository import WorkoutRepository
                workout_repo = WorkoutRepository()
                workouts = workout_repo.find_recent(user_id, limit=5)
            except Exception as e:
                self.logger.warning(f"Erro ao buscar workouts: {e}")
                workouts = []

            return {
                'profile': profile,
                'health': health,
                'activities': activities,
                'purchases': purchases,
                'goals': goals,
                'workouts': workouts,
            }

        except Exception as e:
            self.logger.error(f"Erro ao buscar contexto do usuário: {str(e)}")
            return {}

    def _generate_response(
        self,
        user_id: str,
        message: str,
        intent: str,
        agent_type: str = 'platform_concierge',
        user_context: Optional[Dict[str, Any]] = None,
        context_summary: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Gera resposta baseada na intenção e contexto do usuário para IA preditiva.

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

        # Respostas preditivas baseadas em contexto do usuário
        if intent == 'imc_calculation':
            health = user_context.get('health', {}) if user_context else {}
            profile = user_context.get('profile', {}) if user_context else {}

            bmi = health.get('bmi')
            height = health.get('height') or profile.get('height')
            weight = health.get('weight') or profile.get('weight')

            if bmi:
                bmi_category = health.get('bmi_category', '')
                if bmi < 18.5:
                    response_text = (
                        f"Vejo que seu IMC atual é {bmi:.1f} (abaixo do peso). "
                        f"Para ganhar peso de forma saudável, recomendo uma alimentação "
                        f"balanceada rica em proteínas e carboidratos complexos, "
                        f"combinada com exercícios de força."
                    )
                elif bmi >= 25:
                    response_text = (
                        f"Seu IMC atual é {bmi:.1f} (acima do peso ideal). "
                        f"Vamos criar um plano personalizado para você! "
                        f"Baseado no seu perfil, posso recomendar exercícios e "
                        f"ajustes nutricionais específicos."
                    )
                else:
                    response_text = (
                        f"Ótimo! Seu IMC está em {bmi:.1f}, que está na faixa saudável. "
                        f"Para mantê-lo assim, continue com hábitos equilibrados."
                    )
            else:
                response_text = (
                    "Para calcular seu IMC preciso da sua altura e peso. "
                    "Use nossa calculadora de IMC em Ferramentas de Saúde! "
                    "Ela fornece classificação e recomendações personalizadas."
                )

            return {
                'response': response_text,
                'suggestions': [
                    'Como interpretar meu IMC?',
                    'Qual é o IMC ideal para minha idade?',
                    'Criar plano para melhorar meu IMC'
                ],
                'related_topics': ['IMC', 'peso', 'altura', 'saúde']
            }

        elif intent == 'exercise_recommendation':
            workouts = user_context.get('workouts', []) if user_context else []
            goals = user_context.get('goals', []) if user_context else []
            health = user_context.get('health', {}) if user_context else {}

            # Analisar treinos recentes
            recent_exercises = []
            if workouts:
                recent_exercises = [
                    w.get('name') or w.get('exercise_name')
                    for w in workouts[:3]
                    if w.get('name') or w.get('exercise_name')
                ]

            # Analisar objetivos
            goal_text = ""
            if goals:
                goal_titles = [g.get('title', '') for g in goals[:2] if g.get('title')]
                if goal_titles:
                    goal_text = f"Vejo que seus objetivos incluem: {', '.join(goal_titles)}. "

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
                'response': response_text,
                'suggestions': [
                    'Criar treino personalizado',
                    'Ver exercícios similares',
                    'Exercícios para meu objetivo',
                    'Treino em casa sem equipamentos'
                ],
                'related_topics': ['exercícios', 'fitness', 'treino', 'musculação']
            }

        elif intent == 'nutrition_advice':
            return {
                'response': (
                    "A alimentação é a base da saúde! Nossa plataforma oferece um "
                    "diário alimentar completo, calculadora de calorias e recomendações "
                    "nutricionais personalizadas. Você pode registrar suas refeições e "
                    "acompanhar seus macronutrientes diariamente."
                ),
                'suggestions': [
                    'Como calcular minhas calorias diárias?',
                    'Quais alimentos são mais nutritivos?',
                    'Como fazer um diário alimentar?',
                    'Receitas saudáveis'
                ],
                'related_topics': ['nutrição', 'alimentação', 'calorias', 'dieta']
            }

        elif intent == 'product_recommendation':
            purchases = user_context.get('purchases', []) if user_context else []
            goals = user_context.get('goals', []) if user_context else []
            health = user_context.get('health', {}) if user_context else {}

            # Analisar compras recentes
            recent_products = []
            if purchases:
                for purchase in purchases[:3]:
                    items = purchase.get('order_items', [])
                    for item in items:
                        product = item.get('products') or item.get('product', {})
                        if product:
                            recent_products.append(product.get('name', ''))

            # Analisar objetivos para recomendações
            goal_keywords = []
            if goals:
                for goal in goals:
                    title = (goal.get('title', '') or '').lower()
                    if 'perder peso' in title or 'emagrecer' in title:
                        goal_keywords.append('perda de peso')
                    elif 'ganhar massa' in title or 'hipertrofia' in title:
                        goal_keywords.append('ganho de massa')

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
                'response': response_text,
                'suggestions': [
                    'Ver produtos recomendados para mim',
                    'Suplementos baseados nos meus objetivos',
                    'Equipamentos para meus treinos',
                    'Produtos complementares às minhas compras'
                ],
                'related_topics': ['produtos', 'suplementos', 'equipamentos', 'loja']
            }

        elif intent == 'health_advice':
            return {
                'response': (
                    "Saúde e bem-estar são nossa prioridade! Nossa plataforma combina "
                    "tecnologia e conhecimento para oferecer orientações personalizadas. "
                    "Use nossas ferramentas de saúde para acompanhar seu progresso e "
                    "receber insights valiosos."
                ),
                'suggestions': [
                    'Como criar um plano de saúde?',
                    'Ferramentas de monitoramento',
                    'Dicas de bem-estar',
                    'Como manter a motivação?'
                ],
                'related_topics': ['saúde', 'bem-estar', 'fitness', 'qualidade de vida']
            }

        elif intent == 'gratitude':
            return {
                'response': (
                    "De nada! Fico feliz em poder ajudar. Estou aqui sempre que "
                    "precisar de orientações sobre saúde, exercícios, nutrição ou "
                    "qualquer dúvida sobre nossa plataforma. Continue cuidando da "
                    "sua saúde! 💪"
                ),
                'suggestions': [
                    'Como posso melhorar ainda mais?',
                    'Novas funcionalidades da plataforma',
                    'Dicas de motivação'
                ],
                'related_topics': ['motivação', 'progresso', 'objetivos']
            }

        else:  # general
            # Resposta geral personalizada baseada em contexto
            profile = user_context.get('profile', {}) if user_context else {}
            name = profile.get('name') or profile.get('first_name', '')

            if name:
                first_name = name.split()[0] if name.split() else ''
                greeting = f"Olá, {first_name}!" if first_name else "Olá!"
            else:
                greeting = "Olá!"

            return {
                'response': (
                    f"{greeting} Entendi que você disse: '{message}'. Sou seu "
                    f"assistente de IA personalizado e tenho acesso ao seu perfil "
                    f"completo. Posso ajudar com recomendações de saúde, exercícios, "
                    f"nutrição, produtos e muito mais! Como posso te ajudar hoje?"
                ),
                'suggestions': [
                    'Recomende exercícios para mim',
                    'Como melhorar minha alimentação?',
                    'Calcular meu IMC',
                    'Ver produtos recomendados'
                ],
                'related_topics': ['saúde', 'exercícios', 'nutrição', 'produtos']
            }

    def _save_chat_message(
        self,
        user_id: str,
        user_message: str,
        ai_response: str,
        agent_type: str = 'platform_concierge',
        intent: str = 'general'
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
                'user_id': user_id,
                'user_message': user_message,
                'ai_response': ai_response,
                'agent_type': agent_type,
                'intent': intent,
                'created_at': datetime.now().isoformat()
            }

            # ✅ CORRIGIDO: Usa repositório
            from repositories.ai_repository import AIRepository
            repo = AIRepository()
            created_message = repo.create_chat_message(chat_data)
            return created_message

        except Exception as e:
            self.logger.error(f"Erro ao salvar chat: {str(e)}")
            # Não falha a operação se não conseguir salvar

    def get_chat_history(self, user_id: str, limit: int = 50) -> Dict[str, Any]:
        """Obtém histórico de chat do usuário"""
        try:
            # ✅ CORRIGIDO: Usa repositório
            from repositories.ai_repository import AIRepository
            repo = AIRepository()
            messages = repo.find_by_user(user_id, limit=limit)

            return {
                'success': True,
                'data': messages or []
            }

        except Exception as e:
            self.logger.error(f"Erro ao obter histórico: {str(e)}")
            return {'success': False, 'error': str(e)}

    def analyze_image(self, user_id: str, image_file, analysis_type: str = 'general') -> Dict[str, Any]:
        """Analisa imagem com IA"""
        try:
            # Simula análise baseada no tipo
            if analysis_type == 'food':
                return {
                    'success': True,
                    'data': {
                        'food_name': 'Alimento Identificado',
                        'description': (
                            'Este parece ser um alimento saudável. Recomendo verificar '
                            'as informações nutricionais.'
                        ),
                        'confidence': 85.0,
                        'category': 'Alimento',
                        'nutritional_info': {
                            'calories': '~200 kcal',
                            'protein': '~15g',
                            'carbs': '~25g',
                            'fat': '~8g'
                        },
                        'recommendations': [
                            'Adicione este alimento ao seu diário alimentar',
                            'Verifique a porção adequada para seus objetivos',
                            'Combine com outros alimentos nutritivos'
                        ]
                    }
                }
            elif analysis_type == 'exercise':
                return {
                    'success': True,
                    'data': {
                        'exercise_name': 'Exercício Identificado',
                        'description': 'Este exercício é excelente para fortalecimento muscular.',
                        'confidence': 80.0,
                        'difficulty': 'Intermediário',
                        'muscle_groups': ['Peito', 'Ombros', 'Tríceps'],
                        'equipment': 'Peso livre',
                        'form_tips': [
                            'Mantenha a postura ereta',
                            'Controle o movimento',
                            'Respire corretamente durante o exercício'
                        ]
                    }
                }
            else:
                return {
                    'success': True,
                    'data': {
                        'description': (
                            'Análise geral da imagem concluída. Identifiquei elementos '
                            'relacionados à saúde e bem-estar.'
                        ),
                        'confidence': 75.0,
                        'objects': [
                            {'name': 'Objeto de saúde', 'confidence': 85},
                            {'name': 'Elemento fitness', 'confidence': 70}
                        ],
                        'tags': ['saúde', 'bem-estar', 'fitness']
                    }
                }

        except Exception as e:
            self.logger.error(f"Erro na análise de imagem: {str(e)}")
            return {'success': False, 'error': str(e)}
