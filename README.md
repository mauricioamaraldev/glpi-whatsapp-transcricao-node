# 🎧 GLPI AI-Voice Pipeline: Automação de Chamados via WhatsApp/Telegram

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="NodeJS" />
  <img src="https://img.shields.io/badge/Groq-f3d122?style=for-the-badge&logo=openai&logoColor=black" alt="Groq" />
  <img src="https://img.shields.io/badge/GLPI-00599c?style=for-the-badge&logo=glpi&logoColor=white" alt="GLPI" />
  <img src="https://img.shields.io/badge/Telegram-26A5E4?style=for-the-badge&logo=telegram&logoColor=white" alt="Telegram" />
</p>

> **Middleware de alta performance para transformar relatos informais de áudio em tickets técnicos estruturados no GLPI.**

Este projeto automatiza a abertura de chamados de suporte técnico em ambientes universitários, eliminando barreiras burocráticas e melhorando a precisão dos dados através de Inteligência Artificial Generativa.

---

## 🎯 O Problema & A Solução

**O Problema:** Professores e funcionários enfrentam fricção ao abrir chamados manuais durante as aulas. O resultado são descrições vagas como _"o computador não liga"_ ou _"está quebrado"_, o que atrasa o diagnóstico.

**A Solução:** Uma interface de voz que permite o envio de áudio natural. O pipeline de IA interpreta gírias, identifica o local (ex: "Sala 4"), corrige jargões técnicos e injeta o ticket via API REST, reduzindo o tempo de triagem em até **80%**.

---

## 🏗️ Arquitetura e Decisões de Engenharia

O projeto foi construído seguindo princípios de **Clean Architecture** e **Resiliência**:

- **Agentic Multi-Stage Pipeline:** Em vez de um único prompt, utilizamos uma esteira de dois estágios via Groq Cloud:
  - 👂 **Whisper-large-v3:** Atua como o "Ouvido" (STT) focado em transcrição fonética de alta fidelidade.
  - 🧠 **Llama-3.3-70b:** Atua como o "Cérebro" (LLM), realizando a sanitização, extração de entidades (Sala, Equipamento) e gerando um **JSON Estrito**.
- **Garbage Collection & Resource Management:** Rotinas de limpeza automática de arquivos temporários (`.ogg`, `.mp3`) garantidas por blocos `finally`, evitando o consumo desnecessário de storage.
- **Adapter Pattern para Mídia:** Encapsulamento do FFmpeg em Promises nativas, permitindo a conversão assíncrona de codecs de voz para formatos compatíveis com a IA.
- **Data Mapping:** Tradução dinâmica de linguagem natural para IDs relacionais do GLPI (Ex: _"Sala 4"_ ⮕ `ID 55`).

---

## 🚀 Stack Tecnológica

| Componente      | Tecnologia                   |
| :-------------- | :--------------------------- |
| **Runtime**     | Node.js (ES Modules)         |
| **IA Engine**   | Groq SDK (Whisper & Llama 3) |
| **Mídia**       | FFmpeg via fluent-ffmpeg     |
| **Bot API**     | Telegraf (Telegram)          |
| **Comunicação** | Axios com Interceptors       |

---

## 📁 Estrutura de Pastas

```bash
📦 src
 ┣ 📂 controllers
 ┃ ┗ 📜 glpiController.js     # Maestro da esteira e gestão de estados
 ┣ 📂 services
 ┃ ┣ 📜 glpiService.js       # Interface com a API REST do GLPI
 ┃ ┣ 📜 telegramBot.js       # Entry point do evento de entrada (Bot)
 ┃ ┗ 📜 transcription.js     # Inteligência: Whisper + Llama 3 JSON Mode
 ┣ 📂 utils
 ┃ ┗ 📜 audioConverter.js    # Utilitário de conversão de codecs
 ┣ 📂 temp                   # Arquivos voláteis (ignorado pelo Git)
 ┗ 📜 index.js               # Inicialização e Injeção de Dependências
```

## ⚙️ Configuração do Ambiente

1. Pré-requisitos
   Node.js 18+

2. FFmpeg instalado no sistema (Obrigatório para conversão .oga ⮕ .mp3)

3. Instalação

```bash
git clone https://github.com/mauricioamaraldev/glpi-whatsapp-transcricao-node

cd projeto-glpi-ai

npm install
```

3. Variáveis de Ambiente (.env)
   Crie um arquivo .env na raiz do projeto:

```
# GLPI CONFIG
GLPI_API_URL=[https://seu-glpi.com/apirest.php](https://seu-glpi.com/apirest.php)
GLPI_APP_TOKEN=seu_app_token
GLPI_USER_TOKEN=seu_user_token

# IA (GROQ)
GROQ_API_KEY=sua_chave_groq

# BOT CONFIG
TELEGRAM_API_KEY=sua_chave_telegram
PORT=3000
```

🛣️ Roadmap de Evolução
[x] Integração com Groq (Whisper + Llama 3)

[x] Autenticação Stateless no GLPI

[x] Conversão automática de arquivos de voz

[ ] Fase 2: Integração com WhatsApp Business API

[ ] Fase 3: Cache de Sessão com Redis para Tokens GLPI

[ ] Fase 4: Feedback em tempo real com link direto do chamado
