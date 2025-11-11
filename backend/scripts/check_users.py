#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para verificar usuários cadastrados no Supabase
"""
import json
import os
import sys
from datetime import datetime

import requests

# Carregar variáveis de ambiente manualmente
env_file = "/root/Projetos/re-educa/backend/.env"
if os.path.exists(env_file):
    with open(env_file, "r") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, value = line.split("=", 1)
                os.environ[key.strip()] = value.strip()

# Configuração Supabase
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://hgfrntbtqsarencqzsla.supabase.co")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY")


def print_header(title):
    """Imprime cabeçalho formatado"""
    print("\n" + "=" * 60)
    print(f"  {title}")
    print("=" * 60 + "\n")


def query_supabase(table, headers, params=None):
    """Faz query na API do Supabase"""
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    try:
        response = requests.get(url, headers=headers, params=params, timeout=10)
        response.raise_for_status()
        return response.json() if response.content else []
    except requests.exceptions.RequestException as e:
        print(f"❌ Erro ao consultar {table}: {e}")
        if hasattr(e.response, "text"):
            print(f"   Resposta: {e.response.text}")
        return None


def check_auth_users(service_key):
    """Verifica usuários na tabela auth.users (autenticação)"""
    print_header("USUÁRIOS EM auth.users (Autenticação)")

    headers = {"apikey": service_key, "Authorization": f"Bearer {service_key}", "Content-Type": "application/json"}

    # Consultar auth.users via API REST Admin
    url = f"{SUPABASE_URL}/rest/v1/"
    try:
        # Tentar consultar diretamente (pode não funcionar sem permissões especiais)
        # Vamos usar uma abordagem diferente: consultar a tabela public.users
        print("⚠️  A tabela auth.users requer permissões de admin.")
        print("   Consultando tabela public.users que deve ter os dados...\n")
        return None
    except Exception as e:
        print(f"❌ Erro: {e}")
        return None


def check_public_users(service_key):
    """Verifica usuários na tabela public.users"""
    print_header("USUÁRIOS EM public.users")

    headers = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }

    # Consultar com limit e order
    params = {"select": "*", "order": "created_at.desc", "limit": "100"}

    users = query_supabase("users", headers, params)

    if users is None:
        print("❌ Não foi possível consultar usuários")
        return []

    if not users or len(users) == 0:
        print("⚠️  Nenhum usuário encontrado na tabela public.users\n")
        return []

    print(f"✅ Total de usuários encontrados: {len(users)}\n")

    for i, user in enumerate(users, 1):
        print(f"👤 Usuário {i}:")
        print(f"   ID: {user.get('id', 'N/A')}")
        print(f"   Nome: {user.get('name', 'N/A')}")
        print(f"   Email: {user.get('email', 'N/A')}")
        print(f"   Ativo: {'Sim' if user.get('is_active', False) else 'Não'}")
        print(f"   Role: {user.get('role', 'user')}")
        if user.get("created_at"):
            print(f"   Criado em: {user.get('created_at')}")
        print()

    return users


def check_user_profiles(service_key):
    """Verifica perfis de usuários"""
    print_header("PERFIS DE USUÁRIOS")

    headers = {"apikey": service_key, "Authorization": f"Bearer {service_key}", "Content-Type": "application/json"}

    params = {"select": "*", "order": "created_at.desc", "limit": "100"}

    profiles = query_supabase("user_profiles", headers, params)

    if profiles is None:
        print("⚠️  Tabela user_profiles não encontrada ou sem acesso\n")
        return []

    if not profiles or len(profiles) == 0:
        print("⚠️  Nenhum perfil encontrado\n")
        return []

    print(f"✅ Total de perfis encontrados: {len(profiles)}\n")

    for i, profile in enumerate(profiles, 1):
        print(f"📋 Perfil {i}:")
        print(f"   User ID: {profile.get('user_id', 'N/A')}")
        print(f"   Avatar: {profile.get('avatar_url', 'Não definido')}")
        print(f"   Bio: {profile.get('bio', 'Não definido')[:50]}...")
        if profile.get("created_at"):
            print(f"   Criado em: {profile.get('created_at')}")
        print()

    return profiles


def main():
    """Função principal"""
    print_header("VERIFICAÇÃO DE USUÁRIOS NO SUPABASE")

    if not SUPABASE_SERVICE_KEY:
        print("❌ SUPABASE_SERVICE_KEY não encontrada no arquivo .env")
        print("   Usando SUPABASE_ANON_KEY...\n")
        key = SUPABASE_ANON_KEY
    else:
        key = SUPABASE_SERVICE_KEY

    if not key:
        print("❌ Nenhuma chave do Supabase encontrada!")
        sys.exit(1)

    print(f"📍 URL: {SUPABASE_URL}")
    print(f"🔑 Usando: {'Service Key' if SUPABASE_SERVICE_KEY else 'Anon Key'}\n")

    # Verificar usuários
    users = check_public_users(key)

    # Verificar perfis
    profiles = check_user_profiles(key)

    # Resumo final
    print_header("RESUMO")
    print(f"✅ Usuários na tabela 'users': {len(users) if users else 0}")
    print(f"✅ Perfis na tabela 'user_profiles': {len(profiles) if profiles else 0}")

    if users and len(users) == 0:
        print("\n⚠️  ATENÇÃO: Nenhum usuário encontrado!")
        print("   Isso pode indicar que:")
        print("   - Os usuários ainda não foram cadastrados")
        print("   - Os usuários estão em auth.users (tabela de autenticação)")
        print("   - Há problema de permissões na consulta")
        print("\n💡 Dica: Tente criar um usuário via API de registro para testar.")

    print("\n" + "=" * 60 + "\n")


if __name__ == "__main__":
    main()
