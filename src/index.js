const axios = require('axios');
require('dotenv').config();

// Credenciais e configuração da API do GLPI
const GLPI_API_URL = process.env.GLPI_API_URL;
const GLPI_APP_TOKEN = process.env.GLPI_APP_TOKEN;
const GLPI_USER_TOKEN = process.env.GLPI_USER_TOKEN;

// Configuração do cliente HTTP para o GLPI
async function createGLPITicket(subject, description) {
  try {
    const authResponse = await axios.get(`${GLPI_API_URL}/initSession`, {
      headers: {
        'App-Token': GLPI_APP_TOKEN,
        'Authorization': `user_token ${GLPI_USER_TOKEN}`
      }
    });

    sessionToken = authResponse.data.session_token;

    const payload = {
      input: {
        name: subject,
        content: description,
        status: 1,
        urgency: 3,
      },
    };
  }