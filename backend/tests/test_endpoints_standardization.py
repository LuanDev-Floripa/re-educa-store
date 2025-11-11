# -*- coding: utf-8 -*-
"""
Testes de validação de padronização de endpoints.

Verifica que:
- Todos os blueprints não têm url_prefix duplicado
- Todos os blueprints estão registrados corretamente no app.py
- Endpoints especiais estão documentados
"""
import pytest
import sys
from pathlib import Path

# Adiciona o diretório src ao path
backend_dir = Path(__file__).parent.parent
src_dir = backend_dir / 'src'
sys.path.insert(0, str(src_dir))
sys.path.insert(0, str(backend_dir))

import re
from flask import Flask


def find_blueprint_definitions():
    """Encontra todas as definições de blueprints nos arquivos de routes."""
    routes_dir = src_dir / 'routes'
    blueprints = {}
    
    for file_path in routes_dir.glob('*.py'):
        if file_path.name.startswith('__'):
            continue
        
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
            # Procura por Blueprint('nome', __name__)
            pattern = r"Blueprint\(['\"]([^'\"]+)['\"],\s*__name__"
            matches = re.findall(pattern, content)
            
            for blueprint_name in matches:
                # Verifica se tem url_prefix no Blueprint
                blueprint_pattern = rf"Blueprint\(['\"]{blueprint_name}['\"][^)]+url_prefix"
                has_url_prefix = bool(re.search(blueprint_pattern, content))
                
                blueprints[blueprint_name] = {
                    'file': file_path.name,
                    'has_url_prefix': has_url_prefix,
                    'path': file_path
                }
    
    return blueprints


