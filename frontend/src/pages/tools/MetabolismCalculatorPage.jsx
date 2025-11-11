import React from "react";
import { MetabolismCalculator } from "../../components/calculators/MetabolismCalculator";
// import AIAssistantPopup - Substituído por UnifiedAIAssistant global

/**
 * MetabolismCalculatorPage
 * Wrapper para calculadora de metabolismo com contexto de IA.
 */
const MetabolismCalculatorPage = () => {
  return (
    <div>
      <MetabolismCalculator />
    </div>
  );
};

export default MetabolismCalculatorPage;
