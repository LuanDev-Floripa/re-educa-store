#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Verifica se as migrações foram aplicadas."""
import os
import sys
from pathlib import Path

backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

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
    import socket
    from urllib.parse import unquote, urlparse

    import psycopg2
except ImportError:
    print("❌ psycopg2 não instalado")
    sys.exit(1)


def get_conn():
    db_url = os.environ.get("SUPABASE_DB_URL")
    if not db_url:
        print("❌ SUPABASE_DB_URL não configurado")
        sys.exit(1)

    parsed = urlparse(db_url)
    password = unquote(parsed.password) if parsed.password else None
    user = parsed.username
    host = parsed.hostname
    port = parsed.port or 5432
    database = parsed.path.lstrip("/") or "postgres"

    try:
        ipv4 = socket.gethostbyname(host)
        host = ipv4
    except Exception:
        pass

    return psycopg2.connect(
        host=host, port=port, database=database, user=user, password=password, sslmode="require", connect_timeout=10
    )


print("\n" + "=" * 60)
print("  🔍 VERIFICANDO STATUS DAS MIGRAÇÕES")
print("=" * 60)

try:
    conn = get_conn()
    print("✅ Conectado ao banco de dados\n")

    with conn.cursor() as cur:
        # Verificar funções da migração 017
        print("📋 Migração 017 - Funções:")
        cur.execute(
            """
            SELECT proname FROM pg_proc 
            WHERE proname IN ('update_product_stock', 'create_order_atomic')
            ORDER BY proname;
        """
        )
        functions = cur.fetchall()
        if functions:
            for func in functions:
                print(f"  ✅ {func[0]}")
        else:
            print("  ❌ Funções não encontradas")

        # Verificar constraint
        print("\n📋 Migração 017 - Constraint:")
        cur.execute(
            """
            SELECT conname FROM pg_constraint 
            WHERE conrelid = 'products'::regclass 
            AND conname = 'check_stock_positive';
        """
        )
        constraint = cur.fetchone()
        if constraint:
            print(f"  ✅ {constraint[0]}")
        else:
            print("  ❌ Constraint não encontrada")

        # Verificar tabela da migração 018
        print("\n📋 Migração 018 - Tabela:")
        cur.execute(
            """
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'processed_webhooks';
        """
        )
        table = cur.fetchone()
        if table:
            print(f"  ✅ {table[0]}")
        else:
            print("  ❌ Tabela não encontrada")

        # Verificar funções da migração 018
        print("\n📋 Migração 018 - Funções:")
        cur.execute(
            """
            SELECT proname FROM pg_proc 
            WHERE proname IN ('is_webhook_processed', 'register_webhook_processed')
            ORDER BY proname;
        """
        )
        functions_018 = cur.fetchall()
        if functions_018:
            for func in functions_018:
                print(f"  ✅ {func[0]}")
        else:
            print("  ❌ Funções não encontradas")

        # Verificar migrações aplicadas
        print("\n📋 Migrações Registradas:")
        try:
            cur.execute(
                """
                SELECT version, name FROM supabase_migrations.schema_migrations
                WHERE name LIKE '017%' OR name LIKE '018%'
                ORDER BY version;
            """
            )
            migrations = cur.fetchall()
            if migrations:
                for mig in migrations:
                    print(f"  ✅ {mig[1]} (versão {mig[0]})")
            else:
                print("  ⚠️  Nenhuma migração registrada na tabela")
        except Exception as e:
            print(f"  ⚠️  Erro ao verificar tabela de migrações: {e}")

    conn.close()

    print("\n" + "=" * 60)
    print("✅ Verificação concluída!")
    print("=" * 60)

except Exception as e:
    print(f"❌ Erro: {e}")
    sys.exit(1)
