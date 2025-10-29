#!/usr/bin/env python3
"""
Script para popular o banco de dados com dados de teste
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

import uuid
import sqlite3
from datetime import datetime

DB_PATH = '../re_educa_dev.db'

def populate_database():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("🚀 Populando banco de dados...")
    
    # Produtos de teste
    products = [
        {
            'id': str(uuid.uuid4()),
            'name': 'Whey Protein Premium 900g',
            'description': 'Proteína isolada de alta qualidade para ganho de massa muscular. Rico em aminoácidos essenciais.',
            'price': 129.90,
            'category': 'suplementos',
            'stock_quantity': 100,
            'image_url': 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?w=400',
            'is_active': 1
        },
        {
            'id': str(uuid.uuid4()),
            'name': 'Creatina Monohidratada 300g',
            'description': 'Creatina pura para aumento de força e performance nos treinos.',
            'price': 79.90,
            'category': 'suplementos',
            'stock_quantity': 150,
            'image_url': 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400',
            'is_active': 1
        },
        {
            'id': str(uuid.uuid4()),
            'name': 'BCAA 2:1:1 - 120 Cápsulas',
            'description': 'Aminoácidos de cadeia ramificada para recuperação muscular.',
            'price': 89.90,
            'category': 'suplementos',
            'stock_quantity': 80,
            'image_url': 'https://images.unsplash.com/photo-1526081715791-7c538139f9bc?w=400',
            'is_active': 1
        },
        {
            'id': str(uuid.uuid4()),
            'name': 'Multivitamínico Completo',
            'description': 'Complexo vitamínico e mineral para saúde geral.',
            'price': 49.90,
            'category': 'vitaminas',
            'stock_quantity': 200,
            'image_url': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400',
            'is_active': 1
        },
        {
            'id': str(uuid.uuid4()),
            'name': 'Omega 3 - 1000mg',
            'description': 'Óleo de peixe rico em EPA e DHA para saúde cardiovascular.',
            'price': 59.90,
            'category': 'vitaminas',
            'stock_quantity': 120,
            'image_url': 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400',
            'is_active': 1
        },
        {
            'id': str(uuid.uuid4()),
            'name': 'Termogênico Extreme',
            'description': 'Queimador de gordura com cafeína e extratos naturais.',
            'price': 99.90,
            'category': 'emagrecimento',
            'stock_quantity': 60,
            'image_url': 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400',
            'is_active': 1
        },
        {
            'id': str(uuid.uuid4()),
            'name': 'Colágeno Hidrolisado 300g',
            'description': 'Colágeno para pele, cabelos e articulações.',
            'price': 69.90,
            'category': 'beleza',
            'stock_quantity': 90,
            'image_url': 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400',
            'is_active': 1
        },
        {
            'id': str(uuid.uuid4()),
            'name': 'Barra de Proteína - Chocolate',
            'description': 'Snack proteico com 20g de proteína. Sabor chocolate.',
            'price': 6.90,
            'category': 'snacks',
            'stock_quantity': 300,
            'image_url': 'https://images.unsplash.com/photo-1582169296194-e4d644c48063?w=400',
            'is_active': 1
        },
        {
            'id': str(uuid.uuid4()),
            'name': 'Pasta de Amendoim Integral',
            'description': 'Pasta de amendoim 100% natural, sem adição de açúcar.',
            'price': 19.90,
            'category': 'alimentos',
            'stock_quantity': 150,
            'image_url': 'https://images.unsplash.com/photo-1571506165871-ee72a35bc9d9?w=400',
            'is_active': 1
        },
        {
            'id': str(uuid.uuid4()),
            'name': 'Pré-Treino Explosivo',
            'description': 'Fórmula avançada com cafeína, beta-alanina e arginina.',
            'price': 119.90,
            'category': 'suplementos',
            'stock_quantity': 70,
            'image_url': 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=400',
            'is_active': 1
        }
    ]
    
    print(f"📦 Inserindo {len(products)} produtos...")
    for product in products:
        try:
            cursor.execute("""
                INSERT INTO products (id, name, description, price, category, 
                                    stock_quantity, image_url, is_active, 
                                    created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                product['id'],
                product['name'],
                product['description'],
                product['price'],
                product['category'],
                product['stock_quantity'],
                product['image_url'],
                product['is_active'],
                datetime.now().isoformat(),
                datetime.now().isoformat()
            ))
            print(f"  ✅ {product['name']}")
        except sqlite3.IntegrityError:
            print(f"  ⚠️  {product['name']} (já existe)")
    
    conn.commit()
    
    # Verificar resultados
    cursor.execute("SELECT COUNT(*) FROM products")
    total_products = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM users")
    total_users = cursor.fetchone()[0]
    
    print(f"\n✅ Banco de dados populado!")
    print(f"   📊 Total de produtos: {total_products}")
    print(f"   👥 Total de usuários: {total_users}")
    
    conn.close()

if __name__ == '__main__':
    populate_database()
