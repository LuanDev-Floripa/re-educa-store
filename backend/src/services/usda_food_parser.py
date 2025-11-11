"""
Parser de Alimentos USDA - RE-EDUCA Store.

Refatoração: Extrai lógica de parsing de alimentos da API USDA de health_service.py
para reduzir complexidade ciclomática.
"""

from typing import Any, Dict, List, Optional


class USDAFoodParser:
    """
    Parser para processar dados de alimentos da API USDA.

    Refatorado para reduzir complexidade ciclomática.
    Lógica de parsing extraída para métodos especializados.
    """

    # Mapa de IDs de nutrientes USDA
    NUTRIENTS_MAP = {
        "calories": 1008,  # Energy (kcal)
        "protein": 1003,  # Protein
        "carbs": 1005,  # Carbohydrate, by difference
        "fat": 1004,  # Total lipid (fat)
        "fiber": 1079,  # Fiber, total dietary
    }

    def parse_food_list(self, foods_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Processa lista de alimentos da API USDA.

        Args:
            foods_data: Lista de alimentos retornados pela API

        Returns:
            Lista de alimentos processados
        """
        foods = []
        for food in foods_data:
            parsed_food = self.parse_food_item(food)
            if parsed_food:
                foods.append(parsed_food)
        return foods

    def parse_food_item(self, food: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Processa um único alimento da API USDA.

        Args:
            food: Dados do alimento da API

        Returns:
            Alimento processado ou None
        """
        nutrients_raw = food.get("foodNutrients", [])
        extracted_nutrients = self._extract_nutrients(nutrients_raw)

        return {
            "fdc_id": food.get("fdcId"),
            "name": food.get("description"),
            "brand": food.get("brandOwner"),
            "category": self._extract_category(food),
            "calories": extracted_nutrients.get("calories", 0),
            "protein": extracted_nutrients.get("protein", 0),
            "carbs": extracted_nutrients.get("carbs", 0),
            "fat": extracted_nutrients.get("fat", 0),
            "fiber": extracted_nutrients.get("fiber", 0),
            "nutrients": nutrients_raw,  # Mantém todos os nutrientes originais
            "serving_size": food.get("servingSize"),
            "serving_unit": food.get("servingSizeUnit"),
        }

    def _extract_nutrients(self, nutrients_raw: List[Dict[str, Any]]) -> Dict[str, float]:
        """
        Extrai nutrientes principais da lista de nutrientes.

        Args:
            nutrients_raw: Lista de nutrientes da API

        Returns:
            Dict com nutrientes principais (calories, protein, carbs, fat, fiber)
        """
        extracted = {}

        for nutrient in nutrients_raw:
            nutrient_id = self._get_nutrient_id(nutrient)
            nutrient_name = self._get_nutrient_name(nutrient)
            value = self._get_nutrient_value(nutrient)
            unit = self._get_nutrient_unit(nutrient)

            # Extrai nutrientes principais
            if nutrient_id == self.NUTRIENTS_MAP["calories"]:
                extracted["calories"] = round(float(value or 0), 1)
            elif nutrient_id == self.NUTRIENTS_MAP["protein"]:
                extracted["protein"] = round(float(value or 0), 1)
            elif nutrient_id == self.NUTRIENTS_MAP["carbs"]:
                extracted["carbs"] = round(float(value or 0), 1)
            elif nutrient_id == self.NUTRIENTS_MAP["fat"]:
                extracted["fat"] = round(float(value or 0), 1)
            elif nutrient_id == self.NUTRIENTS_MAP["fiber"]:
                extracted["fiber"] = round(float(value or 0), 1)

            # Salva outros nutrientes para referência (não sobrescreve os principais)
            if nutrient_name and value:
                nutrient_key = nutrient_name.lower()
                if nutrient_key not in ["calories", "protein", "carbs", "fat", "fiber"]:
                    extracted[nutrient_key] = {"value": value, "unit": unit}

        return extracted

    def _get_nutrient_id(self, nutrient: Dict[str, Any]) -> Optional[int]:
        """Extrai ID do nutriente."""
        nutrient_id = nutrient.get("nutrientId")
        if nutrient_id:
            return int(nutrient_id)

        nutrient_obj = nutrient.get("nutrient", {})
        if isinstance(nutrient_obj, dict):
            nutrient_id = nutrient_obj.get("id")
            if nutrient_id:
                return int(nutrient_id)

        return None

    def _get_nutrient_name(self, nutrient: Dict[str, Any]) -> str:
        """Extrai nome do nutriente."""
        name = nutrient.get("nutrientName")
        if name:
            return name

        nutrient_obj = nutrient.get("nutrient", {})
        if isinstance(nutrient_obj, dict):
            name = nutrient_obj.get("name", "")
            if name:
                return name

        return ""

    def _get_nutrient_value(self, nutrient: Dict[str, Any]) -> float:
        """Extrai valor do nutriente."""
        value = nutrient.get("value")
        if value is not None:
            return float(value)

        value = nutrient.get("amount")
        if value is not None:
            return float(value)

        return 0.0

    def _get_nutrient_unit(self, nutrient: Dict[str, Any]) -> str:
        """Extrai unidade do nutriente."""
        unit = nutrient.get("unitName")
        if unit:
            return unit

        nutrient_obj = nutrient.get("nutrient", {})
        if isinstance(nutrient_obj, dict):
            unit = nutrient_obj.get("unitName", "")
            if unit:
                return unit

        return ""

    def _extract_category(self, food: Dict[str, Any]) -> Optional[str]:
        """Extrai categoria do alimento."""
        food_category = food.get("foodCategory")
        if isinstance(food_category, dict):
            return food_category.get("description")
        return food_category
