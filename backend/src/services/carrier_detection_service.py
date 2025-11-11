# -*- coding: utf-8 -*-
"""
Service de Detecção de Transportadora RE-EDUCA Store.

Detecta automaticamente a transportadora baseado no código de rastreamento
e retorna URL de rastreamento apropriada.
"""
import logging
import re
from typing import Dict, Optional

logger = logging.getLogger(__name__)


class CarrierDetectionService:
    """
    Service para detecção automática de transportadora baseado em código de rastreamento.
    
    Suporta múltiplas transportadoras brasileiras:
    - Correios (códigos de 13 dígitos)
    - Jadlog (códigos alfanuméricos)
    - Loggi (códigos alfanuméricos)
    - Melhor Envio (códigos alfanuméricos)
    """

    # Padrões de códigos de rastreamento por transportadora
    CARRIER_PATTERNS = {
        "correios": [
            r"^[A-Z]{2}\d{9}[A-Z]{2}$",  # Formato: AA123456789BR
            r"^\d{13}$",  # Formato: 13 dígitos
        ],
        "jadlog": [
            r"^JDL\d{10}$",  # Formato: JDL + 10 dígitos
            r"^JAD\d{10}$",  # Formato alternativo
        ],
        "loggi": [
            r"^LOGGI[A-Z0-9]{8,12}$",  # Formato: LOGGI + alfanumérico
        ],
        "melhor_envio": [
            r"^ME\d{10,12}$",  # Formato: ME + dígitos
        ],
    }

    # URLs de rastreamento por transportadora
    TRACKING_URLS = {
        "correios": "https://www.correios.com.br/precisa-de-ajuda/rastreamento-de-objetos?objeto={tracking_number}",
        "jadlog": "https://www.jadlog.com.br/jadlog/servlet/JadLogTracking?cte={tracking_number}",
        "loggi": "https://www.loggi.com/rastreamento/{tracking_number}",
        "melhor_envio": "https://melhorenvio.com.br/rastreamento/{tracking_number}",
    }

    def detect_carrier(self, tracking_number: str) -> Optional[str]:
        """
        Detecta a transportadora baseado no código de rastreamento.

        Args:
            tracking_number: Código de rastreamento

        Returns:
            Nome da transportadora ou None se não detectada
        """
        if not tracking_number:
            return None

        tracking_number = tracking_number.strip().upper()

        # Testar padrões de cada transportadora
        for carrier, patterns in self.CARRIER_PATTERNS.items():
            for pattern in patterns:
                if re.match(pattern, tracking_number):
                    logger.debug(f"Transportadora detectada: {carrier} para código {tracking_number}")
                    return carrier

        # Se não detectou, retornar None (será tratado como Correios por padrão)
        logger.warning(f"Não foi possível detectar transportadora para código: {tracking_number}")
        return None

    def get_tracking_url(self, tracking_number: str, carrier: Optional[str] = None) -> Optional[str]:
        """
        Retorna URL de rastreamento para o código fornecido.

        Args:
            tracking_number: Código de rastreamento
            carrier: Nome da transportadora (opcional, será detectado se não fornecido)

        Returns:
            URL de rastreamento ou None se não encontrada
        """
        if not tracking_number:
            return None

        # Detectar transportadora se não fornecida
        if not carrier:
            carrier = self.detect_carrier(tracking_number)

        # Se não detectou, usar Correios como padrão (mais comum no Brasil)
        if not carrier:
            carrier = "correios"
            logger.info(f"Usando Correios como padrão para código: {tracking_number}")

        # Retornar URL formatada
        if carrier in self.TRACKING_URLS:
            url_template = self.TRACKING_URLS[carrier]
            return url_template.format(tracking_number=tracking_number)

        return None

    def get_carrier_info(self, tracking_number: str) -> Dict[str, any]:
        """
        Retorna informações completas sobre a transportadora detectada.

        Args:
            tracking_number: Código de rastreamento

        Returns:
            Dict com carrier, tracking_url e confidence
        """
        carrier = self.detect_carrier(tracking_number)
        tracking_url = self.get_tracking_url(tracking_number, carrier)

        return {
            "carrier": carrier or "correios",  # Padrão: Correios
            "tracking_url": tracking_url,
            "confidence": "high" if carrier else "low",  # Alta confiança se detectou, baixa se usou padrão
        }


# Instância singleton
carrier_detection_service = CarrierDetectionService()
