"""
Serviço de IA Inteligente RE-EDUCA Store
"""
import logging
import re
from typing import Dict, Any, List, Optional
from datetime import datetime
from config.database import supabase_client

logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        self.logger = logger
        self.supabase = supabase_client
        
    def process_chat_message(self, user_id: str, message: str) -> Dict[str, Any]:
        """Processa mensagem do chat com IA"""
        try:
            # Analisa a intenção da mensagem
            intent = self._analyze_intent(message)
            
            # Gera resposta baseada na intenção
            response = self._generate_response(user_id, message, intent)
            
            # Salva a conversa no histórico
            self._save_chat_message(user_id, message, response['response'])
            
            return {
                'success': True,
                'data': response
            }
            
        except Exception as e:
            self.logger.error(f"Erro ao processar mensagem: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def _analyze_intent(self, message: str) -> str:
        """Analisa a intenção da mensagem do usuário"""
        message_lower = message.lower()
        
        # Padrões de intenção
        if any(word in message_lower for word in ['imc', 'peso', 'altura', 'massa corporal']):
            return 'imc_calculation'
        elif any(word in message_lower for word in ['exercício', 'treino', 'musculação', 'cardio']):
            return 'exercise_recommendation'
        elif any(word in message_lower for word in ['alimentação', 'comida', 'nutrição', 'dieta']):
            return 'nutrition_advice'
        elif any(word in message_lower for word in ['produto', 'comprar', 'loja', 'suplemento']):
            return 'product_recommendation'
        elif any(word in message_lower for word in ['saúde', 'bem-estar', 'fitness']):
            return 'health_advice'
        elif any(word in message_lower for word in ['obrigado', 'valeu', 'thanks']):
            return 'gratitude'
        else:
            return 'general'
    
    def _generate_response(self, user_id: str, message: str, intent: str) -> Dict[str, Any]:
        """Gera resposta baseada na intenção"""
        
        if intent == 'imc_calculation':
            return {
                'response': "Para calcular seu IMC, você precisa da sua altura e peso. Use nossa calculadora de IMC em Ferramentas de Saúde! Ela não só calcula seu IMC, mas também fornece uma classificação e recomendações personalizadas baseadas no resultado.",
                'suggestions': [
                    'Como interpretar meu IMC?',
                    'Qual é o IMC ideal para minha idade?',
                    'Como melhorar meu IMC?'
                ],
                'related_topics': ['IMC', 'peso', 'altura', 'saúde']
            }
        
        elif intent == 'exercise_recommendation':
            return {
                'response': "Excelente! Exercícios são fundamentais para a saúde. Nossa plataforma oferece uma biblioteca completa de exercícios categorizados por dificuldade, grupos musculares e equipamentos necessários. Que tipo de exercício você gostaria de fazer?",
                'suggestions': [
                    'Exercícios para iniciantes',
                    'Treino de musculação',
                    'Exercícios cardiovasculares',
                    'Treino em casa sem equipamentos'
                ],
                'related_topics': ['exercícios', 'fitness', 'treino', 'musculação']
            }
        
        elif intent == 'nutrition_advice':
            return {
                'response': "A alimentação é a base da saúde! Nossa plataforma oferece um diário alimentar completo, calculadora de calorias e recomendações nutricionais personalizadas. Você pode registrar suas refeições e acompanhar seus macronutrientes diariamente.",
                'suggestions': [
                    'Como calcular minhas calorias diárias?',
                    'Quais alimentos são mais nutritivos?',
                    'Como fazer um diário alimentar?',
                    'Receitas saudáveis'
                ],
                'related_topics': ['nutrição', 'alimentação', 'calorias', 'dieta']
            }
        
        elif intent == 'product_recommendation':
            return {
                'response': "Nossa loja oferece produtos cuidadosamente selecionados para sua saúde e bem-estar! Com base no seu perfil e objetivos, posso recomendar suplementos, equipamentos de exercício e produtos de saúde personalizados.",
                'suggestions': [
                    'Suplementos para iniciantes',
                    'Equipamentos de exercício',
                    'Produtos para perda de peso',
                    'Suplementos para ganho de massa'
                ],
                'related_topics': ['produtos', 'suplementos', 'equipamentos', 'loja']
            }
        
        elif intent == 'health_advice':
            return {
                'response': "Saúde e bem-estar são nossa prioridade! Nossa plataforma combina tecnologia e conhecimento para oferecer orientações personalizadas. Use nossas ferramentas de saúde para acompanhar seu progresso e receber insights valiosos.",
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
                'response': "De nada! Fico feliz em poder ajudar. Estou aqui sempre que precisar de orientações sobre saúde, exercícios, nutrição ou qualquer dúvida sobre nossa plataforma. Continue cuidando da sua saúde! 💪",
                'suggestions': [
                    'Como posso melhorar ainda mais?',
                    'Novas funcionalidades da plataforma',
                    'Dicas de motivação'
                ],
                'related_topics': ['motivação', 'progresso', 'objetivos']
            }
        
        else:
            return {
                'response': f"Olá! Entendi que você disse: '{message}'. Sou seu assistente de IA personalizado e posso ajudar com recomendações de saúde, exercícios, nutrição, produtos e muito mais! Como posso te ajudar hoje?",
                'suggestions': [
                    'Recomende exercícios para mim',
                    'Como melhorar minha alimentação?',
                    'Calcular meu IMC',
                    'Ver produtos recomendados'
                ],
                'related_topics': ['saúde', 'exercícios', 'nutrição', 'produtos']
            }
    
    def _save_chat_message(self, user_id: str, user_message: str, ai_response: str):
        """Salva mensagem no histórico de chat"""
        try:
            chat_data = {
                'user_id': user_id,
                'user_message': user_message,
                'ai_response': ai_response,
                'created_at': datetime.now().isoformat()
            }
            
            result = self.supabase.table('ai_chat_history').insert(chat_data).execute()
            return result
            
        except Exception as e:
            self.logger.error(f"Erro ao salvar chat: {str(e)}")
            # Não falha a operação se não conseguir salvar
    
    def get_chat_history(self, user_id: str, limit: int = 50) -> Dict[str, Any]:
        """Obtém histórico de chat do usuário"""
        try:
            result = self.supabase.table('ai_chat_history')\
                .select('*')\
                .eq('user_id', user_id)\
                .order('created_at', desc=True)\
                .limit(limit)\
                .execute()
            
            return {
                'success': True,
                'data': result.data or []
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
                        'description': 'Este parece ser um alimento saudável. Recomendo verificar as informações nutricionais.',
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
                        'description': 'Análise geral da imagem concluída. Identifiquei elementos relacionados à saúde e bem-estar.',
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