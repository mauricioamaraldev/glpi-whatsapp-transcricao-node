import axios from 'axios';
import { config } from '../config/env.js';

const api = axios.create({
  baseURL: config.glpi.apiUrl,
  headers: {
    'App-Token': config.glpi.appToken,
    'Content-Type': 'application/json',
  },
});

async function initSession() {
  const response = await api.get('/initSession', {
    headers: { Authorization: `user_token ${config.glpi.userToken}` },
  });
  return response.data.session_token;
}

async function killSession(sessionToken) {
  await api.get('/killSession', {
    headers: { 'Session-Token': sessionToken },
  });
}

async function buscarUsuarioPorTelefone(sessionToken, telefone) {
  const response = await api.get('/User', {
    headers: { 'Session-Token': sessionToken },
    params: {
      searchText: JSON.stringify({ mobile: telefone }),
      // Campos: 2=id, 3=nome, 4=login, 34=celular
      forcedisplay: JSON.stringify([2, 3, 4, 34]),
    },
  });

  const usuarios = response.data;

  if (!Array.isArray(usuarios) && typeof usuarios === 'object') {
    const lista = Object.values(usuarios);
    return lista.length > 0 ? lista[0] : null;
  }

  return null;
}

async function criarTicket(sessionToken, { titulo, descricao, idRequerente, idCategoria, idLocalizacao }) {
  const payload = {
    input: {
      name: titulo,
      content: descricao,
      status: 1,
      urgency: 3,
      type: 2,
    },
  };

  if (idRequerente) payload.input._users_id_requester = idRequerente;
  console.log(idRequerente)
  if (idCategoria) payload.input.itilcategories_id = idCategoria;
  if (idLocalizacao) payload.input.locations_id = idLocalizacao;

  const response = await api.post('/Ticket', payload, {
    headers: { 'Session-Token': sessionToken },
  });

  return response.data;
}

async function buscarUsuarioPorCelular(sessionToken, celular) {
  const response = await api.get('/User', {
    headers: { 'Session-Token': sessionToken },
    params: {
      // Busca por correspondência parcial no campo mobile
      'searchText[mobile]': celular,
      // Campos retornados: 2=id, 3=nome, 34=mobile
      forcedisplay: JSON.stringify([2, 3, 34]),
      range: '0-1', // só precisa do primeiro resultado
    },
  });

  const data = response.data;

  // GLPI retorna objeto indexado numericamente quando encontra, array vazio quando não
  if (Array.isArray(data) || Object.keys(data).length === 0) return null;

  return Object.values(data)[0];
}

export { initSession, killSession, buscarUsuarioPorTelefone, criarTicket };