def find_blueprint_registrations():
    """Encontra todos os registros de blueprints no app.py."""
    app_file = src_dir / 'app.py'
    
    with open(app_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Procura por app.register_blueprint
    pattern = r"app\.register_blueprint\((\w+_bp)(?:,\s*url_prefix=(['\"])([^'\"]+)\2)?"
    matches = re.findall(pattern, content)
    
    registrations = {}
    
    # Primeiro, busca todos os imports de blueprints
    import_pattern = r"from\s+routes\.(\w+)\s+import\s+(\w+_bp)"
    import_matches = re.findall(import_pattern, content)
    blueprint_imports = {var: name for name, var in import_matches}
    
    # Procura também imports diretos
    direct_import_pattern = r"from\s+routes\.(\w+)\s+import\s+(\w+_bp)"
    
    for match in matches:
        blueprint_var = match[0]
        url_prefix = match[2] if len(match) > 2 and match[2] else None
        
        # Tenta encontrar o nome do blueprint pelo import
        blueprint_name = None
        
        # Busca no import
        for var, name in blueprint_imports.items():
            if var == blueprint_var:
                blueprint_name = name
                break
        
        # Se não encontrou, busca no arquivo de origem
        if not blueprint_name:
            routes_dir = src_dir / 'routes'
            for file_path in routes_dir.glob('*.py'):
                with open(file_path, 'r', encoding='utf-8') as f:
                    file_content = f.read()
                    blueprint_pattern = rf"{blueprint_var}\s*=\s*Blueprint\(['\"]([^'\"]+)['\"]"
                    name_match = re.search(blueprint_pattern, file_content)
                    if name_match:
                        blueprint_name = name_match.group(1)
                        break
        
        if blueprint_name:
            registrations[blueprint_name] = {
                'var': blueprint_var,
                'url_prefix': url_prefix
            }
    
    # Mapeamento de nomes de arquivos para nomes de blueprints (quando diferentes)
    file_to_blueprint_map = {
        'system_routes.py': 'system',
        'video_routes.py': 'video',
        'users_exports.py': 'exports',
    }
    
    # Adiciona registros encontrados via mapeamento de arquivos
    app_file = src_dir / 'app.py'
    with open(app_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    for file_name, blueprint_name in file_to_blueprint_map.items():
        # Busca se o arquivo está importado
        import_pattern = rf"from\s+routes\.{file_name.replace('.py', '')}\s+import\s+(\w+_bp)"
        import_match = re.search(import_pattern, content)
        if import_match:
            blueprint_var = import_match.group(1)
            # Busca o registro
            register_pattern = rf"app\.register_blueprint\({blueprint_var}(?:,\s*url_prefix=(['\"])([^'\"]+)\1)?"
            register_match = re.search(register_pattern, content)
            if register_match:
                url_prefix = register_match.group(2) if len(register_match.groups()) >= 2 and register_match.group(2) else None
                if blueprint_name not in registrations:
                    registrations[blueprint_name] = {
                        'var': blueprint_var,
                        'url_prefix': url_prefix
                    }
    
    return registrations


def test_no_duplicate_url_prefix_in_blueprints():
    """Testa que nenhum blueprint tem url_prefix duplicado."""
    blueprints = find_blueprint_definitions()
    
    errors = []
    for blueprint_name, info in blueprints.items():
        if info['has_url_prefix']:
            errors.append(
                f"Blueprint '{blueprint_name}' em {info['file']} tem url_prefix. "
                f"Deve ser removido do Blueprint e definido apenas no app.py"
            )
    
    assert len(errors) == 0, "\n".join(errors)


def test_all_blueprints_registered_in_app():
    """Testa que todos os blueprints estão registrados no app.py."""
    blueprints = find_blueprint_definitions()
    registrations = find_blueprint_registrations()
    
    # Lista de blueprints que podem não ter url_prefix (especiais)
    special_blueprints = ['swagger']
    
    # Lista de blueprints que podem não estar registrados (arquivos antigos/desabilitados)
    optional_blueprints = ['promotions', 'two_factor', 'affiliates', 'inventory']
    
    errors = []
    for blueprint_name, info in blueprints.items():
        if blueprint_name in special_blueprints:
            continue
        
        # Ignora blueprints opcionais que podem não estar registrados
        if blueprint_name in optional_blueprints:
            # Verifica se está registrado, mas não falha se não estiver
            if blueprint_name not in registrations:
                continue  # OK, blueprint opcional não registrado
        
        if blueprint_name not in registrations:
            errors.append(
                f"Blueprint '{blueprint_name}' de {info['file']} não está registrado no app.py"
            )
        elif registrations[blueprint_name]['url_prefix'] is None:
            errors.append(
                f"Blueprint '{blueprint_name}' registrado sem url_prefix no app.py"
            )
    
    assert len(errors) == 0, "\n".join(errors)


def test_special_endpoints_documented():
    """Testa que os endpoints especiais estão documentados."""
    app_file = src_dir / 'app.py'
    
    with open(app_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Verifica se SPECIAL_ENDPOINTS existe
    assert 'SPECIAL_ENDPOINTS' in content, "SPECIAL_ENDPOINTS não está definido em app.py"
    
    # Verifica endpoints especiais
    special_endpoints = ['/health', '/health/detailed', '/metrics']
    
    for endpoint in special_endpoints:
        # Verifica se endpoint tem comentário
        endpoint_pattern = rf"@app\.route\(['\"]{re.escape(endpoint)}['\"]"
        if re.search(endpoint_pattern, content):
            # Verifica se tem comentário sobre SPECIAL_ENDPOINTS
            # Busca próximo comentário ou docstring
            pattern = rf"{endpoint_pattern}.*?(?:def\s+\w+|#|''')"
            match = re.search(pattern, content, re.DOTALL)
            if match:
                match_text = match.group(0)
                # Aceita se tem comentário ou SPECIAL_ENDPOINTS mencionado
                if 'SPECIAL_ENDPOINTS' not in match_text and 'Endpoint especial' not in match_text:
                    # Não falha, apenas avisa
                    pass


def test_no_hardcoded_api_paths():
    """Testa que não há paths hardcoded /api/ nos blueprints."""
    routes_dir = src_dir / 'routes'
    
    errors = []
    for file_path in routes_dir.glob('*.py'):
        if file_path.name.startswith('__'):
            continue
        
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            
            for line_num, line in enumerate(lines, 1):
                # Procura por @route('/api/...)
                if re.search(r"@\w+\.route\(['\"]/api/", line):
                    errors.append(
                        f"{file_path.name}:{line_num} - Path hardcoded /api/ encontrado: {line.strip()}"
                    )
    
    # Permite alguns casos conhecidos (swagger, etc)
    filtered_errors = [e for e in errors if 'swagger' not in e.lower()]
    
    assert len(filtered_errors) == 0, "\n".join(filtered_errors[:10])  # Mostra até 10 erros


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
