"""
Configuração do Banco de Dados Local RE-EDUCA Store
"""
import os
import logging
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Optional, Dict, Any, List

logger = logging.getLogger(__name__)

class LocalDatabase:
    def __init__(self):
        self.connection_params = {
            'host': os.environ.get('POSTGRES_HOST', 'localhost'),
            'port': os.environ.get('POSTGRES_PORT', '5432'),
            'database': os.environ.get('POSTGRES_DB', 're_educa_dev'),
            'user': os.environ.get('POSTGRES_USER', 're_educa_user'),
            'password': os.environ.get('POSTGRES_PASSWORD', 're_educa_password')
        }
        self._connection = None
    
    def get_connection(self):
        """Retorna conexão com o banco de dados"""
        if self._connection is None or self._connection.closed:
            try:
                self._connection = psycopg2.connect(**self.connection_params)
                logger.info("Conexão com PostgreSQL estabelecida")
            except Exception as e:
                logger.error(f"Erro ao conectar com PostgreSQL: {str(e)}")
                raise
        return self._connection
    
    def execute_query(self, query: str, params: tuple = None) -> List[Dict[str, Any]]:
        """Executa uma query SELECT e retorna os resultados"""
        try:
            conn = self.get_connection()
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute(query, params)
                return cursor.fetchall()
        except Exception as e:
            logger.error(f"Erro ao executar query: {str(e)}")
            raise
    
    def execute_insert(self, query: str, params: tuple = None) -> int:
        """Executa uma query INSERT e retorna o ID inserido"""
        try:
            conn = self.get_connection()
            with conn.cursor() as cursor:
                cursor.execute(query, params)
                conn.commit()
                return cursor.fetchone()[0] if cursor.description else 0
        except Exception as e:
            logger.error(f"Erro ao executar insert: {str(e)}")
            conn.rollback()
            raise
    
    def execute_update(self, query: str, params: tuple = None) -> int:
        """Executa uma query UPDATE e retorna o número de linhas afetadas"""
        try:
            conn = self.get_connection()
            with conn.cursor() as cursor:
                cursor.execute(query, params)
                conn.commit()
                return cursor.rowcount
        except Exception as e:
            logger.error(f"Erro ao executar update: {str(e)}")
            conn.rollback()
            raise
    
    def execute_delete(self, query: str, params: tuple = None) -> int:
        """Executa uma query DELETE e retorna o número de linhas afetadas"""
        try:
            conn = self.get_connection()
            with conn.cursor() as cursor:
                cursor.execute(query, params)
                conn.commit()
                return cursor.rowcount
        except Exception as e:
            logger.error(f"Erro ao executar delete: {str(e)}")
            conn.rollback()
            raise
    
    def close(self):
        """Fecha a conexão com o banco de dados"""
        if self._connection and not self._connection.closed:
            self._connection.close()
            logger.info("Conexão com PostgreSQL fechada")

# Instância global do banco de dados
_local_db = None

def get_local_db() -> LocalDatabase:
    """Retorna instância do banco de dados local"""
    global _local_db
    if _local_db is None:
        _local_db = LocalDatabase()
    return _local_db

def test_connection() -> bool:
    """Testa conexão com o banco de dados"""
    try:
        db = get_local_db()
        result = db.execute_query("SELECT 1 as test")
        return len(result) > 0
    except Exception as e:
        logger.error(f"Erro na conexão com banco: {str(e)}")
        return False

def get_connection_info() -> dict:
    """Retorna informações da conexão (sem dados sensíveis)"""
    return {
        'host': os.environ.get('POSTGRES_HOST', 'localhost'),
        'port': os.environ.get('POSTGRES_PORT', '5432'),
        'database': os.environ.get('POSTGRES_DB', 're_educa_dev'),
        'connected': test_connection(),
        'timestamp': '2024-01-01T00:00:00Z'  # Em produção, usar datetime.now()
    }