import React from "react";
import { StressCalculator } from "../../components/calculators/StressCalculator";
// import AIAssistantPopup - Substituído por UnifiedAIAssistant global

/**
 * StressCalculatorPage
 * Wrapper para calculadora de estresse com contexto de IA.
 */
const StressCalculatorPage = () => {
  return (
    <div>
      <StressCalculator />
    </div>
  );
};

export default StressCalculatorPage;
