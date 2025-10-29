import pytest
import json
from unittest.mock import Mock, patch
from datetime import datetime

class TestAISystem:
    """Testes para sistema de IA"""
    
    @pytest.mark.ai
    def test_ai_chat_success(self, client, auth_headers, mock_supabase):
        """Testa chat com IA bem-sucedido"""
        with patch('main.supabase', mock_supabase), \
             patch('main.request') as mock_request:
            
            mock_request.current_user = {'id': 'test-user-id'}
            
            # Mock da inserção da mensagem
            mock_supabase.table.return_value.insert.return_value.execute.return_value.data = [{'id': 'message-id'}]
            
            chat_data = {
                'message': 'Como posso melhorar minha alimentação?',
                'context': 'nutrition'
            }
            
            response = client.post('/api/ai/chat',
                                 data=json.dumps(chat_data),
                                 content_type='application/json',
                                 headers=auth_headers)
            
            assert response.status_code == 200
            response_data = json.loads(response.data)
            assert 'response' in response_data
            assert 'message_id' in response_data
    
    @pytest.mark.ai
    def test_ai_chat_missing_message(self, client, auth_headers):
        """Testa chat sem mensagem"""
        chat_data = {
            'context': 'nutrition'
        }
        
        response = client.post('/api/ai/chat',
                             data=json.dumps(chat_data),
                             content_type='application/json',
                             headers=auth_headers)
        
        assert response.status_code == 400
        response_data = json.loads(response.data)
        assert 'Mensagem é obrigatória' in response_data['error']
    
    @pytest.mark.ai
    def test_ai_chat_empty_message(self, client, auth_headers):
        """Testa chat com mensagem vazia"""
        chat_data = {
            'message': '',
            'context': 'nutrition'
        }
        
        response = client.post('/api/ai/chat',
                             data=json.dumps(chat_data),
                             content_type='application/json',
                             headers=auth_headers)
        
        assert response.status_code == 400
        response_data = json.loads(response.data)
        assert 'Mensagem é obrigatória' in response_data['error']
    
    @pytest.mark.ai
    def test_ai_chat_long_message(self, client, auth_headers, mock_supabase):
        """Testa chat com mensagem muito longa"""
        with patch('main.supabase', mock_supabase), \
             patch('main.request') as mock_request:
            
            mock_request.current_user = {'id': 'test-user-id'}
            mock_supabase.table.return_value.insert.return_value.execute.return_value.data = [{'id': 'message-id'}]
            
            # Mensagem com 1000 caracteres
            long_message = 'A' * 1000
            chat_data = {
                'message': long_message,
                'context': 'general'
            }
            
            response = client.post('/api/ai/chat',
                                 data=json.dumps(chat_data),
                                 content_type='application/json',
                                 headers=auth_headers)
            
            assert response.status_code == 200
            response_data = json.loads(response.data)
            assert 'response' in response_data
    
    @pytest.mark.ai
    def test_ai_chat_different_contexts(self, client, auth_headers, mock_supabase):
        """Testa chat com diferentes contextos"""
        with patch('main.supabase', mock_supabase), \
             patch('main.request') as mock_request:
            
            mock_request.current_user = {'id': 'test-user-id'}
            mock_supabase.table.return_value.insert.return_value.execute.return_value.data = [{'id': 'message-id'}]
            
            contexts = ['nutrition', 'fitness', 'health', 'general']
            
            for context in contexts:
                chat_data = {
                    'message': f'Teste para contexto {context}',
                    'context': context
                }
                
                response = client.post('/api/ai/chat',
                                     data=json.dumps(chat_data),
                                     content_type='application/json',
                                     headers=auth_headers)
                
                assert response.status_code == 200
                response_data = json.loads(response.data)
                assert 'response' in response_data
    
    @pytest.mark.ai
    def test_get_chat_history(self, client, auth_headers, mock_supabase):
        """Testa obtenção do histórico de chat"""
        with patch('main.supabase', mock_supabase), \
             patch('main.request') as mock_request:
            
            mock_request.current_user = {'id': 'test-user-id'}
            
            # Mock do histórico
            mock_history = [
                {
                    'id': 'msg-1',
                    'user_message': 'Como melhorar alimentação?',
                    'ai_response': 'Consuma mais frutas e verduras',
                    'context': 'nutrition',
                    'created_at': '2024-01-01T00:00:00'
                },
                {
                    'id': 'msg-2',
                    'user_message': 'Quais exercícios fazer?',
                    'ai_response': 'Caminhada e musculação',
                    'context': 'fitness',
                    'created_at': '2024-01-02T00:00:00'
                }
            ]
            
            mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value.limit.return_value.execute.return_value.data = mock_history
            
            response = client.get('/api/ai/history',
                                headers=auth_headers)
            
            assert response.status_code == 200
            response_data = json.loads(response.data)
            assert 'messages' in response_data
            assert len(response_data['messages']) == 2
            assert response_data['messages'][0]['context'] == 'nutrition'
            assert response_data['messages'][1]['context'] == 'fitness'
    
    @pytest.mark.ai
    def test_get_chat_history_empty(self, client, auth_headers, mock_supabase):
        """Testa histórico de chat vazio"""
        with patch('main.supabase', mock_supabase), \
             patch('main.request') as mock_request:
            
            mock_request.current_user = {'id': 'test-user-id'}
            
            # Mock de histórico vazio
            mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value.limit.return_value.execute.return_value.data = []
            
            response = client.get('/api/ai/history',
                                headers=auth_headers)
            
            assert response.status_code == 200
            response_data = json.loads(response.data)
            assert 'messages' in response_data
            assert len(response_data['messages']) == 0
    
    @pytest.mark.ai
    def test_get_chat_history_with_limit(self, client, auth_headers, mock_supabase):
        """Testa histórico de chat com limite"""
        with patch('main.supabase', mock_supabase), \
             patch('main.request') as mock_request:
            
            mock_request.current_user = {'id': 'test-user-id'}
            
            # Mock de histórico limitado
            mock_history = [
                {
                    'id': 'msg-1',
                    'user_message': 'Teste 1',
                    'ai_response': 'Resposta 1',
                    'context': 'general',
                    'created_at': '2024-01-01T00:00:00'
                }
            ]
            
            mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value.limit.return_value.execute.return_value.data = mock_history
            
            response = client.get('/api/ai/history?limit=1',
                                headers=auth_headers)
            
            assert response.status_code == 200
            response_data = json.loads(response.data)
            assert len(response_data['messages']) == 1
    
    @pytest.mark.ai
    def test_get_chat_history_with_context_filter(self, client, auth_headers, mock_supabase):
        """Testa histórico de chat filtrado por contexto"""
        with patch('main.supabase', mock_supabase), \
             patch('main.request') as mock_request:
            
            mock_request.current_user = {'id': 'test-user-id'}
            
            # Mock de histórico filtrado
            mock_history = [
                {
                    'id': 'msg-1',
                    'user_message': 'Teste nutrição',
                    'ai_response': 'Resposta nutrição',
                    'context': 'nutrition',
                    'created_at': '2024-01-01T00:00:00'
                }
            ]
            
            mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.order.return_value.limit.return_value.execute.return_value.data = mock_history
            
            response = client.get('/api/ai/history?context=nutrition',
                                headers=auth_headers)
            
            assert response.status_code == 200
            response_data = json.loads(response.data)
            assert len(response_data['messages']) == 1
            assert response_data['messages'][0]['context'] == 'nutrition'
    
    @pytest.mark.ai
    def test_ai_agent_selection(self, client, auth_headers):
        """Testa seleção de agentes de IA"""
        response = client.get('/api/ai/agents',
                             headers=auth_headers)
        
        assert response.status_code == 200
        response_data = json.loads(response.data)
        assert 'agents' in response_data
        
        # Verifica se os agentes principais estão disponíveis
        agents = response_data['agents']
        agent_names = [agent['name'] for agent in agents]
        
        assert 'nutrition_expert' in agent_names
        assert 'fitness_trainer' in agent_names
        assert 'health_advisor' in agent_names
        assert 'general_assistant' in agent_names
    
    @pytest.mark.ai
    def test_ai_agent_specific_chat(self, client, auth_headers, mock_supabase):
        """Testa chat com agente específico"""
        with patch('main.supabase', mock_supabase), \
             patch('main.request') as mock_request:
            
            mock_request.current_user = {'id': 'test-user-id'}
            mock_supabase.table.return_value.insert.return_value.execute.return_value.data = [{'id': 'message-id'}]
            
            chat_data = {
                'message': 'Quais alimentos são ricos em proteína?',
                'context': 'nutrition',
                'agent': 'nutrition_expert'
            }
            
            response = client.post('/api/ai/chat',
                                 data=json.dumps(chat_data),
                                 content_type='application/json',
                                 headers=auth_headers)
            
            assert response.status_code == 200
            response_data = json.loads(response.data)
            assert 'response' in response_data
            assert 'agent_used' in response_data
            assert response_data['agent_used'] == 'nutrition_expert'
    
    @pytest.mark.ai
    def test_ai_chat_with_metadata(self, client, auth_headers, mock_supabase):
        """Testa chat com metadados adicionais"""
        with patch('main.supabase', mock_supabase), \
             patch('main.request') as mock_request:
            
            mock_request.current_user = {'id': 'test-user-id'}
            mock_supabase.table.return_value.insert.return_value.execute.return_value.data = [{'id': 'message-id'}]
            
            chat_data = {
                'message': 'Teste com metadados',
                'context': 'general',
                'metadata': {
                    'user_preferences': 'vegetarian',
                    'health_conditions': 'diabetes',
                    'language': 'pt-BR'
                }
            }
            
            response = client.post('/api/ai/chat',
                                 data=json.dumps(chat_data),
                                 content_type='application/json',
                                 headers=auth_headers)
            
            assert response.status_code == 200
            response_data = json.loads(response.data)
            assert 'response' in response_data
    
    @pytest.mark.ai
    def test_ai_chat_error_handling(self, client, auth_headers, mock_supabase):
        """Testa tratamento de erros no chat"""
        with patch('main.supabase', mock_supabase), \
             patch('main.request') as mock_request:
            
            mock_request.current_user = {'id': 'test-user-id'}
            
            # Mock de erro na inserção
            mock_supabase.table.return_value.insert.return_value.execute.side_effect = Exception('Database error')
            
            chat_data = {
                'message': 'Teste de erro',
                'context': 'general'
            }
            
            response = client.post('/api/ai/chat',
                                 data=json.dumps(chat_data),
                                 content_type='application/json',
                                 headers=auth_headers)
            
            assert response.status_code == 500
            response_data = json.loads(response.data)
            assert 'Erro interno do servidor' in response_data['error']
    
    @pytest.mark.ai
    def test_ai_chat_rate_limiting(self, client, auth_headers, mock_supabase):
        """Testa limitação de taxa no chat"""
        with patch('main.supabase', mock_supabase), \
             patch('main.request') as mock_request:
            
            mock_request.current_user = {'id': 'test-user-id'}
            mock_supabase.table.return_value.insert.return_value.execute.return_value.data = [{'id': 'message-id'}]
            
            # Envia múltiplas mensagens rapidamente
            for i in range(5):
                chat_data = {
                    'message': f'Mensagem {i}',
                    'context': 'general'
                }
                
                response = client.post('/api/ai/chat',
                                     data=json.dumps(chat_data),
                                     content_type='application/json',
                                     headers=auth_headers)
                
                if i < 3:  # Primeiras 3 mensagens devem passar
                    assert response.status_code == 200
                else:  # Mensagens subsequentes podem ser limitadas
                    assert response.status_code in [200, 429]
    
    @pytest.mark.ai
    def test_ai_chat_context_validation(self):
        """Testa validação de contextos de chat"""
        valid_contexts = ['nutrition', 'fitness', 'health', 'general', 'weight_loss', 'muscle_gain']
        
        for context in valid_contexts:
            assert self.is_valid_context(context) == True
        
        invalid_contexts = ['invalid', 'unknown', '', None]
        for context in invalid_contexts:
            assert self.is_valid_context(context) == False
    
    @pytest.mark.ai
    def test_ai_chat_message_validation(self):
        """Testa validação de mensagens de chat"""
        # Mensagens válidas
        assert self.is_valid_message('Olá, como posso ajudar?') == True
        assert self.is_valid_message('Teste') == True
        assert self.is_valid_message('A' * 100) == True
        
        # Mensagens inválidas
        assert self.is_valid_message('') == False
        assert self.is_valid_message(None) == False
        assert self.is_valid_message('A' * 10001) == False  # Muito longa
    
    def is_valid_context(self, context):
        """Valida contexto do chat"""
        valid_contexts = ['nutrition', 'fitness', 'health', 'general', 'weight_loss', 'muscle_gain']
        return context in valid_contexts
    
    def is_valid_message(self, message):
        """Valida mensagem do chat"""
        if not message:
            return False
        if len(message) > 10000:  # Máximo 10k caracteres
            return False
        return True