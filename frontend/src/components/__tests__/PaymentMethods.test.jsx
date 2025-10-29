import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PaymentMethods } from '../payments/PaymentMethods';
import { useApi } from '../../lib/api';

// Mock do hook useApi
jest.mock('../../lib/api', () => ({
  useApi: jest.fn(),
}));

// Mock do sonner
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

describe('PaymentMethods', () => {
  const mockRequest = jest.fn();
  const mockOnPaymentMethodSelect = jest.fn();

  beforeEach(() => {
    useApi.mockReturnValue({
      request: mockRequest,
    });
    mockRequest.mockClear();
    mockOnPaymentMethodSelect.mockClear();
  });

  it('renders payment methods correctly', async () => {
    const mockPaymentMethods = {
      stripe: {
        enabled: true,
        methods: ['card', 'pix', 'boleto']
      },
      pagseguro: {
        enabled: true,
        methods: ['card', 'pix', 'boleto', 'debit']
      }
    };

    mockRequest.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockPaymentMethods)
    });

    render(
      <PaymentMethods
        amount={100.00}
        onPaymentMethodSelect={mockOnPaymentMethodSelect}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Escolha a forma de pagamento')).toBeInTheDocument();
      expect(screen.getByText('Valor: R$ 100.00')).toBeInTheDocument();
    });
  });

  it('loads payment methods on mount', async () => {
    const mockPaymentMethods = {
      stripe: { enabled: true, methods: ['card'] },
      pagseguro: { enabled: false, methods: [] }
    };

    mockRequest.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockPaymentMethods)
    });

    render(
      <PaymentMethods
        amount={100.00}
        onPaymentMethodSelect={mockOnPaymentMethodSelect}
      />
    );

    await waitFor(() => {
      expect(mockRequest).toHaveBeenCalledWith(expect.any(Function));
    });
  });

  it('calls onPaymentMethodSelect when method is clicked', async () => {
    const mockPaymentMethods = {
      stripe: {
        enabled: true,
        methods: ['card', 'pix']
      },
      pagseguro: {
        enabled: false,
        methods: []
      }
    };

    mockRequest.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockPaymentMethods)
    });

    render(
      <PaymentMethods
        amount={100.00}
        onPaymentMethodSelect={mockOnPaymentMethodSelect}
      />
    );

    await waitFor(() => {
      const cardButton = screen.getByText('Cartão de Crédito');
      fireEvent.click(cardButton);
      expect(mockOnPaymentMethodSelect).toHaveBeenCalledWith('card');
    });
  });

  it('shows correct method names and descriptions', async () => {
    const mockPaymentMethods = {
      stripe: {
        enabled: true,
        methods: ['card', 'pix', 'boleto']
      },
      pagseguro: {
        enabled: false,
        methods: []
      }
    };

    mockRequest.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockPaymentMethods)
    });

    render(
      <PaymentMethods
        amount={100.00}
        onPaymentMethodSelect={mockOnPaymentMethodSelect}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Cartão de Crédito')).toBeInTheDocument();
      expect(screen.getByText('Visa, Mastercard, Elo')).toBeInTheDocument();
      expect(screen.getByText('PIX')).toBeInTheDocument();
      expect(screen.getByText('Aprovação imediata')).toBeInTheDocument();
      expect(screen.getByText('Boleto Bancário')).toBeInTheDocument();
      expect(screen.getByText('Vencimento em 3 dias úteis')).toBeInTheDocument();
    });
  });

  it('highlights selected payment method', async () => {
    const mockPaymentMethods = {
      stripe: {
        enabled: true,
        methods: ['card', 'pix']
      },
      pagseguro: {
        enabled: false,
        methods: []
      }
    };

    mockRequest.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockPaymentMethods)
    });

    render(
      <PaymentMethods
        amount={100.00}
        selectedMethod="card"
        onPaymentMethodSelect={mockOnPaymentMethodSelect}
      />
    );

    await waitFor(() => {
      const cardButton = screen.getByText('Cartão de Crédito').closest('button');
      expect(cardButton).toHaveClass('bg-primary'); // Assumindo que é a classe para método selecionado
    });
  });

  it('shows security information', async () => {
    const mockPaymentMethods = {
      stripe: { enabled: false, methods: [] },
      pagseguro: { enabled: false, methods: [] }
    };

    mockRequest.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockPaymentMethods)
    });

    render(
      <PaymentMethods
        amount={100.00}
        onPaymentMethodSelect={mockOnPaymentMethodSelect}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Pagamento 100% Seguro')).toBeInTheDocument();
      expect(screen.getByText('Criptografia SSL de 256 bits')).toBeInTheDocument();
      expect(screen.getByText('Certificação PCI DSS')).toBeInTheDocument();
      expect(screen.getByText('Proteção contra fraudes')).toBeInTheDocument();
      expect(screen.getByText('Suporte 24/7')).toBeInTheDocument();
    });
  });

  it('handles API error gracefully', async () => {
    mockRequest.mockRejectedValueOnce(new Error('API Error'));

    render(
      <PaymentMethods
        amount={100.00}
        onPaymentMethodSelect={mockOnPaymentMethodSelect}
      />
    );

    await waitFor(() => {
      // Componente deve renderizar mesmo com erro na API
      expect(screen.getByText('Escolha a forma de pagamento')).toBeInTheDocument();
    });
  });

  it('displays amount correctly', () => {
    render(
      <PaymentMethods
        amount={299.99}
        onPaymentMethodSelect={mockOnPaymentMethodSelect}
      />
    );

    expect(screen.getByText('Valor: R$ 299.99')).toBeInTheDocument();
  });

  it('shows only enabled payment providers', async () => {
    const mockPaymentMethods = {
      stripe: {
        enabled: true,
        methods: ['card']
      },
      pagseguro: {
        enabled: false,
        methods: ['card', 'pix']
      }
    };

    mockRequest.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockPaymentMethods)
    });

    render(
      <PaymentMethods
        amount={100.00}
        onPaymentMethodSelect={mockOnPaymentMethodSelect}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Stripe')).toBeInTheDocument();
      expect(screen.queryByText('PagSeguro')).not.toBeInTheDocument();
    });
  });
});