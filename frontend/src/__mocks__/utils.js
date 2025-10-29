// Mock das utilitárias para testes
export const formatCurrency = (value) => `R$ ${value.toFixed(2)}`;

export const formatDate = (date) => new Date(date).toLocaleDateString('pt-BR');

export const formatTime = (time) => new Date(time).toLocaleTimeString('pt-BR');