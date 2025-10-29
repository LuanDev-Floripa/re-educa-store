FROM prom/prometheus:latest

# Instalar dependências adicionais
RUN apk add --no-cache curl jq

# Copiar configuração personalizada
COPY prometheus.yml /etc/prometheus/
COPY rules/ /etc/prometheus/rules/

# Criar diretório para dados persistentes
RUN mkdir -p /prometheus

# Configurar permissões
RUN chown -R nobody:nobody /prometheus

# Expor porta padrão do Prometheus
EXPOSE 9090

# Configurar volume para dados persistentes
VOLUME ["/prometheus"]

# Configurar usuário não-root para segurança
USER nobody

# Comando padrão
CMD ["--config.file=/etc/prometheus/prometheus.yml", "--storage.tsdb.path=/prometheus", "--web.console.libraries=/etc/prometheus/console_libraries", "--web.console.templates=/etc/prometheus/consoles", "--web.listen-address=:9090"]