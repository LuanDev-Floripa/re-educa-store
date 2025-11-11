#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de teste para verificar conexão com o banco de dados Supabase.

Uso:
    python scripts/test_db_connection.py
"""
import os
import sys
from pathlib import Path

# Adicionar o diretório raiz do backend ao path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

# Carregar variáveis de ambiente do arquivo .env
env_file = backend_dir / ".env"
if env_file.exists():
    with open(env_file, "r") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, value = line.split("=", 1)
                value = value.strip().strip('"').strip("'")
                os.environ[key.strip()] = value

try:
    import psycopg2
except ImportError:
    print("❌ Erro: psycopg2 não está instalado.")
    print("   Instale com: pip install psycopg2-binary")
    sys.exit(1)


def test_connection():
    """Testa diferentes métodos de conexão."""
    print("\n" + "=" * 60)
    print("  🔌 TESTE DE CONEXÃO - SUPABASE DATABASE")
    print("=" * 60)

    # Verificar variáveis disponíveis
    print("\n📋 Variáveis de ambiente encontradas:")
    supabase_vars = {k: v for k, v in os.environ.items() if "SUPABASE" in k or "DB" in k}
    for key in sorted(supabase_vars.keys()):
        value = supabase_vars[key]
        # Mascarar senhas
        if "PASSWORD" in key or "KEY" in key:
            value = value[:10] + "..." if len(value) > 10 else "***"
        print(f"   {key}: {value}")

    # Tentar conectar
    print("\n🔌 Tentando conectar...")

    # Método 1: SUPABASE_DB_URL
    db_url = os.environ.get("SUPABASE_DB_URL")
    if db_url:
        print("\n1️⃣  Tentando com SUPABASE_DB_URL...")
        try:
            conn = psycopg2.connect(db_url)
            print("   ✅ Conexão bem-sucedida!")
            with conn.cursor() as cur:
                cur.execute("SELECT version();")
                version = cur.fetchone()[0]
                print(f"   📊 PostgreSQL: {version[:50]}...")
            conn.close()
            return True
        except Exception as e:
            print(f"   ❌ Erro: {e}")

    # Método 2: Construir a partir de outras variáveis
    print("\n2️⃣  Tentando construir URL a partir de variáveis...")
    supabase_url = os.environ.get("SUPABASE_URL")

    if supabase_url:
        import re

        match = re.search(r"https://([^.]+)\.supabase\.co", supabase_url)
        if match:
            project_ref = match.group(1)
            print(f"   📍 Project Ref detectado: {project_ref}")

            # Tentar diferentes hosts
            hosts = [
                f"aws-0-us-east-1.pooler.supabase.com",
                f"db.{project_ref}.supabase.co",
                f"{project_ref}.supabase.co",
            ]

            db_user = os.environ.get("SUPABASE_DB_USER", f"postgres.{project_ref}")
            db_password = os.environ.get("SUPABASE_DB_PASSWORD")
            db_name = os.environ.get("SUPABASE_DB_NAME", "postgres")
            db_port = os.environ.get("SUPABASE_DB_PORT", "5432")

            if not db_password:
                print("   ⚠️  SUPABASE_DB_PASSWORD não encontrada")
                print("\n💡 Para obter a senha do banco:")
                print("   1. Acesse: https://supabase.com/dashboard/project/[PROJECT_REF]/settings/database")
                print("   2. Em 'Database password', você pode resetar ou ver a senha")
                return False

            for host in hosts:
                print(f"\n   Tentando host: {host}")
                try:
                    conn_string = f"host={host} port={db_port} dbname={db_name} user={db_user} password={db_password} sslmode=require"
                    conn = psycopg2.connect(conn_string, connect_timeout=5)
                    print(f"   ✅ Conexão bem-sucedida com {host}!")
                    with conn.cursor() as cur:
                        cur.execute("SELECT version();")
                        version = cur.fetchone()[0]
                        print(f"   📊 PostgreSQL: {version[:50]}...")
                    conn.close()
                    return True
                except Exception as e:
                    print(f"   ❌ Erro: {str(e)[:100]}")

    print("\n❌ Não foi possível conectar ao banco de dados.")
    print("\n📋 Configure uma das seguintes opções no .env:")
    print("   1. SUPABASE_DB_URL=postgresql://user:password@host:port/database")
    print("   2. Ou configure:")
    print("      - SUPABASE_DB_HOST")
    print("      - SUPABASE_DB_USER")
    print("      - SUPABASE_DB_PASSWORD")
    print("      - SUPABASE_DB_NAME (opcional, padrão: postgres)")
    print("      - SUPABASE_DB_PORT (opcional, padrão: 5432)")
    return False


if __name__ == "__main__":
    success = test_connection()
    sys.exit(0 if success else 1)
