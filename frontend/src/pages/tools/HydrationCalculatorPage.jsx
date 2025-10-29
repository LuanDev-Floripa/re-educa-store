import React from 'react';
import { HydrationCalculator } from '../../components/calculators/HydrationCalculator';
import AIAssistantPopup from '../../components/AIAssistantPopup';

const HydrationCalculatorPage = () => {
  const [currentTool, setCurrentTool] = React.useState('hydration_calculator');

  return (
    <div>
      <HydrationCalculator />
      <AIAssistantPopup 
        currentTool={currentTool}
        toolContext={{
          tool: 'hydration_calculator',
          userInputs: {}
        }}
      />
    </div>
  );
};

export default HydrationCalculatorPage;