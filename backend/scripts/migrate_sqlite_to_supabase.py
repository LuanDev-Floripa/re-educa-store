#!/usr/bin/env python3
"""
Script de Migração: SQLite → Supabase/PostgreSQL
RE-EDUCA Store
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

import sqlite3
from supabase import create_client
from datetime import datetime
import json

print("🔄 RE-EDUCA - Migração SQLite → Supabase")
print("=" * 50)
print()

# Configurações
SQLITE_DB = '../re_educa_dev.db'
SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_KEY = os.environ.get('SUPABASE_SERVICE_KEY')  # Usar service key para admin

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ ERRO: Configure SUPABASE_URL e SUPABASE_SERVICE_KEY no .env")
    print()
    print("Exemplo:")
    print("export SUPABASE_URL=https://seu-projeto.supabase.co")
    print("export SUPABASE_SERVICE_KEY=sua-service-key")
    sys.exit(1)

print(f"📁 SQLite: {SQLITE_DB}")
print(f"☁️  Supabase: {SUPABASE_URL}")
print()

# Conectar aos bancos
try:
    sqlite_conn = sqlite3.connect(SQLITE_DB)
    sqlite_conn.row_factory = sqlite3.Row
    print("✅ Conectado ao SQLite")
except Exception as e:
    print(f"❌ Erro ao conectar SQLite: {e}")
    sys.exit(1)

try:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("✅ Conectado ao Supabase")
except Exception as e:
    print(f"❌ Erro ao conectar Supabase: {e}")
    sys.exit(1)

print()
print("🚀 Iniciando migração...")
print()

# Estatísticas
stats = {
    'users': 0,
    'products': 0,
    'orders': 0,
    'order_items': 0,
    'errors': []
}

# Migrar Usuários
print("👥 Migrando usuários...")
try:
    cursor = sqlite_conn.cursor()
    users = cursor.execute("SELECT * FROM users").fetchall()
    
    for user in users:
        try:
            user_data = {
                'id': user['id'],
                'email': user['email'],
                'password_hash': user['password_hash'],
                'name': user['name'],
                'role': user.get('role', 'user'),
                'is_active': bool(user.get('is_active', 1)),
                'created_at': user.get('created_at'),
                'updated_at': user.get('updated_at')
            }
            
            supabase.table('users').upsert(user_data).execute()
            stats['users'] += 1
            print(f"  ✅ {user['email']}")
        except Exception as e:
            error_msg = f"Usuário {user['email']}: {str(e)}"
            stats['errors'].append(error_msg)
            print(f"  ❌ {error_msg}")
    
    print(f"✅ Usuários migrados: {stats['users']}")
except Exception as e:
    print(f"❌ Erro ao migrar usuários: {e}")

print()

# Migrar Produtos
print("📦 Migrando produtos...")
try:
    cursor = sqlite_conn.cursor()
    products = cursor.execute("SELECT * FROM products").fetchall()
    
    for product in products:
        try:
            product_data = {
                'id': product['id'],
                'name': product['name'],
                'description': product.get('description'),
                'price': float(product['price']),
                'category': product.get('category'),
                'stock_quantity': product.get('stock_quantity', 0),
                'image_url': product.get('image_url'),
                'is_active': bool(product.get('is_active', 1)),
                'created_at': product.get('created_at'),
                'updated_at': product.get('updated_at')
            }
            
            supabase.table('products').upsert(product_data).execute()
            stats['products'] += 1
            print(f"  ✅ {product['name']}")
        except Exception as e:
            error_msg = f"Produto {product['name']}: {str(e)}"
            stats['errors'].append(error_msg)
            print(f"  ❌ {error_msg}")
    
    print(f"✅ Produtos migrados: {stats['products']}")
except Exception as e:
    print(f"❌ Erro ao migrar produtos: {e}")

print()

# Migrar Pedidos
print("🛒 Migrando pedidos...")
try:
    cursor = sqlite_conn.cursor()
    orders = cursor.execute("SELECT * FROM orders").fetchall()
    
    for order in orders:
        try:
            order_data = {
                'id': order['id'],
                'user_id': order['user_id'],
                'total': float(order['total']),
                'status': order.get('status', 'pending'),
                'created_at': order.get('created_at'),
                'updated_at': order.get('updated_at')
            }
            
            supabase.table('orders').upsert(order_data).execute()
            stats['orders'] += 1
            print(f"  ✅ Pedido {order['id'][:8]}...")
        except Exception as e:
            error_msg = f"Pedido {order['id']}: {str(e)}"
            stats['errors'].append(error_msg)
            print(f"  ❌ {error_msg}")
    
    print(f"✅ Pedidos migrados: {stats['orders']}")
except Exception as e:
    print(f"❌ Erro ao migrar pedidos: {e}")

print()

# Migrar Itens dos Pedidos
print("📋 Migrando itens dos pedidos...")
try:
    cursor = sqlite_conn.cursor()
    items = cursor.execute("SELECT * FROM order_items").fetchall()
    
    for item in items:
        try:
            item_data = {
                'id': item['id'],
                'order_id': item['order_id'],
                'product_id': item['product_id'],
                'quantity': item['quantity'],
                'price': float(item['price']),
                'created_at': item.get('created_at')
            }
            
            supabase.table('order_items').upsert(item_data).execute()
            stats['order_items'] += 1
        except Exception as e:
            error_msg = f"Item {item['id']}: {str(e)}"
            stats['errors'].append(error_msg)
    
    print(f"✅ Itens migrados: {stats['order_items']}")
except Exception as e:
    print(f"❌ Erro ao migrar itens: {e}")

print()
print("=" * 50)
print("📊 RESUMO DA MIGRAÇÃO")
print("=" * 50)
print()
print(f"✅ Usuários:      {stats['users']}")
print(f"✅ Produtos:      {stats['products']}")
print(f"✅ Pedidos:       {stats['orders']}")
print(f"✅ Itens:         {stats['order_items']}")
print()

if stats['errors']:
    print(f"⚠️  Erros:         {len(stats['errors'])}")
    print()
    print("Detalhes dos erros:")
    for error in stats['errors'][:10]:  # Mostrar apenas os 10 primeiros
        print(f"  - {error}")
    if len(stats['errors']) > 10:
        print(f"  ... e mais {len(stats['errors']) - 10} erros")
else:
    print("🎉 Nenhum erro!")

print()
print("✅ MIGRAÇÃO CONCLUÍDA!")
print()

# Fechar conexões
sqlite_conn.close()
