"""
Serviço de Afiliados RE-EDUCA Store.

Gerencia integrações com plataformas de afiliados incluindo:
- Hotmart (produtos digitais)
- Kiwify (infoprodutos)
- Braip (e-learning)
- Logs (marketplace)
- Sincronização de produtos
- Tracking de conversões
- Validação de webhooks
"""
import os
import requests
import logging
from typing import Dict, Any, Optional
from datetime import datetime
from repositories.affiliate_repository import AffiliateRepository
from services.base_service import BaseService
from config.database import supabase_client
import hashlib
import hmac

logger = logging.getLogger(__name__)


class AffiliateService(BaseService):
    """
    Service para integração com plataformas de afiliados.

    CORRIGIDO: Agora usa AffiliateRepository para acesso a dados.

    Gerencia autenticação, sincronização e tracking.
    """

    def __init__(self):
        """Inicializa o serviço de afiliados com configurações das plataformas."""
        super().__init__()
        self.repo = AffiliateRepository()
        self.supabase = supabase_client  # Mantido para compatibilidade temporária

        # Configurações Hotmart
        self.hotmart_client_id = os.environ.get('HOTMART_CLIENT_ID')
        self.hotmart_client_secret = os.environ.get('HOTMART_CLIENT_SECRET')
        self.hotmart_webhook_secret = os.environ.get('HOTMART_WEBHOOK_SECRET')  # Secret para validar webhooks
        self.hotmart_base_url = os.environ.get('HOTMART_BASE_URL', 'https://developers.hotmart.com')

        # Configurações Kiwify
        self.kiwify_api_key = os.environ.get('KIWIFY_API_KEY')
        self.kiwify_webhook_secret = os.environ.get('KIWIFY_WEBHOOK_SECRET')  # Secret para validar webhooks
        self.kiwify_base_url = os.environ.get('KIWIFY_BASE_URL', 'https://api.kiwify.com/v1')

        # Configurações Logs
        self.logs_api_key = os.environ.get('LOGS_API_KEY')
        self.logs_base_url = os.environ.get('LOGS_BASE_URL', 'https://api.logs.com')

        # Configurações Braip
        self.braip_api_key = os.environ.get('BRAIP_API_KEY')
        self.braip_base_url = os.environ.get('BRAIP_BASE_URL', 'https://api.braip.com')

    # ================================
    # HOTMART
    # ================================

    def get_hotmart_token(self) -> Optional[str]:
        """
        Obtém token de acesso do Hotmart via OAuth2.

        Returns:
            Optional[str]: Access token ou None se falhar.
        """
        try:
            url = f"{self.hotmart_base_url}/payments/api/oauth/token"
            data = {
                'grant_type': 'client_credentials',
                'client_id': self.hotmart_client_id,
                'client_secret': self.hotmart_client_secret
            }

            response = requests.post(url, data=data)

            if response.status_code == 200:
                token_data = response.json()
                return token_data.get('access_token')
            else:
                logger.error(f"Erro ao obter token Hotmart: {response.status_code}")
                return None

        except Exception as e:
            logger.error(f"Erro ao obter token Hotmart: {str(e)}")
            return None

    def get_hotmart_products(self, page: int = 0, size: int = 20) -> Dict[str, Any]:
        """Busca produtos do Hotmart"""
        try:
            token = self.get_hotmart_token()
            if not token:
                return {'success': False, 'error': 'Token não obtido'}

            url = f"{self.hotmart_base_url}/payments/api/1.0/sales/history"
            headers = {
                'Authorization': f'Bearer {token}',
                'Content-Type': 'application/json'
            }

            params = {
                'page': page,
                'size': size,
                'status': 'APPROVED'
            }

            response = requests.get(url, headers=headers, params=params)

            if response.status_code == 200:
                data = response.json()
                products = []

                for sale in data.get('items', []):
                    product = {
                        'id': f"hotmart_{sale.get('product', {}).get('id')}",
                        'name': sale.get('product', {}).get('name'),
                        'description': sale.get('product', {}).get('description'),
                        'price': sale.get('product', {}).get('price'),
                        'currency': sale.get('product', {}).get('currency', 'BRL'),
                        'image_url': sale.get('product', {}).get('image_url'),
                        'affiliate_url': sale.get('product', {}).get('affiliate_url'),
                        'commission_rate': sale.get('commission', {}).get('rate', 0),
                        'platform': 'hotmart',
                        'category': sale.get('product', {}).get('category'),
                        'tags': sale.get('product', {}).get('tags', []),
                        'created_at': sale.get('product', {}).get('created_at'),
                        'updated_at': datetime.now().isoformat()
                    }
                    products.append(product)

                return {
                    'success': True,
                    'products': products,
                    'total': data.get('total_items', 0),
                    'page': page,
                    'size': size
                }
            else:
                return {'success': False, 'error': f'Erro HTTP: {response.status_code}'}

        except Exception as e:
            logger.error(f"Erro ao buscar produtos Hotmart: {str(e)}")
            return {'success': False, 'error': str(e)}

    def track_hotmart_sale(self, sale_data: Dict[str, Any]) -> Dict[str, Any]:
        """Registra venda do Hotmart"""
        try:
            # Salva dados da venda
            sale_record = {
                'platform': 'hotmart',
                'sale_id': sale_data.get('transaction'),
                'product_id': sale_data.get('product', {}).get('id'),
                'product_name': sale_data.get('product', {}).get('name'),
                'buyer_email': sale_data.get('buyer', {}).get('email'),
                'buyer_name': sale_data.get('buyer', {}).get('name'),
                'amount': sale_data.get('price', {}).get('value'),
                'currency': sale_data.get('price', {}).get('currency'),
                'commission': sale_data.get('commission', {}).get('value'),
                'status': sale_data.get('status'),
                'sale_date': sale_data.get('purchase_date'),
                'raw_data': sale_data,
                'created_at': datetime.utcnow().isoformat()
            }

            # ✅ CORRIGIDO: Usa AffiliateRepository
            created_sale = self.repo.create_sale(sale_record)

            if created_sale:
                return {'success': True, 'message': 'Venda registrada com sucesso'}
            else:
                return {'success': False, 'error': 'Erro ao registrar venda'}

        except Exception as e:
            logger.error(f"Erro ao registrar venda Hotmart: {str(e)}")
            return {'success': False, 'error': str(e)}

    # ================================
    # KIWIFY
    # ================================

    def get_kiwify_products(self, page: int = 1, limit: int = 20) -> Dict[str, Any]:
        """Busca produtos do Kiwify"""
        try:
            url = f"{self.kiwify_base_url}/products"
            headers = {
                'Authorization': f'Bearer {self.kiwify_api_key}',
                'Content-Type': 'application/json'
            }

            params = {
                'page': page,
                'limit': limit,
                'status': 'active'
            }

            response = requests.get(url, headers=headers, params=params)

            if response.status_code == 200:
                data = response.json()
                products = []

                for product in data.get('data', []):
                    product_data = {
                        'id': f"kiwify_{product.get('id')}",
                        'name': product.get('name'),
                        'description': product.get('description'),
                        'price': product.get('price'),
                        'currency': product.get('currency', 'BRL'),
                        'image_url': product.get('image_url'),
                        'affiliate_url': product.get('affiliate_url'),
                        'commission_rate': product.get('commission_rate', 0),
                        'platform': 'kiwify',
                        'category': product.get('category'),
                        'tags': product.get('tags', []),
                        'created_at': product.get('created_at'),
                        'updated_at': datetime.now().isoformat()
                    }
                    products.append(product_data)

                return {
                    'success': True,
                    'products': products,
                    'total': data.get('total', 0),
                    'page': page,
                    'limit': limit
                }
            else:
                return {'success': False, 'error': f'Erro HTTP: {response.status_code}'}

        except Exception as e:
            logger.error(f"Erro ao buscar produtos Kiwify: {str(e)}")
            return {'success': False, 'error': str(e)}

    def track_kiwify_sale(self, sale_data: Dict[str, Any]) -> Dict[str, Any]:
        """Registra venda do Kiwify"""
        try:
            sale_record = {
                'platform': 'kiwify',
                'sale_id': sale_data.get('transaction_id'),
                'product_id': sale_data.get('product_id'),
                'product_name': sale_data.get('product_name'),
                'buyer_email': sale_data.get('customer_email'),
                'buyer_name': sale_data.get('customer_name'),
                'amount': sale_data.get('amount'),
                'currency': sale_data.get('currency', 'BRL'),
                'commission': sale_data.get('commission'),
                'status': sale_data.get('status'),
                'sale_date': sale_data.get('sale_date'),
                'raw_data': sale_data,
                'created_at': datetime.utcnow().isoformat()
            }

            # ✅ CORRIGIDO: Usa AffiliateRepository
            created_sale = self.repo.create_sale(sale_record)

            if created_sale:
                return {'success': True, 'message': 'Venda registrada com sucesso'}
            else:
                return {'success': False, 'error': 'Erro ao registrar venda'}

        except Exception as e:
            logger.error(f"Erro ao registrar venda Kiwify: {str(e)}")
            return {'success': False, 'error': str(e)}

    def verify_hotmart_webhook(self, signature: str, payload: bytes) -> bool:
        """Verifica assinatura do webhook Hotmart usando HMAC-SHA256"""
        try:
            if not self.hotmart_webhook_secret:
                logger.warning("HOTMART_WEBHOOK_SECRET não configurado, ignorando validação")
                return True  # Permite se não configurado (apenas para desenvolvimento)

            # Hotmart usa HMAC-SHA256 com o secret
            expected_signature = hmac.new(
                self.hotmart_webhook_secret.encode('utf-8'),
                payload,
                hashlib.sha256
            ).hexdigest()

            # Comparação segura para evitar timing attacks
            return hmac.compare_digest(signature, expected_signature)
        except Exception as e:
            logger.error(f"Erro ao verificar webhook Hotmart: {str(e)}")
            return False

    def verify_kiwify_webhook(self, signature: str, payload: bytes) -> bool:
        """Verifica assinatura do webhook Kiwify usando HMAC-SHA256"""
        try:
            if not self.kiwify_webhook_secret:
                logger.warning("KIWIFY_WEBHOOK_SECRET não configurado, ignorando validação")
                return True  # Permite se não configurado (apenas para desenvolvimento)

            # Kiwify usa HMAC-SHA256
            expected_signature = hmac.new(
                self.kiwify_webhook_secret.encode('utf-8'),
                payload,
                hashlib.sha256
            ).hexdigest()

            # Comparação segura
            return hmac.compare_digest(signature, expected_signature)
        except Exception as e:
            logger.error(f"Erro ao verificar webhook Kiwify: {str(e)}")
            return False

    # ================================
    # LOGS
    # ================================

    def get_logs_products(self, page: int = 1, limit: int = 20) -> Dict[str, Any]:
        """Busca produtos do Logs"""
        try:
            url = f"{self.logs_base_url}/products"
            headers = {
                'Authorization': f'Bearer {self.logs_api_key}',
                'Content-Type': 'application/json'
            }

            params = {
                'page': page,
                'limit': limit,
                'active': True
            }

            response = requests.get(url, headers=headers, params=params)

            if response.status_code == 200:
                data = response.json()
                products = []

                for product in data.get('products', []):
                    product_data = {
                        'id': f"logs_{product.get('id')}",
                        'name': product.get('title'),
                        'description': product.get('description'),
                        'price': product.get('price'),
                        'currency': product.get('currency', 'BRL'),
                        'image_url': product.get('image'),
                        'affiliate_url': product.get('affiliate_link'),
                        'commission_rate': product.get('commission_percentage', 0),
                        'platform': 'logs',
                        'category': product.get('category'),
                        'tags': product.get('tags', []),
                        'created_at': product.get('created_at'),
                        'updated_at': datetime.now().isoformat()
                    }
                    products.append(product_data)

                return {
                    'success': True,
                    'products': products,
                    'total': data.get('total', 0),
                    'page': page,
                    'limit': limit
                }
            else:
                return {'success': False, 'error': f'Erro HTTP: {response.status_code}'}

        except Exception as e:
            logger.error(f"Erro ao buscar produtos Logs: {str(e)}")
            return {'success': False, 'error': str(e)}

    # ================================
    # BRAIP
    # ================================

    def get_braip_products(self, page: int = 1, limit: int = 20) -> Dict[str, Any]:
        """Busca produtos do Braip"""
        try:
            url = f"{self.braip_base_url}/products"
            headers = {
                'Authorization': f'Bearer {self.braip_api_key}',
                'Content-Type': 'application/json'
            }

            params = {
                'page': page,
                'limit': limit,
                'status': 'active'
            }

            response = requests.get(url, headers=headers, params=params)

            if response.status_code == 200:
                data = response.json()
                products = []

                for product in data.get('data', []):
                    product_data = {
                        'id': f"braip_{product.get('id')}",
                        'name': product.get('name'),
                        'description': product.get('description'),
                        'price': product.get('price'),
                        'currency': product.get('currency', 'BRL'),
                        'image_url': product.get('image'),
                        'affiliate_url': product.get('affiliate_url'),
                        'commission_rate': product.get('commission_rate', 0),
                        'platform': 'braip',
                        'category': product.get('category'),
                        'tags': product.get('tags', []),
                        'created_at': product.get('created_at'),
                        'updated_at': datetime.now().isoformat()
                    }
                    products.append(product_data)

                return {
                    'success': True,
                    'products': products,
                    'total': data.get('total', 0),
                    'page': page,
                    'limit': limit
                }
            else:
                return {'success': False, 'error': f'Erro HTTP: {response.status_code}'}

        except Exception as e:
            logger.error(f"Erro ao buscar produtos Braip: {str(e)}")
            return {'success': False, 'error': str(e)}

    # ================================
    # MÉTODOS GERAIS
    # ================================

    def sync_all_affiliate_products(self) -> Dict[str, Any]:
        """Sincroniza produtos de todas as plataformas"""
        try:
            all_products = []
            platforms = ['hotmart', 'kiwify', 'logs', 'braip']

            for platform in platforms:
                try:
                    if platform == 'hotmart':
                        result = self.get_hotmart_products()
                    elif platform == 'kiwify':
                        result = self.get_kiwify_products()
                    elif platform == 'logs':
                        result = self.get_logs_products()
                    elif platform == 'braip':
                        result = self.get_braip_products()

                    if result.get('success'):
                        all_products.extend(result['products'])

                        # Salva produtos no banco
                        for product in result['products']:
                            # ✅ CORRIGIDO: Usa repositório
                            self.repo.upsert_product(product)

                except Exception as e:
                    logger.error(f"Erro ao sincronizar {platform}: {str(e)}")
                    continue

            return {
                'success': True,
                'total_products': len(all_products),
                'platforms_synced': platforms,
                'products': all_products
            }

        except Exception as e:
            logger.error(f"Erro ao sincronizar produtos: {str(e)}")
            return {'success': False, 'error': str(e)}

    def get_affiliate_products(self, platform: str = None, category: str = None,
                             page: int = 1, limit: int = 20) -> Dict[str, Any]:
        """Busca produtos afiliados do banco"""
        try:
            # ✅ CORRIGIDO: Usa repositório
            products = self.repo.find_all_products(platform=platform)

            # Filtro de categoria em memória (pode ser melhorado no repositório)
            if category:
                products = [p for p in products if p.get('category') == category]

            # Paginação manual
            offset = (page - 1) * limit
            paginated_products = products[offset:offset + limit]

            return {
                'success': True,
                'products': paginated_products,
                'page': page,
                'limit': limit
            }

        except Exception as e:
            self.logger.error(f"Erro ao buscar produtos afiliados: {str(e)}")
            return {'success': False, 'error': str(e)}

    def get_affiliate_sales(
            self, platform: str = None, start_date: str = None,
            end_date: str = None, page: int = 1, limit: int = 20
    ) -> Dict[str, Any]:
        """Busca vendas afiliadas"""
        try:
            # ✅ CORRIGIDO: Usa AffiliateRepository
            sales = self.repo.find_all_filtered(
                platform=platform,
                start_date=start_date,
                end_date=end_date,
                limit=limit,
                offset=(page - 1) * limit
            )
            
            total = self.repo.count_filtered(
                platform=platform,
                start_date=start_date,
                end_date=end_date
            )

            return {
                'success': True,
                'sales': sales,
                'pagination': {
                    'page': page,
                    'limit': limit,
                    'total': total,
                    'pages': (total + limit - 1) // limit if total > 0 else 0
                }
            }

        except Exception as e:
            logger.error(f"Erro ao buscar vendas afiliadas: {str(e)}")
            return {'success': False, 'error': str(e)}

    def calculate_commission(self, platform: str, amount: float) -> float:
        """Calcula comissão baseada na plataforma"""
        commission_rates = {
            'hotmart': 0.30,  # 30%
            'kiwify': 0.25,   # 25%
            'logs': 0.35,     # 35%
            'braip': 0.40     # 40%
        }

        rate = commission_rates.get(platform, 0.20)  # Default 20%
        return amount * rate

    def get_affiliate_stats(self) -> Dict[str, Any]:
        """Retorna estatísticas de afiliados"""
        try:
            # Total de produtos por plataforma
            platforms = ['hotmart', 'kiwify', 'logs', 'braip']
            platform_stats = {}

            for platform in platforms:
                # ✅ CORRIGIDO: Usa repositório
                platform_stats[platform] = self.repo.count_products_by_platform(platform)

            # ✅ CORRIGIDO: Total de vendas via repositório
            sales = self.repo.find_sales()
            total_sales = sum(sale.get('amount', 0) for sale in sales) if sales else 0

            # ✅ CORRIGIDO: Total de comissões via repositório
            total_commission = sum(sale.get('commission', 0) for sale in sales) if sales else 0

            return {
                'success': True,
                'stats': {
                    'total_products': sum(platform_stats.values()),
                    'products_by_platform': platform_stats,
                    'total_sales': total_sales,
                    'total_commission': total_commission,
                    'total_sales_count': len(sales) if sales else 0
                }
            }

        except Exception as e:
            logger.error(f"Erro ao calcular estatísticas: {str(e)}")
            return {'success': False, 'error': str(e)}
