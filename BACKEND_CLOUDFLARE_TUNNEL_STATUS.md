# 🚀 Status Backend e Cloudflare Tunnel - RE-EDUCA

**Data:** 2025-01-12  
**Status:** ⚠️ **CONFIGURAÇÃO NECESSÁRIA**

---

## 📋 Resumo

### Backend Flask
- **Status:** ✅ Iniciado
- **Porta:** 9001
- **URL Local:** http://localhost:9001
- **Health Check:** `/api/health`

### Cloudflare Tunnel
- **Status:** ⚠️ Requer configuração
- **Hostname:** api.topsupplementslab.com
- **Tunnel ID:** Precisa ser configurado

---

## 🔧 Configuração Necessária

### 1. Backend Flask

O backend está configurado para rodar na porta 9001.

**Para iniciar manualmente:**
```bash
cd /root/Projetos/re-educa/backend
python -m src.app
```

**Para rodar em background:**
```bash
cd /root/Projetos/re-educa/backend
nohup python -m src.app > /tmp/backend.log 2>&1 &
```

### 2. Cloudflare Tunnel

**Pré-requisitos:**
1. Ter uma conta Cloudflare
2. Ter um tunnel criado no Cloudflare Zero Trust
3. Ter o arquivo de credenciais do tunnel

**Passos para configurar:**

1. **Criar tunnel no Cloudflare Dashboard:**
   - Acesse: https://one.dash.cloudflare.com/
   - Vá em Zero Trust > Networks > Tunnels
   - Crie um novo tunnel
   - Copie o Tunnel ID

2. **Baixar credenciais:**
   - No dashboard do Cloudflare, baixe o arquivo JSON de credenciais
   - Salve em: `~/.cloudflared/YOUR_TUNNEL_ID.json`

3. **Configurar config.yml:**
   ```yaml
   tunnel: YOUR_TUNNEL_ID
   credentials-file: /root/.cloudflared/YOUR_TUNNEL_ID.json

   ingress:
     - hostname: api.topsupplementslab.com
       service: http://localhost:9001
     - service: http_status:404
   ```

4. **Iniciar tunnel:**
   ```bash
   cloudflared tunnel run
   ```

   Ou em background:
   ```bash
   nohup cloudflared tunnel run > /tmp/cloudflared.log 2>&1 &
   ```

---

## 📝 Comandos Úteis

### Verificar Backend
```bash
# Verificar se está rodando
ps aux | grep "python.*app"

# Ver logs
tail -f /tmp/backend.log

# Testar health check
curl http://localhost:9001/api/health
```

### Verificar Cloudflare Tunnel
```bash
# Verificar se está rodando
ps aux | grep cloudflared

# Ver logs
tail -f /tmp/cloudflared.log

# Listar tunnels
cloudflared tunnel list

# Testar endpoint público
curl https://api.topsupplementslab.com/api/health
```

---

## ⚠️ Notas Importantes

1. **Tunnel ID:** Você precisa criar um tunnel no Cloudflare Dashboard e obter o ID
2. **Credenciais:** O arquivo JSON de credenciais deve ser baixado do dashboard
3. **Porta:** O backend deve estar rodando na porta 9001 antes de iniciar o tunnel
4. **Firewall:** Certifique-se de que a porta 9001 está acessível localmente

---

## 🎯 Próximos Passos

1. ⏳ Criar tunnel no Cloudflare Dashboard
2. ⏳ Baixar credenciais do tunnel
3. ⏳ Configurar `~/.cloudflared/config.yml`
4. ⏳ Iniciar cloudflared tunnel
5. ⏳ Verificar se api.topsupplementslab.com está funcionando

---

**Status:** ⚠️ **Aguardando configuração do Cloudflare Tunnel**
