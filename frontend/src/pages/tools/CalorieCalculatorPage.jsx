import React from 'react';
import { CalorieCalculator } from '../../components/calculators/CalorieCalculator';
import AIAssistantPopup from '../../components/AIAssistantPopup';

const CalorieCalculatorPage = () => {
  const [currentTool, setCurrentTool] = React.useState('calorie_calculator');

  return (
    <div>
      <CalorieCalculator />
      <AIAssistantPopup 
        currentTool={currentTool}
        toolContext={{
          tool: 'calorie_calculator',
          userInputs: {}
        }}
      />
    </div>
  );
};

export default CalorieCalculatorPage;