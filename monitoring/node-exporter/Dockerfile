FROM prom/node-exporter:latest

# Instalar dependências adicionais
RUN apk add --no-cache curl jq

# Copiar configuração personalizada
COPY node-exporter.yml /etc/node-exporter/

# Expor porta padrão do Node Exporter
EXPOSE 9100

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:9100/metrics || exit 1

# Comando para executar o Node Exporter
CMD ["--config.file=/etc/node-exporter/node-exporter.yml", "--web.listen-address=:9100"]