# -*- coding: utf-8 -*-
"""
Validadores de Input Robustos para RE-EDUCA Store.

Validação defensiva para prevenir injeções e dados malformados.
"""

import logging
import re
from typing import Any, Dict, List, Optional
from decimal import Decimal, InvalidOperation

logger = logging.getLogger(__name__)


class InputValidator:
    """Validador robusto de inputs para endpoints críticos"""
    
    # Regex patterns
    EMAIL_PATTERN = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
    UUID_PATTERN = re.compile(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', re.IGNORECASE)
    PHONE_BR_PATTERN = re.compile(r'^\+?55\s?\(?([1-9]{2})\)?\s?9?\d{4}-?\d{4}$')
    CPF_PATTERN = re.compile(r'^\d{3}\.\d{3}\.\d{3}-\d{2}$')
    
    # Caracteres perigosos (SQL injection, XSS, etc)
    DANGEROUS_CHARS = ['<script', 'javascript:', 'onerror=', 'onload=', '--', ';--', 
                      'UNION SELECT', 'DROP TABLE', 'INSERT INTO', 'DELETE FROM']
    
    @staticmethod
    def validate_email(email: str) -> bool:
        """
        Valida formato de email.
        
        Args:
            email: Email a validar
            
        Returns:
            bool: True se válido
        """
        if not email or not isinstance(email, str):
            return False
        
        email = email.strip().lower()
        
        if len(email) > 320:  # RFC 5321
            return False
        
        return bool(InputValidator.EMAIL_PATTERN.match(email))
    
    @staticmethod
    def validate_uuid(uuid: str) -> bool:
        """Valida formato UUID"""
        if not uuid or not isinstance(uuid, str):
            return False
        
        return bool(InputValidator.UUID_PATTERN.match(uuid.strip()))
    
    @staticmethod
    def validate_positive_number(value: Any, allow_zero: bool = False) -> bool:
        """
        Valida número positivo.
        
        Args:
            value: Valor a validar
            allow_zero: Se permite zero
            
        Returns:
            bool: True se válido
        """
        try:
            num = Decimal(str(value))
            if allow_zero:
                return num >= 0
            return num > 0
        except (InvalidOperation, ValueError, TypeError):
            return False
    
    @staticmethod
    def sanitize_string(text: str, max_length: int = 1000) -> Optional[str]:
        """
        Sanitiza string removendo caracteres perigosos.
        
        Args:
            text: Texto a sanitizar
            max_length: Comprimento máximo
            
        Returns:
            str: Texto sanitizado ou None se inválido
        """
        if not text or not isinstance(text, str):
            return None
        
        # Remove espaços extras
        text = text.strip()
        
        # Verifica comprimento
        if len(text) > max_length:
            logger.warning(f"String muito longa: {len(text)} > {max_length}")
            return None
        
        # Verifica caracteres perigosos
        text_lower = text.lower()
        for dangerous in InputValidator.DANGEROUS_CHARS:
            if dangerous.lower() in text_lower:
                logger.warning(f"Caractere perigoso detectado: {dangerous}")
                return None
        
        return text
    
    @staticmethod
    def validate_pagination(page: Any, per_page: Any, max_per_page: int = 100) -> tuple:
        """
        Valida parâmetros de paginação.
        
        Args:
            page: Número da página
            per_page: Itens por página
            max_per_page: Máximo de itens por página
            
        Returns:
            tuple: (page, per_page) validados
        """
        try:
            page = max(1, int(page))
            per_page = max(1, min(int(per_page), max_per_page))
            return page, per_page
        except (ValueError, TypeError):
            return 1, 20  # Default
    
    @staticmethod
    def validate_price(price: Any) -> Optional[Decimal]:
        """
        Valida preço.
        
        Args:
            price: Preço a validar
            
        Returns:
            Decimal: Preço validado ou None
        """
        try:
            price_decimal = Decimal(str(price))
            
            # Verifica range razoável
            if price_decimal < 0 or price_decimal > 999999.99:
                logger.warning(f"Preço fora do range: {price_decimal}")
                return None
            
            # Limita a 2 casas decimais
            return price_decimal.quantize(Decimal('0.01'))
            
        except (InvalidOperation, ValueError, TypeError):
            return None
    
    @staticmethod
    def validate_quantity(quantity: Any, max_quantity: int = 1000) -> Optional[int]:
        """
        Valida quantidade.
        
        Args:
            quantity: Quantidade a validar
            max_quantity: Quantidade máxima permitida
            
        Returns:
            int: Quantidade validada ou None
        """
        try:
            qty = int(quantity)
            
            if qty < 1 or qty > max_quantity:
                logger.warning(f"Quantidade inválida: {qty}")
                return None
            
            return qty
            
        except (ValueError, TypeError):
            return None
    
    @staticmethod
    def validate_json_fields(data: Dict[str, Any], required_fields: List[str], 
                           optional_fields: Optional[List[str]] = None) -> tuple:
        """
        Valida campos obrigatórios em JSON.
        
        Args:
            data: Dicionário com dados
            required_fields: Campos obrigatórios
            optional_fields: Campos opcionais permitidos
            
        Returns:
            tuple: (is_valid: bool, missing_fields: list, extra_fields: list)
        """
        if not isinstance(data, dict):
            return False, [], []
        
        # Verifica campos obrigatórios
        missing = [field for field in required_fields if field not in data]
        
        # Verifica campos extras não permitidos
        all_allowed = set(required_fields)
        if optional_fields:
            all_allowed.update(optional_fields)
        
        extra = [field for field in data.keys() if field not in all_allowed]
        
        is_valid = len(missing) == 0 and len(extra) == 0
        
        return is_valid, missing, extra
    
    @staticmethod
    def validate_order_data(data: Dict[str, Any]) -> tuple:
        """
        Valida dados de criação de pedido.
        
        Args:
            data: Dados do pedido
            
        Returns:
            tuple: (is_valid: bool, errors: list)
        """
        errors = []
        
        # Valida items
        if 'items' not in data or not isinstance(data['items'], list):
            errors.append("Campo 'items' obrigatório e deve ser lista")
        elif len(data['items']) == 0:
            errors.append("Pedido deve ter pelo menos 1 item")
        elif len(data['items']) > 100:
            errors.append("Máximo 100 itens por pedido")
        else:
            # Valida cada item
            for i, item in enumerate(data['items']):
                if not isinstance(item, dict):
                    errors.append(f"Item {i} deve ser objeto")
                    continue
                
                if 'product_id' not in item or not InputValidator.validate_uuid(str(item['product_id'])):
                    errors.append(f"Item {i}: product_id inválido")
                
                if 'quantity' not in item or not InputValidator.validate_quantity(item['quantity']):
                    errors.append(f"Item {i}: quantity inválida")
                
                if 'price' not in item or not InputValidator.validate_price(item['price']):
                    errors.append(f"Item {i}: price inválido")
        
        # Valida total
        if 'total' in data:
            if not InputValidator.validate_price(data['total']):
                errors.append("Total inválido")
        
        # Valida endereço de entrega (se fornecido)
        if 'shipping_address' in data:
            addr = data['shipping_address']
            if not isinstance(addr, dict):
                errors.append("Endereço de entrega inválido")
            else:
                required_addr_fields = ['street', 'city', 'state', 'zip_code']
                for field in required_addr_fields:
                    if field not in addr or not addr[field]:
                        errors.append(f"Endereço: campo '{field}' obrigatório")
        
        return len(errors) == 0, errors
    
    @staticmethod
    def validate_payment_data(data: Dict[str, Any]) -> tuple:
        """
        Valida dados de pagamento.
        
        Args:
            data: Dados do pagamento
            
        Returns:
            tuple: (is_valid: bool, errors: list)
        """
        errors = []
        
        # Valida método de pagamento
        valid_methods = ['credit_card', 'debit_card', 'pix', 'boleto', 'stripe']
        if 'payment_method' not in data or data['payment_method'] not in valid_methods:
            errors.append(f"Método de pagamento inválido. Válidos: {valid_methods}")
        
        # Valida valor
        if 'amount' not in data or not InputValidator.validate_price(data['amount']):
            errors.append("Valor do pagamento inválido")
        
        # Valida order_id
        if 'order_id' not in data or not InputValidator.validate_uuid(str(data['order_id'])):
            errors.append("order_id inválido")
        
        return len(errors) == 0, errors


# Instância global
input_validator = InputValidator()
