import React from "react";
import { HydrationCalculator } from "../../components/calculators/HydrationCalculator";
// import AIAssistantPopup - Substituído por UnifiedAIAssistant global

/**
 * HydrationCalculatorPage
 * Wrapper para calculadora de hidrata??o com contexto de IA.
 */
const HydrationCalculatorPage = () => {
  const [currentTool, setCurrentTool] = React.useState("hydration_calculator");

  return (
    <div>
      <HydrationCalculator />
    </div>
  );
};

export default HydrationCalculatorPage;
