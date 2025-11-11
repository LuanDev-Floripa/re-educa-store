#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para criar usuário administrador no Supabase
"""
import os
import sys
import uuid
from datetime import datetime

import bcrypt

# Adicionar o diretório src ao path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend", "src"))

from config.database import supabase_client


def create_admin_user():
    """Cria um usuário administrador no Supabase"""
    
    # Dados do administrador
    email = os.environ.get("ADMIN_EMAIL", "admin@re-educa.com")
    password = os.environ.get("ADMIN_PASSWORD", "Admin@2024!ReEduca")
    name = os.environ.get("ADMIN_NAME", "Administrador Geral")
    
    print("=" * 60)
    print("🔐 CRIANDO USUÁRIO ADMINISTRADOR NO SUPABASE")
    print("=" * 60)
    print(f"Email: {email}")
    print(f"Nome: {name}")
    print(f"Senha: {'*' * len(password)}")
    print("=" * 60)
    
    # Hash da senha
    password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    
    # Verificar se usuário já existe
    try:
        existing_user = supabase_client.table("users").select("*").eq("email", email).execute()
        
        if existing_user.data and len(existing_user.data) > 0:
            user_id = existing_user.data[0]["id"]
            print(f"⚠️  Usuário já existe com ID: {user_id}")
            
            # Atualizar para admin
            update_data = {
                "role": "admin",
                "is_active": True,
                "email_verified": True,
                "password_hash": password_hash,
                "updated_at": datetime.now().isoformat()
            }
            
            result = supabase_client.table("users").update(update_data).eq("id", user_id).execute()
            
            if result.data:
                print("✅ Usuário atualizado para administrador!")
                print(f"   ID: {user_id}")
                print(f"   Email: {email}")
                print(f"   Role: admin")
                return {
                    "id": user_id,
                    "email": email,
                    "name": name,
                    "password": password,
                    "role": "admin"
                }
        else:
            # Criar novo usuário
            user_data = {
                "id": str(uuid.uuid4()),
                "name": name,
                "email": email,
                "password_hash": password_hash,
                "role": "admin",
                "is_active": True,
                "email_verified": True,
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }
            
            result = supabase_client.table("users").insert(user_data).execute()
            
            if result.data and len(result.data) > 0:
                user = result.data[0]
                print("✅ Usuário administrador criado com sucesso!")
                print(f"   ID: {user['id']}")
                print(f"   Email: {user['email']}")
                print(f"   Nome: {user['name']}")
                print(f"   Role: {user['role']}")
                
                # Salvar credenciais
                import json
                credentials = {
                    "email": email,
                    "password": password,
                    "name": name,
                    "id": user['id']
                }
                
                creds_file = os.path.join(os.path.dirname(__file__), "..", "admin_credentials.json")
                with open(creds_file, "w") as f:
                    json.dump(credentials, f, indent=2)
                
                print(f"\n💾 Credenciais salvas em: {creds_file}")
                
                return credentials
            else:
                print("❌ Erro ao criar usuário: resposta vazia")
                return None
                
    except Exception as e:
        print(f"❌ Erro ao criar/atualizar usuário: {e}")
        import traceback
        traceback.print_exc()
        return None


if __name__ == "__main__":
    # Verificar variáveis de ambiente do Supabase
    if not os.environ.get("SUPABASE_URL") or not os.environ.get("SUPABASE_KEY"):
        print("❌ Erro: Variáveis SUPABASE_URL e SUPABASE_KEY devem estar configuradas")
        print("   Configure no arquivo backend/.env")
        sys.exit(1)
    
    result = create_admin_user()
    
    if result:
        print("\n" + "=" * 60)
        print("✅ SUCESSO!")
        print("=" * 60)
        print(f"Email: {result['email']}")
        print(f"Senha: {result['password']}")
        print("\n⚠️  IMPORTANTE: Altere a senha após o primeiro login!")
        print("=" * 60)
    else:
        print("\n❌ Falha ao criar usuário administrador")
        sys.exit(1)
