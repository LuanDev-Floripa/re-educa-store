"""
Script para configurar Supabase Storage
Cria bucket de vídeos e configura permissões
"""

import os
import sys
import requests
from dotenv import load_dotenv

# Carrega variáveis de ambiente
load_dotenv()

def setup_supabase_storage():
    """Configura Supabase Storage para vídeos"""
    
    supabase_url = os.environ.get('SUPABASE_URL')
    supabase_key = os.environ.get('SUPABASE_ANON_KEY')
    
    if not supabase_url or not supabase_key:
        print("❌ Erro: SUPABASE_URL e SUPABASE_ANON_KEY devem estar configurados")
        return False
    
    headers = {
        'Authorization': f'Bearer {supabase_key}',
        'Content-Type': 'application/json'
    }
    
    bucket_name = 'videos'
    
    try:
        # Verificar se bucket já existe
        print(f"🔍 Verificando bucket '{bucket_name}'...")
        
        list_url = f"{supabase_url}/storage/v1/bucket"
        response = requests.get(list_url, headers=headers)
        
        if response.status_code == 200:
            buckets = response.json()
            for bucket in buckets:
                if bucket['name'] == bucket_name:
                    print(f"✅ Bucket '{bucket_name}' já existe")
                    return True
        
        # Criar bucket
        print(f"📦 Criando bucket '{bucket_name}'...")
        
        create_url = f"{supabase_url}/storage/v1/bucket"
        bucket_data = {
            'name': bucket_name,
            'public': True,
            'file_size_limit': 52428800,  # 50MB
            'allowed_mime_types': [
                'video/mp4',
                'video/webm',
                'video/ogg',
                'video/quicktime',
                'video/x-msvideo',  # AVI
                'video/3gpp'        # 3GP
            ]
        }
        
        response = requests.post(create_url, json=bucket_data, headers=headers)
        
        if response.status_code in [200, 201]:
            print(f"✅ Bucket '{bucket_name}' criado com sucesso!")
            print(f"📁 URL pública: {supabase_url}/storage/v1/object/public/{bucket_name}/")
            return True
        else:
            print(f"❌ Erro ao criar bucket: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Erro na configuração: {e}")
        return False

def setup_storage_policies():
    """Configura políticas RLS para o bucket"""
    
    supabase_url = os.environ.get('SUPABASE_URL')
    supabase_key = os.environ.get('SUPABASE_ANON_KEY')
    
    headers = {
        'Authorization': f'Bearer {supabase_key}',
        'Content-Type': 'application/json'
    }
    
    bucket_name = 'videos'
    
    # Políticas RLS para o bucket
    policies = [
        {
            'name': 'Public read access',
            'definition': f'SELECT * FROM storage.objects WHERE bucket_id = \'{bucket_name}\'',
            'check': 'true',
            'command': 'SELECT'
        },
        {
            'name': 'Authenticated users can upload',
            'definition': f'INSERT INTO storage.objects (bucket_id, name, owner, metadata) VALUES (\'{bucket_name}\', NEW.name, auth.uid(), NEW.metadata)',
            'check': 'auth.role() = \'authenticated\'',
            'command': 'INSERT'
        },
        {
            'name': 'Users can update own files',
            'definition': f'UPDATE storage.objects SET metadata = NEW.metadata WHERE bucket_id = \'{bucket_name}\' AND owner = auth.uid()',
            'check': 'auth.role() = \'authenticated\' AND owner = auth.uid()',
            'command': 'UPDATE'
        },
        {
            'name': 'Users can delete own files',
            'definition': f'DELETE FROM storage.objects WHERE bucket_id = \'{bucket_name}\' AND owner = auth.uid()',
            'check': 'auth.role() = \'authenticated\' AND owner = auth.uid()',
            'command': 'DELETE'
        }
    ]
    
    print("🔐 Configurando políticas RLS...")
    
    for policy in policies:
        try:
            # Aqui você precisaria executar as políticas via SQL
            # Por enquanto, apenas logamos as políticas
            print(f"📋 Política: {policy['name']}")
            print(f"   Comando: {policy['command']}")
            print(f"   Definição: {policy['definition']}")
            print(f"   Check: {policy['check']}")
            print()
            
        except Exception as e:
            print(f"⚠️  Aviso: Não foi possível configurar política {policy['name']}: {e}")
    
    print("💡 Execute as políticas SQL manualmente no Supabase Dashboard")
    return True

if __name__ == "__main__":
    print("🚀 Configurando Supabase Storage...")
    print("=" * 50)
    
    # Configurar bucket
    if setup_supabase_storage():
        print("\n" + "=" * 50)
        setup_storage_policies()
        print("\n✅ Configuração concluída!")
    else:
        print("\n❌ Falha na configuração!")
        sys.exit(1)
