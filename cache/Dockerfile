FROM redis:7-alpine

# Instalar dependências adicionais
RUN apk add --no-cache curl jq

# Copiar configuração personalizada
COPY redis.conf /usr/local/etc/redis/redis.conf

# Criar diretório para dados persistentes
RUN mkdir -p /data

# Configurar permissões
RUN chown -R redis:redis /data

# Expor porta padrão do Redis
EXPOSE 6379

# Configurar volume para dados persistentes
VOLUME ["/data"]

# Configurar usuário redis para segurança
USER redis

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD redis-cli ping || exit 1

# Comando para executar o Redis
CMD ["redis-server", "/usr/local/etc/redis/redis.conf"]