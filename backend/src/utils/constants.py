"""
Constantes do sistema RE-EDUCA Store.

Define todas as constantes centralizadas do sistema incluindo:
- Roles e tipos de usuário
- Status de pedidos e produtos
- Categorias e classificações
- Limites de uso por plano
- Mensagens de erro e sucesso padronizadas
- Configurações de cache e rate limiting
- Macronutrientes e micronutrientes
- Classificações de IMC

Centralizar constantes evita números mágicos e facilita manutenção.
"""

# Tipos de usuário
USER_ROLES = {"USER": "user", "ADMIN": "admin", "MODERATOR": "moderator"}

# Tipos de assinatura
SUBSCRIPTION_TYPES = {"FREE": "free", "BASIC": "basic", "PREMIUM": "premium", "ENTERPRISE": "enterprise"}

# Status de pedidos
ORDER_STATUS = {
    "PENDING": "pending",
    "PAID": "paid",
    "SHIPPED": "shipped",
    "DELIVERED": "delivered",
    "CANCELLED": "cancelled",
    "REFUNDED": "refunded",
}

# Status de produtos
PRODUCT_STATUS = {"ACTIVE": "active", "INACTIVE": "inactive", "DRAFT": "draft", "ARCHIVED": "archived"}

# Categorias de produtos
PRODUCT_CATEGORIES = {
    "SUPPLEMENTS": "supplements",
    "EQUIPMENT": "equipment",
    "BOOKS": "books",
    "COURSES": "courses",
    "CONSULTATIONS": "consultations",
    "MEMBERSHIPS": "memberships",
}

# Tipos de ferramentas de saúde
HEALTH_TOOL_TYPES = {
    "IMC_CALCULATOR": "imc_calculator",
    "FOOD_DIARY": "food_diary",
    "EXERCISE_TRACKER": "exercise_tracker",
    "NUTRITION_ANALYZER": "nutrition_analyzer",
    "HEALTH_GOALS": "health_goals",
}

# Classificações de IMC
IMC_CLASSIFICATIONS = {
    "UNDERWEIGHT": {
        "min": 0,
        "max": 18.5,
        "label": "Abaixo do peso",
        "color": "#FF6B6B",
        "recommendations": [
            "Consulte um nutricionista",
            "Aumente a ingestão calórica",
            "Foque em ganho de massa muscular",
        ],
    },
    "NORMAL": {
        "min": 18.5,
        "max": 24.9,
        "label": "Peso normal",
        "color": "#4ECDC4",
        "recommendations": [
            "Mantenha hábitos saudáveis",
            "Continue com exercícios regulares",
            "Mantenha alimentação equilibrada",
        ],
    },
    "OVERWEIGHT": {
        "min": 25.0,
        "max": 29.9,
        "label": "Sobrepeso",
        "color": "#FFE66D",
        "recommendations": [
            "Reduza a ingestão calórica",
            "Aumente a atividade física",
            "Consulte um profissional de saúde",
        ],
    },
    "OBESE_1": {
        "min": 30.0,
        "max": 34.9,
        "label": "Obesidade Grau I",
        "color": "#FF8E53",
        "recommendations": [
            "Procure orientação médica",
            "Implemente mudanças no estilo de vida",
            "Considere acompanhamento nutricional",
        ],
    },
    "OBESE_2": {
        "min": 35.0,
        "max": 39.9,
        "label": "Obesidade Grau II",
        "color": "#FF6B6B",
        "recommendations": [
            "Procure atendimento médico urgente",
            "Implemente programa de perda de peso",
            "Acompanhamento multidisciplinar",
        ],
    },
    "OBESE_3": {
        "min": 40.0,
        "max": 999,
        "label": "Obesidade Grau III",
        "color": "#FF4757",
        "recommendations": [
            "Procure atendimento médico imediato",
            "Avaliação para cirurgia bariátrica",
            "Acompanhamento intensivo",
        ],
    },
}

# Macronutrientes
MACRONUTRIENTS = {
    "PROTEIN": {"name": "Proteína", "unit": "g", "calories_per_gram": 4, "recommended_percentage": 20},
    "CARBS": {"name": "Carboidratos", "unit": "g", "calories_per_gram": 4, "recommended_percentage": 50},
    "FAT": {"name": "Gorduras", "unit": "g", "calories_per_gram": 9, "recommended_percentage": 30},
}

