#!/usr/bin/env python3
"""
RE-EDUCA Store - Servidor de Teste Simples
"""
import os
import json
import uuid
from datetime import datetime, timezone
from flask import Flask, request, jsonify
from flask_cors import CORS
import logging

# Configuração de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuração da aplicação Flask
app = Flask(__name__)
app.config['SECRET_KEY'] = 'dev-secret-key-12345'

# Configuração CORS
CORS(app, origins=['http://localhost:9002', 'http://localhost:5173', 'http://localhost:3000'])

# Dados em memória para teste
users_db = []
activities_db = []

@app.route('/api/health', methods=['GET'])
def health_check():
    """Verifica saúde da API"""
    logger.info("Health check solicitado")
    return jsonify({
        'status': 'healthy',
        'database': 'memory',
        'timestamp': datetime.now(timezone.utc).isoformat(),
        'version': '2.0.0-test',
        'message': 'RE-EDUCA Store API funcionando!'
    }), 200

@app.route('/api/auth/register', methods=['POST'])
def register():
    """Registro de novo usuário"""
    try:
        logger.info("Tentativa de registro")
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Dados JSON são obrigatórios'}), 400
        
        # Validação básica
        if not data.get('email') or not data.get('password') or not data.get('name'):
            return jsonify({'error': 'Email, senha e nome são obrigatórios'}), 400
        
        email = data['email'].lower().strip()
        password = data['password']
        name = data['name'].strip()
        
        # Verifica se já existe
        if any(user['email'] == email for user in users_db):
            return jsonify({'error': 'Email já cadastrado'}), 409
        
        # Cria usuário
        user_id = str(uuid.uuid4())
        user = {
            'id': user_id,
            'email': email,
            'password': password,  # Em produção, usar hash
            'name': name,
            'role': 'user',
            'is_active': True,
            'created_at': datetime.now(timezone.utc).isoformat(),
            'subscription_plan': 'free'
        }
        
        users_db.append(user)
        
        # Log da atividade
        activities_db.append({
            'user_id': user_id,
            'activity_type': 'user_registered',
            'timestamp': datetime.now(timezone.utc).isoformat()
        })
        
        logger.info(f"Usuário registrado: {email}")
        
        return jsonify({
            'message': 'Usuário criado com sucesso',
            'user': {
                'id': user['id'],
                'email': user['email'],
                'name': user['name'],
                'role': user['role']
            }
        }), 201
        
    except Exception as e:
        logger.error(f"Erro no registro: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Login do usuário"""
    try:
        logger.info("Tentativa de login")
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Dados JSON são obrigatórios'}), 400
        
        email = data.get('email', '').lower().strip()
        password = data.get('password', '')
        
        if not email or not password:
            return jsonify({'error': 'Email e senha são obrigatórios'}), 400
        
        # Busca usuário
        user = next((u for u in users_db if u['email'] == email), None)
        
        if not user:
            logger.warning(f"Tentativa de login com email não encontrado: {email}")
            return jsonify({'error': 'Credenciais inválidas'}), 401
        
        if not user.get('is_active', True):
            return jsonify({'error': 'Conta desativada'}), 401
        
        if user['password'] != password:
            logger.warning(f"Senha incorreta para: {email}")
            return jsonify({'error': 'Credenciais inválidas'}), 401
        
        # Log da atividade
        activities_db.append({
            'user_id': user['id'],
            'activity_type': 'user_login',
            'timestamp': datetime.now(timezone.utc).isoformat()
        })
        
        logger.info(f"Login bem-sucedido: {email}")
        
        return jsonify({
            'message': 'Login realizado com sucesso',
            'user': {
                'id': user['id'],
                'email': user['email'],
                'name': user['name'],
                'role': user['role']
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Erro no login: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@app.route('/api/users', methods=['GET'])
def get_users():
    """Lista usuários (para teste)"""
    logger.info("Listagem de usuários solicitada")
    return jsonify({
        'users': [
            {
                'id': user['id'],
                'email': user['email'],
                'name': user['name'],
                'role': user['role'],
                'created_at': user['created_at']
            }
            for user in users_db
        ],
        'total': len(users_db)
    }), 200

@app.route('/api/activities', methods=['GET'])
def get_activities():
    """Lista atividades (para teste)"""
    logger.info("Listagem de atividades solicitada")
    return jsonify({
        'activities': activities_db,
        'total': len(activities_db)
    }), 200

@app.route('/api/test', methods=['GET'])
def test_endpoint():
    """Endpoint de teste"""
    return jsonify({
        'message': 'Endpoint de teste funcionando!',
        'timestamp': datetime.now(timezone.utc).isoformat(),
        'users_count': len(users_db),
        'activities_count': len(activities_db)
    }), 200

@app.route('/', methods=['GET'])
def home():
    """Página inicial da API"""
    return jsonify({
        'message': 'RE-EDUCA Store API v2.0.0-test',
        'status': 'running',
        'endpoints': [
            'GET /api/health',
            'POST /api/auth/register',
            'POST /api/auth/login',
            'GET /api/users',
            'GET /api/activities',
            'GET /api/test'
        ],
        'timestamp': datetime.now(timezone.utc).isoformat()
    }), 200

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint não encontrado'}), 404

@app.errorhandler(500)
def internal_error(error):
    logger.error(f"Erro interno: {str(error)}")
    return jsonify({'error': 'Erro interno do servidor'}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 9001))
    debug = os.environ.get('FLASK_ENV') == 'development'
    
    logger.info(f"🚀 Iniciando RE-EDUCA Store API v2.0.0-test na porta {port}")
    logger.info(f"📱 Frontend deve estar em: http://localhost:9002")
    logger.info(f"🔧 Backend rodando em: http://localhost:{port}")
    logger.info(f"✅ Health check: http://localhost:{port}/api/health")
    
    try:
        app.run(host='0.0.0.0', port=port, debug=debug)
    except Exception as e:
        logger.error(f"Erro ao iniciar servidor: {str(e)}")
        print(f"❌ Erro: {str(e)}")
        print("💡 Verifique se a porta 9001 está livre")