import axios from 'axios';
import "dotenv/config";

// Configuração do cliente Axios para GLPI
const api = axios.create({
  baseURL: process.env.GLPI_API_URL,
  headers: {
    'App-Token': process.env.GLPI_APP_TOKEN,
    'Content-Type': 'application/json'
  }
});

// Função para iniciar uma sessão no GLPI e obter o token de sessão
async function initSession() {
  const response = await api.get('/initSession', {
    headers: { 'Authorization': `user_token ${process.env.GLPI_USER_TOKEN}` }
  });
  return response.data.session_token;
}

// Função para encerrar a sessão no GLPI
async function killSession(sessionToken) {
  try {
    await api.get('/killSession', { headers: { 'Session-Token': sessionToken } });
  } catch (error) {
    console.error('Erro ao matar a sessão:', error.message);
  }
}

// Criação do chamado
async function createTicket(sessionToken, title, content, idRequerente = null, idCategoria = null, idLocalizacao = null) {
  const payload = {
    input: {
      name: title,
      content: content,
      status: 1,
      urgency: 3,
      type: 2 // 2 = Requisição (Request). Se fosse Incidente, seria 1.
    }
  };

  if (idRequerente) payload.input._users_id_requester = idRequerente;
  if (idCategoria) payload.input.itilcategories_id = idCategoria;
  if (idLocalizacao) payload.input.locations_id = idLocalizacao;

  const response = await api.post('/Ticket', payload, {
    headers: { 'Session-Token': sessionToken }
  });

  return response.data;
}

export {
  initSession,
  killSession,
  createTicket
};