import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { toast } from 'sonner';

export const useSocialAuth = () => {
  const { user, login, logout, register } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (credentials) => {
    setIsLoading(true);
    setError(null);
    try {
      await login(credentials);
      toast.success('Login realizado com sucesso!');
    } catch (err) {
      setError(err.message);
      toast.error('Erro no login: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await logout();
      toast.success('Logout realizado com sucesso!');
    } catch (err) {
      setError(err.message);
      toast.error('Erro no logout: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (userData) => {
    setIsLoading(true);
    setError(null);
    try {
      await register(userData);
      toast.success('Conta criada com sucesso!');
    } catch (err) {
      setError(err.message);
      toast.error('Erro no registro: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    user,
    isLoading,
    error,
    login: handleLogin,
    logout: handleLogout,
    register: handleRegister,
    isAuthenticated: !!user
  };
};