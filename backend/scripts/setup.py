#!/usr/bin/env python3
"""
Script de Setup RE-EDUCA Store
Configura o ambiente de desenvolvimento
"""
import os
import sys
import subprocess
import shutil
from pathlib import Path

def print_header():
    """Imprime cabeçalho do setup"""
    print("=" * 60)
    print("🚀 RE-EDUCA Store - Setup de Desenvolvimento")
    print("=" * 60)
    print()

def check_python_version():
    """Verifica versão do Python"""
    print("📋 Verificando versão do Python...")
    if sys.version_info < (3, 8):
        print("❌ Python 3.8+ é necessário")
        sys.exit(1)
    print(f"✅ Python {sys.version_info.major}.{sys.version_info.minor} detectado")
    print()

def create_env_file():
    """Cria arquivo .env se não existir"""
    print("📋 Configurando arquivo de ambiente...")
    
    env_file = Path(".env")
    env_example = Path(".env.example")
    
    if not env_file.exists():
        if env_example.exists():
            shutil.copy(env_example, env_file)
            print("✅ Arquivo .env criado a partir do .env.example")
            print("⚠️  Configure as variáveis no arquivo .env")
        else:
            print("❌ Arquivo .env.example não encontrado")
    else:
        print("✅ Arquivo .env já existe")
    print()

def install_dependencies():
    """Instala dependências Python"""
    print("📋 Instalando dependências Python...")
    try:
        subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"], 
                      check=True, capture_output=True)
        print("✅ Dependências instaladas com sucesso")
    except subprocess.CalledProcessError as e:
        print(f"❌ Erro ao instalar dependências: {e}")
        sys.exit(1)
    print()

def setup_database():
    """Configura banco de dados"""
    print("📋 Configurando banco de dados...")
    try:
        # Importa e inicializa o banco
        sys.path.append('src')
        from config.database_sqlite import get_sqlite_db
        
        db = get_sqlite_db()
        print("✅ Banco de dados SQLite configurado")
        
        # Cria usuário admin padrão
        create_admin_user(db)
        
    except Exception as e:
        print(f"❌ Erro ao configurar banco: {e}")
        sys.exit(1)
    print()

def create_admin_user(db):
    """Cria usuário admin padrão"""
    print("📋 Criando usuário admin padrão...")
    try:
        from config.security import hash_password
        from utils.helpers import generate_uuid
        from datetime import datetime
        
        admin_data = {
            'id': generate_uuid(),
            'email': 'admin@re-educa.com',
            'password_hash': hash_password('admin123'),
            'name': 'Administrador',
            'role': 'admin',
            'is_active': True,
            'subscription_plan': 'enterprise',
            'email_verified': True,
            'email_verified_at': datetime.now().isoformat(),
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        }
        
        # Verifica se admin já existe
        existing = db.execute_query('SELECT id FROM users WHERE email = ?', (admin_data['email'],))
        
        if not existing:
            db.execute_insert('''
                INSERT INTO users 
                (id, email, password_hash, name, role, is_active, subscription_plan, 
                 email_verified, email_verified_at, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                admin_data['id'], admin_data['email'], admin_data['password_hash'],
                admin_data['name'], admin_data['role'], admin_data['is_active'],
                admin_data['subscription_plan'], admin_data['email_verified'],
                admin_data['email_verified_at'], admin_data['created_at'],
                admin_data['updated_at']
            ))
            print("✅ Usuário admin criado:")
            print("   Email: admin@re-educa.com")
            print("   Senha: admin123")
        else:
            print("✅ Usuário admin já existe")
            
    except Exception as e:
        print(f"⚠️  Erro ao criar usuário admin: {e}")

def create_sample_data():
    """Cria dados de exemplo"""
    print("📋 Criando dados de exemplo...")
    try:
        sys.path.append('src')
        from config.database_sqlite import get_sqlite_db
        from utils.helpers import generate_uuid
        from datetime import datetime, timedelta
        
        db = get_sqlite_db()
        
        # Cria cupons de exemplo
        sample_coupons = [
            {
                'id': generate_uuid(),
                'code': 'BEMVINDO10',
                'name': 'Desconto de Boas-vindas',
                'description': '10% de desconto para novos usuários',
                'type': 'percentage',
                'value': 10.0,
                'min_order_value': 50.0,
                'max_discount': 20.0,
                'usage_limit': 100,
                'usage_count': 0,
                'user_limit': 1,
                'valid_from': datetime.now().isoformat(),
                'valid_until': (datetime.now() + timedelta(days=30)).isoformat(),
                'active': True,
                'created_at': datetime.now().isoformat(),
                'updated_at': datetime.now().isoformat()
            },
            {
                'id': generate_uuid(),
                'code': 'FRETE15',
                'name': 'Frete Grátis',
                'description': 'Frete grátis para pedidos acima de R$ 100',
                'type': 'fixed',
                'value': 15.0,
                'min_order_value': 100.0,
                'usage_limit': 50,
                'usage_count': 0,
                'user_limit': 1,
                'valid_from': datetime.now().isoformat(),
                'valid_until': (datetime.now() + timedelta(days=15)).isoformat(),
                'active': True,
                'created_at': datetime.now().isoformat(),
                'updated_at': datetime.now().isoformat()
            }
        ]
        
        for coupon in sample_coupons:
            # Verifica se cupom já existe
            existing = db.execute_query('SELECT id FROM coupons WHERE code = ?', (coupon['code'],))
            
            if not existing:
                db.execute_insert('''
                    INSERT INTO coupons 
                    (id, code, name, description, type, value, min_order_value, max_discount,
                     usage_limit, usage_count, user_limit, valid_from, valid_until, active,
                     created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    coupon['id'], coupon['code'], coupon['name'], coupon['description'],
                    coupon['type'], coupon['value'], coupon['min_order_value'], coupon['max_discount'],
                    coupon['usage_limit'], coupon['usage_count'], coupon['user_limit'],
                    coupon['valid_from'], coupon['valid_until'], coupon['active'],
                    coupon['created_at'], coupon['updated_at']
                ))
        
        print("✅ Cupons de exemplo criados")
        
    except Exception as e:
        print(f"⚠️  Erro ao criar dados de exemplo: {e}")

def print_next_steps():
    """Imprime próximos passos"""
    print("=" * 60)
    print("🎉 Setup concluído com sucesso!")
    print("=" * 60)
    print()
    print("📋 Próximos passos:")
    print("1. Configure as variáveis no arquivo .env")
    print("2. Execute o servidor: python src/app.py")
    print("3. Acesse: http://localhost:5000")
    print("4. Login admin: admin@re-educa.com / admin123")
    print()
    print("📚 Documentação: README.md")
    print("🐛 Problemas: Verifique os logs em backend.log")
    print()

def main():
    """Função principal do setup"""
    print_header()
    
    # Verifica se está no diretório correto
    if not Path("requirements.txt").exists():
        print("❌ Execute este script no diretório backend/")
        sys.exit(1)
    
    check_python_version()
    create_env_file()
    install_dependencies()
    setup_database()
    create_sample_data()
    print_next_steps()

if __name__ == "__main__":
    main()