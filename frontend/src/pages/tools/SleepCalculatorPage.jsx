import React from "react";
import { SleepCalculator } from "../../components/calculators/SleepCalculator";
// import AIAssistantPopup - Substituído por UnifiedAIAssistant global

/**
 * SleepCalculatorPage
 * Wrapper para calculadora de sono com contexto de IA.
 */
const SleepCalculatorPage = () => {
  const [currentTool, setCurrentTool] = React.useState("sleep_calculator");

  return (
    <div>
      <SleepCalculator />
    </div>
  );
};

export default SleepCalculatorPage;
