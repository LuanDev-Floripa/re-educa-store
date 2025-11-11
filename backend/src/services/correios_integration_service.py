# -*- coding: utf-8 -*-
"""
Service de Integração com Correios RE-EDUCA Store.

Integra com API dos Correios para cálculo de frete real baseado em:
- CEP de origem e destino
- Peso e dimensões do produto
- Tipo de serviço (PAC, SEDEX, etc)
"""
import logging
import os
import requests
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


class CorreiosIntegrationService:
    """
    Service para integração com API dos Correios.
    
    Calcula frete real usando a API dos Correios baseado em CEP, peso e dimensões.
    """

    def __init__(self):
        """Inicializa o serviço de integração com Correios."""
        self.logger = logger
        # Códigos de serviço dos Correios
        self.service_codes = {
            "PAC": "04510",  # PAC sem contrato
            "SEDEX": "04014",  # SEDEX sem contrato
            "PAC_CONTRATO": "04669",  # PAC com contrato
            "SEDEX_CONTRATO": "04162",  # SEDEX com contrato
            "SEDEX_10": "40215",  # SEDEX 10
            "SEDEX_12": "40126",  # SEDEX 12
        }
        
        # Código administrativo e senha (se tiver contrato)
        self.codigo_administrativo = os.environ.get("CORREIOS_CODIGO_ADMINISTRATIVO")
        self.senha = os.environ.get("CORREIOS_SENHA")
        
        # CEP de origem (loja)
        self.cep_origem = os.environ.get("CORREIOS_CEP_ORIGEM", "01310100")  # Padrão: Av. Paulista
        
        # URL da API dos Correios
        self.api_url = "http://ws.correios.com.br/calculador/CalcPrecoPrazo.aspx"

    def calculate_shipping(
        self,
        cep_destino: str,
        peso_kg: float,
        comprimento_cm: float,
        altura_cm: float,
        largura_cm: float,
        valor_declarado: float = 0,
        services: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        Calcula frete usando API dos Correios.

        Args:
            cep_destino: CEP de destino (formato: 01310100)
            peso_kg: Peso em kg
            comprimento_cm: Comprimento em cm
            altura_cm: Altura em cm
            largura_cm: Largura em cm
            valor_declarado: Valor declarado (opcional)
            services: Lista de serviços a calcular (padrão: ['PAC', 'SEDEX'])

        Returns:
            Dict com opções de frete calculadas
        """
        try:
            # Normalizar CEP (remover hífen e espaços)
            cep_destino = cep_destino.replace("-", "").replace(" ", "")
            cep_origem = self.cep_origem.replace("-", "").replace(" ", "")

            # Validar CEP
            if len(cep_destino) != 8 or not cep_destino.isdigit():
                return {"success": False, "error": "CEP inválido"}

            # Serviços padrão se não especificado
            if services is None:
                services = ["PAC", "SEDEX"]

            # Validar dimensões (Correios tem limites)
            if comprimento_cm + largura_cm + altura_cm > 200:
                return {"success": False, "error": "Soma das dimensões excede 200cm (limite dos Correios)"}

            if max(comprimento_cm, largura_cm, altura_cm) > 105:
                return {"success": False, "error": "Dimensão máxima excede 105cm (limite dos Correios)"}

            # Converter peso para gramas (API dos Correios usa gramas)
            peso_gramas = int(peso_kg * 1000)
            if peso_gramas < 1:
                peso_gramas = 1  # Mínimo 1g

            # Calcular para cada serviço
            shipping_options = []

            for service_name in services:
                service_code = self.service_codes.get(service_name)
                if not service_code:
                    continue

                result = self._call_correios_api(
                    cep_origem=cep_origem,
                    cep_destino=cep_destino,
                    peso_gramas=peso_gramas,
                    comprimento_cm=comprimento_cm,
                    altura_cm=altura_cm,
                    largura_cm=largura_cm,
                    valor_declarado=valor_declarado,
                    service_code=service_code,
                    service_name=service_name,
                )

                if result.get("success"):
                    shipping_options.append(result)

            if not shipping_options:
                return {"success": False, "error": "Nenhuma opção de frete disponível"}

            # Ordenar por preço
            shipping_options.sort(key=lambda x: x.get("price", float("inf")))

            return {
                "success": True,
                "options": shipping_options,
                "cheapest": shipping_options[0] if shipping_options else None,
                "fastest": min(shipping_options, key=lambda x: x.get("delivery_days", 999)) if shipping_options else None,
            }

        except Exception as e:
            self.logger.error(f"Erro ao calcular frete dos Correios: {str(e)}", exc_info=True)
            return {"success": False, "error": f"Erro ao calcular frete: {str(e)}"}

    def _call_correios_api(
        self,
        cep_origem: str,
        cep_destino: str,
        peso_gramas: int,
        comprimento_cm: float,
        altura_cm: float,
        largura_cm: float,
        valor_declarado: float,
        service_code: str,
        service_name: str,
    ) -> Dict[str, Any]:
        """
        Chama API dos Correios para calcular frete.

        Args:
            Todos os parâmetros necessários para a API

        Returns:
            Dict com resultado do cálculo
        """
        try:
            # Parâmetros da API dos Correios
            params = {
                "nCdEmpresa": self.codigo_administrativo or "",
                "sDsSenha": self.senha or "",
                "sCepOrigem": cep_origem,
                "sCepDestino": cep_destino,
                "nVlPeso": str(peso_gramas),
                "nCdFormato": "1",  # 1 = Caixa/Pacote
                "nVlComprimento": str(comprimento_cm),
                "nVlAltura": str(altura_cm),
                "nVlLargura": str(largura_cm),
                "nVlDiametro": "0",
                "sCdMaoPropria": "N",
                "nVlValorDeclarado": str(int(valor_declarado)),
                "sCdAvisoRecebimento": "N",
                "StrRetorno": "xml",
                "nCdServico": service_code,
            }

            # Remover parâmetros vazios
            params = {k: v for k, v in params.items() if v}

            # Fazer requisição
            response = requests.get(self.api_url, params=params, timeout=10)

            if response.status_code != 200:
                return {"success": False, "error": f"Erro na API dos Correios: {response.status_code}"}

            # Parse XML (simplificado - em produção usar xml.etree.ElementTree)
            import xml.etree.ElementTree as ET

            root = ET.fromstring(response.content)

            # Buscar resultado
            servico = root.find(".//cServico")
            if servico is None:
                return {"success": False, "error": "Resposta inválida da API dos Correios"}

            erro = servico.find("Erro")
            if erro is not None and erro.text != "0":
                erro_msg = servico.find("MsgErro")
                return {"success": False, "error": erro_msg.text if erro_msg is not None else "Erro desconhecido"}

            # Extrair dados
            valor = servico.find("Valor")
            prazo = servico.find("PrazoEntrega")

            if valor is None or prazo is None:
                return {"success": False, "error": "Dados incompletos da API"}

            # Converter valor (formato: "15,50")
            valor_str = valor.text.replace(",", ".")
            price = float(valor_str)

            # Prazo em dias
            delivery_days = int(prazo.text) if prazo.text else 0

            return {
                "success": True,
                "service": service_name,
                "service_code": service_code,
                "price": round(price, 2),
                "delivery_days": delivery_days,
                "delivery_estimate": f"{delivery_days} dia(s) útil(is)",
            }

        except requests.exceptions.RequestException as e:
            self.logger.error(f"Erro na requisição para Correios: {str(e)}")
            return {"success": False, "error": f"Erro de conexão: {str(e)}"}
        except Exception as e:
            self.logger.error(f"Erro ao processar resposta dos Correios: {str(e)}", exc_info=True)
            return {"success": False, "error": f"Erro ao processar resposta: {str(e)}"}

    def validate_cep(self, cep: str) -> Dict[str, Any]:
        """
        Valida e busca informações de um CEP.

        Args:
            cep: CEP a validar

        Returns:
            Dict com informações do CEP ou erro
        """
        try:
            # Normalizar CEP
            cep = cep.replace("-", "").replace(" ", "")

            if len(cep) != 8 or not cep.isdigit():
                return {"success": False, "error": "CEP inválido"}

            # Usar API ViaCEP para buscar informações do CEP
            viacep_url = f"https://viacep.com.br/ws/{cep}/json/"
            response = requests.get(viacep_url, timeout=5)

            if response.status_code != 200:
                return {"success": False, "error": "Erro ao buscar CEP"}

            data = response.json()

            if "erro" in data:
                return {"success": False, "error": "CEP não encontrado"}

            return {
                "success": True,
                "cep": data.get("cep", "").replace("-", ""),
                "logradouro": data.get("logradouro", ""),
                "complemento": data.get("complemento", ""),
                "bairro": data.get("bairro", ""),
                "cidade": data.get("localidade", ""),
                "uf": data.get("uf", ""),
                "ibge": data.get("ibge", ""),
            }

        except Exception as e:
            self.logger.error(f"Erro ao validar CEP: {str(e)}", exc_info=True)
            return {"success": False, "error": str(e)}

    def get_tracking_history(self, tracking_number: str) -> Dict[str, Any]:
        """
        Busca histórico de rastreamento na API dos Correios.
        
        Nota: A API pública dos Correios não fornece histórico detalhado.
        Este método retorna informações básicas ou pode ser integrado com
        serviços terceiros que fornecem histórico completo.
        
        Args:
            tracking_number: Código de rastreamento
            
        Returns:
            Dict com histórico de eventos ou erro
        """
        try:
            # API pública dos Correios não fornece histórico via API
            # Retornar estrutura básica que pode ser preenchida manualmente
            # ou via integração com serviços terceiros (ex: Melhor Envio, etc)
            
            # Para implementação completa, seria necessário:
            # 1. Integração com API privada dos Correios (requer contrato)
            # 2. Integração com serviços terceiros (Melhor Envio, etc)
            # 3. Web scraping (não recomendado, pode quebrar)
            
            return {
                "success": True,
                "tracking_number": tracking_number,
                "carrier": "correios",
                "events": [],  # Vazio - requer integração adicional
                "status": "tracking_available",
                "message": "Histórico completo requer integração com API privada ou serviço terceiro",
                "tracking_url": f"https://www.correios.com.br/precisa-de-ajuda/rastreamento-de-objetos?objeto={tracking_number}",
            }
        except Exception as e:
            self.logger.error(f"Erro ao buscar histórico de rastreamento: {str(e)}", exc_info=True)
            return {"success": False, "error": str(e)}


# Instância singleton
correios_integration_service = CorreiosIntegrationService()
