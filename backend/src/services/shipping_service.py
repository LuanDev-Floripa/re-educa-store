"""
Service de Frete RE-EDUCA Store.

Gerencia cálculo de frete incluindo:
- Cálculo baseado em regras configuradas
- Frete grátis baseado em valor mínimo
- Cálculo por peso e dimensões usando API dos Correios
- Cálculo por CEP de origem e destino
- Múltiplas opções de frete (PAC, SEDEX, etc)
"""

import logging
from typing import Any, Dict, List, Optional

from repositories.shipping_repository import ShippingRepository

logger = logging.getLogger(__name__)


class ShippingService:
    """
    Service para cálculo de frete.
    
    Suporta cálculo básico por regras e cálculo avançado usando API dos Correios.
    """

    def __init__(self):
        """Inicializa o serviço de frete."""
        self.repo = ShippingRepository()
        self.logger = logger
        self.default_shipping_cost = 15.00
        self.default_free_shipping_threshold = 200.00
        
        # Tentar inicializar integração com Correios
        try:
            from services.correios_integration_service import correios_integration_service
            self.correios_service = correios_integration_service
            self.correios_available = True
        except Exception as e:
            logger.warning(f"Integração com Correios não disponível: {e}")
            self.correios_service = None
            self.correios_available = False

    def calculate_shipping(
        self,
        order_total: float,
        address: Optional[Dict[str, Any]] = None,
        items: Optional[List[Dict[str, Any]]] = None,
        use_correios: bool = False,
    ) -> Dict[str, Any]:
        """
        Calcula valor do frete baseado em regras configuradas ou API dos Correios.

        Args:
            order_total: Valor total do pedido
            address: Endereço de entrega (deve conter 'cep' para cálculo por CEP)
            items: Lista de itens do pedido (deve conter peso e dimensões para cálculo real)
            use_correios: Se deve usar API dos Correios (requer CEP e dimensões)

        Returns:
            Dict com shipping_cost, is_free, message, options (se usar Correios)
        """
        try:
            # Se usar Correios e tiver dados necessários, calcular frete real
            if use_correios and self.correios_available and address and items:
                cep_destino = address.get("cep") or address.get("postal_code")
                if cep_destino:
                    # Calcular peso e dimensões totais dos itens
                    total_weight, total_dimensions = self._calculate_total_weight_and_dimensions(items)
                    
                    if total_weight > 0:
                        # Calcular usando Correios
                        correios_result = self.correios_service.calculate_shipping(
                            cep_destino=cep_destino,
                            peso_kg=total_weight,
                            comprimento_cm=total_dimensions["comprimento"],
                            altura_cm=total_dimensions["altura"],
                            largura_cm=total_dimensions["largura"],
                            valor_declarado=order_total,
                            services=["PAC", "SEDEX"],
                        )
                        
                        if correios_result.get("success"):
                            options = correios_result.get("options", [])
                            cheapest = correios_result.get("cheapest")
                            
                            # Verificar frete grátis
                            if order_total >= self.default_free_shipping_threshold:
                                return {
                                    "shipping_cost": 0,
                                    "is_free": True,
                                    "message": "Frete grátis!",
                                    "rule_name": "Frete grátis",
                                    "options": options,
                                    "cheapest_option": cheapest,
                                    "calculated_by": "correios",
                                }
                            
                            # Retornar opção mais barata
                            if cheapest:
                                return {
                                    "shipping_cost": cheapest.get("price", 0),
                                    "is_free": False,
                                    "message": f"Frete {cheapest.get('service', '')}: R$ {cheapest.get('price', 0):.2f}",
                                    "delivery_days": cheapest.get("delivery_days", 0),
                                    "options": options,
                                    "cheapest_option": cheapest,
                                    "calculated_by": "correios",
                                }
            
            # Fallback: usar regras configuradas
            rules = self.repo.find_active_rules(order_by="priority", desc=True)

            # Se não houver regras, usar padrão
            if not rules:
                return self._apply_default_rule(order_total)

            # Aplicar primeira regra que atender os critérios
            for rule in rules:
                min_order = float(rule.get("min_order_value", 0) or 0)
                max_order = rule.get("max_order_value")
                free_threshold = rule.get("free_shipping_threshold")

                # Verificar se o valor do pedido está dentro do range
                if order_total < min_order:
                    continue

                if max_order and order_total > float(max_order):
                    continue

                # Verificar frete grátis
                if free_threshold and order_total >= float(free_threshold):
                    return {
                        "shipping_cost": 0,
                        "is_free": True,
                        "message": "Frete grátis!",
                        "rule_name": rule.get("name", "Regra padrão"),
                        "calculated_by": "rules",
                    }

                # Calcular frete baseado na regra
                shipping_cost = float(
                    rule.get("shipping_cost", self.default_shipping_cost) or self.default_shipping_cost
                )

                return {
                    "shipping_cost": round(shipping_cost, 2),
                    "is_free": False,
                    "message": f"Frete: R$ {shipping_cost:.2f}",
                    "rule_name": rule.get("name", "Regra padrão"),
                    "calculated_by": "rules",
                }

            # Se nenhuma regra se aplicou, usar padrão
            return self._apply_default_rule(order_total)

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            return self._apply_default_rule(order_total)
        except Exception as e:
            self.logger.error(f"Erro ao calcular frete: {str(e)}", exc_info=True)
            return self._apply_default_rule(order_total)

    def _apply_default_rule(self, order_total: float) -> Dict[str, Any]:
        """Aplica regra padrão de frete."""
        if order_total >= self.default_free_shipping_threshold:
            return {
                "shipping_cost": 0,
                "is_free": True,
                "message": "Frete grátis acima de R$ 200!",
                "rule_name": "Regra padrão",
                "calculated_by": "default",
            }
        else:
            return {
                "shipping_cost": self.default_shipping_cost,
                "is_free": False,
                "message": f"Frete: R$ {self.default_shipping_cost:.2f}",
                "rule_name": "Regra padrão",
                "calculated_by": "default",
            }

    def _calculate_total_weight_and_dimensions(self, items: List[Dict[str, Any]]) -> tuple:
        """
        Calcula peso total e dimensões totais dos itens.

        Args:
            items: Lista de itens com peso e dimensões

        Returns:
            Tuple (peso_total_kg, dimensoes_dict)
        """
        total_weight = 0.0
        max_dimensions = {"comprimento": 0, "altura": 0, "largura": 0}

        for item in items:
            # Peso do item (multiplicado pela quantidade)
            item_weight = float(item.get("weight_kg", 0) or 0)
            quantity = int(item.get("quantity", 1))
            total_weight += item_weight * quantity

            # Dimensões (usar as maiores para cálculo)
            comprimento = float(item.get("comprimento_cm", 0) or item.get("length_cm", 0) or 0)
            altura = float(item.get("altura_cm", 0) or item.get("height_cm", 0) or 0)
            largura = float(item.get("largura_cm", 0) or item.get("width_cm", 0) or 0)

            max_dimensions["comprimento"] = max(max_dimensions["comprimento"], comprimento)
            max_dimensions["altura"] = max(max_dimensions["altura"], altura)
            max_dimensions["largura"] = max(max_dimensions["largura"], largura)

        # Valores padrão se não especificados
        if total_weight == 0:
            total_weight = 0.5  # 500g padrão

        if max_dimensions["comprimento"] == 0:
            max_dimensions = {"comprimento": 20, "altura": 10, "largura": 15}  # Dimensões padrão

        return total_weight, max_dimensions

    def validate_cep(self, cep: str) -> Dict[str, Any]:
        """
        Valida e busca informações de um CEP.

        Args:
            cep: CEP a validar

        Returns:
            Dict com informações do CEP ou erro
        """
        if not self.correios_available:
            return {"success": False, "error": "Integração com Correios não disponível"}

        return self.correios_service.validate_cep(cep)

    def calculate_shipping_by_cep(
        self,
        cep_destino: str,
        items: List[Dict[str, Any]],
        order_total: float = 0,
    ) -> Dict[str, Any]:
        """
        Calcula frete usando CEP e itens (usa API dos Correios).

        Args:
            cep_destino: CEP de destino
            items: Lista de itens com peso e dimensões
            order_total: Valor total do pedido (para frete grátis)

        Returns:
            Dict com opções de frete
        """
        if not self.correios_available:
            return {"success": False, "error": "Integração com Correios não disponível"}

        # Calcular peso e dimensões
        total_weight, total_dimensions = self._calculate_total_weight_and_dimensions(items)

        # Calcular usando Correios
        result = self.correios_service.calculate_shipping(
            cep_destino=cep_destino,
            peso_kg=total_weight,
            comprimento_cm=total_dimensions["comprimento"],
            altura_cm=total_dimensions["altura"],
            largura_cm=total_dimensions["largura"],
            valor_declarado=order_total,
            services=["PAC", "SEDEX"],
        )

        # Verificar frete grátis
        if result.get("success") and order_total >= self.default_free_shipping_threshold:
            options = result.get("options", [])
            return {
                "success": True,
                "shipping_cost": 0,
                "is_free": True,
                "message": "Frete grátis!",
                "options": options,
                "calculated_by": "correios",
            }

        return result
