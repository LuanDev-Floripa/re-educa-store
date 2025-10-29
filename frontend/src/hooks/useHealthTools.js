import { useState, useCallback } from 'react';
import apiClient from '../services/apiClient';

export const useHealthTools = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const calculateIMC = useCallback(async (weight, height) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.calculateIMC(weight, height);
      return { success: true, data: response };
    } catch (err) {
      const errorMessage = err.message || 'Erro ao calcular IMC';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const calculateCalories = useCallback(async (age, gender, weight, height, activityLevel, goal) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.calculateCalories(age, gender, weight, height, activityLevel, goal);
      return { success: true, data: response };
    } catch (err) {
      const errorMessage = err.message || 'Erro ao calcular calorias';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const calculateMacros = useCallback(async (calories, goal) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.calculateMacros(calories, goal);
      return { success: true, data: response };
    } catch (err) {
      const errorMessage = err.message || 'Erro ao calcular macros';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const calculateBiologicalAge = useCallback(async (age, gender, healthData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.calculateBiologicalAge(age, gender, healthData);
      return { success: true, data: response };
    } catch (err) {
      const errorMessage = err.message || 'Erro ao calcular idade biológica';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const calculateHydration = useCallback(async (weight, activityLevel, climate) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.calculateHydration(weight, activityLevel, climate);
      return { success: true, data: response };
    } catch (err) {
      const errorMessage = err.message || 'Erro ao calcular hidratação';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    calculateIMC,
    calculateCalories,
    calculateMacros,
    calculateBiologicalAge,
    calculateHydration,
  };
};