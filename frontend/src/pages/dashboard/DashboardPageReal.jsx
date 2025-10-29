import React from 'react';
import DashboardReal from '../../components/dashboard/DashboardReal';

const DashboardPageReal = () => {
  const handleWidgetUpdate = (widgetId, updates) => {
    console.log('Widget atualizado:', widgetId, updates);
  };

  const handleLayoutChange = (newLayout) => {
    console.log('Layout alterado:', newLayout);
  };

  return (
    <DashboardReal
      onWidgetUpdate={handleWidgetUpdate}
      onLayoutChange={handleLayoutChange}
      showCustomization={true}
      showStats={true}
      showGoals={true}
      showAchievements={true}
      showRecommendations={true}
    />
  );
};

export default DashboardPageReal;