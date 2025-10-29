import React from 'react';
import { BiologicalAgeCalculator } from '../../components/calculators/BiologicalAgeCalculator';
import AIAssistantPopup from '../../components/AIAssistantPopup';

const BiologicalAgeCalculatorPage = () => {
  const [currentTool, setCurrentTool] = React.useState('biological_age_calculator');

  return (
    <div>
      <BiologicalAgeCalculator />
      <AIAssistantPopup 
        currentTool={currentTool}
        toolContext={{
          tool: 'biological_age_calculator',
          userInputs: {}
        }}
      />
    </div>
  );
};

export default BiologicalAgeCalculatorPage;