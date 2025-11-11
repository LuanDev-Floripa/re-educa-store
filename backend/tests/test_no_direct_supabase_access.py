# -*- coding: utf-8 -*-
"""
Testes de validação de acesso direto ao Supabase.

Verifica que:
- Routes não acessam Supabase diretamente
- Services usam repositórios (exceto casos documentados)
- Casos legítimos estão documentados
"""
import pytest
import sys
from pathlib import Path
import re

# Adiciona o diretório src ao path
backend_dir = Path(__file__).parent.parent
src_dir = backend_dir / 'src'
sys.path.insert(0, str(src_dir))
sys.path.insert(0, str(backend_dir))


def is_legitimate_usage(file_path: Path, line: str) -> bool:
    """Verifica se o uso de Supabase é legítimo."""
    file_str = str(file_path)
    
    # Repositórios podem acessar diretamente
    if 'repositories' in file_str:
        return True
    
    # Casos legítimos documentados
    legitimate_patterns = [
        r'# NOTA:.*legítimo',
        r'# Acesso direto.*legítimo',
        r'# Health check',
        r'# Métricas genéricas',
    ]
    
    for pattern in legitimate_patterns:
        if re.search(pattern, line, re.IGNORECASE):
            return True
    
    # Arquivos específicos legítimos
    legitimate_files = [
        'monitoring_service.py',
        'health_checks.py',
        'base_repository.py',
    ]
    
    for legit_file in legitimate_files:
        if legit_file in file_str:
            return True
    
    return False


def find_direct_supabase_access():
    """Encontra todos os acessos diretos ao Supabase."""
    patterns = [
        r'supabase_client\.table\(',
        r'supabase\.table\(',
        r'\.supabase\.table\(',
        r'self\.supabase\.table\(',
    ]
    
    issues = {
        'routes': [],
        'services': [],
        'other': []
    }
    
    # Verifica routes
    routes_dir = src_dir / 'routes'
    if routes_dir.exists():
        for file_path in routes_dir.glob('*.py'):
            if file_path.name.startswith('__'):
                continue
            
            with open(file_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
                
                for line_num, line in enumerate(lines, 1):
                    for pattern in patterns:
                        if re.search(pattern, line):
                            if not is_legitimate_usage(file_path, line):
                                issues['routes'].append({
                                    'file': file_path.name,
                                    'line': line_num,
                                    'content': line.strip()
                                })
    
    # Verifica services
    services_dir = src_dir / 'services'
    if services_dir.exists():
        for file_path in services_dir.glob('*.py'):
            if file_path.name.startswith('__'):
                continue
            
            with open(file_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
                
                for line_num, line in enumerate(lines, 1):
                    for pattern in patterns:
                        if re.search(pattern, line):
                            if not is_legitimate_usage(file_path, line):
                                issues['services'].append({
                                    'file': file_path.name,
                                    'line': line_num,
                                    'content': line.strip()
                                })
    
    return issues


def test_routes_no_direct_supabase_access():
    """Testa que routes não acessam Supabase diretamente."""
    issues = find_direct_supabase_access()
    route_issues = issues['routes']
    
    if route_issues:
        error_messages = []
        for issue in route_issues:
            error_messages.append(
                f"{issue['file']}:{issue['line']} - {issue['content'][:80]}"
            )
        
        assert False, f"Routes acessando Supabase diretamente:\n" + "\n".join(error_messages[:10])


def test_services_use_repositories():
    """Testa que services usam repositórios (com exceções documentadas)."""
    issues = find_direct_supabase_access()
    service_issues = issues['services']
    
    # Remove casos legítimos já documentados
    legitimate_services = ['monitoring_service.py', 'health_checks.py']
    
    filtered_issues = [
        issue for issue in service_issues
        if not any(legit in issue['file'] for legit in legitimate_services)
    ]
    
    if filtered_issues:
        error_messages = []
        for issue in filtered_issues:
            error_messages.append(
                f"{issue['file']}:{issue['line']} - {issue['content'][:80]}"
            )
        
        assert False, (
            f"Services acessando Supabase diretamente (sem documentação):\n" +
            "\n".join(error_messages[:10])
        )


def test_legitimate_cases_documented():
    """Testa que casos legítimos estão documentados."""
    legitimate_files = [
        src_dir / 'services' / 'monitoring_service.py',
        src_dir / 'utils' / 'health_checks.py',
    ]
    
    for file_path in legitimate_files:
        if not file_path.exists():
            continue
        
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
            # Verifica se tem acesso direto
            if re.search(r'\.supabase\.table\(|supabase_client\.table\(', content):
                # Verifica se está documentado
                if not re.search(r'# NOTA:.*legítimo|# Acesso direto.*legítimo', content, re.IGNORECASE):
                    assert False, (
                        f"{file_path.name} acessa Supabase diretamente mas não está documentado "
                        f"como caso legítimo"
                    )


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
