#!/bin/bash
# Script de instalação inteligente de dependências para Python 3.13.3

set -e  # Para em caso de erro

echo "🚀 Instalação de dependências do Backend RE-EDUCA"
echo "=================================================="
echo ""

# Verifica se está no diretório correto
if [ ! -f "requirements_py313.txt" ]; then
    echo "❌ Erro: Execute este script no diretório backend/"
    exit 1
fi

# Ativa o ambiente virtual
echo "📦 Ativando ambiente virtual..."
source venv/bin/activate

# Atualiza pip, setuptools e wheel
echo ""
echo "⬆️  Atualizando pip, setuptools e wheel..."
pip install --upgrade pip setuptools wheel

# Instala os pacotes básicos primeiro
echo ""
echo "📥 Instalando pacotes básicos (Flask, etc)..."
pip install Flask==3.0.0 Flask-CORS==4.0.0 python-dotenv==1.0.0 gunicorn==21.2.0

# Instala os pacotes de banco de dados
echo ""
echo "🗄️  Instalando pacotes de banco de dados..."
pip install SQLAlchemy==2.0.25 "psycopg[binary]>=3.1.0"

# Instala supabase (pode demorar um pouco)
echo ""
echo "☁️  Instalando Supabase..."
pip install supabase==2.3.0

# Instala pacotes de segurança
echo ""
echo "🔐 Instalando pacotes de segurança..."
pip install PyJWT==2.8.0 bcrypt==4.1.2 cryptography

# Instala pacotes HTTP
echo ""
echo "🌐 Instalando pacotes HTTP..."
pip install requests==2.31.0 urllib3==2.1.0

# Instala numpy e pandas (versões compatíveis com Python 3.13)
echo ""
echo "📊 Instalando numpy e pandas (Python 3.13 compatível)..."
pip install "numpy>=1.26.4" "pandas>=2.2.0"

# Instala outros pacotes
echo ""
echo "📦 Instalando demais pacotes..."
pip install marshmallow==3.20.2 email-validator==2.1.0
pip install python-dateutil==2.8.2 pytz==2023.3
pip install redis==5.0.1
pip install "Pillow>=10.2.0"
pip install Flask-Caching==2.1.0 Flask-Limiter==3.5.0
pip install flask-restx==1.3.0
pip install psutil==5.9.6
pip install pyotp==2.9.0 qrcode==7.4.2
pip install stripe==7.8.0

# Instala pacotes de teste
echo ""
echo "🧪 Instalando pacotes de teste..."
pip install "pytest>=7.4.3" "pytest-flask>=1.3.0" "pytest-cov>=4.1.0"

# Instala pacotes de ML e análise (podem demorar mais)
echo ""
echo "🤖 Instalando pacotes de ML e análise de dados..."
echo "   (Isso pode demorar alguns minutos...)"
pip install "scikit-learn>=1.4.0" "scipy>=1.12.0"
pip install "matplotlib>=3.9.0" seaborn==0.13.0 plotly==5.17.0
pip install nltk==3.8.1 textblob==0.17.1
pip install "statsmodels>=0.14.1"

# Prophet - tentativa opcional
echo ""
echo "🔮 Tentando instalar Prophet (pode falhar no Python 3.13)..."
pip install prophet || echo "⚠️  Prophet não instalado - não há wheels para Python 3.13 (opcional)"

echo ""
echo "✅ Instalação concluída!"
echo ""
echo "📋 Para verificar os pacotes instalados:"
echo "   pip list"
echo ""
echo "🚀 Para iniciar o servidor:"
echo "   python src/app.py"
