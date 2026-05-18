# GLPI WhatsApp Bot

Bot de suporte de TI via WhatsApp que transcreve áudios e abre chamados automaticamente no GLPI.

---

## Como funciona

O usuário envia um **áudio** ou **texto** descrevendo o problema pelo WhatsApp. O bot transcreve com Whisper, extrai os dados do chamado com LLaMA, mostra um preview para confirmação e abre o ticket via API do GLPI.

```
Usuário envia áudio/texto
        │
        ▼
[Whisper-large-v3] Transcrição do áudio → texto
        │
        ▼
[LLaMA-3.3-70b] Extração de título, descrição e categoria → JSON
        │
        ▼
[Bot] Verifica se o número está cadastrado no GLPI
        │   Não cadastrado → solicita login de rede
        │   Cadastrado ────────────────────────────┐
        │                                          ▼
        │                              Preview para o usuário
        │                           1 Confirmar | 2 Corrigir | 3 Cancelar
        │                                          │
        ▼                                          ▼
[GLPI API] Cria o ticket e notifica o usuário com o ID
```

Após aberto, o bot monitora o ticket e notifica o usuário em caso de atualização de status ou novo comentário do técnico.

---

## Estrutura do projeto

```
src/
├── index.js                    # Ponto de entrada
├── bot/
│   └── bot.js                  # Eventos do WhatsApp e máquina de estados da conversa
├── controllers/
│   └── chamadoController.js    # Orquestra os serviços e regras de negócio
├── services/
│   ├── glpiService.js          # Comunicação com a API REST do GLPI
│   ├── transcriptionService.js # Whisper (STT) + LLaMA (extração de dados)
│   ├── localizacaoService.js   # Cache e resolução de localizações do GLPI
│   ├── pollingService.js       # Monitoramento de tickets abertos
│   └── expiraTempoService.js   # Expiração de sessões inativas
├── db/
│   └── database.js             # SQLite via Knex — sessões e estado dos tickets
├── utils/
│   └── audioUtil.js            # Download e limpeza de arquivos de áudio temporários
├── config/
│   ├── env.js                  # Validação de variáveis de ambiente
│   ├── prompts.js              # Prompts de IA (não versionado — veja prompts.example.js)
│   └── localizacoes.json       # Cache local das localizações do GLPI (gerado automaticamente)
└── scripts/
    └── sincronizarLocalizacoes.js  # Atualiza o cache de localizações manualmente
```

---

## Pré-requisitos

- Node.js 20+
- Conta no [Groq Cloud](https://console.groq.com) com chave de API
- GLPI com API REST habilitada, um **App Token** e um **User Token** configurados

---

## Instalação local

```bash
git clone https://github.com/mauricioamaraldev/glpi-whatsapp-transcricao-node
cd glpi-whatsapp-transcricao-node
npm install
```

Crie o arquivo de configuração:

```bash
cp .env.example .env
```

Edite o `.env` com suas credenciais:

```env
GLPI_API_URL=https://seu-glpi.com/apirest.php
GLPI_APP_TOKEN=seu_app_token
GLPI_USER_TOKEN=seu_user_token

GROQ_API_KEY=sua_chave_groq
```

Crie o arquivo de prompts a partir do exemplo:

```bash
cp src/config/prompts.example.js src/config/prompts.js
```

Edite `prompts.js` com os textos adequados à sua instituição.

Inicie o bot:

```bash
# Desenvolvimento (reinicia ao salvar)
npm run dev

# Produção
npm start
```

Na primeira execução um QR Code será exibido no terminal. Escaneie com o WhatsApp do número que será usado como bot. A sessão é salva automaticamente e reconectada nas próximas execuções.

---

## Docker

### Desenvolvimento (hot-reload do código)

```bash
docker compose -f docker-compose.local.yml up --build
```

### Produção

```bash
docker compose -f docker-compose.producao.yml up -d --build
```

Os volumes Docker persistem automaticamente:

| Volume | Conteúdo |
|---|---|
| `whatsapp_auth` | Sessão do WhatsApp (evita novo QR Code) |
| `bot_data` | Banco SQLite com sessões e tickets |
| `bot_temp` | Arquivos de áudio temporários |

> Na primeira execução em Docker, acompanhe os logs para escanear o QR Code:
> ```bash
> docker logs -f glpi-whatsapp-producao
> ```

---

## Cadastro de usuários

Não é necessário nenhum mapeamento manual. Basta cadastrar o celular do usuário no perfil do GLPI:

**Administração → Usuários → [usuário] → Celular**

Use apenas dígitos com DDD, sem código do país: `98912345678`. O bot normaliza automaticamente o número recebido pelo WhatsApp antes de consultar o GLPI.

Se o número não estiver cadastrado, o bot solicita o login de rede do usuário e faz o vínculo automaticamente.

---

## Sincronizar localizações

As localizações do GLPI são sincronizadas automaticamente na primeira execução. Para forçar uma atualização manual (quando novos setores forem cadastrados no GLPI):

```bash
node src/scripts/sincronizarLocalizacoes.js
```

---

## Stack

| Camada | Tecnologia |
|---|---|
| Runtime | Node.js 20 (ES Modules) |
| WhatsApp | whatsapp-web.js + Puppeteer |
| IA — STT | Groq · Whisper-large-v3 |
| IA — LLM | Groq · LLaMA-3.3-70b-versatile |
| Banco de dados | SQLite via Knex + better-sqlite3 |
| HTTP | Axios |
| ITSM | GLPI REST API |
