/**
 * Testes para useAuth Hook RE-EDUCA Store
 * 
 * Testes completos do hook de autenticação
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuth } from '../../hooks/useAuth';
import apiClient from '../../services/apiClient';
import { MemoryRouter } from 'react-router-dom';

// Mock do apiClient
jest.mock('../../services/apiClient', () => ({
  get: jest.fn(),
  post: jest.fn(),
  setAuth: jest.fn(),
  clearAuth: jest.fn(),
}));

// Mock do react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

describe('useAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test('deve iniciar sem autenticação', async () => {
    apiClient.get.mockResolvedValue({
      success: false
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  test('deve fazer login com sucesso', async () => {
    const mockUser = {
      id: '1',
      name: 'Test User',
      email: 'test@example.com'
    };

    apiClient.post.mockResolvedValue({
      success: true,
      data: {
        user: mockUser,
        token: 'mock-token',
        refresh_token: 'mock-refresh-token'
      }
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      const success = await result.current.login({
        email: 'test@example.com',
        password: 'password123'
      });
      expect(success).toBe(true);
    });

    expect(apiClient.setAuth).toHaveBeenCalledWith('mock-token', 'mock-refresh-token');
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(mockUser);
  });

  test('deve falhar login com credenciais inválidas', async () => {
    apiClient.post.mockResolvedValue({
      success: false,
      error: 'Credenciais inválidas'
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      const success = await result.current.login({
        email: 'wrong@example.com',
        password: 'wrong'
      });
      expect(success).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.error).toBeTruthy();
  });

  test('deve fazer logout', async () => {
    const mockUser = {
      id: '1',
      name: 'Test User',
      email: 'test@example.com'
    };

    localStorage.setItem('auth_token', 'mock-token');

    apiClient.get.mockResolvedValue({
      success: true,
      data: mockUser
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });

    await act(async () => {
      result.current.logout();
    });

    expect(apiClient.clearAuth).toHaveBeenCalled();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  test('deve registrar novo usuário', async () => {
    const mockUser = {
      id: '1',
      name: 'New User',
      email: 'new@example.com'
    };

    apiClient.post.mockResolvedValue({
      success: true,
      data: {
        user: mockUser,
        token: 'mock-token',
        refresh_token: 'mock-refresh-token'
      }
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      const success = await result.current.register({
        name: 'New User',
        email: 'new@example.com',
        password: 'password123'
      });
      expect(success).toBe(true);
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(mockUser);
  });
});
