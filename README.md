# 🎧 Automação de Chamados GLPI via WhatsApp (AI Pipeline)

Este projeto é um _middleware_ em Node.js construído para automatizar e otimizar a abertura de chamados de suporte de TI em um ambiente universitário. Ele recebe relatos em áudio (padrão WhatsApp), processa o arquivo, transcreve, corrige jargões técnicos usando Inteligência Artificial e injeta o ticket perfeitamente formatado via REST API no sistema GLPI.

## 🎯 O Problema que Resolvemos

Atualmente, usuários (professores e funcionários) encontram atrito ao parar suas aulas para abrir chamados detalhados no GLPI. Ao permitir o envio de áudios informais, reduzimos o tempo de resposta e garantimos que a equipe de TI receba tickets padronizados, com termos técnicos corretos e categorizados automaticamente.

## 🏗️ Arquitetura e Decisões de Engenharia

O sistema foi desenhado com foco em resiliência, isolamento de responsabilidades e escalabilidade:

- **Agentic Workflow (Pipeline de Múltiplas IAs):** Em vez de confiar em um único modelo, utilizamos uma esteira de dois passos. O **Whisper** atua como o "Ouvido" (Speech-to-Text), enquanto o **Llama 3** atua como o "Cérebro" (Revisor Técnico), formatando a saída em um JSON estrito.
- **Garbage Collection Manual:** O processamento de mídia gera arquivos temporários. O Controller implementa rotinas de limpeza (`fs.unlink`) garantidas em blocos `finally` para evitar vazamento de memória e sobrecarga do disco do servidor.
- **Defensive Programming & Adapter Pattern:** A comunicação com o FFmpeg foi encapsulada em Promises nativas, e as respostas da IA passam por sanitização via Expressões Regulares (Regex) antes do _parsing_ do JSON, protegendo a aplicação de quebras fatais.
- **Data Mapper Pattern:** Tradução isolada de entidades em texto natural (ex: "Sala 4") para Chaves Primárias do banco de dados relacional do GLPI (ex: ID `55`).

## 🚀 Tecnologias Utilizadas

- **Node.js** (ES Modules)
- **API Groq** (`whisper-large-v3` e `llama-3.3-70b-versatile`)
- **API REST GLPI** (Autenticação Stateless com App-Token e Session-Token)
- **FFmpeg** (`fluent-ffmpeg`)
- **File System** nativo do Node.js (`fs/promises`)

## 📁 Estrutura do Projeto

```
📦 src
┣ 📂 controllers
┃ ┗ 📜 glpiController.js # Orquestrador da esteira (Maestro) e Garbage Collector
┣ 📂 services
┃ ┣ 📜 glpiService.js # Integração HTTP com a API do GLPI (Auth e Criação)
┃ ┗ 📜 transcriptionService.js # Pipeline de IA (Groq Whisper + Llama 3 JSON Mode)
┣ 📂 utils
┃ ┗ 📜 audioConverter.js # Adapter Pattern para o FFmpeg (OGG para MP3)
┣ 📂 tests
┃ ┗ 🔊 audio-teste.ogg # Arquivos de áudio isolados para testes
┗ 📜 index.js # Entry point e Sandbox de testes da aplicação
```

## ⚙️ Como Executar Localmente

### Pré-requisitos

1. **Node.js** instalado (versão 18+ recomendada).
2. **FFmpeg** instalado e configurado nas Variáveis de Ambiente (`PATH`) do Sistema Operacional.
3. Chaves de API da Groq e credenciais de acesso ao GLPI.

### Setup

1. Clone este repositório.
2. Instale as dependências:
   ```
   npm install
   ```
3. Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:
   ```
   GROQ_API_KEY=sua_chave_aqui
   GLPI_API_URL=http://seu-glpi/apirest.php
   GLPI_APP_TOKEN=seu_app_token
   GLPI_USER_TOKEN=seu_user_token
   ```
4. Coloque um arquivo de áudio `.ogg` na pasta `src/tests/` para simular o WhatsApp.
5. Execute o arquivo principal:
   ```
   npm start
   ```

## 🛣️ Próximos Passos (Roadmap)

- [x] Processamento e conversão de mídia.
- [x] Extração de áudio e correção semântica corporativa.
- [x] Integração completa de sessão e abertura de chamados no GLPI.
- [ ] **Fase 2:** Integração com Webhooks do WhatsApp (via biblioteca ou Meta Cloud API) para escutar mensagens em tempo real.
- [ ] **Fase 3:** Retornar o ID do Ticket gerado diretamente no chat do usuário para acompanhamento.
