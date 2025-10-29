import React from 'react';
import { SleepCalculator } from '../../components/calculators/SleepCalculator';
import AIAssistantPopup from '../../components/AIAssistantPopup';

const SleepCalculatorPage = () => {
  const [currentTool, setCurrentTool] = React.useState('sleep_calculator');

  return (
    <div>
      <SleepCalculator />
      <AIAssistantPopup 
        currentTool={currentTool}
        toolContext={{
          tool: 'sleep_calculator',
          userInputs: {}
        }}
      />
    </div>
  );
};

export default SleepCalculatorPage;