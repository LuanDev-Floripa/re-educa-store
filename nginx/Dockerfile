FROM nginx:alpine

# Instalar dependências adicionais
RUN apk add --no-cache curl jq certbot certbot-nginx

# Copiar configuração personalizada
COPY nginx.conf /etc/nginx/
COPY ssl/ /etc/nginx/ssl/

# Criar diretórios necessários
RUN mkdir -p /var/cache/nginx /var/log/nginx /etc/nginx/conf.d

# Configurar permissões
RUN chown -R nginx:nginx /var/cache/nginx /var/log/nginx

# Expor portas HTTP e HTTPS
EXPOSE 80 443

# Configurar volume para logs
VOLUME ["/var/log/nginx"]

# Configurar usuário nginx para segurança
USER nginx

# Script de inicialização
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Comando padrão
CMD ["/start.sh"]