"""
Validadores para RE-EDUCA Store.

Fornece validadores especializados para:
- Dados de usuário (registro, perfil, senha)
- Dados de produto
- Dados de pedido
- Cupons e promoções
- Dados de saúde

Todos os validadores retornam lista de erros detalhada.
"""
import re
from typing import Dict, Any, List, Optional
from datetime import datetime, date
from utils.helpers import validate_email, validate_password, is_valid_cpf


class Validator:
    """
    Classe base para validadores.

    Fornece estrutura comum para todos os validadores.
    """

    def __init__(self):
        """Inicializa o validador."""
        self.errors = []

    def add_error(self, field: str, message: str):
        """Adiciona erro de validação"""
        self.errors.append({
            'field': field,
            'message': message
        })

    def is_valid(self) -> bool:
        """Verifica se há erros"""
        return len(self.errors) == 0

    def get_errors(self) -> List[Dict[str, str]]:
        """Retorna lista de erros"""
        return self.errors


class UserValidator(Validator):
    """
    Validador para dados de usuário.

    Valida registro, login, atualização de perfil, etc.
    """

    def validate_registration(self, data: Dict[str, Any]) -> bool:
        """
        Valida dados de registro.

        Args:
            data (Dict[str, Any]): Dados do usuário.

        Returns:
            bool: True se válido, False com erros em self.errors.
        """
        self.errors = []

        # Nome
        if not data.get('name'):
            self.add_error('name', 'Nome é obrigatório')
        elif len(data['name']) < 2:
            self.add_error('name', 'Nome deve ter pelo menos 2 caracteres')
        elif len(data['name']) > 100:
            self.add_error('name', 'Nome deve ter no máximo 100 caracteres')

        # Email
        email = data.get('email', '')
        if not email:
            self.add_error('email', 'Email é obrigatório')
        elif not validate_email(email):
            self.add_error('email', 'Email inválido')

        # Senha
        password = data.get('password', '')
        if not password:
            self.add_error('password', 'Senha é obrigatória')
        else:
            password_validation = validate_password(password)
            if not password_validation['valid']:
                for error in password_validation['errors']:
                    self.add_error('password', error)

        # Confirmação de senha
        password_confirmation = data.get('password_confirmation', '')
        if password and password_confirmation and password != password_confirmation:
            self.add_error('password_confirmation', 'Senhas não coincidem')

        # Data de nascimento
        birth_date = data.get('birth_date')
        if birth_date:
            try:
                if isinstance(birth_date, str):
                    birth_date = datetime.strptime(birth_date, '%Y-%m-%d').date()

                if birth_date > date.today():
                    self.add_error('birth_date', 'Data de nascimento não pode ser no futuro')
                elif birth_date.year < 1900:
                    self.add_error('birth_date', 'Data de nascimento inválida')
            except ValueError:
                self.add_error('birth_date', 'Data de nascimento inválida')

        # CPF
        cpf = data.get('cpf', '')
        if cpf and not is_valid_cpf(cpf):
            self.add_error('cpf', 'CPF inválido')

        # Telefone
        phone = data.get('phone', '')
        if phone:
            phone_clean = re.sub(r'[^0-9]', '', phone)
            if len(phone_clean) < 10 or len(phone_clean) > 11:
                self.add_error('phone', 'Telefone inválido')

        return self.is_valid()

    def validate_profile_update(self, data: Dict[str, Any]) -> bool:
        """Valida dados de atualização de perfil"""
        self.errors = []

        # Nome
        if 'name' in data:
            if not data['name']:
                self.add_error('name', 'Nome é obrigatório')
            elif len(data['name']) < 2:
                self.add_error('name', 'Nome deve ter pelo menos 2 caracteres')
            elif len(data['name']) > 100:
                self.add_error('name', 'Nome deve ter no máximo 100 caracteres')

        # Email
        if 'email' in data:
            email = data['email']
            if not email:
                self.add_error('email', 'Email é obrigatório')
            elif not validate_email(email):
                self.add_error('email', 'Email inválido')

        # Data de nascimento
        if 'birth_date' in data and data['birth_date']:
            try:
                if isinstance(data['birth_date'], str):
                    birth_date = datetime.strptime(data['birth_date'], '%Y-%m-%d').date()
                else:
                    birth_date = data['birth_date']

                if birth_date > date.today():
                    self.add_error('birth_date', 'Data de nascimento não pode ser no futuro')
                elif birth_date.year < 1900:
                    self.add_error('birth_date', 'Data de nascimento inválida')
            except ValueError:
                self.add_error('birth_date', 'Data de nascimento inválida')

        # CPF
        if 'cpf' in data and data['cpf']:
            if not is_valid_cpf(data['cpf']):
                self.add_error('cpf', 'CPF inválido')

        # Telefone
        if 'phone' in data and data['phone']:
            phone_clean = re.sub(r'[^0-9]', '', data['phone'])
            if len(phone_clean) < 10 or len(phone_clean) > 11:
                self.add_error('phone', 'Telefone inválido')

        return self.is_valid()


