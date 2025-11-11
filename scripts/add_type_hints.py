#!/usr/bin/env python3
"""
Script para adicionar type hints consistentes no backend.

Analisa funções sem type hints e adiciona anotações adequadas.
"""

import re
from pathlib import Path
from typing import List, Dict, Tuple

BACKEND_SRC = Path(__file__).parent.parent / "backend" / "src"


def analyze_function_signatures(content: str) -> List[Dict]:
    """Analisa assinaturas de funções e identifica as sem type hints"""
    
    # Pattern para funções
    func_pattern = r'^\s*def\s+(\w+)\s*\((.*?)\)\s*(?:->.*?)?:'
    
    functions = []
    for match in re.finditer(func_pattern, content, re.MULTILINE):
        func_name = match.group(1)
        params = match.group(2)
        full_sig = match.group(0)
        
        # Verifica se tem return type hint
        has_return_type = '->' in full_sig
        
        # Verifica se parâmetros têm tipos
        has_param_types = ':' in params and params.strip() not in ['', 'self', 'cls']
        
        functions.append({
            'name': func_name,
            'params': params,
            'signature': full_sig,
            'has_return_type': has_return_type,
            'has_param_types': has_param_types,
            'needs_improvement': not (has_return_type and has_param_types)
        })
    
    return functions


def suggest_type_hints_for_service(filepath: Path) -> Dict:
    """Sugere type hints para arquivo de service"""
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    functions = analyze_function_signatures(content)
    
    # Estatísticas
    total = len([f for f in functions if f['name'] not in ['__init__', '__str__', '__repr__']])
    with_types = len([f for f in functions if not f['needs_improvement']])
    without_types = total - with_types
    
    return {
        'file': filepath.relative_to(BACKEND_SRC),
        'total_functions': total,
        'with_types': with_types,
        'without_types': without_types,
        'coverage': (with_types / total * 100) if total > 0 else 0,
        'functions': [f for f in functions if f['needs_improvement'] and f['name'] not in ['__init__']]
    }


def generate_type_hints_example(func_name: str, file_type: str) -> str:
    """Gera exemplo de type hint baseado no tipo de função"""
    
    common_patterns = {
        # Services - geralmente retornam Dict
        'create': '(self, data: Dict[str, Any]) -> Dict[str, Any]',
        'update': '(self, id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]',
        'delete': '(self, id: str) -> bool',
        'get': '(self, id: str) -> Optional[Dict[str, Any]]',
        'find': '(self, filters: Optional[Dict] = None) -> List[Dict[str, Any]]',
        'validate': '(self, data: Dict[str, Any]) -> bool',
        
        # Repositories
        'find_by_id': '(self, id: str) -> Optional[Dict[str, Any]]',
        'find_all': '(self, filters: Optional[Dict] = None) -> List[Dict[str, Any]]',
        'count': '(self, filters: Optional[Dict] = None) -> int',
        'exists': '(self, id: str) -> bool',
    }
    
    # Tenta match com padrões comuns
    for pattern, hint in common_patterns.items():
        if pattern in func_name.lower():
            return hint
    
    # Default baseado em nome
    if func_name.startswith('get_') or func_name.startswith('find_'):
        return '(self, ...) -> Optional[Dict[str, Any]]'
    elif func_name.startswith('create_') or func_name.startswith('register_'):
        return '(self, data: Dict[str, Any]) -> Dict[str, Any]'
    elif func_name.startswith('update_'):
        return '(self, id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]'
    elif func_name.startswith('delete_') or func_name.startswith('remove_'):
        return '(self, id: str) -> bool'
    elif func_name.startswith('validate_') or func_name.startswith('check_'):
        return '(self, ...) -> bool'
    elif func_name.startswith('calculate_'):
        return '(self, ...) -> Dict[str, Any]'
    else:
        return '(self, ...) -> Any'


def categorize_file(filepath: Path) -> str:
    """Categoriza arquivo"""
    parts = filepath.parts
    if 'services' in parts:
        return 'service'
    elif 'repositories' in parts:
        return 'repository'
    elif 'routes' in parts:
        return 'route'
    elif 'utils' in parts:
        return 'util'
    else:
        return 'other'


