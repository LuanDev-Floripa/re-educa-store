# -*- coding: utf-8 -*-
"""
Configuração do Banco de Dados RE-EDUCA Store - Supabase.

Módulo responsável pela configuração e conexão com o banco
de dados Supabase via API REST PostgREST.
"""
import os
import logging
import requests
from typing import Optional, Dict, Any, List

# Carregar variáveis de ambiente do arquivo .env
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # dotenv não está disponível

logger = logging.getLogger(__name__)

# Configuração Supabase
SUPABASE_URL = os.environ.get('SUPABASE_URL', 'https://hgfrntbtqsarencqzsla.supabase.co')
SUPABASE_ANON_KEY = os.environ.get('SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhnZnJudGJ0cXNhcmVuY3F6c2xhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyMzgyMDcsImV4cCI6MjA3NjgxNDIwN30.zjknkqDHmpq12uq24raW3PCMcpFfNWkNllH5r5n5a3E')

def test_db_connection():
    """
    Testa a conexão com o banco de dados Supabase.
    
    Returns:
        bool: True se a conexão foi bem-sucedida, False caso contrário.
    """
    try:
        headers = {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': f'Bearer {SUPABASE_ANON_KEY}',
            'Content-Type': 'application/json'
        }
        
        # Testa conexão fazendo uma requisição simples
        response = requests.get(f"{SUPABASE_URL}/rest/v1/", headers=headers, timeout=10)
        response.raise_for_status()
        
        logger.info("Conexão com Supabase estabelecida com sucesso")
        return True
        
    except Exception as e:
        logger.error(f"Erro ao conectar com Supabase: {e}")
        return False

def get_supabase_client():
    """
    Retorna um cliente Supabase simplificado.
    
    Returns:
        SupabaseClient: Instância do cliente Supabase.
    """
    return SupabaseClient()