class HealthDataValidator(Validator):
    """Validador para dados de saúde"""

    def validate_imc_data(self, data: Dict[str, Any]) -> bool:
        """Valida dados para cálculo de IMC"""
        self.errors = []

        # Peso
        weight = data.get('weight')
        if not weight:
            self.add_error('weight', 'Peso é obrigatório')
        elif not isinstance(weight, (int, float)) or weight <= 0:
            self.add_error('weight', 'Peso deve ser um número positivo')
        elif weight > 500:
            self.add_error('weight', 'Peso inválido')

        # Altura
        height = data.get('height')
        if not height:
            self.add_error('height', 'Altura é obrigatória')
        elif not isinstance(height, (int, float)) or height <= 0:
            self.add_error('height', 'Altura deve ser um número positivo')
        elif height > 3:
            self.add_error('height', 'Altura inválida (use metros)')

        return self.is_valid()

    def validate_food_entry(self, data: Dict[str, Any]) -> bool:
        """Valida dados de entrada de alimento"""
        self.errors = []

        # Nome do alimento
        food_name = data.get('food_name', '')
        if not food_name:
            self.add_error('food_name', 'Nome do alimento é obrigatório')
        elif len(food_name) > 200:
            self.add_error('food_name', 'Nome do alimento muito longo')

        # Quantidade
        quantity = data.get('quantity')
        if not quantity:
            self.add_error('quantity', 'Quantidade é obrigatória')
        elif not isinstance(quantity, (int, float)) or quantity <= 0:
            self.add_error('quantity', 'Quantidade deve ser um número positivo')

        # Unidade
        unit = data.get('unit', '')
        if not unit:
            self.add_error('unit', 'Unidade é obrigatória')

        # Data
        entry_date = data.get('entry_date')
        if entry_date:
            try:
                if isinstance(entry_date, str):
                    datetime.strptime(entry_date, '%Y-%m-%d')
            except ValueError:
                self.add_error('entry_date', 'Data inválida')

        return self.is_valid()

    def validate_exercise_entry(self, data: Dict[str, Any]) -> bool:
        """Valida dados de entrada de exercício"""
        self.errors = []

        # Nome do exercício
        exercise_name = data.get('exercise_name', '')
        if not exercise_name:
            self.add_error('exercise_name', 'Nome do exercício é obrigatório')
        elif len(exercise_name) > 200:
            self.add_error('exercise_name', 'Nome do exercício muito longo')

        # Duração
        duration = data.get('duration')
        if not duration:
            self.add_error('duration', 'Duração é obrigatória')
        elif not isinstance(duration, (int, float)) or duration <= 0:
            self.add_error('duration', 'Duração deve ser um número positivo')

        # Intensidade
        intensity = data.get('intensity', '')
        valid_intensities = ['low', 'moderate', 'high', 'very_high']
        if intensity and intensity not in valid_intensities:
            self.add_error('intensity', 'Intensidade inválida')

        # Data
        entry_date = data.get('entry_date')
        if entry_date:
            try:
                if isinstance(entry_date, str):
                    datetime.strptime(entry_date, '%Y-%m-%d')
            except ValueError:
                self.add_error('entry_date', 'Data inválida')

        return self.is_valid()

    def validate_biological_age(self, data: Dict[str, Any]) -> bool:
        """Valida dados para cálculo de idade biológica"""
        self.errors = []

        # Idade cronológica
        age = data.get('age')
        if not age:
            self.add_error('age', 'Idade é obrigatória')
        elif not isinstance(age, int) or age <= 0 or age > 150:
            self.add_error('age', 'Idade deve ser um número entre 1 e 150')

        # Peso e altura (opcionais, mas se fornecidos devem ser válidos)
        weight = data.get('weight')
        if weight is not None:
            if not isinstance(weight, (int, float)) or weight <= 0 or weight > 500:
                self.add_error('weight', 'Peso inválido')

        height = data.get('height')
        if height is not None:
            if not isinstance(height, (int, float)) or height <= 0 or height > 3:
                self.add_error('height', 'Altura inválida (use metros)')

        # Fatores de saúde (devem ser listas ou None)
        health_factors = data.get('health_factors', [])
        if health_factors and not isinstance(health_factors, list):
            self.add_error('health_factors', 'Fatores de saúde devem ser uma lista')

        return self.is_valid()

    def validate_hydration(self, data: Dict[str, Any]) -> bool:
        """Valida dados para cálculo de hidratação"""
        self.errors = []

        # Peso
        weight = data.get('weight')
        if not weight:
            self.add_error('weight', 'Peso é obrigatório')
        elif not isinstance(weight, (int, float)) or weight <= 0:
            self.add_error('weight', 'Peso deve ser um número positivo')

        # Idade
        age = data.get('age')
        if age is not None:
            if not isinstance(age, int) or age <= 0 or age > 150:
                self.add_error('age', 'Idade inválida')

        # Duração de exercício (opcional)
        exercise_duration = data.get('exercise_duration')
        if exercise_duration is not None:
            if not isinstance(exercise_duration, (int, float)) or exercise_duration < 0:
                self.add_error('exercise_duration', 'Duração de exercício inválida')

        return self.is_valid()

    def validate_metabolism(self, data: Dict[str, Any]) -> bool:
        """Valida dados para cálculo de metabolismo"""
        self.errors = []

        # Peso
        weight = data.get('weight')
        if not weight:
            self.add_error('weight', 'Peso é obrigatório')
        elif not isinstance(weight, (int, float)) or weight <= 0:
            self.add_error('weight', 'Peso deve ser um número positivo')

        # Altura
        height = data.get('height')
        if not height:
            self.add_error('height', 'Altura é obrigatória')
        elif not isinstance(height, (int, float)) or height <= 0:
            self.add_error('height', 'Altura deve ser um número positivo')

        # Idade
        age = data.get('age')
        if not age:
            self.add_error('age', 'Idade é obrigatória')
        elif not isinstance(age, int) or age <= 0:
            self.add_error('age', 'Idade deve ser um número positivo')

        # Gênero
        gender = data.get('gender', '').lower()
        valid_genders = ['male', 'female', 'm', 'f', 'masculino', 'feminino']
        if gender and gender not in valid_genders:
            self.add_error('gender', 'Gênero inválido')

        return self.is_valid()

    def validate_sleep(self, data: Dict[str, Any]) -> bool:
        """Valida dados para cálculo de sono"""
        self.errors = []

        # Idade
        age = data.get('age')
        if not age:
            self.add_error('age', 'Idade é obrigatória')
        elif not isinstance(age, int) or age <= 0:
            self.add_error('age', 'Idade deve ser um número positivo')

        # Horas de sono (opcional para recomendação, obrigatório para análise)
        sleep_hours = data.get('sleep_hours')
        if sleep_hours is not None:
            if not isinstance(sleep_hours, (int, float)) or sleep_hours < 0 or sleep_hours > 24:
                self.add_error('sleep_hours', 'Horas de sono inválidas (0-24)')

        return self.is_valid()

    def validate_stress(self, data: Dict[str, Any]) -> bool:
        """Valida dados para cálculo de estresse"""
        self.errors = []

        # Respostas do questionário (devem ser numéricas)
        responses = data.get('responses', {})
        if responses:
            if not isinstance(responses, dict):
                self.add_error('responses', 'Respostas devem ser um objeto')
            else:
                for key, value in responses.items():
                    if not isinstance(value, (int, float)) or value < 0 or value > 10:
                        self.add_error(f'responses.{key}', 'Resposta deve ser um número entre 0 e 10')

        return self.is_valid()


