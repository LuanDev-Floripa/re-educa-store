#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para aplicar migrações críticas do Supabase (017 e 018).

Este script aplica as migrações críticas que corrigem:
- Race conditions em operações de estoque (017)
- Idempotência em webhooks de pagamento (018)

Uso:
    python scripts/apply_critical_migrations.py

Requisitos:
    - Variáveis de ambiente configuradas no .env:
      * SUPABASE_DB_URL (URL de conexão direta ao PostgreSQL)
      * Ou SUPABASE_URL + SUPABASE_DB_PASSWORD
    - psycopg2 instalado: pip install psycopg2-binary
"""
import os
import re
import sys
from pathlib import Path
# Removido: imports não utilizados

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
                # Remover aspas se existirem
                value = value.strip().strip('"').strip("'")
                os.environ[key.strip()] = value

try:
    import psycopg2
    from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
except ImportError:
    print("❌ Erro: psycopg2 não está instalado.")
    print("   Instale com: pip install psycopg2-binary")
    sys.exit(1)


def get_db_connection():
    """
    Obtém conexão direta ao PostgreSQL do Supabase.

    Tenta usar SUPABASE_DB_URL primeiro, depois constrói a partir de outras variáveis.
    """
    # Opção 1: URL direta de conexão
    db_url = os.environ.get("SUPABASE_DB_URL")
    if db_url:
        try:
            # Decodificar URL e extrair componentes para forçar IPv4
            from urllib.parse import unquote, urlparse

            parsed = urlparse(db_url)

            # Decodificar senha
            password = unquote(parsed.password) if parsed.password else None
            user = parsed.username
            host = parsed.hostname
            port = parsed.port or 5432
            database = parsed.path.lstrip("/") or "postgres"

            # Resolver hostname para IPv4
            import socket

            try:
                # Forçar IPv4
                ipv4 = socket.gethostbyname(host)
                print(f"   Resolvido {host} -> {ipv4} (IPv4)")
                host = ipv4
            except Exception as e:
                print(f"   ⚠️  Não foi possível resolver hostname: {e}")

            # Forçar IPv4 usando parâmetros separados
            return psycopg2.connect(
                host=host,
                port=port,
                database=database,
                user=user,
                password=password,
                sslmode="require",
                connect_timeout=10,
            )
        except Exception as e:
            print(f"⚠️  Erro ao conectar com SUPABASE_DB_URL: {e}")
            print("   Tentando construir URL a partir de outras variáveis...")

    # Opção 2: Construir URL a partir de SUPABASE_URL
    supabase_url = os.environ.get("SUPABASE_URL")
    db_password = os.environ.get("SUPABASE_DB_PASSWORD")
    db_host = os.environ.get("SUPABASE_DB_HOST")
    db_port = os.environ.get("SUPABASE_DB_PORT", "5432")
    db_name = os.environ.get("SUPABASE_DB_NAME", "postgres")
    db_user = os.environ.get("SUPABASE_DB_USER", "postgres")

    if supabase_url:
        # Extrair project ref da URL do Supabase
        # Exemplo: https://hgfrntbtqsarencqzsla.supabase.co
        match = re.search(r"https://([^.]+)\.supabase\.co", supabase_url)
        if match:
            project_ref = match.group(1)
            # Construir host do pooler
            if not db_host:
                db_host = f"aws-0-us-east-1.pooler.supabase.com"
            if not db_user:
                db_user = f"postgres.{project_ref}"
            if not db_name:
                db_name = "postgres"

    # Tentar conectar
    if db_host and db_user and db_password:
        try:
            conn_string = (
                f"host={db_host} port={db_port} dbname={db_name} user={db_user} password={db_password} sslmode=require"
            )
            return psycopg2.connect(conn_string)
        except Exception as e:
            print(f"❌ Erro ao conectar: {e}")
            print(f"   Host: {db_host}")
            print(f"   User: {db_user}")
            print(f"   Database: {db_name}")

    # Se nada funcionou, pedir informações
    print("\n❌ Não foi possível determinar a conexão do banco de dados.")
    print("\n📋 Configure uma das seguintes opções no .env:")
    print("   1. SUPABASE_DB_URL=postgresql://user:password@host:port/database")
    print("   2. Ou configure:")
    print("      - SUPABASE_DB_HOST")
    print("      - SUPABASE_DB_USER")
    print("      - SUPABASE_DB_PASSWORD")
    print("      - SUPABASE_DB_NAME (opcional, padrão: postgres)")
    print("      - SUPABASE_DB_PORT (opcional, padrão: 5432)")
    print("\n💡 Você pode encontrar essas informações no Dashboard do Supabase:")
    print("   Settings > Database > Connection string")
    sys.exit(1)


def check_migration_applied(conn, migration_name):
    """Verifica se uma migração já foi aplicada."""
    try:
        with conn.cursor() as cur:
            # Verificar na tabela supabase_migrations.schema_migrations
            cur.execute(
                """
                SELECT EXISTS (
                    SELECT 1 FROM supabase_migrations.schema_migrations
                    WHERE name = %s
                )
            """,
                (migration_name,),
            )
            result = cur.fetchone()
            return result[0] if result else False
    except Exception as e:
        # Se a tabela não existir, assumir que não foi aplicada
        if "does not exist" in str(e) or "relation" in str(e).lower():
            return False
        print(f"⚠️  Erro ao verificar migração {migration_name}: {e}")
        return False


def apply_migration(conn, migration_file, migration_name):
    """Aplica uma migração SQL."""
    print(f"\n📄 Aplicando migração: {migration_name}")
    print("=" * 60)

    # Ler arquivo de migração
    migration_path = Path(__file__).parent.parent.parent / "supabase" / "migrations" / migration_file
    if not migration_path.exists():
        print(f"❌ Arquivo de migração não encontrado: {migration_path}")
        return False

    with open(migration_path, "r", encoding="utf-8") as f:
        sql_content = f.read()

    try:
        # Executar migração em uma transação
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        with conn.cursor() as cur:
            # Executar SQL
            cur.execute(sql_content)

            # Registrar migração na tabela supabase_migrations.schema_migrations
            try:
                cur.execute(
                    """
                    INSERT INTO supabase_migrations.schema_migrations (version, name, statements)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (version) DO NOTHING
                """,
                    (migration_name, migration_name, [sql_content]),
                )
            except Exception as e:
                # Se não conseguir registrar, não é crítico
                print(f"⚠️  Aviso: Não foi possível registrar migração na tabela: {e}")
                print("   A migração foi aplicada, mas pode não aparecer no supabase migration list")

        print(f"✅ Migração {migration_name} aplicada com sucesso!")
        return True

    except Exception as e:
        print(f"❌ Erro ao aplicar migração {migration_name}: {e}")
        print(f"   Tipo de erro: {type(e).__name__}")
        return False


def main():
    """Função principal."""
    print("\n" + "=" * 60)
    print("  🔧 APLICAR MIGRAÇÕES CRÍTICAS - SUPABASE")
    print("=" * 60)

    # Migrações críticas a aplicar
    critical_migrations = [
        ("017_fix_race_conditions_atomic_transactions.sql", "017_fix_race_conditions_atomic_transactions"),
        ("018_webhook_idempotency.sql", "018_webhook_idempotency"),
    ]

    # Conectar ao banco
    print("\n🔌 Conectando ao banco de dados...")
    try:
        conn = get_db_connection()
        print("✅ Conexão estabelecida com sucesso!")
    except Exception as e:
        print(f"❌ Erro ao conectar: {e}")
        sys.exit(1)

    # Verificar e aplicar migrações
    applied_count = 0
    skipped_count = 0
    failed_count = 0

    for migration_file, migration_name in critical_migrations:
        print(f"\n{'='*60}")
        print(f"📋 Verificando: {migration_name}")

        # Verificar se já foi aplicada
        if check_migration_applied(conn, migration_name):
            print(f"⏭️  Migração {migration_name} já foi aplicada. Pulando...")
            skipped_count += 1
            continue

        # Aplicar migração
        if apply_migration(conn, migration_file, migration_name):
            applied_count += 1
        else:
            failed_count += 1
            print(f"⚠️  Continuando com próxima migração...")

    # Fechar conexão
    conn.close()

    # Resumo
    print("\n" + "=" * 60)
    print("  📊 RESUMO")
    print("=" * 60)
    print(f"✅ Aplicadas: {applied_count}")
    print(f"⏭️  Puladas (já aplicadas): {skipped_count}")
    print(f"❌ Falhas: {failed_count}")
    print("=" * 60)

    if failed_count > 0:
        print("\n⚠️  Algumas migrações falharam. Verifique os erros acima.")
        sys.exit(1)
    elif applied_count > 0:
        print("\n✅ Todas as migrações críticas foram aplicadas com sucesso!")
    else:
        print("\n✅ Todas as migrações críticas já estavam aplicadas.")


if __name__ == "__main__":
    main()
