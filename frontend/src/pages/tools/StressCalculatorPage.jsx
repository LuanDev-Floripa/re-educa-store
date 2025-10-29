import React from 'react';
import { StressCalculator } from '../../components/calculators/StressCalculator';
import AIAssistantPopup from '../../components/AIAssistantPopup';

const StressCalculatorPage = () => {
  const [currentTool, setCurrentTool] = React.useState('stress_calculator');

  return (
    <div>
      <StressCalculator />
      <AIAssistantPopup 
        currentTool={currentTool}
        toolContext={{
          tool: 'stress_calculator',
          userInputs: {}
        }}
      />
    </div>
  );
};

export default StressCalculatorPage;