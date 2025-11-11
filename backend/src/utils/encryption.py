"""
Sistema de Criptografia para Chaves de API RE-EDUCA Store.

Fornece criptografia segura para dados sensíveis incluindo:
- Criptografia/descriptografia com Fernet (AES-128)
- Derivação de chave com PBKDF2-HMAC-SHA256
- Proteção de API keys
- Salt e password configuráveis via env

Usa cryptography library para segurança robusta.
"""

import base64
import logging
import os

from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

logger = logging.getLogger(__name__)


class EncryptionService:
    """
    Serviço de criptografia para dados sensíveis.

    Usa Fernet (AES-128 CBC + HMAC) para criptografia simétrica.
    """

    def __init__(self):
        """Inicializa o serviço de criptografia."""
        self.salt = os.environ.get("ENCRYPTION_SALT", "re-educa-salt-2024").encode()
        self.password = os.environ.get("ENCRYPTION_PASSWORD", "re-educa-encryption-key").encode()
        self._fernet = None

    def _get_fernet(self):
        """Obtém instância do Fernet para criptografia"""
        if self._fernet is None:
            kdf = PBKDF2HMAC(
                algorithm=hashes.SHA256(),
                length=32,
                salt=self.salt,
                iterations=100000,
            )
            key = base64.urlsafe_b64encode(kdf.derive(self.password))
            self._fernet = Fernet(key)
        return self._fernet

    def encrypt(self, data: str) -> str:
        """
        Criptografa dados sensíveis.

        Args:
            data (str): Dados em texto plano.

        Returns:
            str: Dados criptografados em base64.
        """
        try:
            if not data:
                return ""

            fernet = self._get_fernet()
            encrypted_data = fernet.encrypt(data.encode())
            return base64.urlsafe_b64encode(encrypted_data).decode()
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao criptografar dados: {str(e)}", exc_info=True)
            raise

    def decrypt(self, encrypted_data: str) -> str:
        """Descriptografa dados sensíveis"""
        try:
            if not encrypted_data:
                return ""

            fernet = self._get_fernet()
            decoded_data = base64.urlsafe_b64decode(encrypted_data.encode())
            decrypted_data = fernet.decrypt(decoded_data)
            return decrypted_data.decode()
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao descriptografar dados: {str(e)}", exc_info=True)
            raise

    def encrypt_api_key(self, api_key: str) -> str:
        """Criptografa chave de API"""
        return self.encrypt(api_key)

    def decrypt_api_key(self, encrypted_api_key: str) -> str:
        """Descriptografa chave de API"""
        return self.decrypt(encrypted_api_key)


# Instância global do serviço de criptografia
encryption_service = EncryptionService()
