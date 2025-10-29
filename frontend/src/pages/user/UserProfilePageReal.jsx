import React from 'react';
import UserProfileReal from '../../components/profile/UserProfileReal';

const UserProfilePageReal = () => {
  const handleProfileUpdate = (user) => {
    console.log('Perfil atualizado:', user);
  };

  const handlePasswordChange = () => {
    console.log('Alterar senha');
  };

  const handleNotificationSettings = () => {
    console.log('Configurações de notificação');
  };

  const handlePrivacySettings = () => {
    console.log('Configurações de privacidade');
  };

  const handleDataExport = () => {
    console.log('Exportar dados');
  };

  const handleAccountDelete = () => {
    console.log('Excluir conta');
  };

  return (
    <UserProfileReal
      onProfileUpdate={handleProfileUpdate}
      onPasswordChange={handlePasswordChange}
      onNotificationSettings={handleNotificationSettings}
      onPrivacySettings={handlePrivacySettings}
      onDataExport={handleDataExport}
      onAccountDelete={handleAccountDelete}
      showEditMode={true}
      showStats={true}
      showAchievements={true}
      showSettings={true}
    />
  );
};

export default UserProfilePageReal;