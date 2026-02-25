# GLPI WhatsApp Transcrição (Node.js)

Este sistema automatiza a abertura de chamados no GLPI a partir de mensagens de áudio enviadas via WhatsApp Business. O fluxo consiste em receber o áudio, transcrevê-lo para texto (utilizando IA) e registrar o incidente automaticamente na plataforma de gestão.

## Funcionalidades

- Recepção de áudios via API do WhatsApp Business.

- Transcrição automática de áudio para texto.

- Abertura de chamados no GLPI com a transcrição no corpo do atendimento.

- Integração via API REST.

## Pré-requisitos

- Antes de começar, você precisará de:

- Node.js instalado (versão 16.x ou superior).

- Acesso de administrador ao GLPI.

- Configuração de uma conta de desenvolvedor na Meta (Facebook Developers) para o WhatsApp Business API.

## Configuração do GLPI

Para que o sistema se comunique com o GLPI, é necessário habilitar a API REST:

Acesse o painel do GLPI.

Vá em Configurar > Geral > API.

Ative a opção Habilitar login com credenciais externas.

Anote a URL da API (Geralmente http://seu-ip/apirest.php ou https://seu-dns/apirest.php).

Gere um App-Token para autorizar a aplicação.

## Instalação

### Clone o repositório

```bash
git clone https://github.com/seu-usuario/glpi-whatsapp-transcricao-node.git
```

### Entre na pasta do projeto

```bash
cd glpi-whatsapp-transcricao-node
```

# Instale as dependências

```bash
npm install
```

## Variáveis de Ambiente

Crie um arquivo .env na raiz do projeto e preencha com as suas credenciais (exemplo):

```bash
# Configurações do GLPI
GLPI_API_URL=https://sua-instancia.com/apirest.php
GLPI_USER_TOKEN=seu_user_token
GLPI_APP_TOKEN=seu_app_token

# Configurações do WhatsApp
WHATSAPP_TOKEN=seu_whatsapp_token
```
