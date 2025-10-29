FROM grafana/grafana:latest

# Instalar dependências adicionais
RUN apk add --no-cache curl jq

# Copiar configurações personalizadas
COPY grafana.ini /etc/grafana/
COPY provisioning/ /etc/grafana/provisioning/

# Criar diretório para dados persistentes
RUN mkdir -p /var/lib/grafana

# Configurar permissões
RUN chown -R grafana:grafana /var/lib/grafana

# Expor porta padrão do Grafana
EXPOSE 3000

# Configurar volume para dados persistentes
VOLUME ["/var/lib/grafana"]

# Configurar usuário grafana para segurança
USER grafana

# Comando padrão
CMD ["/run.sh"]