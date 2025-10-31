import React from "react";
import { BiologicalAgeCalculator } from "../../components/calculators/BiologicalAgeCalculator";
// import AIAssistantPopup - Substituído por UnifiedAIAssistant global

/**
 * BiologicalAgeCalculatorPage
 * Wrapper para idade biol?gica com contexto de IA.
 */
const BiologicalAgeCalculatorPage = () => {
  const [currentTool, setCurrentTool] = React.useState(
    "biological_age_calculator",
  );

  return (
    <div>
      <BiologicalAgeCalculator />
    </div>
  );
};

export default BiologicalAgeCalculatorPage;
