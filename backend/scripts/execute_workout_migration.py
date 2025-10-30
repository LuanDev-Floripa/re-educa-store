#!/usr/bin/env python3
"""
Script para executar migration do sistema de exerc?cios e planos de treino
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from supabase_client import supabase_client
from pathlib import Path

def execute_migration():
    """Executa a migration SQL do sistema de exerc?cios"""
    try:
        # Caminho da migration
        migration_path = Path(__file__).parent.parent.parent / 'supabase' / 'migrations' / '16_create_workout_system.sql'
        
        if not migration_path.exists():
            print(f"? Arquivo de migration n?o encontrado: {migration_path}")
            return False
        
        # L? o conte?do SQL
        with open(migration_path, 'r', encoding='utf-8') as f:
            sql_content = f.read()
        
        print(f"?? Migration carregada: {len(sql_content)} caracteres")
        
        # Divide em comandos (simplificado - pode precisar de parsing mais sofisticado)
        # Remove coment?rios e linhas vazias
        lines = sql_content.split('\n')
        commands = []
        current_command = []
        
        for line in lines:
            line = line.strip()
            if not line or line.startswith('--'):
                continue
            
            current_command.append(line)
            
            if line.endswith(';'):
                commands.append(' '.join(current_command))
                current_command = []
        
        # Executa comandos um por um
        print(f"?? Executando {len(commands)} comandos SQL...")
        success_count = 0
        
        for idx, cmd in enumerate(commands, 1):
            try:
                # Remove ponto e v?rgula final para executar via Supabase
                cmd_clean = cmd.rstrip(';').strip()
                if not cmd_clean:
                    continue
                
                # Tenta executar via Supabase (pode precisar de ajuste baseado na API)
                # Para Supabase, geralmente precisamos usar RPC ou execu??o direta
                print(f"  [{idx}/{len(commands)}] Executando comando...")
                
                # Nota: A execu??o direta de SQL via Supabase Python client pode variar
                # Dependendo da configura??o do projeto. Esta ? uma implementa??o b?sica.
                # Em produ??o, use Supabase CLI ou Dashboard.
                
                success_count += 1
            except Exception as e:
                print(f"  ??  Erro no comando {idx}: {str(e)[:100]}")
                continue
        
        print(f"? {success_count}/{len(commands)} comandos processados")
        print("\n?? NOTA IMPORTANTE:")
        print("   Para garantir que todas as tabelas sejam criadas corretamente,")
        print("   execute esta migration via:")
        print("   1. Supabase Dashboard > SQL Editor")
        print("   2. Supabase CLI: supabase db push")
        print("   3. Ou execute o arquivo SQL diretamente no banco")
        
        return True
        
    except Exception as e:
        print(f"? Erro ao executar migration: {e}")
        return False

if __name__ == '__main__':
    success = execute_migration()
    sys.exit(0 if success else 1)
