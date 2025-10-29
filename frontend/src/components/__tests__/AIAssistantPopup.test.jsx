/*
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AIAssistantPopup from '../AIAssistantPopup';

// Mock das dependências
// jest.mock('lucide-react', () => ({
  MessageCircle: () => <div data-testid="message-circle-icon">MessageCircle</div>,
  X: () => <div data-testid="x-icon">X</div>,
  Send: () => <div data-testid="send-icon">Send</div>,
  ShoppingCart: () => <div data-testid="shopping-cart-icon">ShoppingCart</div>,
  CreditCard: () => <div data-testid="credit-card-icon">CreditCard</div>,
  Zap: () => <div data-testid="zap-icon">Zap</div>,
  Bot: () => <div data-testid="bot-icon">Bot</div>,
  User: () => <div data-testid="user-icon">User</div>,
  Star: () => <div data-testid="star-icon">Star</div>,
  Heart: () => <div data-testid="heart-icon">Heart</div>,
  Loader2: () => <div data-testid="loader-icon">Loader2</div>,
  CheckCircle: () => <div data-testid="check-circle-icon">CheckCircle</div>,
  AlertCircle: () => <div data-testid="alert-circle-icon">AlertCircle</div>,
  Gift: () => <div data-testid="gift-icon">Gift</div>,
  Target: () => <div data-testid="target-icon">Target</div>,
  TrendingUp: () => <div data-testid="trending-up-icon">TrendingUp</div>,
  Brain: () => <div data-testid="brain-icon">Brain</div>,
  Sparkles: () => <div data-testid="sparkles-icon">Sparkles</div>,
}));

// Mock do scrollIntoView
Element.prototype.scrollIntoView = jest.fn();

// describe('AIAssistantPopup', () => {
  test('renderiza botão flutuante quando fechado', () => {
    render(<AIAssistantPopup />);
    
    // Deve renderizar apenas o botão flutuante
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByTestId('message-circle-icon')).toBeInTheDocument();
    
    // Não deve renderizar o popup
    expect(screen.queryByText('RE-EDUCA Assistant')).not.toBeInTheDocument();
  });

  test('abre o popup quando botão é clicado', async () => {
    const user = userEvent.setup();
    render(<AIAssistantPopup />);
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    // Deve renderizar o popup (usar getAllByText para ser mais específico)
    const agentNames = screen.getAllByText('RE-EDUCA Assistant');
    expect(agentNames.length).toBeGreaterThan(0);
    
    // Verificar mensagem de boas-vindas (usar getAllByText para ser mais específico)
    const welcomeMessages = screen.getAllByText((content, element) => {
      return element.textContent.includes('Como posso ajudar você hoje');
    });
    expect(welcomeMessages.length).toBeGreaterThan(0);
  });

  test('fecha quando botão X é clicado', async () => {
    const user = userEvent.setup();
    render(<AIAssistantPopup />);
    
    // Abrir popup
    const openButton = screen.getByRole('button');
    await user.click(openButton);
    
    // Verificar que está aberto (usar getAllByText para ser mais específico)
    const agentNames = screen.getAllByText('RE-EDUCA Assistant');
    expect(agentNames.length).toBeGreaterThan(0);
    
    // Fechar popup
    const closeButton = screen.getByTestId('x-icon').closest('button');
    await user.click(closeButton);
    
    // Verificar que fechou
    expect(screen.queryByText('RE-EDUCA Assistant')).not.toBeInTheDocument();
  });

  test('envia mensagem quando formulário é submetido', async () => {
    const user = userEvent.setup();
    render(<AIAssistantPopup />);
    
    // Abrir popup
    const openButton = screen.getByRole('button');
    await user.click(openButton);
    
    // Encontrar input e botão de envio
    const input = screen.getByPlaceholderText('Digite sua mensagem...');
    const sendButton = screen.getByTestId('send-icon').closest('button');
    
    // Digitar e enviar mensagem
    await user.type(input, 'Olá, como estou?');
    await user.click(sendButton);
    
    // Verificar que a mensagem foi enviada
    expect(screen.getByText('Olá, como estou?')).toBeInTheDocument();
  });

  test('exibe mensagens do usuário', async () => {
    const user = userEvent.setup();
    render(<AIAssistantPopup />);
    
    // Abrir popup
    const openButton = screen.getByRole('button');
    await user.click(openButton);
    
    // Enviar mensagem
    const input = screen.getByPlaceholderText('Digite sua mensagem...');
    const sendButton = screen.getByTestId('send-icon').closest('button');
    
    await user.type(input, 'Teste de mensagem');
    await user.click(sendButton);
    
    // Verificar mensagem do usuário
    expect(screen.getByText('Teste de mensagem')).toBeInTheDocument();
  });

  test('exibe contexto da ferramenta atual', async () => {
    const user = userEvent.setup();
    render(<AIAssistantPopup />);
    
    // Abrir popup
    const openButton = screen.getByRole('button');
    await user.click(openButton);
    
    // Verificar informações do agente atual (usar getAllByText para ser mais específico)
    const agentNames = screen.getAllByText('RE-EDUCA Assistant');
    expect(agentNames.length).toBeGreaterThan(0);
    
    // Verificar especialidade (usar getAllByText para ser mais específico)
    const specialties = screen.getAllByText('Atendimento Geral');
    expect(specialties.length).toBeGreaterThan(0);
  });

  test('filtra agentes por categoria', async () => {
    const user = userEvent.setup();
    render(<AIAssistantPopup />);
    
    // Abrir popup
    const openButton = screen.getByRole('button');
    await user.click(openButton);
    
    // Ir para aba de agentes
    const agentsTab = screen.getByText('Agentes');
    await user.click(agentsTab);
    
    // Verificar que os agentes estão listados
    expect(screen.getByText('Dr. Nutri')).toBeInTheDocument();
    expect(screen.getByText('Coach Fit')).toBeInTheDocument();
  });

  test('seleciona agente específico', async () => {
    const user = userEvent.setup();
    render(<AIAssistantPopup />);
    
    // Abrir popup
    const openButton = screen.getByRole('button');
    await user.click(openButton);
    
    // Ir para aba de agentes
    const agentsTab = screen.getByText('Agentes');
    await user.click(agentsTab);
    
    // Selecionar agente (usar getAllByText para ser mais específico)
    const agentButtons = screen.getAllByText('Dr. Nutri');
    const agentButton = agentButtons[1]; // O segundo é o da lista de agentes
    await user.click(agentButton);
    
    // Verificar que voltou para o chat com o agente selecionado
    expect(screen.getByText('Dr. Nutri')).toBeInTheDocument();
  });

  test('exibe histórico de conversas', async () => {
    const user = userEvent.setup();
    render(<AIAssistantPopup />);
    
    // Abrir popup
    const openButton = screen.getByRole('button');
    await user.click(openButton);
    
    // Verificar mensagem de boas-vindas
    expect(screen.getByText('👋 Olá! Sou seu assistente pessoal da RE-EDUCA Store. Como posso ajudar você hoje?')).toBeInTheDocument();
  });

  test('exibe indicador de digitação', async () => {
    const user = userEvent.setup();
    render(<AIAssistantPopup />);
    
    // Abrir popup
    const openButton = screen.getByRole('button');
    await user.click(openButton);
    
    // Enviar mensagem para ativar digitação
    const input = screen.getByPlaceholderText('Digite sua mensagem...');
    const sendButton = screen.getByTestId('send-icon').closest('button');
    
    await user.type(input, 'Teste');
    await user.click(sendButton);
    
    // Verificar indicador de digitação (os três pontos animados)
    await waitFor(() => {
      const dots = document.querySelectorAll('.animate-bounce');
      expect(dots.length).toBeGreaterThanOrEqual(3);
    });
  });

  test('valida mensagem vazia', async () => {
    const user = userEvent.setup();
    render(<AIAssistantPopup />);
    
    // Abrir popup
    const openButton = screen.getByRole('button');
    await user.click(openButton);
    
    // Tentar enviar mensagem vazia
    const sendButton = screen.getByTestId('send-icon').closest('button');
    await user.click(sendButton);
    
    // Verificar que não foi enviada
    expect(screen.queryByText('Por favor, digite uma mensagem.')).not.toBeInTheDocument();
  });

  test('exibe loading durante processamento', async () => {
    const user = userEvent.setup();
    render(<AIAssistantPopup />);
    
    // Abrir popup
    const openButton = screen.getByRole('button');
    await user.click(openButton);
    
    // Enviar mensagem
    const input = screen.getByPlaceholderText('Digite sua mensagem...');
    const sendButton = screen.getByTestId('send-icon').closest('button');
    
    await user.type(input, 'Teste de IA');
    await user.click(sendButton);
    
    // Verificar loading (os três pontos animados)
    await waitFor(() => {
      const dots = document.querySelectorAll('.animate-bounce');
      expect(dots.length).toBeGreaterThanOrEqual(3);
    });
  });
});
*/