class ProductValidator(Validator):
    """Validador para dados de produtos"""

    def validate_product(self, data: Dict[str, Any]) -> bool:
        """Valida dados de produto"""
        self.errors = []

        # Nome
        name = data.get('name', '')
        if not name:
            self.add_error('name', 'Nome do produto é obrigatório')
        elif len(name) < 3:
            self.add_error('name', 'Nome deve ter pelo menos 3 caracteres')
        elif len(name) > 200:
            self.add_error('name', 'Nome deve ter no máximo 200 caracteres')

        # Descrição
        description = data.get('description', '')
        if description and len(description) > 2000:
            self.add_error('description', 'Descrição muito longa')

        # Preço
        price = data.get('price')
        if not price:
            self.add_error('price', 'Preço é obrigatório')
        elif not isinstance(price, (int, float)) or price < 0:
            self.add_error('price', 'Preço deve ser um número positivo')

        # Categoria
        category = data.get('category', '')
        valid_categories = ['supplements', 'equipment', 'books', 'courses', 'consultations', 'memberships']
        if category and category not in valid_categories:
            self.add_error('category', 'Categoria inválida')

        # Status
        status = data.get('status', '')
        valid_statuses = ['active', 'inactive', 'draft', 'archived']
        if status and status not in valid_statuses:
            self.add_error('status', 'Status inválido')

        return self.is_valid()


