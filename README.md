# GLPI WhatsApp Transcrição (Node.js)

Este sistema automatiza a abertura de chamados no GLPI a partir de mensagens de áudio enviadas via WhatsApp Business. O fluxo consiste em receber o áudio, transcrevê-lo para texto utilizando a API de Inteligência Artificial da Groq (modelo Whisper) e registrar o incidente automaticamente na plataforma de gestão.

## Funcionalidades

- Transcrição automática de áudio para texto utilizando IA de alta velocidade (Groq/Whisper).

- Abertura de chamados no GLPI via API com a transcrição no corpo do atendimento.

- Vinculação dinâmica de IDs (Requerente, Categoria e Localização) na criação do ticket.

- Arquitetura modular e escalável (Controllers e Services) utilizando o padrão moderno ES Modules.

- Recepção de áudios via API do WhatsApp Business (Em desenvolvimento).

## Pré-requisitos

### Antes de começar, você precisará de:

1. Node.js instalado (versão 16.x ou superior).

2. Acesso de Administrador/Técnico ao GLPI.

3. Conta de desenvolvedor na Groq para geração da chave de API gratuita.

## Configuração do GLPI

### Para que o sistema se comunique com o GLPI, é necessário habilitar a API REST:

1. Acesse o painel do GLPI.

2. Vá em Configurar > Geral > API.

3. Ative a opção Habilitar login com credenciais externas.

4. Anote a URL da API (Geralmente http://seu-ip/apirest.php ou https://seu-dns/apirest.php).

5. Gere um App-Token para autorizar a aplicação.

## 💻 Instalação

#### Clone o repositório

```
git clone https://github.com/seu-usuario/glpi-whatsapp-transcricao-node.git
```

#### Entre na pasta do projeto

```
cd glpi-whatsapp-transcricao-node
```

#### Instale as dependências

Certifique-se de que o seu projeto possui o pacote da Groq e as ferramentas base instaladas:

```
npm install axios dotenv groq-sdk
```

> Nota: Este projeto utiliza ES Modules. O arquivo package.json já deve conter a propriedade "type": "module".

## 🔐 Variáveis de Ambiente

#### Crie um arquivo .env na raiz do projeto e preencha com as suas credenciais, seguindo este formato:

```
# Configurações do GLPI
GLPI_API_URL=https://sua-instancia.com/apirest.php
GLPI_USER_TOKEN=seu_user_token_aqui
GLPI_APP_TOKEN=seu_app_token_aqui

# Configurações de Inteligência Artificial (Transcrição)
GROQ_API_KEY=sua_chave_api_da_groq_aqui
```
