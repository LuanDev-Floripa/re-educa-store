/**
 * Cliente API centralizado para comunicação com o backend RE-EDUCA
 * Gerencia autenticação, requisições e respostas de forma unificada
 */

// Garante que a URL sempre termina com /api
const getApiBaseUrl = () => {
  const envUrl =
    import.meta.env.VITE_API_URL || "https://api.topsupplementslab.com";
  // Remove /api se já existir para evitar duplicação
  const baseUrl = envUrl.replace(/\/api\/?$/, "");
  return `${baseUrl}/api`;
};

const API_BASE_URL = getApiBaseUrl();
const WS_URL = import.meta.env.VITE_WS_URL || "http://localhost:5000";

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.wsURL = WS_URL;
    try {
      this.token = localStorage.getItem("auth_token");
      this.refreshToken = localStorage.getItem("refresh_token");
    } catch {
      this.token = null;
      this.refreshToken = null;
    }
  }

  /**
   * Configura headers padrão para requisições
   * @param {boolean} [includeAuth=true] Incluir header Authorization
   * @returns {Record<string,string>} Headers para fetch
   */
  getHeaders(includeAuth = true) {
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    if (includeAuth && this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    return headers;
  }

  /**
   * Faz requisição HTTP genérica
   * @param {string} endpoint Caminho relativo começando com '/'
   * @param {RequestInit & { includeAuth?: boolean }} [options]
   * @returns {Promise<any>} Corpo JSON já parseado
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getHeaders(options.includeAuth !== false),
      ...options,
    };

    try {
      const response = await fetch(url, config);

      // Se token expirou, tenta renovar
      if (response.status === 401 && this.refreshToken) {
        const refreshed = await this.refreshAuthToken();
        if (refreshed) {
          // Refaz a requisição com novo token
          config.headers["Authorization"] = `Bearer ${this.token}`;
          const retryResponse = await fetch(url, config);
          return await this.handleResponse(retryResponse);
        }
      }

      return await this.handleResponse(response);
    } catch (error) {
      console.error("Erro na requisição API:", error);

      // Melhor tratamento de erros de rede
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        throw new Error(
          "Não foi possível conectar ao servidor. Verifique sua conexão com a internet.",
        );
      }

      if (error.message) {
        throw error;
      }

      throw new Error(
        "Erro de conexão com o servidor. Tente novamente mais tarde.",
      );
    }
  }

  /**
   * Processa resposta da API
   * @param {Response} response
   * @returns {Promise<any>}
   */
  async handleResponse(response) {
    let data;
    try {
      data = await response.json();
    } catch (error) {
      // Se não conseguir fazer parse do JSON, retorna erro genérico
      throw new Error(`Erro ${response.status}: ${response.statusText}`);
    }

    if (!response.ok) {
      const errorMessage =
        data?.error || data?.message || `Erro ${response.status}: ${response.statusText}`;
      throw new Error(errorMessage);
    }

    return data;
  }

  /**
   * Renova token de autenticação
   * @returns {Promise<boolean>} true se renovado com sucesso
   */
  async refreshAuthToken() {
    try {
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: "POST",
        headers: this.getHeaders(false),
        body: JSON.stringify({ refresh_token: this.refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        this.setTokens(data.token, data.refresh_token);
        return true;
      }
    } catch (error) {
      console.error("Erro ao renovar token:", error);
    }

    // Se falhou, limpa tokens e redireciona para login
    this.clearTokens();
    window.location.href = "/login";
    return false;
  }

  /**
   * Define tokens de autenticação
   * @param {string} token
   * @param {string} refreshToken
   */
  setTokens(token, refreshToken) {
    this.token = token;
    this.refreshToken = refreshToken;
    localStorage.setItem("auth_token", token);
    localStorage.setItem("refresh_token", refreshToken);
  }

  /**
   * Limpa tokens de autenticação
   * @returns {void}
   */
  clearTokens() {
    this.token = null;
    this.refreshToken = null;
    localStorage.removeItem("auth_token");
    localStorage.removeItem("refresh_token");
  }

  // ================================
  // MÉTODOS DE AUTENTICAÇÃO
  // ================================

  /**
   * Realiza login do usuário
   * @param {string} email
   * @param {string} password
   * @returns {Promise<any>}
   */
  async login(email, password) {
    const data = await this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
      includeAuth: false,
    });

    if (data.token) {
      this.setTokens(data.token, data.refresh_token);
    }

    return data;
  }

  /**
   * Registra um novo usuário
   * @param {Record<string, any>} userData
   * @returns {Promise<any>}
   */
  async register(userData) {
    const response = await this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
      includeAuth: false,
    });

    // Se registro bem-sucedido, salva tokens se fornecidos
    if (response.token) {
      this.setTokens(response.token, response.refresh_token);
    }

    return response;
  }

  /**
   * Faz logout do usuário atual
   * @returns {Promise<void>}
   */
  async logout() {
    try {
      await this.request("/auth/logout", { method: "POST" });
    } finally {
      this.clearTokens();
    }
  }

  // ================================
  // MÉTODOS DE USUÁRIO
  // ================================

  /** @returns {Promise<any>} Perfil do usuário logado */
  async getUserProfile() {
    return await this.request("/users/profile");
  }

  /**
   * @param {Record<string, any>} profileData
   * @returns {Promise<any>}
   */
  async updateUserProfile(profileData) {
    return await this.request("/users/profile", {
      method: "PUT",
      body: JSON.stringify(profileData),
    });
  }

  /** @returns {Promise<any>} Dados do dashboard do usuário */
  async getUserDashboard() {
    return await this.request("/users/dashboard");
  }

  // ================================
  // MÉTODOS DE SAÚDE
  // ================================

  /**
   * @param {number} weight
   * @param {number} height
   */
  async calculateIMC(weight, height) {
    return await this.request("/health/imc/calculate", {
      method: "POST",
      body: JSON.stringify({ weight, height }),
    });
  }

  /**
   * @param {number} age
   * @param {string} gender
   * @param {number} weight
   * @param {number} height
   * @param {string} activityLevel
   * @param {string} goal
   */
  async calculateCalories(age, gender, weight, height, activityLevel, goal) {
    return await this.request("/health/calories/calculate", {
      method: "POST",
      body: JSON.stringify({
        age,
        gender,
        weight,
        height,
        activityLevel,
        goal,
      }),
    });
  }

  /**
   * @param {number} calories
   * @param {string} goal
   */
  async calculateMacros(calories, goal) {
    return await this.request("/health/macros/calculate", {
      method: "POST",
      body: JSON.stringify({ calories, goal }),
    });
  }

  /**
   * @param {number} age
   * @param {string} gender
   * @param {Record<string, any>} healthData
   */
  async calculateBiologicalAge(age, gender, healthData) {
    return await this.request("/health/biological-age/calculate", {
      method: "POST",
      body: JSON.stringify({ age, gender, ...healthData }),
    });
  }

  /**
   * @param {number} weight
   * @param {string} activityLevel
   * @param {string} climate
   */
  async calculateHydration(weight, activityLevel, climate) {
    return await this.request("/health/hydration/calculate", {
      method: "POST",
      body: JSON.stringify({ weight, activityLevel, climate }),
    });
  }

  // ================================
  // MÉTODOS DE EXERCÍCIOS
  // ================================

  /**
   * @param {Record<string, any>} [filters]
   */
  async getExercises(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    return await this.request(
      `/exercises${queryParams ? `?${queryParams}` : ""}`,
    );
  }

  /** @param {string|number} id */
  async getExerciseById(id) {
    return await this.request(`/exercises/${id}`);
  }

  /** @param {Record<string, any>} planData */
  async createWorkoutPlan(planData) {
    return await this.request("/exercises/workout-plans", {
      method: "POST",
      body: JSON.stringify(planData),
    });
  }

  // ================================
  // MÉTODOS DE PRODUTOS
  // ================================

  /** @param {Record<string, any>} [filters] */
  async getProducts(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    return await this.request(
      `/products${queryParams ? `?${queryParams}` : ""}`,
    );
  }

  /** @param {string|number} id */
  async getProductById(id) {
    return await this.request(`/products/${id}`);
  }

  // ================================
  // MÉTODOS DE CARRINHO
  // ================================

  /** @returns {Promise<any>} Carrinho atual */
  async getCart() {
    return await this.request("/cart");
  }

  /** @param {string|number} productId @param {number} [quantity=1] */
  async addToCart(productId, quantity = 1) {
    return await this.request("/cart/items", {
      method: "POST",
      body: JSON.stringify({ product_id: productId, quantity }),
    });
  }

  /** @param {string|number} itemId @param {number} quantity */
  async updateCartItem(itemId, quantity) {
    return await this.request(`/cart/items/${itemId}`, {
      method: "PUT",
      body: JSON.stringify({ quantity }),
    });
  }

  /** @param {string|number} itemId */
  async removeFromCart(itemId) {
    return await this.request(`/cart/items/${itemId}`, {
      method: "DELETE",
    });
  }

  // ================================
  // MÉTODOS DE PEDIDOS
  // ================================

  /** @param {Record<string, any>} orderData */
  async createOrder(orderData) {
    return await this.request("/orders", {
      method: "POST",
      body: JSON.stringify(orderData),
    });
  }

  /** @returns {Promise<any[]>} Lista de pedidos */
  async getOrders() {
    return await this.request("/orders");
  }

  /** @param {string|number} id */
  async getOrderById(id) {
    return await this.request(`/orders/${id}`);
  }

  // ================================
  // MÉTODOS DE PAGAMENTO
  // ================================

  /** @param {Record<string, any>} orderData */
  async createPaymentIntent(orderData) {
    return await this.request("/payments/create-intent", {
      method: "POST",
      body: JSON.stringify(orderData),
    });
  }

  /** @param {string} paymentIntentId */
  async confirmPayment(paymentIntentId) {
    return await this.request("/payments/confirm", {
      method: "POST",
      body: JSON.stringify({ payment_intent_id: paymentIntentId }),
    });
  }

  // ================================
  // MÉTODOS DE IA
  // ================================

  /** @param {Record<string, any>} userData */
  async getAIRecommendations(userData) {
    return await this.request("/ai/recommendations", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  }

  /** @param {string} message @param {Record<string, any>} [context] */
  async chatWithAI(message, context = {}) {
    return await this.request("/ai/chat", {
      method: "POST",
      body: JSON.stringify({ message, context }),
    });
  }

  // ================================
  // MÉTODOS DE REDE SOCIAL
  // ================================

  /** @param {Record<string, any>} [filters] */
  async getSocialPosts(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    return await this.request(
      `/social/posts${queryParams ? `?${queryParams}` : ""}`,
    );
  }

  /** @param {Record<string, any>} postData */
  async createPost(postData) {
    return await this.request("/social/posts", {
      method: "POST",
      body: JSON.stringify(postData),
    });
  }

  /** @param {string|number} postId */
  async likePost(postId) {
    return await this.request(`/social/posts/${postId}/like`, {
      method: "POST",
    });
  }

  /** @param {string|number} postId @param {string} comment */
  async commentPost(postId, comment) {
    return await this.request(`/social/posts/${postId}/comments`, {
      method: "POST",
      body: JSON.stringify({ content: comment }),
    });
  }

  // ================================
  // MÉTODOS DE LIVE STREAMING
  // ================================

  /** @returns {Promise<any[]>} Lista de streams */
  async getLiveStreams() {
    return await this.request("/social/streams");
  }

  /** @param {Record<string, any>} streamData */
  async createStream(streamData) {
    return await this.request("/social/streams", {
      method: "POST",
      body: JSON.stringify(streamData),
    });
  }

  /** @param {string|number} streamId */
  async joinStream(streamId) {
    return await this.request(`/social/streams/${streamId}/join`, {
      method: "POST",
    });
  }

  // ================================
  // MÉTODOS DE CUPONS
  // ================================

  /** @returns {Promise<any[]>} Lista de cupons */
  async getCoupons() {
    return await this.request("/coupons");
  }

  /** @param {string} code */
  async validateCoupon(code) {
    return await this.request("/coupons/validate", {
      method: "POST",
      body: JSON.stringify({ code }),
    });
  }

  // ================================
  // MÉTODOS DE EXPORTAÇÃO DE DADOS
  // ================================

  /** @param {"json"|"csv"} [format="json"] */
  async exportUserData(format = "json") {
    return await this.request("/users/export", {
      method: "POST",
      body: JSON.stringify({ format }),
    });
  }

  /** @param {string} exportId */
  async getExportStatus(exportId) {
    return await this.request(`/users/export/${exportId}`);
  }

  /** @param {string} exportId */
  async downloadExport(exportId) {
    return await this.request(`/users/export/${exportId}/download`);
  }

  // ================================
  // MÉTODOS DE GAMIFICAÇÃO
  // ================================

  /** @returns {Promise<any>} Progresso de gamificação */
  async getUserProgress() {
    return await this.request("/users/progress");
  }

  /** @param {string|number} rewardId */
  async claimReward(rewardId) {
    return await this.request(`/users/rewards/${rewardId}/claim`, {
      method: "POST",
    });
  }

  /** @returns {Promise<any[]>} Conquistas do usuário */
  async getAchievements() {
    return await this.request("/users/achievements");
  }

  // ================================
  // MÉTODOS DE NOTIFICAÇÕES
  // ================================

  /** @returns {Promise<any[]>} Notificações do usuário */
  async getNotifications() {
    return await this.request("/users/notifications");
  }

  /** @param {string|number} notificationId */
  async markNotificationAsRead(notificationId) {
    return await this.request(`/users/notifications/${notificationId}/read`, {
      method: "PUT",
    });
  }

  /** @param {Record<string, any>} settings */
  async updateNotificationSettings(settings) {
    return await this.request("/users/notification-settings", {
      method: "PUT",
      body: JSON.stringify(settings),
    });
  }

  // ================================
  // MÉTODOS ADMINISTRATIVOS
  // ================================

  /** @returns {Promise<any>} Dashboard admin */
  async getAdminDashboard() {
    return await this.request("/admin/dashboard");
  }

  /** @param {number} [page=1] @param {number} [per_page=20] @param {string|null} [search] */
  async getAdminUsers(page = 1, per_page = 20, search = null) {
    const params = new URLSearchParams({ page, per_page });
    if (search) params.append("search", search);
    return await this.request(`/admin/users?${params.toString()}`);
  }

  /** @param {number} [page=1] @param {number} [per_page=20] @param {string|null} [status] */
  async getAdminOrders(page = 1, per_page = 20, status = null) {
    const params = new URLSearchParams({ page, per_page });
    if (status) params.append("status", status);
    return await this.request(`/admin/orders?${params.toString()}`);
  }

  /** @param {string} [period="month"] @param {string} [type="sales"] */
  async getAdminAnalytics(period = "month", type = "sales") {
    return await this.request(`/admin/analytics/${type}?period=${period}`);
  }

  /** @param {string} [period="month"] */
  async getAdminSalesAnalytics(period = "month") {
    return await this.request(`/admin/analytics/sales?period=${period}`);
  }

  /** @param {string} [period="month"] */
  async getAdminUsersAnalytics(period = "month") {
    return await this.request(`/admin/analytics/users?period=${period}`);
  }

  /** @param {string} [period="month"] */
  async getAdminProductsAnalytics(period = "month") {
    return await this.request(`/admin/analytics/products?period=${period}`);
  }
}

// Instância singleton do cliente API
const apiClient = new ApiClient();

export default apiClient;