class OrderValidator(Validator):
    """Validador para dados de pedidos"""

    def validate_order(self, data: Dict[str, Any]) -> bool:
        """Valida dados de pedido"""
        self.errors = []

        # Produtos
        products = data.get('products', [])
        if not products:
            self.add_error('products', 'Pedido deve conter pelo menos um produto')
        elif not isinstance(products, list):
            self.add_error('products', 'Produtos deve ser uma lista')
        else:
            for i, product in enumerate(products):
                if not isinstance(product, dict):
                    self.add_error(f'products[{i}]', 'Produto inválido')
                    continue

                if not product.get('product_id'):
                    self.add_error(f'products[{i}].product_id', 'ID do produto é obrigatório')

                quantity = product.get('quantity')
                if not quantity:
                    self.add_error(f'products[{i}].quantity', 'Quantidade é obrigatória')
                elif not isinstance(quantity, int) or quantity <= 0:
                    self.add_error(f'products[{i}].quantity', 'Quantidade deve ser um número positivo')

        # Endereço de entrega
        shipping_address = data.get('shipping_address', {})
        if not shipping_address.get('street'):
            self.add_error('shipping_address.street', 'Rua é obrigatória')
        if not shipping_address.get('city'):
            self.add_error('shipping_address.city', 'Cidade é obrigatória')
        if not shipping_address.get('state'):
            self.add_error('shipping_address.state', 'Estado é obrigatório')
        if not shipping_address.get('zip_code'):
            self.add_error('shipping_address.zip_code', 'CEP é obrigatório')

        return self.is_valid()

# Função utilitária para validação de campos obrigatórios
def validate_required_fields(data: Dict[str, Any], required_fields: List[str]) -> Dict[str, Any]:
    """
    Valida se os campos obrigatórios estão presentes nos dados

    Args:
        data: Dados a serem validados
        required_fields: Lista de campos obrigatórios

    Returns:
        Dict com 'valid' (bool) e 'errors' (list)
    """
    errors = []

    for field in required_fields:
        if field not in data or data[field] is None or data[field] == '':
            errors.append(f"Campo '{field}' é obrigatório")

    return {
        'valid': len(errors) == 0,
        'errors': errors
    }


# Instâncias globais dos validadores
user_validator = UserValidator()
health_data_validator = HealthDataValidator()
product_validator = ProductValidator()
order_validator = OrderValidator()
