FROM prom/alertmanager:latest

# Instalar dependências adicionais
RUN apk add --no-cache curl jq

# Copiar configuração personalizada
COPY alertmanager.yml /etc/alertmanager/
COPY templates/ /etc/alertmanager/templates/

# Criar diretório para dados persistentes
RUN mkdir -p /alertmanager

# Expor porta padrão do Alertmanager
EXPOSE 9093

# Configurar volume para dados persistentes
VOLUME ["/alertmanager"]

# Configurar usuário não-root para segurança
USER nobody

# Comando padrão
CMD ["--config.file=/etc/alertmanager/alertmanager.yml", "--storage.path=/alertmanager", "--web.listen-address=:9093"]