/**
 * Testes para useCart Hook RE-EDUCA Store
 * 
 * Testes completos do hook de carrinho
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useCart } from '../../hooks/useCart';
import apiClient from '../../services/apiClient';

// Mock do apiClient
jest.mock('../../services/apiClient', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

describe('useCart', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test('deve carregar carrinho inicial vazio', async () => {
    apiClient.get.mockResolvedValue({
      success: true,
      data: { items: [], total: 0, item_count: 0 }
    });

    const { result } = renderHook(() => useCart());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.cart).toEqual([]);
    expect(result.current.total).toBe(0);
  });

  test('deve adicionar item ao carrinho', async () => {
    const mockCart = { items: [], total: 0, item_count: 0 };
    apiClient.get.mockResolvedValue({
      success: true,
      data: mockCart
    });

    apiClient.post.mockResolvedValue({
      success: true,
      data: {
        items: [{ id: '1', product_id: 'prod1', quantity: 1, price: 99.90 }],
        total: 99.90,
        item_count: 1
      }
    });

    const { result } = renderHook(() => useCart());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.addToCart('prod1', 1);
    });

    expect(apiClient.post).toHaveBeenCalledWith('/cart/items', {
      product_id: 'prod1',
      quantity: 1
    });
  });

  test('deve remover item do carrinho', async () => {
    const mockCart = {
      items: [{ id: '1', product_id: 'prod1', quantity: 1 }],
      total: 99.90,
      item_count: 1
    };

    apiClient.get.mockResolvedValue({
      success: true,
      data: mockCart
    });

    apiClient.delete.mockResolvedValue({
      success: true
    });

    const { result } = renderHook(() => useCart());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.removeFromCart('1');
    });

    expect(apiClient.delete).toHaveBeenCalledWith('/cart/items/1');
  });

  test('deve atualizar quantidade de item', async () => {
    const mockCart = {
      items: [{ id: '1', product_id: 'prod1', quantity: 1 }],
      total: 99.90,
      item_count: 1
    };

    apiClient.get.mockResolvedValue({
      success: true,
      data: mockCart
    });

    apiClient.put.mockResolvedValue({
      success: true,
      data: {
        ...mockCart,
        items: [{ id: '1', product_id: 'prod1', quantity: 2 }],
        total: 199.80
      }
    });

    const { result } = renderHook(() => useCart());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.updateQuantity('1', 2);
    });

    expect(apiClient.put).toHaveBeenCalledWith('/cart/items/1', {
      quantity: 2
    });
  });

  test('deve limpar carrinho', async () => {
    const mockCart = {
      items: [{ id: '1', product_id: 'prod1', quantity: 1 }],
      total: 99.90,
      item_count: 1
    };

    apiClient.get.mockResolvedValue({
      success: true,
      data: mockCart
    });

    apiClient.delete.mockResolvedValue({
      success: true
    });

    const { result } = renderHook(() => useCart());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.clearCart();
    });

    expect(apiClient.delete).toHaveBeenCalledWith('/cart');
  });
});
