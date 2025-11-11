"""
Service de Gamificação RE-EDUCA Store.

Gerencia sistema de gamificação incluindo:
- Desafios
- Conquistas
- Pontuação
- Recompensas
- Leaderboard
"""

import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from config.database import supabase_client
from services.base_service import BaseService

logger = logging.getLogger(__name__)


class GamificationService(BaseService):
    """Service para operações de gamificação"""

    def __init__(self):
        super().__init__()
        self.supabase = supabase_client
        try:
            from repositories.achievements_repository import AchievementsRepository

            self.achievements_repo = AchievementsRepository()
        except ImportError:
            self.achievements_repo = None

    def get_user_stats(self, user_id: str) -> Dict[str, Any]:
        """
        Retorna estatísticas de gamificação do usuário.

        Args:
            user_id: ID do usuário

        Returns:
            Dict com estatísticas
        """
        try:
            # Buscar total_points do usuário
            user_result = self.supabase.table("users").select("total_points").eq("id", user_id).execute()
            total_points = user_result.data[0].get("total_points", 0) if user_result.data else 0

            # Buscar conquistas do usuário
            achievements = []
            if self.achievements_repo:
                achievements = self.achievements_repo.get_user_achievements(user_id)

            # Buscar desafios completados
            completed_challenges_result = (
                self.supabase.table("user_challenges")
                .select("*, challenges(*)")
                .eq("user_id", user_id)
                .eq("status", "completed")
                .execute()
            )
            completed_challenges = completed_challenges_result.data if completed_challenges_result.data else []

            # Buscar desafios em progresso
            active_challenges_result = (
                self.supabase.table("user_challenges")
                .select("*, challenges(*)")
                .eq("user_id", user_id)
                .eq("status", "in_progress")
                .execute()
            )
            active_challenges = active_challenges_result.data if active_challenges_result.data else []

            # Buscar recompensas reivindicadas
            rewards_result = (
                self.supabase.table("user_rewards")
                .select("*, rewards(*)")
                .eq("user_id", user_id)
                .execute()
            )
            claimed_rewards = rewards_result.data if rewards_result.data else []

            # Calcular nível (baseado em pontos)
            level = (total_points // 100) + 1

            return {
                "user_id": user_id,
                "total_points": total_points,
                "level": level,
                "achievements_count": len(achievements),
                "achievements": achievements,
                "completed_challenges_count": len(completed_challenges),
                "active_challenges_count": len(active_challenges),
                "claimed_rewards_count": len(claimed_rewards),
                "next_level_points": level * 100 - total_points,
            }
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
        except Exception as e:
            self.logger.error(f"Erro ao buscar stats de gamificação: {str(e)}", exc_info=True)
        return {
            "user_id": user_id,
            "total_points": 0,
            "level": 1,
            "achievements_count": 0,
            "achievements": [],
            "completed_challenges_count": 0,
            "active_challenges_count": 0,
            "claimed_rewards_count": 0,
            "next_level_points": 100,
        }

    def get_challenges(self, user_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Retorna lista de desafios disponíveis.

        Args:
            user_id: ID do usuário (opcional, para filtrar desafios do usuário)

        Returns:
            Lista de desafios
        """
        try:
            # Buscar desafios ativos do banco
            challenges_result = (
                self.supabase.table("challenges").select("*").eq("is_active", True).execute()
            )
            challenges = challenges_result.data if challenges_result.data else []

            # Se tiver user_id, verificar progresso e status
            if user_id:
                user_challenges_result = (
                    self.supabase.table("user_challenges")
                    .select("challenge_id, status, progress, target")
                    .eq("user_id", user_id)
                    .execute()
                )
                user_challenges_map = {
                    uc["challenge_id"]: uc for uc in (user_challenges_result.data if user_challenges_result.data else [])
                }

                for challenge in challenges:
                    challenge_id = challenge["id"]
                    user_challenge = user_challenges_map.get(challenge_id)
                    if user_challenge:
                        challenge["status"] = user_challenge["status"]
                        challenge["progress"] = user_challenge["progress"]
                        challenge["target"] = user_challenge["target"]
                        challenge["is_completed"] = user_challenge["status"] == "completed"
                        challenge["is_in_progress"] = user_challenge["status"] == "in_progress"
                    else:
                        challenge["status"] = "available"
                        challenge["progress"] = 0
                        challenge["target"] = challenge.get("requirements", {}).get("count", 1)
                        challenge["is_completed"] = False
                        challenge["is_in_progress"] = False

            return challenges
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
        except Exception as e:
            self.logger.error(f"Erro ao buscar desafios: {str(e)}", exc_info=True)
        return []

    def start_challenge(self, user_id: str, challenge_id: str) -> Dict[str, Any]:
        """
        Inicia um desafio para o usuário.

        Args:
            user_id: ID do usuário
            challenge_id: ID do desafio

        Returns:
            Dict com success ou error
        """
        try:
            # Verificar se desafio existe e está ativo
            challenge_result = (
                self.supabase.table("challenges").select("*").eq("id", challenge_id).eq("is_active", True).execute()
            )
            if not challenge_result.data:
                return {"success": False, "error": "Desafio não encontrado ou inativo"}

            challenge = challenge_result.data[0]

            # Verificar se usuário já tem este desafio ativo
            existing_result = (
                self.supabase.table("user_challenges")
                .select("*")
                .eq("user_id", user_id)
                .eq("challenge_id", challenge_id)
                .eq("status", "in_progress")
                .execute()
            )

            if existing_result.data:
                return {"success": False, "error": "Desafio já está em progresso"}

            # Calcular data de expiração se tiver duração
            expires_at = None
            if challenge.get("duration_days"):
                expires_at = (datetime.now() + timedelta(days=challenge["duration_days"])).isoformat()

            # Determinar target do desafio
            requirements = challenge.get("requirements", {})
            target = requirements.get("count", 1)

            # Criar registro de progresso
            user_challenge_data = {
                "user_id": user_id,
                "challenge_id": challenge_id,
                "progress": 0,
                "target": target,
                "status": "in_progress",
                "started_at": datetime.now().isoformat(),
                "expires_at": expires_at,
            }

            insert_result = self.supabase.table("user_challenges").insert(user_challenge_data).execute()

            if insert_result.data:
                return {
                    "success": True,
                    "message": "Desafio iniciado com sucesso",
                    "challenge_id": challenge_id,
                    "user_challenge": insert_result.data[0],
                }
            else:
                return {"success": False, "error": "Erro ao iniciar desafio"}

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            return {"success": False, "error": f"Dados inválidos: {str(e)}"}
        except Exception as e:
            self.logger.error(f"Erro ao iniciar desafio: {str(e)}", exc_info=True)
            return {"success": False, "error": "Erro ao iniciar desafio"}

    def complete_challenge(self, user_id: str, challenge_id: str) -> Dict[str, Any]:
        """
        Completa um desafio para o usuário (chamado automaticamente ou manualmente).

        Args:
            user_id: ID do usuário
            challenge_id: ID do desafio

        Returns:
            Dict com success, pontos ganhos ou error
        """
        try:
            # Buscar desafio do usuário
            user_challenge_result = (
                self.supabase.table("user_challenges")
                .select("*, challenges(*)")
                .eq("user_id", user_id)
                .eq("challenge_id", challenge_id)
                .eq("status", "in_progress")
                .execute()
            )

            if not user_challenge_result.data:
                return {"success": False, "error": "Desafio não encontrado ou já completado"}

            user_challenge = user_challenge_result.data[0]
            challenge = user_challenge.get("challenges", {})

            # Verificar se progresso atingiu o target
            if user_challenge["progress"] < user_challenge["target"]:
                return {"success": False, "error": "Desafio ainda não foi completado"}

            points = challenge.get("points", 0)

            # Atualizar status do desafio
            update_result = (
                self.supabase.table("user_challenges")
                .update(
                    {
                        "status": "completed",
                        "completed_at": datetime.now().isoformat(),
                        "points_earned": points,
                        "updated_at": datetime.now().isoformat(),
                    }
                )
                .eq("id", user_challenge["id"])
                .execute()
            )

            if update_result.data:
                # Adicionar pontos ao usuário
                self._add_points(user_id, points, "challenge", challenge_id, f"Desafio completado: {challenge.get('name', 'N/A')}")

                return {
                    "success": True,
                    "message": "Desafio completado com sucesso",
                    "challenge_id": challenge_id,
                    "points_earned": points,
                }
            else:
                return {"success": False, "error": "Erro ao completar desafio"}

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            return {"success": False, "error": f"Dados inválidos: {str(e)}"}
        except Exception as e:
            logger.error(f"Erro ao completar desafio: {str(e)}", exc_info=True)
            return {"success": False, "error": "Erro ao completar desafio"}

    def claim_reward(self, user_id: str, reward_id: str) -> Dict[str, Any]:
        """
        Reivindica uma recompensa.

        Args:
            user_id: ID do usuário
            reward_id: ID da recompensa

        Returns:
            Dict com success ou error
        """
        try:
            # Buscar recompensa
            reward_result = (
                self.supabase.table("rewards").select("*").eq("id", reward_id).eq("is_active", True).execute()
            )

            if not reward_result.data:
                return {"success": False, "error": "Recompensa não encontrada ou inativa"}

            reward = reward_result.data[0]

            # Verificar validade
            if reward.get("valid_until") and datetime.fromisoformat(reward["valid_until"].replace("Z", "+00:00")) < datetime.now():
                return {"success": False, "error": "Recompensa expirada"}

            # Verificar se usuário tem pontos suficientes
            user_result = self.supabase.table("users").select("total_points").eq("id", user_id).execute()
            user_points = user_result.data[0].get("total_points", 0) if user_result.data else 0

            cost_points = reward.get("cost_points", 0)
            if user_points < cost_points:
                return {"success": False, "error": "Pontos insuficientes para reivindicar esta recompensa"}

            # Verificar disponibilidade
            if reward.get("availability_limit"):
                claimed_count_result = (
                    self.supabase.table("user_rewards")
                    .select("id", count="exact")
                    .eq("reward_id", reward_id)
                    .execute()
                )
                claimed_count = len(claimed_count_result.data) if claimed_count_result.data else 0
                if claimed_count >= reward["availability_limit"]:
                    return {"success": False, "error": "Recompensa esgotada"}

            # Verificar se usuário já reivindicou (se não for reivindicável múltiplas vezes)
            existing_result = (
                self.supabase.table("user_rewards")
                .select("*")
                .eq("user_id", user_id)
                .eq("reward_id", reward_id)
                .eq("status", "claimed")
                .execute()
            )
            if existing_result.data and not reward.get("is_recurring", False):
                return {"success": False, "error": "Recompensa já foi reivindicada"}

            # Subtrair pontos se necessário
            if cost_points > 0:
                self._add_points(user_id, -cost_points, "reward_claim", reward_id, f"Reivindicação: {reward.get('name', 'N/A')}")

            # Criar registro de recompensa reivindicada
            reward_value = reward.get("value", {})
            metadata = {}

            # Se for cupom, gerar código único
            if reward.get("type") == "coupon":
                coupon_code = reward_value.get("coupon_code", f"REWARD{reward_id[:8].upper()}")
                metadata = {"coupon_code": coupon_code, "discount": reward_value.get("discount", 0)}

            # Se for pontos, adicionar pontos
            if reward.get("type") == "points":
                points_to_add = reward_value.get("points", 0)
                if points_to_add > 0:
                    self._add_points(user_id, points_to_add, "reward", reward_id, f"Recompensa: {reward.get('name', 'N/A')}")

            expires_at = None
            if reward.get("valid_until"):
                expires_at = reward["valid_until"]

            user_reward_data = {
                "user_id": user_id,
                "reward_id": reward_id,
                "status": "claimed",
                "claimed_at": datetime.now().isoformat(),
                "expires_at": expires_at,
                "metadata": metadata,
            }

            insert_result = self.supabase.table("user_rewards").insert(user_reward_data).execute()

            if insert_result.data:
                return {
                    "success": True,
                    "message": "Recompensa reivindicada com sucesso",
                    "reward_id": reward_id,
                    "reward": insert_result.data[0],
                    "metadata": metadata,
                }
            else:
                return {"success": False, "error": "Erro ao reivindicar recompensa"}

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            return {"success": False, "error": f"Dados inválidos: {str(e)}"}
        except Exception as e:
            logger.error(f"Erro ao reivindicar recompensa: {str(e)}", exc_info=True)
            return {"success": False, "error": "Erro ao reivindicar recompensa"}

    def _add_points(self, user_id: str, points: int, source: str, source_id: str = None, description: str = None):
        """Adiciona pontos ao usuário e atualiza total_points"""
        try:
            # Inserir registro de pontos
            points_data = {
                "user_id": user_id,
                "points": points,
                "source": source,
                "source_id": source_id,
                "description": description,
            }
            self.supabase.table("user_points").insert(points_data).execute()

            # Atualizar total_points do usuário (trigger também faz isso, mas garantimos)
            user_result = self.supabase.table("users").select("total_points").eq("id", user_id).execute()
            current_points = user_result.data[0].get("total_points", 0) if user_result.data else 0
            new_total = max(0, current_points + points)

            self.supabase.table("users").update({"total_points": new_total}).eq("id", user_id).execute()

        except Exception as e:
            logger.error(f"Erro ao adicionar pontos: {str(e)}", exc_info=True)

    def get_leaderboard(self, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Retorna leaderboard de usuários por pontos.

        Args:
            limit: Número de usuários a retornar (padrão: 10)

        Returns:
            Lista de usuários ordenados por pontos
        """
        try:
            result = (
                self.supabase.table("users")
                .select("id, name, email, total_points")
                .order("total_points", desc=True)
                .limit(limit)
                .execute()
            )

            leaderboard = []
            for idx, user in enumerate(result.data if result.data else [], 1):
                leaderboard.append(
                    {
                        "rank": idx,
                        "user_id": user["id"],
                        "name": user.get("name", "Usuário"),
                        "total_points": user.get("total_points", 0),
                        "level": (user.get("total_points", 0) // 100) + 1,
                    }
                )

            return leaderboard
        except Exception as e:
            logger.error(f"Erro ao buscar leaderboard: {str(e)}", exc_info=True)
            return []

    def get_available_rewards(self, user_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Retorna lista de recompensas disponíveis.

        Args:
            user_id: ID do usuário (opcional, para verificar se já reivindicou)

        Returns:
            Lista de recompensas
        """
        try:
            result = (
                self.supabase.table("rewards")
                .select("*")
                .eq("is_active", True)
                .gte("valid_from", datetime.now().isoformat())
                .or_("valid_until.is.null,valid_until.gt." + datetime.now().isoformat())
                .execute()
            )

            rewards = result.data if result.data else []

            # Se tiver user_id, verificar quais já foram reivindicadas
            if user_id:
                claimed_result = (
                    self.supabase.table("user_rewards")
                    .select("reward_id")
                    .eq("user_id", user_id)
                    .eq("status", "claimed")
                    .execute()
                )
                claimed_ids = {ur["reward_id"] for ur in (claimed_result.data if claimed_result.data else [])}

                for reward in rewards:
                    reward["is_claimed"] = reward["id"] in claimed_ids

            return rewards
        except Exception as e:
            logger.error(f"Erro ao buscar recompensas: {str(e)}", exc_info=True)
            return []
