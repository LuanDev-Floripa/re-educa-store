import React from 'react';
import { MetabolismCalculator } from '../../components/calculators/MetabolismCalculator';
import AIAssistantPopup from '../../components/AIAssistantPopup';

const MetabolismCalculatorPage = () => {
  const [currentTool, setCurrentTool] = React.useState('metabolism_calculator');

  return (
    <div>
      <MetabolismCalculator />
      <AIAssistantPopup 
        currentTool={currentTool}
        toolContext={{
          tool: 'metabolism_calculator',
          userInputs: {}
        }}
      />
    </div>
  );
};

export default MetabolismCalculatorPage;