def main():
    """Analisa e reporta cobertura de type hints"""
    print("🔍 Analisando type hints no backend...")
    print(f"📁 Diretório: {BACKEND_SRC}\n")
    
    stats_by_type = {
        'service': {'files': 0, 'total_funcs': 0, 'with_types': 0, 'coverage': []},
        'repository': {'files': 0, 'total_funcs': 0, 'with_types': 0, 'coverage': []},
        'route': {'files': 0, 'total_funcs': 0, 'with_types': 0, 'coverage': []},
        'util': {'files': 0, 'total_funcs': 0, 'with_types': 0, 'coverage': []},
        'other': {'files': 0, 'total_funcs': 0, 'with_types': 0, 'coverage': []}
    }
    
    files_analysis = []
    
    # Analisa services
    for py_file in (BACKEND_SRC / "services").glob("*.py"):
        if py_file.name == '__init__.py':
            continue
        
        analysis = suggest_type_hints_for_service(py_file)
        if analysis['total_functions'] > 0:
            file_type = 'service'
            stats_by_type[file_type]['files'] += 1
            stats_by_type[file_type]['total_funcs'] += analysis['total_functions']
            stats_by_type[file_type]['with_types'] += analysis['with_types']
            stats_by_type[file_type]['coverage'].append(analysis['coverage'])
            
            if analysis['coverage'] < 100:
                files_analysis.append(analysis)
    
    # Analisa repositories
    for py_file in (BACKEND_SRC / "repositories").glob("*.py"):
        if py_file.name == '__init__.py':
            continue
        
        analysis = suggest_type_hints_for_service(py_file)
        if analysis['total_functions'] > 0:
            file_type = 'repository'
            stats_by_type[file_type]['files'] += 1
            stats_by_type[file_type]['total_funcs'] += analysis['total_functions']
            stats_by_type[file_type]['with_types'] += analysis['with_types']
            stats_by_type[file_type]['coverage'].append(analysis['coverage'])
            
            if analysis['coverage'] < 100:
                files_analysis.append(analysis)
    
    # Imprime estatísticas
    print("📊 COBERTURA DE TYPE HINTS POR CATEGORIA:")
    print("━" * 80)
    
    for cat, stats in stats_by_type.items():
        if stats['files'] > 0:
            avg_coverage = sum(stats['coverage']) / len(stats['coverage']) if stats['coverage'] else 0
            quality = "✅" if avg_coverage > 70 else "⚠️" if avg_coverage > 30 else "❌"
            
            print(f"{quality} {cat.upper():12} | "
                  f"Arquivos: {stats['files']:3} | "
                  f"Funções: {stats['total_funcs']:4} | "
                  f"Com tipos: {stats['with_types']:4} | "
                  f"Cobertura: {avg_coverage:5.1f}%")
    
    total_files = sum(s['files'] for s in stats_by_type.values())
    total_funcs = sum(s['total_funcs'] for s in stats_by_type.values())
    total_with_types = sum(s['with_types'] for s in stats_by_type.values())
    overall_coverage = (total_with_types / total_funcs * 100) if total_funcs > 0 else 0
    
    print("\n" + "━" * 80)
    print(f"📈 TOTAL: {total_funcs} funções em {total_files} arquivos")
    print(f"📊 Cobertura Geral: {overall_coverage:.1f}%")
    print(f"{'✅ EXCELENTE' if overall_coverage > 70 else '⚠️ PRECISA MELHORAR'}")
    
    # Top arquivos que precisam type hints
    print("\n🎯 TOP 10 ARQUIVOS SEM TYPE HINTS:")
    print("━" * 80)
    
    sorted_files = sorted(files_analysis, key=lambda x: x['without_types'], reverse=True)[:10]
    
    for i, item in enumerate(sorted_files, 1):
        quality = "✅" if item['coverage'] > 70 else "⚠️" if item['coverage'] > 30 else "❌"
        print(f"\n{i}. {quality} {item['file']}")
        print(f"   Funções: {item['total_functions']} | "
              f"Com tipos: {item['with_types']} | "
              f"Sem tipos: {item['without_types']} | "
              f"Cobertura: {item['coverage']:.1f}%")
        
        if item['functions']:
            print(f"   Funções para melhorar:")
            for func in item['functions'][:3]:
                hint_example = generate_type_hints_example(func['name'], 'service')
                print(f"   • {func['name']}{hint_example}")
    
    print("\n" + "━" * 80)
    print("\n✨ Análise completa! Use os exemplos acima para adicionar type hints.")
    print("📚 Documentação: TYPE_HINTS_GUIDE.md")
    
    # Salva relatório
    save_type_hints_report(stats_by_type, sorted_files[:20])


def save_type_hints_report(stats: dict, files: list):
    """Salva relatório detalhado"""
    report_path = Path(__file__).parent.parent / "TYPE_HINTS_REPORT.md"
    
    with open(report_path, 'w', encoding='utf-8') as f:
        f.write("# 📊 Relatório de Type Hints - RE-EDUCA Backend\n\n")
        f.write("**Data**: 2025-11-08\n\n")
        f.write("---\n\n")
        
        f.write("## 📈 Cobertura por Categoria\n\n")
        f.write("| Categoria | Arquivos | Funções | Com Tipos | Sem Tipos | Cobertura |\n")
        f.write("|-----------|----------|---------|-----------|-----------|----------|\n")
        
        for cat, st in sorted(stats.items()):
            if st['files'] > 0:
                avg_cov = sum(st['coverage']) / len(st['coverage']) if st['coverage'] else 0
                quality = "✅" if avg_cov > 70 else "⚠️" if avg_cov > 30 else "❌"
                without = st['total_funcs'] - st['with_types']
                f.write(f"| {quality} {cat} | {st['files']} | {st['total_funcs']} | "
                       f"{st['with_types']} | {without} | {avg_cov:.1f}% |\n")
        
        f.write("\n---\n\n")
        f.write("## 🎯 Arquivos para Melhorar\n\n")
        
        for item in files:
            f.write(f"### {item['file']}\n\n")
            f.write(f"**Cobertura**: {item['coverage']:.1f}%\n")
            f.write(f"**Funções sem tipos**: {item['without_types']}/{item['total_functions']}\n\n")
            
            if item['functions']:
                f.write("**Funções para adicionar type hints**:\n")
                for func in item['functions'][:5]:
                    hint = generate_type_hints_example(func['name'], 'service')
                    f.write(f"- `{func['name']}{hint}`\n")
                f.write("\n")
        
        f.write("---\n\n")
        f.write("## 📚 Guia Rápido\n\n")
        f.write("```python\n")
        f.write("from typing import Dict, List, Optional, Any\n\n")
        f.write("# Retorna dict ou None\n")
        f.write("def get_item(self, id: str) -> Optional[Dict[str, Any]]:\n")
        f.write("    pass\n\n")
        f.write("# Retorna lista\n")
        f.write("def get_all(self) -> List[Dict[str, Any]]:\n")
        f.write("    pass\n\n")
        f.write("# Retorna bool\n")
        f.write("def exists(self, id: str) -> bool:\n")
        f.write("    pass\n")
        f.write("```\n")


if __name__ == "__main__":
    main()