class SupabaseClient:
    """
    Cliente simplificado para Supabase usando API REST.
    
    Fornece métodos para interagir com o banco de dados Supabase
    através da API PostgREST com tratamento de erros robusto.
    """
    
    def __init__(self):
        """Inicializa o cliente com configurações do Supabase."""
        self.url = SUPABASE_URL
        self.anon_key = SUPABASE_ANON_KEY
        self.headers = {
            'apikey': self.anon_key,
            'Authorization': f'Bearer {self.anon_key}',
            'Content-Type': 'application/json'
        }
    
    def table(self, table_name: str):
        """
        Retorna um objeto Table para operações na tabela especificada.
        
        Compatível com a API do supabase-python para manter consistência.
        
        Args:
            table_name (str): Nome da tabela.
            
        Returns:
            TableQueryBuilder: Builder para construir queries na tabela.
        """
        return TableQueryBuilder(self, table_name)
    
    def _make_request(
        self, 
        method: str, 
        endpoint: str, 
        data: Optional[Dict] = None, 
        params: Optional[Dict] = None
    ) -> Dict:
        """
        Faz uma requisição para a API do Supabase.
        
        Args:
            method (str): Método HTTP.
            endpoint (str): Endpoint da API.
            data (Optional[Dict]): Dados para POST/PUT/PATCH.
            params (Optional[Dict]): Parâmetros de query para GET.
            
        Returns:
            Dict: Resposta da API ou dicionário de erro.
        """
        url = f"{self.url}/rest/v1/{endpoint}"
        
        try:
            if method.upper() == 'GET':
                response = requests.get(url, headers=self.headers, params=params, timeout=10)
            elif method.upper() == 'POST':
                response = requests.post(url, headers=self.headers, json=data, timeout=10)
            elif method.upper() == 'PUT':
                response = requests.put(url, headers=self.headers, json=data, timeout=10)
            elif method.upper() == 'PATCH':
                response = requests.patch(url, headers=self.headers, json=data, timeout=10)
            elif method.upper() == 'DELETE':
                response = requests.delete(url, headers=self.headers, timeout=10)
            else:
                raise ValueError(f"Método HTTP não suportado: {method}")
            
            response.raise_for_status()
            return response.json() if response.content else {}
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Erro na requisição Supabase: {e}")
            return {'error': str(e)}
    
    # Métodos para usuários
    def get_user_by_email(self, email: str) -> Optional[Dict]:
        """Busca usuário por email"""
        params = {'email': f'eq.{email}'}
        result = self._make_request('GET', 'users', params=params)
        if isinstance(result, list) and len(result) > 0 and 'error' not in result:
            return result[0]
        elif isinstance(result, dict) and 'error' in result:
            return None
        return None
    
    def create_user(self, user_data: Dict) -> Optional[Dict]:
        """Cria um novo usuário"""
        result = self._make_request('POST', 'users', user_data)
        # PostgREST retorna lista quando cria com sucesso
        if isinstance(result, list) and len(result) > 0:
            return result[0]
        elif isinstance(result, dict) and 'error' not in result:
            return result
        return None
    
    def update_user(self, user_id: str, user_data: Dict) -> Optional[Dict]:
        """Atualiza um usuário"""
        return self._make_request('PATCH', f'users?id=eq.{user_id}', user_data)
    
    def get_user_by_id(self, user_id: str) -> Optional[Dict]:
        """Busca usuário por ID"""
        result = self._make_request('GET', 'users', {'id': f'eq.{user_id}'})
        return result[0] if result and len(result) > 0 and 'error' not in result else None
    
    # Métodos para produtos
    def get_products(self, filters: Optional[Dict] = None) -> List[Dict]:
        """Busca produtos com filtros opcionais"""
        # Construir parâmetros PostgREST corretamente
        params = {}
        if filters:
            for key, value in filters.items():
                if key == 'category':
                    params['category'] = f'eq.{value}'
                elif key == 'search':
                    params['name'] = f'ilike.%{value}%'
                elif key == 'is_active':
                    params['is_active'] = f'eq.{value}'
        
        result = self._make_request('GET', 'products', params=params)
        return result if result and 'error' not in result else []
    
    def get_product_by_id(self, product_id: str) -> Optional[Dict]:
        """Busca produto por ID"""
        result = self._make_request('GET', 'products', {'id': f'eq.{product_id}'})
        return result[0] if result and len(result) > 0 and 'error' not in result else None
    
    def create_product(self, product_data: Dict) -> Optional[Dict]:
        """Cria um novo produto"""
        return self._make_request('POST', 'products', product_data)
    
    def update_product(self, product_id: str, product_data: Dict) -> Optional[Dict]:
        """Atualiza um produto"""
        return self._make_request('PATCH', f'products?id=eq.{product_id}', product_data)
    
    # Métodos para carrinho
    def get_cart_items(self, user_id: str) -> List[Dict]:
        """Busca itens do carrinho do usuário"""
        result = self._make_request('GET', 'cart_items', {'user_id': f'eq.{user_id}'})
        return result if result and 'error' not in result else []
    
    def add_to_cart(self, cart_data: Dict) -> Optional[Dict]:
        """Adiciona item ao carrinho"""
        return self._make_request('POST', 'cart_items', cart_data)
    
    def update_cart_item(self, item_id: str, cart_data: Dict) -> Optional[Dict]:
        """Atualiza item do carrinho"""
        return self._make_request('PATCH', f'cart_items?id=eq.{item_id}', cart_data)
    
    def remove_from_cart(self, item_id: str) -> bool:
        """Remove item do carrinho"""
        result = self._make_request('DELETE', f'cart_items?id=eq.{item_id}')
        return 'error' not in result
    
    # Métodos para pedidos
    def create_order(self, order_data: Dict) -> Optional[Dict]:
        """Cria um novo pedido"""
        return self._make_request('POST', 'orders', order_data)
    
    def get_orders(self, user_id: str) -> List[Dict]:
        """Busca pedidos do usuário"""
        result = self._make_request('GET', 'orders', {'user_id': f'eq.{user_id}'})
        return result if result and 'error' not in result else []
    
    def create_order_item(self, order_item_data: Dict) -> Optional[Dict]:
        """Cria item do pedido"""
        return self._make_request('POST', 'order_items', order_item_data)
    
    # Métodos para atividades
    def create_user_activity(self, activity_data: Dict) -> Optional[Dict]:
        """Cria atividade do usuário"""
        return self._make_request('POST', 'user_activities', activity_data)
    
    def get_user_activities(self, user_id: str) -> List[Dict]:
        """Busca atividades do usuário"""
        result = self._make_request('GET', 'user_activities', {'user_id': f'eq.{user_id}'})
        return result if result and 'error' not in result else []
    
    # Métodos para conquistas
    def get_user_achievements(self, user_id: str) -> List[Dict]:
        """Busca conquistas do usuário"""
        result = self._make_request('GET', 'user_achievements', {'user_id': f'eq.{user_id}'})
        return result if result and 'error' not in result else []
    
    def create_user_achievement(self, achievement_data: Dict) -> Optional[Dict]:
        """Cria conquista do usuário"""
        return self._make_request('POST', 'user_achievements', achievement_data)
    
    # Métodos para metas
    def get_user_goals(self, user_id: str) -> List[Dict]:
        """Busca metas do usuário"""
        result = self._make_request('GET', 'user_goals', {'user_id': f'eq.{user_id}'})
        return result if result and 'error' not in result else []
    
    def create_user_goal(self, goal_data: Dict) -> Optional[Dict]:
        """Cria meta do usuário"""
        return self._make_request('POST', 'user_goals', goal_data)
    
    def update_user_goal(self, goal_id: str, goal_data: Dict) -> Optional[Dict]:
        """Atualiza meta do usuário"""
        return self._make_request('PATCH', f'user_goals?id=eq.{goal_id}', goal_data)
    
    # Métodos para exercícios
    def create_exercise_log(self, exercise_data: Dict) -> Optional[Dict]:
        """Cria log de exercício"""
        return self._make_request('POST', 'exercise_logs', exercise_data)
    
    def get_exercise_logs(self, user_id: str) -> List[Dict]:
        """Busca logs de exercícios do usuário"""
        result = self._make_request('GET', 'exercise_logs', {'user_id': f'eq.{user_id}'})
        return result if result and 'error' not in result else []
    
    # Métodos para nutrição
    def create_nutrition_log(self, nutrition_data: Dict) -> Optional[Dict]:
        """Cria log de nutrição"""
        return self._make_request('POST', 'nutrition_logs', nutrition_data)
    
    def get_nutrition_logs(self, user_id: str) -> List[Dict]:
        """Busca logs de nutrição do usuário"""
        result = self._make_request('GET', 'nutrition_logs', {'user_id': f'eq.{user_id}'})
        return result if result and 'error' not in result else []
    
    # Métodos para favoritos
    def add_favorite(self, favorite_data: Dict) -> Optional[Dict]:
        """Adiciona produto aos favoritos"""
        return self._make_request('POST', 'favorites', favorite_data)
    
    def get_favorites(self, user_id: str) -> List[Dict]:
        """Busca favoritos do usuário"""
        result = self._make_request('GET', 'favorites', {'user_id': f'eq.{user_id}'})
        return result if result and 'error' not in result else []
    
    def remove_favorite(self, favorite_id: str) -> bool:
        """Remove favorito"""
        result = self._make_request('DELETE', f'favorites?id=eq.{favorite_id}')
        return 'error' not in result
    
    # Métodos para avaliações
    def create_review(self, review_data: Dict) -> Optional[Dict]:
        """Cria avaliação de produto"""
        return self._make_request('POST', 'reviews', review_data)
    
    def get_product_reviews(self, product_id: str) -> List[Dict]:
        """Busca avaliações de um produto"""
        result = self._make_request('GET', 'reviews', {'product_id': f'eq.{product_id}'})
        return result if result and 'error' not in result else []
    
    # Métodos para cupons
    def get_coupon_by_code(self, code: str) -> Optional[Dict]:
        """Busca cupom por código"""
        result = self._make_request('GET', 'coupons', {'code': f'eq.{code}'})
        return result[0] if result and len(result) > 0 and 'error' not in result else None
    
    def update_coupon_usage(self, coupon_id: str, usage_data: Dict) -> Optional[Dict]:
        """Atualiza uso do cupom"""
        return self._make_request('PATCH', f'coupons?id=eq.{coupon_id}', usage_data)
    
    # Métodos para pagamentos
    def create_payment(self, payment_data: Dict) -> Optional[Dict]:
        """Cria registro de pagamento"""
        return self._make_request('POST', 'payments', payment_data)
    
    def get_payment_by_order(self, order_id: str) -> Optional[Dict]:
        """Busca pagamento por pedido"""
        result = self._make_request('GET', 'payments', {'order_id': f'eq.{order_id}'})
        return result[0] if result and len(result) > 0 and 'error' not in result else None
    
    # Métodos para cálculos de saúde
    def insert_health_calculation(self, calculation_data: Dict) -> Optional[Dict]:
        """Insere cálculo de saúde"""
        result = self._make_request('POST', 'health_calculations', calculation_data)
        if isinstance(result, list) and len(result) > 0:
            return result[0]
        elif isinstance(result, dict) and 'error' not in result:
            return result
        return None
    
    def insert_imc_history(self, imc_data: Dict) -> Optional[Dict]:
        """Insere histórico de IMC"""
        result = self._make_request('POST', 'imc_history', imc_data)
        if isinstance(result, list) and len(result) > 0:
            return result[0]
        elif isinstance(result, dict) and 'error' not in result:
            return result
        return None
    
    def insert_calories_history(self, calories_data: Dict) -> Optional[Dict]:
        """Insere histórico de calorias"""
        result = self._make_request('POST', 'calories_history', calories_data)
        if isinstance(result, list) and len(result) > 0:
            return result[0]
        elif isinstance(result, dict) and 'error' not in result:
            return result
        return None
    
    def insert_hydration_history(self, hydration_data: Dict) -> Optional[Dict]:
        """Insere histórico de hidratação"""
        result = self._make_request('POST', 'hydration_history', hydration_data)
        if isinstance(result, list) and len(result) > 0:
            return result[0]
        elif isinstance(result, dict) and 'error' not in result:
            return result
        return None
    
    def insert_body_fat_history(self, body_fat_data: Dict) -> Optional[Dict]:
        """Insere histórico de gordura corporal"""
        result = self._make_request('POST', 'body_fat_history', body_fat_data)
        if isinstance(result, list) and len(result) > 0:
            return result[0]
        elif isinstance(result, dict) and 'error' not in result:
            return result
        return None
    
    # Métodos para UserDashboardService
    def get_user_by_id_simple(self, user_id: str) -> Optional[Dict]:
        """Busca usuário por ID usando PostgREST"""
        params = {'id': f'eq.{user_id}'}
        result = self._make_request('GET', 'users', params=params)
        if isinstance(result, list) and len(result) > 0 and 'error' not in result:
            return result[0]
        return None
    
    def get_user_activities(self, user_id: str, since: Optional[str] = None, limit: Optional[int] = None) -> List[Dict]:
        """Busca atividades do usuário"""
        params = {'user_id': f'eq.{user_id}', 'order': 'created_at.desc'}
        if since:
            params['created_at'] = f'gte.{since}'
        if limit:
            params['limit'] = str(limit)
        result = self._make_request('GET', 'user_activities', params=params)
        return result if result and 'error' not in result else []
    
    def get_exercise_logs(self, user_id: str, since: Optional[str] = None, limit: Optional[int] = None) -> List[Dict]:
        """Busca logs de exercícios do usuário"""
        params = {'user_id': f'eq.{user_id}', 'order': 'created_at.desc'}
        if since:
            params['created_at'] = f'gte.{since}'
        if limit:
            params['limit'] = str(limit)
        result = self._make_request('GET', 'exercise_logs', params=params)
        return result if result and 'error' not in result else []
    
    def get_user_goals(self, user_id: str, is_active: Optional[bool] = None) -> List[Dict]:
        """Busca metas do usuário"""
        params = {'user_id': f'eq.{user_id}'}
        if is_active is not None:
            params['is_active'] = f'eq.{is_active}'
        result = self._make_request('GET', 'user_goals', params=params)
        return result if result and 'error' not in result else []
    
    def get_user_achievements(self, user_id: str, limit: Optional[int] = None) -> List[Dict]:
        """Busca conquistas do usuário"""
        params = {'user_id': f'eq.{user_id}', 'order': 'unlocked_at.desc'}
        if limit:
            params['limit'] = str(limit)
        result = self._make_request('GET', 'user_achievements', params=params)
        return result if result and 'error' not in result else []
    
    def get_orders(self, user_id: str) -> List[Dict]:
        """Busca pedidos do usuário"""
        params = {'user_id': f'eq.{user_id}'}
        result = self._make_request('GET', 'orders', params=params)
        return result if result and 'error' not in result else []
    
    def get_favorites(self, user_id: str) -> List[Dict]:
        """Busca favoritos do usuário"""
        params = {'user_id': f'eq.{user_id}'}
        result = self._make_request('GET', 'favorites', params=params)
        return result if result and 'error' not in result else []
    
    def get_reviews(self, user_id: str) -> List[Dict]:
        """Busca reviews do usuário"""
        params = {'user_id': f'eq.{user_id}'}
        result = self._make_request('GET', 'reviews', params=params)
        return result if result and 'error' not in result else []
    
    def get_user_created_at(self, user_id: str) -> Optional[str]:
        """Busca data de criação do usuário"""
        params = {'id': f'eq.{user_id}', 'select': 'created_at'}
        result = self._make_request('GET', 'users', params=params)
        if isinstance(result, list) and len(result) > 0 and 'error' not in result:
            return result[0].get('created_at')
        return None
    
    def get_nutrition_logs(self, user_id: str, since: Optional[str] = None) -> List[Dict]:
        """Busca logs de nutrição do usuário"""
        params = {'user_id': f'eq.{user_id}'}
        if since:
            params['created_at'] = f'gte.{since}'
        result = self._make_request('GET', 'nutrition_logs', params=params)
        return result if result and 'error' not in result else []


