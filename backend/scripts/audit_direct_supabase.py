#!/usr/bin/env python3
"""
Script de Auditoria de Acesso Direto ao Supabase
Identifica casos onde Supabase é acessado diretamente sem usar repositórios.
"""
import os
import re
import sys
from collections import defaultdict
from pathlib import Path

# Cores
RED = "\033[91m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
RESET = "\033[0m"


def find_python_files(directory):
    """Encontra todos os arquivos Python em um diretório"""
    path = Path(directory)
    return list(path.rglob("*.py"))


def is_test_file(file_path):
    """Verifica se é arquivo de teste"""
    return "test" in str(file_path).lower() or "tests" in str(file_path)


def is_repository_file(file_path):
    """Verifica se é arquivo de repositório"""
    return "repository" in str(file_path).lower()


def is_legitimate_usage(file_path, line_content):
    """Verifica se o uso é legítimo"""
    # Repositórios podem usar supabase_client
    if is_repository_file(file_path):
        return True

    # Testes podem mockar
    if is_test_file(file_path):
        return True

    # Configuração e inicialização
    if "config" in str(file_path).lower() or "database" in str(file_path).lower():
        return True

    # Casos especiais (monitoring, auth específico)
    if "monitoring" in str(file_path).lower() and "metrics" in line_content.lower():
        return True

    return False


def audit_direct_access():
    """Audita acesso direto ao Supabase"""
    print(f"\n{BLUE}=== Auditando Acesso Direto ao Supabase ==={RESET}\n")

    backend_dir = Path(__file__).parent.parent
    src_dir = backend_dir / "src"

    # Diretórios a verificar
    routes_dir = src_dir / "routes"
    services_dir = src_dir / "services"
    middleware_dir = src_dir / "middleware"
    utils_dir = src_dir / "utils"

    patterns = [
        r"supabase_client\.table\(",
        r"supabase\.table\(",
        r"\.supabase\.table\(",
        r"self\.supabase\.table\(",
    ]

    issues = defaultdict(list)

    for directory in [routes_dir, services_dir, middleware_dir, utils_dir]:
        if not directory.exists():
            continue

        for file_path in find_python_files(directory):
            # Ignora __pycache__ e venv
            if "__pycache__" in str(file_path) or "venv" in str(file_path):
                continue

            with open(file_path, "r", encoding="utf-8") as f:
                lines = f.readlines()

                for line_num, line in enumerate(lines, 1):
                    for pattern in patterns:
                        if re.search(pattern, line):
                            # Verifica se é legítimo
                            if not is_legitimate_usage(file_path, line):
                                relative_path = file_path.relative_to(backend_dir)
                                issues[relative_path].append(
                                    {"line": line_num, "content": line.strip(), "pattern": pattern}
                                )

    # Categoriza por severidade
    critical = []
    attention = []

    for file_path, occurrences in issues.items():
        file_str = str(file_path)
        if "routes" in file_str:
            critical.append((file_path, occurrences))
        elif "services" in file_str:
            attention.append((file_path, occurrences))
        else:
            attention.append((file_path, occurrences))

    # Reporta críticos
    if critical:
        print(f"{RED}❌ CRÍTICO: Routes acessando Supabase diretamente ({len(critical)} arquivos):{RESET}\n")
        for file_path, occurrences in critical:
            print(f"  {RED}•{RESET} {file_path}")
            for occ in occurrences[:5]:  # Mostra até 5 ocorrências
                print(f"    Linha {occ['line']}: {occ['content'][:80]}")
            if len(occurrences) > 5:
                print(f"    ... e mais {len(occurrences) - 5} ocorrências")
            print()

    # Reporta atenção
    if attention:
        print(
            f"{YELLOW}⚠️  ATENÇÃO: Services/outros acessando Supabase diretamente ({len(attention)} arquivos):{RESET}\n"
        )
        for file_path, occurrences in attention[:10]:  # Limita a 10 arquivos
            print(f"  {YELLOW}•{RESET} {file_path} ({len(occurrences)} ocorrências)")
            for occ in occurrences[:3]:  # Mostra até 3 ocorrências
                print(f"    Linha {occ['line']}: {occ['content'][:80]}")
            if len(occurrences) > 3:
                print(f"    ... e mais {len(occurrences) - 3} ocorrências")
            print()
        if len(attention) > 10:
            print(f"  ... e mais {len(attention) - 10} arquivos\n")

    if not critical and not attention:
        print(f"{GREEN}✅ Nenhum acesso direto não-legítimo encontrado!{RESET}\n")

    return {
        "critical": len(critical),
        "attention": len(attention),
        "details": {"critical_files": [str(f) for f, _ in critical], "attention_files": [str(f) for f, _ in attention]},
    }


def main():
    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{BLUE}  AUDITORIA DE ACESSO DIRETO AO SUPABASE{RESET}")
    print(f"{BLUE}{'='*60}{RESET}")

    results = audit_direct_access()

    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{GREEN}✅ Auditoria concluída!{RESET}")
    print(f"\n{BLUE}Resumo:{RESET}")
    print(f"  {RED}Críticos: {results['critical']}{RESET}")
    print(f"  {YELLOW}Atenção: {results['attention']}{RESET}")
    print(f"{BLUE}{'='*60}{RESET}\n")

    # Retorna código de erro se houver críticos
    sys.exit(1 if results["critical"] > 0 else 0)


if __name__ == "__main__":
    main()
