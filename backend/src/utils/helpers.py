"""
Funções auxiliares para RE-EDUCA Store
"""
import re
import hashlib
import uuid
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from utils.constants import IMC_CLASSIFICATIONS, MACRONUTRIENTS

def generate_uuid() -> str:
    """Gera um UUID único"""
    return str(uuid.uuid4())

def generate_hash(data: str) -> str:
    """Gera hash SHA-256 de uma string"""
    return hashlib.sha256(data.encode()).hexdigest()

def validate_email(email: str) -> bool:
    """Valida formato de email"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password: str) -> Dict[str, Any]:
    """Valida força da senha"""
    errors = []
    
    if len(password) < 8:
        errors.append("Senha deve ter pelo menos 8 caracteres")
    
    if not re.search(r'[A-Z]', password):
        errors.append("Senha deve conter pelo menos uma letra maiúscula")
    
    if not re.search(r'[a-z]', password):
        errors.append("Senha deve conter pelo menos uma letra minúscula")
    
    if not re.search(r'\d', password):
        errors.append("Senha deve conter pelo menos um número")
    
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        errors.append("Senha deve conter pelo menos um caractere especial")
    
    strength = 'weak'
    if len(errors) == 0:
        strength = 'strong'
    elif len(errors) <= 2:
        strength = 'medium'
    
    return {
        'valid': len(errors) == 0,
        'errors': errors,
        'strength': strength
    }

def calculate_imc(weight: float, height: float) -> Dict[str, Any]:
    """Calcula IMC e retorna classificação"""
    if height <= 0 or weight <= 0:
        return {'error': 'Peso e altura devem ser maiores que zero'}
    
    imc = weight / (height ** 2)
    
    # Encontra a classificação
    classification = None
    for key, data in IMC_CLASSIFICATIONS.items():
        if data['min'] <= imc <= data['max']:
            classification = data
            break
    
    if not classification:
        return {'error': 'IMC fora do range válido'}
    
    # Calcula peso ideal
    min_ideal = 18.5 * (height ** 2)
    max_ideal = 24.9 * (height ** 2)
    
    return {
        'imc': round(imc, 2),
        'classification': classification['label'],
        'color': classification['color'],
        'recommendations': classification['recommendations'],
        'weight_range': {
            'min': round(min_ideal, 1),
            'max': round(max_ideal, 1)
        }
    }

def calculate_calories(age: int, weight: float, height: float, gender: str, activity_level: str) -> Dict[str, Any]:
    """Calcula necessidade calórica diária"""
    
    # Fórmula de Harris-Benedict
    if gender.lower() == 'male':
        bmr = 88.362 + (13.397 * weight) + (4.799 * height * 100) - (5.677 * age)
    else:
        bmr = 447.593 + (9.247 * weight) + (3.098 * height * 100) - (4.330 * age)
    
    # Multiplicadores de atividade
    activity_multipliers = {
        'sedentary': 1.2,
        'light': 1.375,
        'moderate': 1.55,
        'active': 1.725,
        'very_active': 1.9
    }
    
    multiplier = activity_multipliers.get(activity_level.lower(), 1.2)
    daily_calories = bmr * multiplier
    
    return {
        'bmr': round(bmr),
        'daily_calories': round(daily_calories),
        'activity_multiplier': multiplier
    }

def calculate_macros(calories: float, protein_percent: float = 20, fat_percent: float = 30) -> Dict[str, Any]:
    """Calcula macronutrientes baseado em calorias"""
    carbs_percent = 100 - protein_percent - fat_percent
    
    protein_cals = calories * (protein_percent / 100)
    fat_cals = calories * (fat_percent / 100)
    carbs_cals = calories * (carbs_percent / 100)
    
    protein_grams = protein_cals / MACRONUTRIENTS['PROTEIN']['calories_per_gram']
    fat_grams = fat_cals / MACRONUTRIENTS['FAT']['calories_per_gram']
    carbs_grams = carbs_cals / MACRONUTRIENTS['CARBS']['calories_per_gram']
    
    return {
        'protein': {
            'grams': round(protein_grams, 1),
            'calories': round(protein_cals),
            'percentage': protein_percent
        },
        'carbs': {
            'grams': round(carbs_grams, 1),
            'calories': round(carbs_cals),
            'percentage': carbs_percent
        },
        'fat': {
            'grams': round(fat_grams, 1),
            'calories': round(fat_cals),
            'percentage': fat_percent
        }
    }

def format_date(date: datetime, format_str: str = '%d/%m/%Y') -> str:
    """Formata data para string"""
    return date.strftime(format_str)

def parse_date(date_str: str, format_str: str = '%d/%m/%Y') -> Optional[datetime]:
    """Converte string para data"""
    try:
        return datetime.strptime(date_str, format_str)
    except ValueError:
        return None

def get_date_range(days: int = 30) -> Dict[str, datetime]:
    """Retorna range de datas"""
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    
    return {
        'start': start_date,
        'end': end_date
    }

def paginate_data(data: List[Any], page: int = 1, per_page: int = 20) -> Dict[str, Any]:
    """Pagina dados"""
    total = len(data)
    start = (page - 1) * per_page
    end = start + per_page
    
    paginated_data = data[start:end]
    
    return {
        'data': paginated_data,
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': total,
            'pages': (total + per_page - 1) // per_page,
            'has_next': end < total,
            'has_prev': page > 1
        }
    }

def sanitize_string(text: str) -> str:
    """Remove caracteres especiais perigosos"""
    # Remove caracteres de controle
    text = ''.join(char for char in text if ord(char) >= 32)
    
    # Remove tags HTML
    text = re.sub(r'<[^>]+>', '', text)
    
    # Remove caracteres especiais perigosos
    text = re.sub(r'[<>"\']', '', text)
    
    return text.strip()

def truncate_text(text: str, max_length: int = 100) -> str:
    """Trunca texto se exceder o limite"""
    if len(text) <= max_length:
        return text
    
    return text[:max_length-3] + '...'

def generate_slug(text: str) -> str:
    """Gera slug a partir de texto"""
    # Converte para minúsculas
    text = text.lower()
    
    # Remove acentos
    text = text.replace('á', 'a').replace('à', 'a').replace('ã', 'a').replace('â', 'a')
    text = text.replace('é', 'e').replace('è', 'e').replace('ê', 'e')
    text = text.replace('í', 'i').replace('ì', 'i').replace('î', 'i')
    text = text.replace('ó', 'o').replace('ò', 'o').replace('õ', 'o').replace('ô', 'o')
    text = text.replace('ú', 'u').replace('ù', 'u').replace('û', 'u')
    text = text.replace('ç', 'c')
    
    # Remove caracteres especiais
    text = re.sub(r'[^a-z0-9\s-]', '', text)
    
    # Substitui espaços por hífens
    text = re.sub(r'\s+', '-', text)
    
    # Remove hífens múltiplos
    text = re.sub(r'-+', '-', text)
    
    # Remove hífens no início e fim
    text = text.strip('-')
    
    return text

def calculate_age(birth_date: datetime) -> int:
    """Calcula idade a partir da data de nascimento"""
    today = datetime.now()
    age = today.year - birth_date.year
    
    if today.month < birth_date.month or (today.month == birth_date.month and today.day < birth_date.day):
        age -= 1
    
    return age

def is_valid_cpf(cpf: str) -> bool:
    """Valida CPF"""
    # Remove caracteres não numéricos
    cpf = re.sub(r'[^0-9]', '', cpf)
    
    # Verifica se tem 11 dígitos
    if len(cpf) != 11:
        return False
    
    # Verifica se todos os dígitos são iguais
    if cpf == cpf[0] * 11:
        return False
    
    # Calcula primeiro dígito verificador
    sum = 0
    for i in range(9):
        sum += int(cpf[i]) * (10 - i)
    
    remainder = sum % 11
    digit1 = 0 if remainder < 2 else 11 - remainder
    
    # Calcula segundo dígito verificador
    sum = 0
    for i in range(10):
        sum += int(cpf[i]) * (11 - i)
    
    remainder = sum % 11
    digit2 = 0 if remainder < 2 else 11 - remainder
    
    # Verifica se os dígitos calculados são iguais aos fornecidos
    return cpf[-2:] == f"{digit1}{digit2}"

def format_currency(value: float, currency: str = 'BRL') -> str:
    """Formata valor monetário"""
    if currency == 'BRL':
        return f"R$ {value:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.')
    else:
        return f"${value:,.2f}"

def calculate_percentage(part: float, total: float) -> float:
    """Calcula porcentagem"""
    if total == 0:
        return 0
    return round((part / total) * 100, 2)

def get_file_extension(filename: str) -> str:
    """Retorna extensão do arquivo"""
    return filename.rsplit('.', 1)[1].lower() if '.' in filename else ''

def is_allowed_file(filename: str, allowed_extensions: set) -> bool:
    """Verifica se arquivo tem extensão permitida"""
    return get_file_extension(filename) in allowed_extensions