class TableQueryBuilder:
    """
    Builder para construir queries do PostgREST de forma fluente.
    
    Compatível com a API do supabase-python.
    """
    
    def __init__(self, client: SupabaseClient, table_name: str):
        """Inicializa o builder."""
        self.client = client
        self.table_name = table_name
        self.params = {}
        self.columns = '*'
        self.method = 'GET'
        self.data = None
    
    def select(self, columns: str = '*', count: Optional[str] = None):
        """Define colunas a selecionar."""
        if count:
            self.columns = f'{columns},count={count}'
            self.params['count'] = count
        else:
            self.columns = columns
        return self
    
    def eq(self, column: str, value: Any):
        """Adiciona filtro de igualdade."""
        self.params[column] = f'eq.{value}'
        return self
    
    def neq(self, column: str, value: Any):
        """Adiciona filtro de diferença."""
        self.params[column] = f'neq.{value}'
        return self
    
    def gt(self, column: str, value: Any):
        """Adiciona filtro maior que."""
        self.params[column] = f'gt.{value}'
        return self
    
    def gte(self, column: str, value: Any):
        """Adiciona filtro maior ou igual."""
        self.params[column] = f'gte.{value}'
        return self
    
    def lt(self, column: str, value: Any):
        """Adiciona filtro menor que."""
        self.params[column] = f'lt.{value}'
        return self
    
    def lte(self, column: str, value: Any):
        """Adiciona filtro menor ou igual."""
        self.params[column] = f'lte.{value}'
        return self
    
    def like(self, column: str, pattern: str):
        """Adiciona filtro LIKE."""
        self.params[column] = f'like.{pattern}'
        return self
    
    def ilike(self, column: str, pattern: str):
        """Adiciona filtro ILIKE (case-insensitive)."""
        self.params[column] = f'ilike.{pattern}'
        return self
    
    def in_(self, column: str, values: List[Any]):
        """Adiciona filtro IN."""
        self.params[column] = f'in.({",".join(map(str, values))})'
        return self
    
    def contains(self, column: str, value: Any):
        """Adiciona filtro contains (para arrays)."""
        self.params[column] = f'cs.{value if isinstance(value, str) else "{" + ",".join(map(str, value)) + "}"}'
        return self
    
    def order(self, column: str, desc: bool = False):
        """Define ordenação."""
        self.params['order'] = f'{column}.{"desc" if desc else "asc"}'
        return self
    
    def range(self, from_: int, to_: int):
        """Define range para paginação."""
        self.params['offset'] = str(from_)
        self.params['limit'] = str(to_ - from_ + 1)
        return self
    
    def limit(self, limit: int):
        """Define limite."""
        self.params['limit'] = str(limit)
        return self
    
    def single(self):
        """Retorna apenas um resultado."""
        self.params['limit'] = '1'
        return self
    
    def insert(self, data: Dict[str, Any]):
        """Prepara inserção."""
        self.method = 'POST'
        self.data = data
        return self
    
    def update(self, data: Dict[str, Any]):
        """Prepara atualização."""
        self.method = 'PATCH'
        self.data = data
        return self
    
    def delete(self):
        """Prepara deleção."""
        self.method = 'DELETE'
        return self
    
    def upsert(self, data: Dict[str, Any]):
        """Prepara upsert."""
        self.method = 'POST'
        self.data = data
        self.params['on_conflict'] = 'id'  # Assumir que há um campo id único
        return self
    
    def execute(self):
        """Executa a query."""
        try:
            # Construir URL com parâmetros
            url = f"{self.client.url}/rest/v1/{self.table_name}"
            
            # Adicionar select como header se especificado
            headers = self.client.headers.copy()
            if self.columns and self.columns != '*' and self.method == 'GET':
                headers['Prefer'] = f'return=representation,columns={self.columns}'
            
            # Preparar parâmetros de query (filtros)
            query_params = {}
            for key, value in self.params.items():
                if key in ['offset', 'limit', 'order']:
                    query_params[key] = value
                elif key == 'count':
                    headers['Prefer'] = f"{headers.get('Prefer', '')},count=exact"
                else:
                    query_params[key] = value
            
            # Executar requisição
            import requests
            if self.method == 'GET':
                response = requests.get(url, headers=headers, params=query_params, timeout=10)
            elif self.method == 'POST':
                response = requests.post(url, headers=headers, json=self.data, params=query_params, timeout=10)
            elif self.method == 'PATCH':
                # Para PATCH, precisamos converter filtros para query string
                filter_params = '&'.join([f"{k}=eq.{v.split('.')[1]}" if '.' in str(v) else f"{k}={v}" 
                                         for k, v in self.params.items() if k not in ['limit', 'offset', 'order', 'count']])
                if filter_params:
                    url = f"{url}?{filter_params}"
                response = requests.patch(url, headers=headers, json=self.data, timeout=10)
            elif self.method == 'DELETE':
                filter_params = '&'.join([f"{k}=eq.{v.split('.')[1]}" if '.' in str(v) else f"{k}={v}" 
                                         for k, v in self.params.items()])
                if filter_params:
                    url = f"{url}?{filter_params}"
                response = requests.delete(url, headers=headers, timeout=10)
            else:
                raise ValueError(f"Método não suportado: {self.method}")
            
            response.raise_for_status()
            
            # Processar resposta
            if response.content:
                result_data = response.json()
                
                # Criar objeto de resultado similar ao supabase-python
                class Result:
                    def __init__(self, data, count=None):
                        self.data = data if isinstance(data, list) else [data] if data else []
                        self.count = count if count is not None else (len(self.data) if isinstance(data, list) else None)
                
                # Extrair count do header se disponível
                count = None
                if 'Content-Range' in response.headers:
                    try:
                        count = int(response.headers['Content-Range'].split('/')[-1])
                    except:
                        pass
                
                return Result(result_data, count)
            else:
                class Result:
                    def __init__(self):
                        self.data = []
                        self.count = 0
                return Result()
                
        except Exception as e:
            logger.error(f"Erro ao executar query na tabela {self.table_name}: {e}", exc_info=True)
            class ErrorResult:
                def __init__(self, error):
                    self.data = []
                    self.count = 0
                    self.error = error
            return ErrorResult(str(e))

# Instância global do cliente
supabase_client = SupabaseClient()