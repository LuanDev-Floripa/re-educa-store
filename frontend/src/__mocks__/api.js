// Mock da API para testes
export const useApi = () => ({
  request: jest.fn(),
  loading: false,
  error: null,
});

export const apiService = {
  gamification: {
    getUserStats: jest.fn(),
    getChallenges: jest.fn(),
    startChallenge: jest.fn(),
    completeChallenge: jest.fn(),
    claimReward: jest.fn(),
  },
  payments: {
    getPaymentItems: jest.fn(),
    processPayment: jest.fn(),
    getPaymentHistory: jest.fn(),
    applyCoupon: jest.fn(),
  },
  ai: {
    sendMessage: jest.fn(),
    getConversationHistory: jest.fn(),
    getAvailableAgents: jest.fn(),
  },
};
