"""
Calculadora de Idade Biológica - RE-EDUCA Store.

Refatoração: Extrai lógica de cálculo de idade biológica de health_service.py
para reduzir complexidade ciclomática.

Divide o cálculo em módulos separados por categoria de fatores.
"""

from typing import Any, Dict, List


class BiologicalAgeCalculator:
    """
    Calculadora de idade biológica.

    Refatorado para reduzir complexidade ciclomática.
    Lógica dividida em módulos especializados.
    """

    def __init__(self):
        """Inicializa calculadora com fatores de ajuste."""
        self.fitness_factors = {
            "cardiovascularFitness": {"poor": 3, "below_average": 2, "average": 0, "good": -1, "excellent": -2},
            "strength": {"poor": 2, "below_average": 1, "average": 0, "good": -1, "excellent": -2},
            "endurance": {"poor": 2, "below_average": 1, "average": 0, "good": -1, "excellent": -2},
            "flexibility": {"poor": 1, "below_average": 0.5, "average": 0, "good": -0.5, "excellent": -1},
            "balance": {"poor": 1, "below_average": 0.5, "average": 0, "good": -0.5, "excellent": -1},
        }

        self.lifestyle_factors = {
            "sleepQuality": {"poor": 2, "fair": 1, "good": 0, "excellent": -1},
            "dietQuality": {"poor": 2, "fair": 1, "good": 0, "excellent": -1},
            "hydration": {"poor": 1, "fair": 0.5, "good": 0, "excellent": -0.5},
            "exerciseFrequency": {"poor": 3, "below_average": 1.5, "average": 0, "good": -1.5, "excellent": -3},
        }

        self.stress_levels = {"low": -0.5, "moderate": 0, "high": 1.5, "severe": 3}

        self.disease_factors = {
            "diabetes": 3,
            "hypertension": 2,
            "heart_disease": 4,
            "cancer": 5,
            "arthritis": 1,
            "osteoporosis": 2,
            "depression": 1,
            "anxiety": 1,
        }

        self.biomarker_factors = {
            "bloodPressure": {"high": 3, "normal": -1},
            "cholesterol": {"high": 2, "normal": -1},
            "bloodSugar": {"high": 3, "normal": -1},
            "inflammation": {"high": 2, "low": -1},
            "vitaminD": {"low": 1, "optimal": -1},
            "omega3": {"low": 1, "optimal": -1},
        }

    def calculate(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calcula idade biológica baseada em múltiplos fatores.

        Args:
            data: Dados do usuário incluindo idade, fatores de saúde, etc.

        Returns:
            Dict com idade biológica calculada, diferença, classificação e score.
        """
        chronological_age = int(data.get("age", 30))
        age_adjustment = 0

        factors = data.get("factors", {})

        # Calcular ajustes por categoria
        age_adjustment += self._calculate_fitness_adjustment(factors)
        age_adjustment += self._calculate_lifestyle_adjustment(factors)
        age_adjustment += self._calculate_stress_adjustment(factors)
        age_adjustment += self._calculate_smoking_alcohol_adjustment(factors)
        age_adjustment += self._calculate_chronic_diseases_adjustment(data.get("chronicDiseases", []))
        age_adjustment += self._calculate_medications_adjustment(data.get("medications", []))
        age_adjustment += self._calculate_family_history_adjustment(data.get("familyHistory", []))
        age_adjustment += self._calculate_biomarkers_adjustment(data.get("biomarkers", {}), data.get("gender", "male"))

        # Calcular idade biológica
        biological_age = chronological_age + age_adjustment
        age_difference = biological_age - chronological_age

        # Classificação
        classification = self._classify_age_difference(age_difference)

        # Score (0-100)
        score = max(0, min(100, 100 - (age_difference * 2)))

        return {
            "chronological_age": chronological_age,
            "biological_age": round(biological_age, 1),
            "age_difference": round(age_difference, 1),
            "classification": classification,
            "score": round(score, 1),
            "age_adjustment": round(age_adjustment, 1),
        }

    def _calculate_fitness_adjustment(self, factors: Dict[str, Any]) -> float:
        """Calcula ajuste baseado em fatores de fitness."""
        adjustment = 0.0
        for factor_key, factor_values in self.fitness_factors.items():
            value = factors.get(factor_key)
            if value and value in factor_values:
                adjustment += factor_values[value]
        return adjustment

    def _calculate_lifestyle_adjustment(self, factors: Dict[str, Any]) -> float:
        """Calcula ajuste baseado em fatores de estilo de vida."""
        adjustment = 0.0
        for factor_key, factor_values in self.lifestyle_factors.items():
            value = factors.get(factor_key)
            if value and value in factor_values:
                adjustment += factor_values[value]
        return adjustment

    def _calculate_stress_adjustment(self, factors: Dict[str, Any]) -> float:
        """Calcula ajuste baseado em nível de estresse."""
        stress_level = factors.get("stressLevel")
        if stress_level and stress_level in self.stress_levels:
            return self.stress_levels[stress_level]
        return 0.0

    def _calculate_smoking_alcohol_adjustment(self, factors: Dict[str, Any]) -> float:
        """Calcula ajuste baseado em tabagismo e álcool."""
        adjustment = 0.0

        smoking = factors.get("smoking", "never")
        if smoking == "yes":
            adjustment += 5
        elif smoking == "former":
            adjustment += 2

        alcohol = factors.get("alcohol", "none")
        if alcohol == "heavy":
            adjustment += 3
        elif alcohol == "moderate":
            adjustment += 1

        return adjustment

    def _calculate_chronic_diseases_adjustment(self, diseases: List[str]) -> float:
        """Calcula ajuste baseado em doenças crônicas."""
        adjustment = 0.0
        for disease in diseases:
            if disease in self.disease_factors:
                adjustment += self.disease_factors[disease]
        return adjustment

    def _calculate_medications_adjustment(self, medications: List[str]) -> float:
        """Calcula ajuste baseado em medicamentos."""
        return len(medications) * 0.5

    def _calculate_family_history_adjustment(self, family_history: List[str]) -> float:
        """Calcula ajuste baseado em histórico familiar."""
        return len(family_history) * 1.5

    def _calculate_biomarkers_adjustment(self, biomarkers: Dict[str, Any], gender: str) -> float:
        """Calcula ajuste baseado em biomarcadores."""
        adjustment = 0.0

        # Gordura corporal
        body_fat = biomarkers.get("bodyFat")
        if body_fat:
            body_fat_value = float(body_fat)
            if body_fat_value > 25:
                adjustment += (body_fat_value - 25) * 0.2
            elif body_fat_value < 10:
                adjustment -= (10 - body_fat_value) * 0.1

        # Massa muscular
        muscle_mass = biomarkers.get("muscleMass")
        if muscle_mass:
            muscle_mass_value = float(muscle_mass)
            expected_muscle_mass = 40 if gender == "male" else 30
            if muscle_mass_value < expected_muscle_mass:
                adjustment += (expected_muscle_mass - muscle_mass_value) * 0.1
            elif muscle_mass_value > expected_muscle_mass + 5:
                adjustment -= (muscle_mass_value - expected_muscle_mass - 5) * 0.05

        # Outros biomarcadores
        for biomarker_key, biomarker_values in self.biomarker_factors.items():
            value = biomarkers.get(biomarker_key)
            if value and value in biomarker_values:
                adjustment += biomarker_values[value]

        return adjustment

    def _classify_age_difference(self, age_difference: float) -> str:
        """Classifica diferença de idade."""
        if age_difference <= -5:
            return "Muito Jovem"
        elif age_difference <= -2:
            return "Jovem"
        elif age_difference >= 5:
            return "Envelhecido"
        elif age_difference >= 2:
            return "Ligeiramente Envelhecido"
        else:
            return "Normal"
