"""
Service de autenticação RE-EDUCA Store - Supabase.

Gerencia autenticação e autorização de usuários incluindo:
- Registro de novos usuários com validação
- Autenticação com email e senha
- Geração e verificação de tokens JWT
- Atualização de perfil e senha
- Recuperação de senha
"""

import logging
from datetime import datetime
from typing import Any, Dict, Optional

from config.database import supabase_client
from config.security import generate_token, hash_password, verify_password
from services.base_service import BaseService
from utils.helpers import validate_email

logger = logging.getLogger(__name__)


class AuthService(BaseService):
    """
    Service para operações de autenticação - Supabase.

    Herda de BaseService para padronização e centralização de lógica comum.

    Attributes:
        supabase: Cliente Supabase para operações de banco de dados.
    """

    def __init__(self):
        """Inicializa o serviço de autenticação."""
        super().__init__()
        from repositories.user_repository import UserRepository

        self.user_repo = UserRepository()
        # Mantém supabase apenas para métodos específicos que ainda precisam
        self.supabase = supabase_client

    def register_user(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Registra novo usuário no sistema.

        Args:
            data (Dict[str, Any]): Dados do usuário contendo name, email e password.

        Returns:
            Dict[str, Any]: Resultado com success, user e token ou erro.
        """
        try:
            existing_user = self.user_repo.find_by_email(data["email"])

            if existing_user:
                return {"success": False, "error": "Email já está em uso"}

            # Valida email
            if not validate_email(data["email"]):
                return {"success": False, "error": "Email inválido"}

            # Hash da senha
            password_hash = hash_password(data["password"])

            # Dados do usuário
            user_data = {
                "name": data["name"],
                "email": data["email"],
                "password_hash": password_hash,
                "role": "user",
                "is_active": True,
            }

            result = self.user_repo.create(user_data)

            if result and isinstance(result, dict) and "id" in result:
                # Gera token
                token = generate_token(result["id"])

                return {
                    "success": True,
                    "user": {
                        "id": result["id"],
                        "name": result.get("name"),
                        "email": result.get("email"),
                        "role": result.get("role", "user"),
                    },
                    "token": token,
                }
            else:
                logger.error(f"Erro ao criar usuário. Result: {result}")
                return {"success": False, "error": "Erro ao criar usuário"}

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao registrar usuário: {e}", exc_info=True)
            return {"success": False, "error": "Erro interno do servidor"}

    def authenticate_user(self, email: str, password: str) -> Dict[str, Any]:
        """
        Autentica usuário com email e senha.

        Args:
            email (str): Email do usuário.
            password (str): Senha em texto plano.

        Returns:
            Dict[str, Any]: Resultado com success, user e token ou erro.
        """
        try:
            user = self.user_repo.find_by_email(email)

            if not user:
                return {"success": False, "error": "Email ou senha inválidos"}

            # Verifica senha
            if not verify_password(password, user["password_hash"]):
                return {"success": False, "error": "Email ou senha inválidos"}

            # Verifica se usuário está ativo
            if not user.get("is_active", True):
                return {"success": False, "error": "Conta desativada"}

            # Atualiza último login (campo não existe na tabela atual)
            # self.supabase.update_user(user['id'], {
            #     'last_login': datetime.now().isoformat()
            # })

            # Gera token
            token = generate_token(user["id"])

            return {
                "success": True,
                "user": {"id": user["id"], "name": user["name"], "email": user["email"], "role": user["role"]},
                "token": token,
            }

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao autenticar usuário: {e}", exc_info=True)
            return {"success": False, "error": "Erro interno do servidor"}

    def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Busca usuário por ID"""
        try:
            return self.user_repo.find_by_id(user_id)
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao buscar usuário: {e}", exc_info=True)
            return None

    def update_user(self, user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Atualiza dados do usuário"""
        try:
            result = self.user_repo.update(user_id, data)

            if result:
                return {"success": True, "user": result}
            else:
                return {"success": False, "error": "Erro ao atualizar usuário"}

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao atualizar usuário: {e}", exc_info=True)
            return {"success": False, "error": "Erro interno do servidor"}

    def change_password(self, user_id: str, current_password: str, new_password: str) -> Dict[str, Any]:
        """Altera senha do usuário"""
        try:
            user = self.user_repo.find_by_id(user_id)

            if not user:
                return {"success": False, "error": "Usuário não encontrado"}

            # Verifica senha atual
            if not verify_password(current_password, user["password_hash"]):
                return {"success": False, "error": "Senha atual incorreta"}

            # Hash da nova senha
            new_password_hash = hash_password(new_password)

            result = self.user_repo.update(
                user_id, {"password_hash": new_password_hash, "updated_at": datetime.now().isoformat()}
            )

            if result:
                return {"success": True}
            else:
                return {"success": False, "error": "Erro ao alterar senha"}

        except Exception as e:
            logger.error(f"Erro ao alterar senha: {e}")
            return {"success": False, "error": "Erro interno do servidor"}

    def deactivate_user(self, user_id: str) -> Dict[str, Any]:
        """Desativa usuário"""
        try:
            result = self.user_repo.update(user_id, {"is_active": False, "updated_at": datetime.now().isoformat()})

            if result:
                return {"success": True}
            else:
                return {"success": False, "error": "Erro ao desativar usuário"}

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao desativar usuário: {e}", exc_info=True)
            return {"success": False, "error": "Erro interno do servidor"}
