"""
Serviço de Calculadoras de Saúde RE-EDUCA Store.

Fornece cálculos de saúde incluindo:
- IMC (Índice de Massa Corporal)
- Necessidades calóricas diárias (TMB/TDEE)
- Hidratação recomendada
- Percentual de gordura corporal
- Salvamento de histórico de cálculos
"""

import logging
from datetime import datetime
from typing import Any, Dict

from config.database import supabase_client
from repositories.health_repository import HealthRepository

logger = logging.getLogger(__name__)


class HealthCalculatorService:
    """Service para cálculos de saúde e fitness."""

    def __init__(self):
        """Inicializa o serviço de calculadoras de saúde."""
        self.supabase = supabase_client
        self.health_repo = HealthRepository()

    def calculate_bmi(self, height_cm: float, weight_kg: float) -> Dict[str, Any]:
        """
        Calcula o IMC (Índice de Massa Corporal) com classificação.

        Args:
            height_cm (float): Altura em centímetros.
            weight_kg (float): Peso em quilogramas.

        Returns:
            Dict[str, Any]: IMC, categoria e recomendações.
        """
        try:
            if height_cm <= 0 or weight_kg <= 0:
                return {"error": "Altura e peso devem ser maiores que zero"}

            # Converte altura para metros
            height_m = height_cm / 100

            # Calcula IMC
            bmi = weight_kg / (height_m**2)

            # Classifica o IMC
            if bmi < 18.5:
                category = "Abaixo do peso"
                color = "blue"
            elif bmi < 25:
                category = "Peso normal"
                color = "green"
            elif bmi < 30:
                category = "Sobrepeso"
                color = "yellow"
            else:
                category = "Obesidade"
                color = "red"

            return {
                "bmi": round(bmi, 1),
                "category": category,
                "color": color,
                "height_cm": height_cm,
                "weight_kg": weight_kg,
                "timestamp": datetime.now().isoformat(),
            }

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao calcular IMC: {e}", exc_info=True)
            return {"error": "Erro interno do servidor"}

    def calculate_calories(
        self, age: int, gender: str, height_cm: float, weight_kg: float, activity_level: str
    ) -> Dict[str, Any]:
        """Calcula necessidade calórica diária"""
        try:
            if age <= 0 or height_cm <= 0 or weight_kg <= 0:
                return {"error": "Idade, altura e peso devem ser maiores que zero"}

            if gender not in ["male", "female"]:
                return {"error": "Gênero deve ser male ou female"}

            if activity_level not in ["sedentary", "light", "moderate", "active", "very_active"]:
                return {"error": "Nível de atividade inválido"}

            # Calcula TMB (Taxa Metabólica Basal) usando fórmula de Mifflin-St Jeor
            if gender == "male":
                bmr = (10 * weight_kg) + (6.25 * height_cm) - (5 * age) + 5
            else:
                bmr = (10 * weight_kg) + (6.25 * height_cm) - (5 * age) - 161

            # Fatores de atividade
            activity_factors = {
                "sedentary": 1.2,  # Pouco ou nenhum exercício
                "light": 1.375,  # Exercício leve 1-3 dias/semana
                "moderate": 1.55,  # Exercício moderado 3-5 dias/semana
                "active": 1.725,  # Exercício pesado 6-7 dias/semana
                "very_active": 1.9,  # Exercício muito pesado, trabalho físico
            }

            # Calcula necessidade calórica diária
            daily_calories = bmr * activity_factors[activity_level]

            # Calcula macros básicos (proteína: 25%, carboidrato: 45%, gordura: 30%)
            protein_calories = daily_calories * 0.25
            carb_calories = daily_calories * 0.45
            fat_calories = daily_calories * 0.30

            protein_grams = protein_calories / 4  # 4 cal/g
            carb_grams = carb_calories / 4  # 4 cal/g
            fat_grams = fat_calories / 9  # 9 cal/g

            return {
                "bmr": round(bmr, 0),
                "daily_calories": round(daily_calories, 0),
                "macros": {
                    "protein": {
                        "grams": round(protein_grams, 1),
                        "calories": round(protein_calories, 0),
                        "percentage": 25,
                    },
                    "carbs": {"grams": round(carb_grams, 1), "calories": round(carb_calories, 0), "percentage": 45},
                    "fat": {"grams": round(fat_grams, 1), "calories": round(fat_calories, 0), "percentage": 30},
                },
                "activity_level": activity_level,
                "timestamp": datetime.now().isoformat(),
            }

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao calcular calorias: {e}", exc_info=True)
            return {"error": "Erro interno do servidor"}

    def calculate_hydration(self, weight_kg: float, activity_level: str, climate: str = "temperate") -> Dict[str, Any]:
        """Calcula necessidade de hidratação diária"""
        try:
            if weight_kg <= 0:
                return {"error": "Peso deve ser maior que zero"}

            if activity_level not in ["sedentary", "light", "moderate", "active", "very_active"]:
                return {"error": "Nível de atividade inválido"}

            # Base: 35ml por kg de peso corporal
            base_water_ml = weight_kg * 35

            # Ajustes por atividade
            activity_multipliers = {"sedentary": 1.0, "light": 1.2, "moderate": 1.4, "active": 1.6, "very_active": 1.8}

            # Ajustes por clima
            climate_multipliers = {"cold": 1.0, "temperate": 1.1, "hot": 1.3, "very_hot": 1.5}

            # Calcula necessidade total
            total_water_ml = base_water_ml * activity_multipliers[activity_level] * climate_multipliers[climate]

            # Converte para litros
            total_water_liters = total_water_ml / 1000

            # Calcula copos (200ml cada)
            glasses = total_water_ml / 200

            # Calcula garrafas (500ml cada)
            bottles = total_water_ml / 500

            return {
                "total_water_ml": round(total_water_ml, 0),
                "total_water_liters": round(total_water_liters, 1),
                "glasses_200ml": round(glasses, 1),
                "bottles_500ml": round(bottles, 1),
                "weight_kg": weight_kg,
                "activity_level": activity_level,
                "climate": climate,
                "timestamp": datetime.now().isoformat(),
            }

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao calcular hidratação: {e}", exc_info=True)
            return {"error": "Erro interno do servidor"}

    def calculate_body_fat(
        self, age: int, gender: str, height_cm: float, weight_kg: float, waist_cm: float, neck_cm: float
    ) -> Dict[str, Any]:
        """Calcula percentual de gordura corporal usando método da Marinha Americana"""
        try:
            if age <= 0 or height_cm <= 0 or weight_kg <= 0 or waist_cm <= 0 or neck_cm <= 0:
                return {"error": "Todos os valores devem ser maiores que zero"}

            if gender not in ["male", "female"]:
                return {"error": "Gênero deve ser male ou female"}

            # Converte para polegadas
            height_in = height_cm / 2.54
            waist_in = waist_cm / 2.54
            neck_in = neck_cm / 2.54

            if gender == "male":
                # Fórmula para homens
                body_fat = 495 / (1.0324 - 0.19077 * (waist_in - neck_in) + 0.15456 * height_in) - 450
                # Limita entre 3% e 50%
                body_fat = max(3, min(50, body_fat))
            else:
                # Para mulheres, precisamos também da medida do quadril
                # Como não temos, vamos usar uma estimativa baseada no IMC
                height_m = height_cm / 100
                bmi = weight_kg / (height_m**2)

                # Estimativa baseada no IMC (menos precisa para mulheres)
                if bmi < 18.5:
                    body_fat = 10 + (bmi - 15) * 2
                elif bmi < 25:
                    body_fat = 15 + (bmi - 18.5) * 1.5
                elif bmi < 30:
                    body_fat = 25 + (bmi - 25) * 2
                else:
                    body_fat = 35 + (bmi - 30) * 1.5

                body_fat = max(8, min(45, body_fat))  # Limita entre 8% e 45%

            # Classifica o percentual de gordura
            if gender == "male":
                if body_fat < 6:
                    category = "Atlético"
                    color = "blue"
                elif body_fat < 14:
                    category = "Bom"
                    color = "green"
                elif body_fat < 18:
                    category = "Aceitável"
                    color = "yellow"
                elif body_fat < 25:
                    category = "Sobrepeso"
                    color = "orange"
                else:
                    category = "Obeso"
                    color = "red"
            else:
                if body_fat < 10:
                    category = "Atlético"
                    color = "blue"
                elif body_fat < 20:
                    category = "Bom"
                    color = "green"
                elif body_fat < 25:
                    category = "Aceitável"
                    color = "yellow"
                elif body_fat < 32:
                    category = "Sobrepeso"
                    color = "orange"
                else:
                    category = "Obeso"
                    color = "red"

            return {
                "body_fat_percentage": round(body_fat, 1),
                "category": category,
                "color": color,
                "gender": gender,
                "age": age,
                "timestamp": datetime.now().isoformat(),
            }

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao calcular gordura corporal: {e}", exc_info=True)
            return {"error": "Erro interno do servidor"}

    def save_calculation(
        self, user_id: str, calculation_type: str, input_data: Dict[str, Any], result: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Salva cálculo no banco de dados Supabase"""
        try:
            # Salva na tabela health_calculations
            calculation_data = {
                "user_id": user_id,
                "calculation_type": calculation_type,
                "input_data": input_data,
                "result_data": result,
                "created_at": datetime.now().isoformat(),
            }

            response = self.health_repo.create_health_calculation(calculation_data)

            if response:
                # Também salva na tabela específica do tipo de cálculo para histórico
                if calculation_type == "bmi":
                    # Salva histórico de IMC
                    imc_data = {
                        "user_id": user_id,
                        "height_cm": input_data.get("height_cm"),
                        "weight_kg": input_data.get("weight_kg"),
                        "imc_value": result.get("bmi"),
                        "category": result.get("category"),
                    }
                    self.health_repo.create_imc_history(imc_data)
                    logger.debug(f"Histórico de IMC salvo para usuário {user_id}")

                elif calculation_type == "calories":
                    # Salva histórico de calorias
                    calories_data = {
                        "user_id": user_id,
                        "age": input_data.get("age"),
                        "gender": input_data.get("gender"),
                        "height_cm": input_data.get("height_cm"),
                        "weight_kg": input_data.get("weight_kg"),
                        "activity_level": input_data.get("activity_level"),
                        "bmr": result.get("bmr"),
                        "daily_calories": result.get("daily_calories"),
                    }
                    self.health_repo.create_calories_history(calories_data)
                    logger.debug(f"Histórico de calorias salvo para usuário {user_id}")

                elif calculation_type == "hydration":
                    # Salva histórico de hidratação
                    hydration_data = {
                        "user_id": user_id,
                        "weight_kg": input_data.get("weight_kg"),
                        "activity_level": input_data.get("activity_level"),
                        "climate": input_data.get("climate", "temperate"),
                        "total_water_ml": result.get("total_water_ml"),
                        "total_water_liters": result.get("total_water_liters"),
                    }
                    self.health_repo.create_hydration_history(hydration_data)
                    logger.debug(f"Histórico de hidratação salvo para usuário {user_id}")

                elif calculation_type == "body_fat":
                    # Salva histórico de gordura corporal
                    body_fat_data = {
                        "user_id": user_id,
                        "age": input_data.get("age"),
                        "gender": input_data.get("gender"),
                        "height_cm": input_data.get("height_cm"),
                        "weight_kg": input_data.get("weight_kg"),
                        "waist_cm": input_data.get("waist_cm"),
                        "neck_cm": input_data.get("neck_cm"),
                        "body_fat_percentage": result.get("body_fat_percentage"),
                        "category": result.get("category"),
                    }
                    self.health_repo.create_body_fat_history(body_fat_data)
                    logger.debug(f"Histórico de gordura corporal salvo para usuário {user_id}")

                logger.info(f"Cálculo {calculation_type} salvo com sucesso para usuário {user_id}")
                return {"success": True, "calculation": response}
            else:
                logger.error("Erro: resposta do repositório vazia")
                return {"success": False, "error": "Erro ao salvar cálculo no banco"}

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao salvar cálculo: {str(e)}", exc_info=True)
            return {"success": False, "error": f"Erro interno do servidor: {str(e)}"}
