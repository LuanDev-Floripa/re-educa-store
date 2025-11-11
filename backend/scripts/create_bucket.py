#!/usr/bin/env python3
"""
Script para criar bucket de vídeos no Supabase Storage
"""

import os
import sys

import requests
from dotenv import load_dotenv

# Carrega variáveis de ambiente
load_dotenv()


def create_videos_bucket():
    """Cria o bucket de vídeos no Supabase Storage"""

    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_KEY")

    if not supabase_url or not supabase_key:
        print("❌ Erro: SUPABASE_URL e SUPABASE_SERVICE_KEY devem estar configurados")
        return False

    headers = {"Authorization": f"Bearer {supabase_key}", "Content-Type": "application/json", "apikey": supabase_key}

    bucket_name = "videos"

    try:
        # Verificar se bucket já existe
        print(f"🔍 Verificando bucket '{bucket_name}'...")

        list_url = f"{supabase_url}/storage/v1/bucket"
        response = requests.get(list_url, headers=headers)

        if response.status_code == 200:
            buckets = response.json()
            for bucket in buckets:
                if bucket["name"] == bucket_name:
                    print(f"✅ Bucket '{bucket_name}' já existe")
                    return True

        # Criar bucket
        print(f"📦 Criando bucket '{bucket_name}'...")

        create_url = f"{supabase_url}/storage/v1/bucket"
        bucket_data = {
            "name": bucket_name,
            "public": True,
            "file_size_limit": 52428800,  # 50MB
            "allowed_mime_types": [
                "video/mp4",
                "video/webm",
                "video/ogg",
                "video/quicktime",
                "video/x-msvideo",  # AVI
                "video/3gpp",  # 3GP
            ],
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


if __name__ == "__main__":
    print("🚀 Criando bucket de vídeos no Supabase Storage...")
    print("=" * 50)

    if create_videos_bucket():
        print("\n✅ Bucket criado com sucesso!")
    else:
        print("\n❌ Falha ao criar bucket!")
        sys.exit(1)
