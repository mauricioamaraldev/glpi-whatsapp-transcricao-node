# 🎧 GLPI AI-Voice Pipeline

> Middleware para transformar relatos informais de áudio em tickets técnicos estruturados no GLPI, via WhatsApp ou Telegram.

---

## 🎯 O Problema & A Solução

**O Problema:** Professores e funcionários enfrentam fricção ao abrir chamados manuais durante as aulas. O resultado são descrições vagas como _"o computador não liga"_ ou _"está quebrado"_, o que atrasa o diagnóstico e a triagem.

**A Solução:** Uma interface de voz que permite o envio de áudio natural pelo WhatsApp ou Telegram. O pipeline de IA interpreta o relato, identifica o local (ex: _"Sala 4"_), corrige jargões técnicos e abre o ticket via API REST do GLPI automaticamente — sem formulários, sem burocracia.

---

## 🏗️ Arquitetura

O projeto segue o princípio de **responsabilidade única por camada**. Cada arquivo tem um papel bem definido e não conhece os detalhes das outras camadas.

```
src/
├── index.js                        # Ponto de entrada — inicializa o bot
├── bot/
│   └── bot.js                      # Eventos do mensageiro · verifica usuário · formata resposta
├── controllers/
│   └── chamadoController.js        # Orquestra os serviços · resolve IDs · regras de negócio
├── services/
│   ├── glpiService.js              # Chamadas HTTP para a API REST do GLPI
│   └── transcriptionService.js     # Whisper (STT) + LLaMA (extração de dados via JSON Mode)
├── utils/
│   └── audioUtils.js               # Download e limpeza de arquivos temporários
└── config/
    ├── env.js                       # Validação de variáveis de ambiente na inicialização
    └── mappings.js                  # Mapeamentos estáticos (localizações, categoria padrão)
```

### Pipeline de processamento

```
Áudio (WhatsApp/Telegram)
        │
        ▼
  [bot.js] Verifica se o número está cadastrado no GLPI
        │  (consulta ao campo `mobile` do usuário via API)
        │
        ▼
  [audioUtils.js] Download do áudio para arquivo temporário
        │
        ▼
  [transcriptionService.js]
        ├── Whisper-large-v3 → transcrição fonética de alta fidelidade
        └── LLaMA-3.3-70b   → sanitização + extração de entidades (JSON Mode)
                                  { titulo, descricao, idLocalizacao, idCategoria }
        │
        ▼
  [chamadoController.js] Resolve IDs · abre sessão GLPI
        │
        ▼
  [glpiService.js] POST /Ticket → GLPI
        │
        ▼
  Resposta ao usuário com ID e título do chamado
```

---

## 🧠 Decisões de Engenharia

**Pipeline de IA em dois estágios**
Em vez de um único prompt, usamos dois modelos especializados via Groq Cloud. O Whisper-large-v3 foca exclusivamente em transcrição fonética de alta fidelidade. O LLaMA-3.3-70b recebe o texto bruto e extrai as entidades relevantes (local, equipamento, ação) em JSON estrito, com `temperature: 0.1` para máxima consistência.

**Autenticação via GLPI (sem mapeamento local)**
A verificação de usuário consulta diretamente o campo `mobile` da API REST do GLPI. Isso elimina qualquer mapa hardcoded no código (`MAPA_USUARIOS`), evitando o risco de vazar números de telefone em repositórios. O GLPI é a única fonte da verdade.

**Gestão de sessão GLPI**
Cada operação abre e fecha sua própria sessão no bloco `try/finally`, garantindo que nenhuma sessão fique aberta em caso de erro. Operações relacionadas (buscar usuário + criar ticket) compartilham a mesma sessão para evitar overhead desnecessário.

**Limpeza de arquivos temporários**
Arquivos de áudio baixados para a pasta `temp/` são sempre removidos no bloco `finally`, independentemente de sucesso ou falha na transcrição. A pasta `temp/` está no `.gitignore`.

**Validação de ambiente na inicialização**
O `config/env.js` valida todas as variáveis de ambiente obrigatórias antes de o app subir. Se alguma estiver faltando, o processo encerra imediatamente com uma mensagem clara — em vez de quebrar silenciosamente no meio de uma requisição.

---

## 🚀 Stack

| Camada     | Tecnologia                                       |
| ---------- | ------------------------------------------------ |
| Runtime    | Node.js 18+ (ES Modules)                         |
| Mensageiro | Telegraf (Telegram) · whatsapp-web.js (WhatsApp) |
| IA — STT   | Groq SDK · Whisper-large-v3                      |
| IA — LLM   | Groq SDK · LLaMA-3.3-70b-versatile               |
| HTTP       | Axios                                            |
| ITSM       | GLPI REST API                                    |

> **WhatsApp:** a integração usa `whatsapp-web.js` (autenticação por QR Code, sem API oficial da Meta). Requer Chromium instalado e consome ~300–500 MB de RAM devido ao Puppeteer.

---

## ⚙️ Configuração

### Pré-requisitos

- Node.js 18+
- Conta no [Groq Cloud](https://console.groq.com) com chave de API
- GLPI com a API REST habilitada e um `App Token` + `User Token` configurados
- Números de telefone cadastrados no campo **Celular** do perfil dos usuários no GLPI

### Instalação

```bash
git clone https://github.com/mauricioamaraldev/glpi-whatsapp-transcricao-node
cd glpi-whatsapp-transcricao-node
npm install
```

### Variáveis de ambiente

Crie um arquivo `.env` na raiz com base no `.env.example`:

```env
# GLPI
GLPI_API_URL=https://seu-glpi.com/apirest.php
GLPI_APP_TOKEN=seu_app_token
GLPI_USER_TOKEN=seu_user_token

# Groq
GROQ_API_KEY=sua_chave_groq

# Bot (Telegram ou WhatsApp — configure o que for usar)
TELEGRAM_API_KEY=sua_chave_telegram
```

### Executar

```bash
# Produção
npm start

# Desenvolvimento (reinicia automaticamente ao salvar)
npm run dev
```

**WhatsApp:** na primeira execução, um QR Code será exibido no terminal. Escaneie com o WhatsApp do número que será usado como bot. A sessão é salva localmente e reconectada automaticamente nas próximas execuções.

### Cadastro de usuários

Nenhum mapeamento manual é necessário. Basta garantir que o número de celular do usuário esteja preenchido no perfil do GLPI (**Administração → Usuários → [usuário] → Celular**).

O formato recomendado é somente dígitos com DDD, sem código do país: `11999998888`. O sistema normaliza automaticamente o número recebido pelo WhatsApp antes de consultar o GLPI.

---

## 🛣️ Roadmap

- [x] Pipeline Whisper + LLaMA com JSON Mode
- [x] Autenticação stateless no GLPI (sessão por operação)
- [x] Verificação de usuário via API do GLPI (sem mapeamento local)
- [x] Suporte a Telegram
- [x] Suporte a WhatsApp (whatsapp-web.js)
- [x] Limpeza automática de arquivos temporários
- [ ] Cache de sessão GLPI com Redis (reduzir latência em picos)
- [ ] Suporte a mensagens de texto além de áudio
- [ ] Webhook para notificar o usuário quando o chamado for atualizado
- [ ] Painel de monitoramento de erros e volume de chamados

---
