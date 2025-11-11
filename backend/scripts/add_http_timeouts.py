#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para adicionar timeouts em todas as chamadas requests sem timeout.

Encontra e reporta todos os requests.get/post/put/patch/delete que não
possuem parâmetro timeout= definido.
"""

import os
import re
from pathlib import Path
from typing import Dict, List, Tuple

# Diretório base do backend
BACKEND_DIR = Path(__file__).parent.parent / "src"

# Padrões para detectar requests sem timeout
PATTERNS = [
    r'requests\.(get|post|put|patch|delete)\([^)]*\)',
]


def find_requests_without_timeout(file_path: Path) -> List[Tuple[int, str, str]]:
    """
    Encontra todas as chamadas requests sem timeout em um arquivo.
    
    Args:
        file_path: Caminho do arquivo Python
        
    Returns:
        Lista de tuplas (linha, método, código)
    """
    issues = []
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            
        for i, line in enumerate(lines, 1):
            # Verificar se é uma linha de requests
            for pattern in PATTERNS:
                matches = re.findall(pattern, line)
                if matches:
                    # Verificar se já tem timeout
                    if 'timeout' not in line and 'timeout=' not in line:
                        # Pode ser multi-linha, vamos verificar as próximas linhas
                        full_call = line
                        j = i
                        paren_count = line.count('(') - line.count(')')
                        
                        # Continuar lendo se os parênteses não fecharam
                        while paren_count > 0 and j < len(lines):
                            full_call += lines[j]
                            paren_count += lines[j].count('(') - lines[j].count(')')
                            j += 1
                        
                        # Verificar se tem timeout na chamada completa
                        if 'timeout' not in full_call:
                            method = matches[0]
                            issues.append((i, method, line.strip()))
    
    except Exception as e:
        print(f"Erro ao processar {file_path}: {e}")
    
    return issues


def analyze_backend() -> Dict[str, List[Tuple[int, str, str]]]:
    """
    Analisa todo o backend procurando requests sem timeout.
    
    Returns:
        Dicionário com {arquivo: [(linha, método, código)]}
    """
    results = {}
    
    # Percorrer todos os arquivos Python
    for py_file in BACKEND_DIR.rglob("*.py"):
        # Pular __pycache__ e outros
        if '__pycache__' in str(py_file) or 'venv' in str(py_file):
            continue
        
        issues = find_requests_without_timeout(py_file)
        if issues:
            rel_path = py_file.relative_to(BACKEND_DIR.parent)
            results[str(rel_path)] = issues
    
    return results


def generate_report(results: Dict[str, List[Tuple[int, str, str]]]) -> str:
    """
    Gera relatório formatado.
    
    Args:
        results: Resultados da análise
        
    Returns:
        Relatório em formato Markdown
    """
    total_issues = sum(len(issues) for issues in results.values())
    
    report = f"""# Relatório de Timeouts HTTP RE-EDUCA

**Data**: {__import__('datetime').datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## Resumo

- **Total de arquivos com issues**: {len(results)}
- **Total de chamadas sem timeout**: {total_issues}

## Prioridade

🔴 **CRÍTICO**: Todas as chamadas HTTP devem ter timeout definido para evitar:
- Travamento da aplicação
- Esgotamento de recursos
- Timeouts de load balancer/proxy
- Má experiência do usuário

## Timeout Recomendado

```python
# APIs externas (Stripe, OpenAI, etc)
timeout=30  # ou mais dependendo da API

# Supabase / Database
timeout=15

# APIs internas / rápidas
timeout=10
```

## Detalhes por Arquivo

"""
    
    # Ordenar por número de issues (mais críticos primeiro)
    sorted_files = sorted(results.items(), key=lambda x: len(x[1]), reverse=True)
    
    for file_path, issues in sorted_files:
        report += f"### `{file_path}` ({len(issues)} issues)\n\n"
        
        for line_num, method, code in issues:
            report += f"- **Linha {line_num}**: `requests.{method}()`\n"
            report += f"  ```python\n"
            report += f"  {code}\n"
            report += f"  ```\n\n"
        
        report += "\n"
    
    report += """## Ação Recomendada

### Opção 1: Usar ResilientHTTPClient (RECOMENDADO)

```python
from utils.http_resilience import ResilientHTTPClient

client = ResilientHTTPClient(
    service_name='nome-do-servico',
    timeout=15,
    max_retries=3,
    use_circuit_breaker=True
)

response = client.get('/endpoint')
```

**Benefícios**:
- ✅ Timeout automático
- ✅ Retry com backoff exponencial
- ✅ Circuit breaker
- ✅ Métricas integradas

### Opção 2: Adicionar timeout manualmente

```python
# Antes (SEM TIMEOUT - PERIGOSO!)
response = requests.get('https://api.example.com/data')

# Depois (COM TIMEOUT - SEGURO!)
response = requests.get('https://api.example.com/data', timeout=15)
```

## Próximos Passos

1. Migrar serviços críticos para `ResilientHTTPClient`
2. Adicionar timeout em chamadas restantes
3. Executar testes de carga
4. Monitorar métricas de timeout

---
*Gerado automaticamente por `add_http_timeouts.py`*
"""
    
    return report


def main():
    """Executa análise e gera relatório."""
    print("🔍 Analisando chamadas HTTP sem timeout...")
    print(f"📂 Diretório: {BACKEND_DIR}")
    print()
    
    results = analyze_backend()
    
    if not results:
        print("✅ Nenhuma chamada HTTP sem timeout encontrada!")
        print("🎉 Código está 100% seguro em relação a timeouts HTTP!")
        return
    
    # Gerar relatório
    report = generate_report(results)
    
    # Salvar relatório
    report_path = BACKEND_DIR.parent.parent / "HTTP_TIMEOUT_AUDIT.md"
    with open(report_path, 'w', encoding='utf-8') as f:
        f.write(report)
    
    print(f"📊 Relatório gerado: {report_path}")
    print()
    print(f"🔴 Encontradas {sum(len(i) for i in results.values())} chamadas sem timeout em {len(results)} arquivos!")
    print()
    print("📋 Top 5 arquivos com mais issues:")
    sorted_files = sorted(results.items(), key=lambda x: len(x[1]), reverse=True)[:5]
    for file_path, issues in sorted_files:
        print(f"   {len(issues):3d} - {file_path}")


if __name__ == "__main__":
    main()
