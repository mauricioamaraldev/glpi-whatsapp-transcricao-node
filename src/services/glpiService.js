const axios = require('axios');
require('dotenv').config();

// Instância configurada do Axios
const api = axios.create({
  baseURL: process.env.GLPI_API_URL,
  headers: {
    'App-Token': process.env.GLPI_APP_TOKEN,
    'Content-Type': 'application/json'
  }
});

// Função para iniciar sessão e obter o session_token
async function initSession() {
  const response = await api.get('/initSession', {
    headers: {
      'Authorization': `user_token ${process.env.GLPI_USER_TOKEN}`
    }
  });
  return response.data.session_token;
}

// Função para criar um novo chamado
async function createTicket(sessionToken, title, content) {
  const payload = {
    input: {
      name: title,
      content: content,
      status: 1,
      urgency: 3
    }
  };
  const response = await api.post('/Ticket', payload, {
    headers: {
      'Session-Token': sessionToken
    }
  });

  return response.data
}

// Função para encerrar a sessão
async function killSession(sessionToken) {
  await api.get('/killSession', {
    headers: {
      'Session-Token': sessionToken
    }
  });
}

// Exportando as funções para serem usadas em outros arquivos
module.exports = {
  initSession,
  createTicket,
  killSession
};