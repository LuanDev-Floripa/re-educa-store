#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para criar usuario administrador
"""
import os
import sys
import uuid
from datetime import datetime

import bcrypt

# Adicionar o diretório src ao path
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "src"))


def create_admin_user():
    """Cria um usuario administrador"""

    # Dados do administrador
    admin_data = {
        "id": str(uuid.uuid4()),
        "name": "Administrador",
        "email": "admin@re-educa.com",
        "password": "admin123",  # Senha padrão - deve ser alterada
        "role": "admin",
        "is_active": True,
        "email_verified": True,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat(),
    }

    # Hash da senha
    password_hash = bcrypt.hashpw(admin_data["password"].encode("utf-8"), bcrypt.gensalt())
    admin_data["password_hash"] = password_hash.decode("utf-8")

    print("=== CRIANDO USUARIO ADMINISTRADOR ===")
    print(f"Email: {admin_data['email']}")
    print(f"Senha: {admin_data['password']}")
    print(f"Nome: {admin_data['name']}")
    print(f"ID: {admin_data['id']}")
    print("=" * 40)

    # Salvar em arquivo JSON para referência
    import json

    with open("admin_credentials.json", "w") as f:
        json.dump(
            {
                "email": admin_data["email"],
                "password": admin_data["password"],
                "name": admin_data["name"],
                "id": admin_data["id"],
            },
            f,
            indent=2,
        )

    print("✅ Credenciais salvas em admin_credentials.json")

    # Se estiver usando SQLite, criar o usuário diretamente
    try:
        import sqlite3

        # Conectar ao banco SQLite
        db_path = os.path.join(os.path.dirname(__file__), "re_educa.db")
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # Criar tabela users se não existir
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT DEFAULT 'user',
                is_active BOOLEAN DEFAULT 1,
                email_verified BOOLEAN DEFAULT 0,
                created_at TEXT,
                updated_at TEXT
            )
        """
        )

        # Inserir usuário administrador
        cursor.execute(
            """
            INSERT OR REPLACE INTO users 
            (id, name, email, password_hash, role, is_active, email_verified, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
            (
                admin_data["id"],
                admin_data["name"],
                admin_data["email"],
                admin_data["password_hash"],
                admin_data["role"],
                admin_data["is_active"],
                admin_data["email_verified"],
                admin_data["created_at"],
                admin_data["updated_at"],
            ),
        )

        conn.commit()
        conn.close()

        print("✅ Usuario administrador criado com sucesso no SQLite!")

    except Exception as e:
        print(f"⚠️  Erro ao criar no SQLite: {e}")
        print("💡 O usuario sera criado automaticamente no primeiro login")

    print("\n🔐 CREDENCIAIS DO ADMINISTRADOR:")
    print(f"   Email: {admin_data['email']}")
    print(f"   Senha: {admin_data['password']}")
    print("\n⚠️  IMPORTANTE: Altere a senha após o primeiro login!")

    return admin_data


if __name__ == "__main__":
    create_admin_user()