# Micronutrientes importantes
MICRONUTRIENTS = {
    "VITAMIN_A": "Vitamina A",
    "VITAMIN_C": "Vitamina C",
    "VITAMIN_D": "Vitamina D",
    "VITAMIN_E": "Vitamina E",
    "VITAMIN_K": "Vitamina K",
    "VITAMIN_B1": "Vitamina B1",
    "VITAMIN_B2": "Vitamina B2",
    "VITAMIN_B3": "Vitamina B3",
    "VITAMIN_B6": "Vitamina B6",
    "VITAMIN_B12": "Vitamina B12",
    "FOLIC_ACID": "Ácido Fólico",
    "CALCIUM": "Cálcio",
    "IRON": "Ferro",
    "MAGNESIUM": "Magnésio",
    "ZINC": "Zinco",
    "POTASSIUM": "Potássio",
    "SODIUM": "Sódio",
}

# Tipos de exercícios
EXERCISE_TYPES = {
    "CARDIO": "cardio",
    "STRENGTH": "strength",
    "FLEXIBILITY": "flexibility",
    "BALANCE": "balance",
    "SPORTS": "sports",
    "YOGA": "yoga",
    "PILATES": "pilates",
}

# Intensidade de exercícios
EXERCISE_INTENSITY = {"LOW": "low", "MODERATE": "moderate", "HIGH": "high", "VERY_HIGH": "very_high"}

# Status de atividades
ACTIVITY_STATUS = {
    "PLANNED": "planned",
    "IN_PROGRESS": "in_progress",
    "COMPLETED": "completed",
    "CANCELLED": "cancelled",
}

# Tipos de notificação
NOTIFICATION_TYPES = {
    "SYSTEM": "system",
    "HEALTH": "health",
    "PURCHASE": "purchase",
    "REMINDER": "reminder",
    "ACHIEVEMENT": "achievement",
}

# Status de notificações
NOTIFICATION_STATUS = {"UNREAD": "unread", "READ": "read", "ARCHIVED": "archived"}

# Limites de uso por plano
USAGE_LIMITS = {
    "free": {
        "imc_calculations_per_month": 10,
        "food_entries_per_month": 50,
        "exercise_entries_per_month": 30,
        "ai_consultations_per_month": 5,
        "reports_per_month": 2,
    },
    "basic": {
        "imc_calculations_per_month": 100,
        "food_entries_per_month": 500,
        "exercise_entries_per_month": 300,
        "ai_consultations_per_month": 50,
        "reports_per_month": 10,
    },
    "premium": {
        "imc_calculations_per_month": -1,  # Ilimitado
        "food_entries_per_month": -1,
        "exercise_entries_per_month": -1,
        "ai_consultations_per_month": 200,
        "reports_per_month": 50,
    },
    "enterprise": {
        "imc_calculations_per_month": -1,
        "food_entries_per_month": -1,
        "exercise_entries_per_month": -1,
        "ai_consultations_per_month": -1,
        "reports_per_month": -1,
    },
}

# Configurações de paginação
PAGINATION = {"DEFAULT_PAGE_SIZE": 20, "MAX_PAGE_SIZE": 100, "DEFAULT_PAGE": 1}

# Configurações de cache
CACHE_TIMEOUTS = {
    "SHORT": 300,  # 5 minutos
    "MEDIUM": 3600,  # 1 hora
    "LONG": 86400,  # 1 dia
    "VERY_LONG": 604800,  # 1 semana
}

# Configurações de rate limiting
RATE_LIMITS = {"AUTH": "5 per minute", "API": "100 per hour", "UPLOAD": "10 per hour", "AI": "20 per hour"}

# Mensagens de erro
ERROR_MESSAGES = {
    "INVALID_TOKEN": "Token de acesso inválido ou expirado",
    "INSUFFICIENT_PERMISSIONS": "Permissões insuficientes para esta operação",
    "USER_NOT_FOUND": "Usuário não encontrado",
    "INVALID_CREDENTIALS": "Credenciais inválidas",
    "EMAIL_ALREADY_EXISTS": "Email já está em uso",
    "INVALID_DATA": "Dados inválidos fornecidos",
    "RESOURCE_NOT_FOUND": "Recurso não encontrado",
    "RATE_LIMIT_EXCEEDED": "Limite de requisições excedido",
    "SUBSCRIPTION_REQUIRED": "Assinatura premium requerida",
    "INTERNAL_ERROR": "Erro interno do servidor",
}

# Mensagens de sucesso
SUCCESS_MESSAGES = {
    "USER_CREATED": "Usuário criado com sucesso",
    "USER_UPDATED": "Usuário atualizado com sucesso",
    "LOGIN_SUCCESS": "Login realizado com sucesso",
    "LOGOUT_SUCCESS": "Logout realizado com sucesso",
    "PASSWORD_CHANGED": "Senha alterada com sucesso",
    "PROFILE_UPDATED": "Perfil atualizado com sucesso",
    "DATA_SAVED": "Dados salvos com sucesso",
    "OPERATION_COMPLETED": "Operação concluída com sucesso",
}
