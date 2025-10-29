FROM certbot/certbot:latest

# Instalar dependências adicionais
RUN apk add --no-cache curl jq openssl

# Copiar scripts de configuração
COPY certbot.conf /etc/letsencrypt/
COPY ssl-renew.sh /usr/local/bin/
COPY ssl-check.sh /usr/local/bin/

# Configurar permissões
RUN chmod +x /usr/local/bin/ssl-renew.sh /usr/local/bin/ssl-check.sh

# Criar diretórios necessários
RUN mkdir -p /etc/letsencrypt /var/www/certbot

# Configurar volume para certificados
VOLUME ["/etc/letsencrypt", "/var/www/certbot"]

# Expor porta 80 para desafios HTTP
EXPOSE 80

# Health check
HEALTHCHECK --interval=1h --timeout=30s --start-period=5s --retries=3 \
    CMD /usr/local/bin/ssl-check.sh || exit 1

# Comando padrão
CMD ["certbot", "certonly", "--standalone", "--config", "/etc/letsencrypt/certbot.conf"]