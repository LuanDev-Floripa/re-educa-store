import React from "react";
import { CalorieCalculator } from "../../components/calculators/CalorieCalculator";
// import AIAssistantPopup - Substituído por UnifiedAIAssistant global

/**
 * CalorieCalculatorPage
 * Wrapper para calculadora de calorias com contexto de IA.
 */
const CalorieCalculatorPage = () => {
  return (
    <div>
      <CalorieCalculator />
    </div>
  );
};

export default CalorieCalculatorPage;
