const axios = require('axios');
require('dotenv').config();

// Puxando as variáveis do seu arquivo .env
const GLPI_API_URL = process.env.GLPI_API_URL;
const GLPI_APP_TOKEN = process.env.GLPI_APP_TOKEN;
const GLPI_USER_TOKEN = process.env.GLPI_USER_TOKEN;

async function testarLeituraGLPI() {
  let sessionToken;

  try {
    const authResponse = await axios.get(`${GLPI_API_URL}/initSession`, {
      headers: {
        'App-Token': GLPI_APP_TOKEN,
        'Authorization': `user_token ${GLPI_USER_TOKEN}`
      }
    });

    sessionToken = authResponse.data.session_token;

    // 2. Buscando os chamados do GLPI

    const ticketsResponse = await axios.get(`${GLPI_API_URL}/Ticket?range=0-5`, {
      headers: {
        'App-Token': GLPI_APP_TOKEN,
        'Session-Token': sessionToken
      }
    });

    const chamados = ticketsResponse.data;

    console.log('\n--- RESULTADO DA BUSCA ---');
    if (chamados && chamados.length > 0) {
      chamados.forEach(chamado => {
        console.log(`ID: ${chamado.id} | Título: ${chamado.name}`);
      });
    } else {
      console.log('Nenhum chamado encontrado ou você não tem permissão para vê-los.');
    }

  } catch (error) {
    console.error(error.response ? error.response.data : error.message);
  } finally {
    if (sessionToken) {
      try {
        await axios.get(`${GLPI_API_URL}/killSession`, {
          headers: {
            'App-Token': GLPI_APP_TOKEN,
            'Session-Token': sessionToken
          }
        });
        console.log('🔒 Sessão encerrada de forma segura.');
      } catch (killError) {
        console.error('Erro ao encerrar sessão:', killError.message);
      }
    }
  }
}

testarLeituraGLPI();