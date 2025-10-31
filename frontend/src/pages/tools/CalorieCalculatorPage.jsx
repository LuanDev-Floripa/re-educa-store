import React from "react";
import { CalorieCalculator } from "../../components/calculators/CalorieCalculator";
// import AIAssistantPopup - Substituído por UnifiedAIAssistant global

/**
 * CalorieCalculatorPage
 * Wrapper para calculadora de calorias com contexto de IA.
 */
const CalorieCalculatorPage = () => {
  const [currentTool, setCurrentTool] = React.useState("calorie_calculator");

  return (
    <div>
      <CalorieCalculator />
    </div>
  );
};

export default CalorieCalculatorPage;
