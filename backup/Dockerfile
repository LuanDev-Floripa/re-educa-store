FROM alpine:latest

# Instalar dependências necessárias
RUN apk add --no-cache \
    postgresql-client \
    redis-cli \
    curl \
    jq \
    tar \
    gzip \
    openssl \
    rsync \
    cronie \
    bash

# Copiar scripts de backup
COPY backup.sh /usr/local/bin/
COPY backup-config.sh /usr/local/bin/
COPY cron-backup /etc/crontabs/root

# Configurar permissões
RUN chmod +x /usr/local/bin/backup.sh /usr/local/bin/backup-config.sh

# Criar diretórios necessários
RUN mkdir -p /backup /logs /scripts

# Configurar volume para backups
VOLUME ["/backup", "/logs"]

# Expor porta para API de backup (se necessário)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=1h --timeout=30s --start-period=5s --retries=3 \
    CMD /usr/local/bin/backup-config.sh health || exit 1

# Comando padrão
CMD ["crond", "-f", "-d", "8"]