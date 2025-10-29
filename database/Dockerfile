FROM postgres:15-alpine

# Definir variáveis de ambiente
ENV POSTGRES_DB=re_educa
ENV POSTGRES_USER=re_educa_user
ENV POSTGRES_PASSWORD=re_educa_password

# Instalar extensões adicionais
RUN apk add --no-cache \
    postgresql-contrib \
    postgis \
    && rm -rf /var/cache/apk/*

# Copiar scripts de inicialização
COPY init.sql /docker-entrypoint-initdb.d/

# Configurar permissões
RUN chmod 644 /docker-entrypoint-initdb.d/*.sql

# Expor porta padrão do PostgreSQL
EXPOSE 5432

# Configurar volume para dados persistentes
VOLUME ["/var/lib/postgresql/data"]

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD pg_isready -U $POSTGRES_USER -d $POSTGRES_DB || exit 1