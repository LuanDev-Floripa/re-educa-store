import React from 'react';
import CalorieCalculatorReal from '../../components/calculators/CalorieCalculatorReal';

const CalorieCalculatorPageReal = () => {
  const handleCalculationComplete = (result) => {
    console.log('Cálculo concluído:', result);
  };

  return (
    <CalorieCalculatorReal
      onCalculationComplete={handleCalculationComplete}
      showAdvanced={true}
      showMacros={true}
      showRecommendations={true}
    />
  );
};

export default CalorieCalculatorPageReal;