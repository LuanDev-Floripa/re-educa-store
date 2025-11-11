#!/usr/bin/env python3
"""
Script de Auditoria de Endpoints
Verifica padronização de endpoints e identifica problemas.
"""
import os
import re
import sys
from pathlib import Path

# Cores para output
RED = "\033[91m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
RESET = "\033[0m"


def find_blueprint_files():
    """Encontra todos os arquivos de rotas"""
    routes_dir = Path(__file__).parent.parent / "src" / "routes"
    return list(routes_dir.glob("*.py"))


def find_app_file():
    """Encontra o arquivo app.py"""
    return Path(__file__).parent.parent / "src" / "app.py"


def check_blueprint_prefixes():
    """Verifica url_prefix nos blueprints"""
    print(f"\n{BLUE}=== Verificando url_prefix nos Blueprints ==={RESET}\n")

    issues = []
    files = find_blueprint_files()

    for file_path in files:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
            lines = content.split("\n")

            # Procura por Blueprint com url_prefix
            for i, line in enumerate(lines, 1):
                if "Blueprint" in line and "url_prefix" in line:
                    # Extrai o nome do blueprint e o prefix
                    match = re.search(r'Blueprint\([\'"](\w+)[\'"].*?url_prefix=[\'"]([^\'"]+)[\'"]', line)
                    if match:
                        blueprint_name = match.group(1)
                        prefix = match.group(2)
                        issues.append(
                            {
                                "file": file_path.name,
                                "line": i,
                                "type": "blueprint_prefix",
                                "blueprint": blueprint_name,
                                "prefix": prefix,
                                "line_content": line.strip(),
                            }
                        )

    if issues:
        print(f"{YELLOW}⚠️  Encontrados {len(issues)} blueprints com url_prefix definido:{RESET}\n")
        for issue in issues:
            print(f"  {YELLOW}•{RESET} {issue['file']}:{issue['line']}")
            print(f"    Blueprint: {issue['blueprint']}")
            print(f"    Prefix: {issue['prefix']}")
            print(f"    Linha: {issue['line_content']}\n")
    else:
        print(f"{GREEN}✅ Nenhum blueprint com url_prefix encontrado (OK){RESET}\n")

    return issues


def check_register_blueprint():
    """Verifica register_blueprint no app.py"""
    print(f"\n{BLUE}=== Verificando register_blueprint no app.py ==={RESET}\n")

    app_file = find_app_file()
    if not app_file.exists():
        print(f"{RED}❌ app.py não encontrado{RESET}\n")
        return []

    with open(app_file, "r", encoding="utf-8") as f:
        content = f.read()
        lines = content.split("\n")

    registrations = []
    in_register_function = False

    for i, line in enumerate(lines, 1):
        if "def register_blueprints" in line:
            in_register_function = True
            continue

        if in_register_function:
            if line.strip().startswith("def "):
                break

            # Procura por register_blueprint
            if "register_blueprint" in line:
                match = re.search(r'register_blueprint\((\w+)(?:.*?url_prefix=[\'"]([^\'"]+)[\'"])?', line)
                if match:
                    blueprint_name = match.group(1)
                    prefix = match.group(2) if match.group(2) else None
                    registrations.append(
                        {"line": i, "blueprint": blueprint_name, "prefix": prefix, "line_content": line.strip()}
                    )

    print(f"{GREEN}✅ Encontrados {len(registrations)} registros de blueprints:{RESET}\n")
    for reg in registrations:
        prefix_str = f" → {reg['prefix']}" if reg["prefix"] else " → SEM PREFIX"
        print(f"  {GREEN}•{RESET} {reg['blueprint']}{prefix_str}")
        print(f"    Linha {reg['line']}: {reg['line_content']}\n")

    return registrations


def check_duplicated_prefixes():
    """Verifica duplicação de url_prefix"""
    print(f"\n{BLUE}=== Verificando duplicação de url_prefix ==={RESET}\n")

    blueprint_prefixes = {}
    files = find_blueprint_files()

    # Verifica nos blueprints
    for file_path in files:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
            match = re.search(r'(\w+)\s*=\s*Blueprint\([\'"](\w+)[\'"].*?url_prefix=[\'"]([^\'"]+)[\'"]', content)
            if match:
                var_name = match.group(1)
                blueprint_name = match.group(2)
                prefix = match.group(3)
                blueprint_prefixes[blueprint_name] = {"file": file_path.name, "prefix": prefix, "source": "blueprint"}

    # Verifica no app.py
    app_file = find_app_file()
    if app_file.exists():
        with open(app_file, "r", encoding="utf-8") as f:
            content = f.read()
            matches = re.finditer(r'register_blueprint\((\w+)(?:.*?url_prefix=[\'"]([^\'"]+)[\'"])?', content)
            for match in matches:
                blueprint_name = match.group(1)
                prefix = match.group(2)
                if blueprint_name in blueprint_prefixes:
                    # Tem duplicação!
                    existing = blueprint_prefixes[blueprint_name]
                    if prefix and existing["prefix"]:
                        print(f"{RED}❌ DUPLICAÇÃO ENCONTRADA:{RESET}")
                        print(f"  Blueprint: {blueprint_name}")
                        print(f"  Prefix no Blueprint: {existing['prefix']} ({existing['file']})")
                        print(f"  Prefix no register: {prefix} (app.py)")
                        print(f"  {RED}→ Remover um dos dois!{RESET}\n")
                    blueprint_prefixes[blueprint_name]["register_prefix"] = prefix
                elif prefix:
                    blueprint_prefixes[blueprint_name] = {"file": "app.py", "prefix": prefix, "source": "register"}

    if not any("register_prefix" in v for v in blueprint_prefixes.values()):
        print(f"{GREEN}✅ Nenhuma duplicação encontrada{RESET}\n")


def check_special_endpoints():
    """Verifica endpoints especiais (sem /api/)"""
    print(f"\n{BLUE}=== Verificando Endpoints Especiais ==={RESET}\n")

    app_file = find_app_file()
    if not app_file.exists():
        return

    with open(app_file, "r", encoding="utf-8") as f:
        content = f.read()
        lines = content.split("\n")

    special_endpoints = []
    for i, line in enumerate(lines, 1):
        if "@app.route(" in line or "app.route(" in line:
            match = re.search(r'@?app\.route\([\'"]([^\'"]+)[\'"]', line)
            if match:
                route = match.group(1)
                if not route.startswith("/api/"):
                    special_endpoints.append({"line": i, "route": route, "line_content": line.strip()})

    if special_endpoints:
        print(f"{YELLOW}⚠️  Endpoints especiais (sem /api/):{RESET}\n")
        for endpoint in special_endpoints:
            print(f"  {YELLOW}•{RESET} {endpoint['route']}")
            print(f"    Linha {endpoint['line']}: {endpoint['line_content']}\n")
        print(f"{BLUE}ℹ️  Estes endpoints são intencionais (health, metrics, etc.){RESET}\n")
    else:
        print(f"{GREEN}✅ Todos os endpoints têm /api/{RESET}\n")


def main():
    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{BLUE}  AUDITORIA DE ENDPOINTS - RE-EDUCA{RESET}")
    print(f"{BLUE}{'='*60}{RESET}")

    check_blueprint_prefixes()
    check_register_blueprint()
    check_duplicated_prefixes()
    check_special_endpoints()

    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{GREEN}✅ Auditoria concluída!{RESET}")
    print(f"{BLUE}{'='*60}{RESET}\n")


if __name__ == "__main__":
    main()
